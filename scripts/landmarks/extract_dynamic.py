"""
Build 3D hand animations for dynamic LSM letters from the CICESE dataset
"Mexican Sign Language Alphabet (dynamic signs only)" (Zenodo 10.5281/zenodo.14689869, CC BY 4.0),
using BOTH camera views (frontal + 45° profile) of the same real executions.

Per letter:
  1. Track every execution in both views with MediaPipe Hand Landmarker (VIDEO mode):
     image landmarks (trajectory) + world landmarks (metric 3D hand shape).
  2. Drop false detections, keep executions tracked well in both views.
  3. Pick the MEDOID pair: the real execution most similar to all others (both views together).
     No averaging across people, so shape and movement are exactly one real signer's.
  4. Hand shape = frontal world landmarks. Trajectory = frontal image motion converted to meters;
     depth estimated from the 45° view only when it agrees with an independent estimate
     (hand size change in the frontal view). Otherwise depth stays 0 (reported).

Usage:
  uv run --python 3.12 --with "mediapipe==0.10.14" --with opencv-python-headless \
    scripts/landmarks/extract_dynamic.py \
      --front "~/Downloads/MSL dynamic-frontal-signs" --side "~/Downloads/MSL dynamic-profile-signs" \
      [--letters J Ñ Q X Z] [--debug-dir /tmp/strips]

Output: assets/signs/anim/dynamic.json
  { "j": { "fps": 30, "trail": 20, "depth": "side"|"none", "source": {...},
           "frames": [[[x, y, z] × 21], …] } }   # meters, x right, y down, z away from the viewer
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import unicodedata
import urllib.request
from dataclasses import dataclass
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

ROOT = Path(__file__).resolve().parents[2]
CACHE = Path(__file__).resolve().parent / ".cache"
MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/1/hand_landmarker.task"
)
OUT = ROOT / "assets/signs/anim/dynamic.json"

IDS = {"J": "j", "Ñ": "enie", "Q": "q", "X": "x", "Z": "z", "K": "k"}
# Fingertip that draws the letter, when the sign defines one; otherwise the one that travels most.
TRAIL = {"J": 20, "Z": 8}
TIPS = [4, 8, 12, 16, 20]
SIDE_ANGLE = math.radians(45)
# Hide the trail when the fingertip barely travels (e.g. Ñ: the wrist moves, no finger "writes").
MIN_TRAIL_METERS = 0.12

SCORE_STRIDE = 2
MIN_DETECTION = 0.85
RESAMPLE = 24
OUT_FPS = 30

NAME_RE = re.compile(r"^(S\d+)-(.+?)-([A-Za-z]+)[.\-_ ]?(\d+)\.mp4$", re.I)


def nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s)


# ─── MediaPipe ───────────────────────────────────────────────────────────────


def model_path() -> str:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / "hand_landmarker.task"
    if not path.exists():
        print(f"Descargando modelo -> {path}")
        urllib.request.urlretrieve(MODEL_URL, path)
    return str(path)


def make_landmarker(model: str) -> vision.HandLandmarker:
    return vision.HandLandmarker.create_from_options(
        vision.HandLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=model, delegate=mp_python.BaseOptions.Delegate.CPU),
            running_mode=vision.RunningMode.VIDEO,
            num_hands=1,
            min_hand_detection_confidence=0.4,
            min_hand_presence_confidence=0.4,
            min_tracking_confidence=0.4,
        )
    )


@dataclass
class Track:
    image: list[np.ndarray | None]  # 21×3, x/y in pixels, z in pixels (MediaPipe relative depth)
    world: list[np.ndarray | None]  # 21×3 meters, origin at the hand center
    fps: float
    size: tuple[int, int]


def track(model: str, video: Path, stride: int) -> Track:
    cap = cv2.VideoCapture(str(video))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    w, h = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    image: list[np.ndarray | None] = []
    world: list[np.ndarray | None] = []
    with make_landmarker(model) as landmarker:
        index = 0
        while True:
            ok, bgr = cap.read()
            if not ok:
                break
            if index % stride == 0:
                frame = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
                r = landmarker.detect_for_video(frame, int(index * 1000 / fps))
                if r.hand_landmarks:
                    image.append(np.array([[p.x * w, p.y * h, p.z * w] for p in r.hand_landmarks[0]]))
                    world.append(np.array([[p.x, p.y, p.z] for p in r.hand_world_landmarks[0]]))
                else:
                    image.append(None)
                    world.append(None)
            index += 1
    cap.release()
    return Track(image, world, fps / stride, (w, h))


# ─── Cleaning ────────────────────────────────────────────────────────────────


def drop_outliers(t: Track) -> Track:
    """Discard false detections: wrist far from its neighbours' median, or hand size jumps."""
    found = [i for i, f in enumerate(t.image) if f is not None]
    if len(found) < 5:
        return t
    wrists = np.array([t.image[i][0, :2] for i in found])
    sizes = np.array([np.linalg.norm(t.image[i][9, :2] - t.image[i][0, :2]) for i in found])
    size = float(np.median(sizes))
    image, world = list(t.image), list(t.world)
    for k, i in enumerate(found):
        window = wrists[max(0, k - 4) : k + 5]
        if np.linalg.norm(wrists[k] - np.median(window, axis=0)) > size or abs(sizes[k] - size) > 0.5 * size:
            image[i] = world[i] = None
    return Track(image, world, t.fps, t.size)


def fill(frames: list[np.ndarray | None], start: int, end: int) -> np.ndarray:
    """Linear interpolation of missing frames between start..end (both detected)."""
    frames = frames[start : end + 1]
    idx = [i for i, f in enumerate(frames) if f is not None]
    out = np.empty((len(frames), 21, 3))
    for i in range(len(frames)):
        if frames[i] is not None:
            out[i] = frames[i]
            continue
        a = max(j for j in idx if j < i)
        b = min(j for j in idx if j > i)
        u = (i - a) / (b - a)
        out[i] = frames[a] * (1 - u) + frames[b] * u
    return out


@dataclass
class Clean:
    image: np.ndarray
    world: np.ndarray
    fps: float
    rate: float
    start: int  # index (in processed frames) of the first detected frame


def clean(t: Track) -> Clean | None:
    t = drop_outliers(t)
    found = [i for i, f in enumerate(t.image) if f is not None]
    if len(found) < 5:
        return None
    rate = len(found) / len(t.image)
    return Clean(fill(t.image, found[0], found[-1]), fill(t.world, found[0], found[-1]), t.fps, rate, found[0])


def smooth(seq: np.ndarray, width: int = 5) -> np.ndarray:
    kernel = np.concatenate([np.arange(1, width // 2 + 2), np.arange(width // 2, 0, -1)]).astype(float)
    kernel /= kernel.sum()
    pad = width // 2
    padded = np.concatenate([seq[:1].repeat(pad, 0), seq, seq[-1:].repeat(pad, 0)])
    return sum(padded[k : k + len(seq)] * kernel[k] for k in range(width))


def resample(seq: np.ndarray, n: int) -> np.ndarray:
    t = np.linspace(0, len(seq) - 1, n)
    lo = np.floor(t).astype(int)
    hi = np.minimum(lo + 1, len(seq) - 1)
    w = (t - lo).reshape(-1, *([1] * (seq.ndim - 1)))
    return seq[lo] * (1 - w) + seq[hi] * w


def hand_px(image: np.ndarray) -> np.ndarray:
    """Per-frame hand size in pixels (wrist → middle knuckle)."""
    return np.linalg.norm(image[:, 9, :2] - image[:, 0, :2], axis=1)


def signature(c: Clean) -> np.ndarray:
    """Time-normalized shape + trajectory, invariant to position and scale."""
    res = resample(c.image, RESAMPLE)[:, :, :2]
    res = res - res[:, 0:1].mean(axis=0, keepdims=True)
    return (res / float(np.median(hand_px(c.image)))).ravel()


def max_jump(c: Clean) -> float:
    return float(np.linalg.norm(np.diff(c.image[:, 0, :2], axis=0), axis=1).max() / np.median(hand_px(c.image)))


# ─── Pairing and selection ───────────────────────────────────────────────────


def key_of(path: Path) -> tuple[str, str] | None:
    m = NAME_RE.match(nfc(path.name))
    return (m.group(1).upper(), m.group(4)) if m else None


def videos_by_key(folder: Path) -> dict[tuple[str, str], Path]:
    out = {}
    for p in folder.iterdir():
        if p.suffix.lower() == ".mp4" and (k := key_of(p)):
            out[k] = p
    return out


def score_view(model: str, path: Path) -> Clean | None:
    c = clean(track(model, path, SCORE_STRIDE))
    if c is None or c.rate < MIN_DETECTION or max_jump(c) > 0.6:
        return None
    return c


def medoid(signatures: np.ndarray) -> tuple[int, np.ndarray]:
    dist = np.linalg.norm(signatures[:, None] - signatures[None], axis=2).mean(axis=1)
    return int(np.argmin(dist)), dist


# ─── Trajectory in meters ────────────────────────────────────────────────────


def align_offset(a: np.ndarray, b: np.ndarray, max_shift: int) -> int:
    """Frame offset that best aligns 1D signal b to a (normalized cross-correlation)."""
    best, best_corr = 0, -2.0
    for s in range(-max_shift, max_shift + 1):
        x = a[max(0, s) : len(a) + min(0, s)]
        y = b[max(0, -s) : len(b) + min(0, -s)]
        n = min(len(x), len(y))
        if n < 10:
            continue
        x, y = x[:n] - x[:n].mean(), y[:n] - y[:n].mean()
        denom = np.linalg.norm(x) * np.linalg.norm(y)
        corr = float(x @ y / denom) if denom > 1e-9 else -1
        if corr > best_corr:
            best, best_corr = s, corr
    return best


def trajectory(front: Clean, side: Clean | None) -> tuple[np.ndarray, str]:
    """Hand-center motion in meters (n×3), relative to the first frame."""
    meters_per_px = np.median(np.linalg.norm(front.world[:, 9] - front.world[:, 0], axis=1)) / np.median(
        hand_px(front.image)
    )
    center_px = front.image[:, :, :2].mean(axis=1)
    xy = (center_px - center_px[0]) * meters_per_px
    z = np.zeros(len(xy))
    mode = "none"

    if side is not None:
        side_img = resample(side.image, int(round(len(side.image) * front.fps / side.fps)))
        side_mpp = np.median(np.linalg.norm(side.world[:, 9] - side.world[:, 0], axis=1)) / np.median(hand_px(side_img))
        side_center = side_img[:, :, :2].mean(axis=1) * side_mpp
        # Vertical motion is shared by both cameras: use it to synchronize them.
        shift = align_offset(xy[:, 1], side_center[:, 1] - side_center[0, 1], max_shift=15)
        idx = np.clip(np.arange(len(xy)) - shift, 0, len(side_center) - 1)
        side_x = side_center[idx, 0] - side_center[idx[0], 0]
        # Camera rotated 45° around the vertical axis: x_side = x·cosθ ± z·sinθ.
        z_side = (side_x - xy[:, 0] * math.cos(SIDE_ANGLE)) / math.sin(SIDE_ANGLE)
        # Independent check: the hand looks bigger in the frontal view when it comes closer.
        size = smooth(hand_px(front.image), 9)
        depth0 = 0.5  # rough camera distance (m); only the sign/shape of the curve matters here
        z_scale = depth0 * (size[0] / size - 1)
        corr = np.corrcoef(z_side, z_scale)[0, 1] if z_side.std() > 1e-4 and z_scale.std() > 1e-4 else 0
        if abs(corr) >= 0.4:
            z = smooth(np.sign(corr) * z_side, 9)
            z = np.clip(z - z[0], -0.25, 0.25)
            mode = "side"
    return np.column_stack([xy, z]), mode


# ─── Main per letter ─────────────────────────────────────────────────────────


def palmar_side(world: np.ndarray) -> int:
    """
    Sign that turns n = (index_mcp - wrist) × (pinky_mcp - wrist) into the palm's normal.
    Fingers curl towards the palm, so the fingertips' offset from the knuckles along n tells the side.
    Falls back to a right hand (n points to the back of the hand) when the hand stays flat.
    """
    n = np.cross(world[:, 5] - world[:, 0], world[:, 17] - world[:, 0])
    n /= np.linalg.norm(n, axis=1, keepdims=True)
    curl = world[:, [8, 12, 16, 20]].mean(axis=1) - world[:, [5, 9, 13, 17]].mean(axis=1)
    score = float(np.einsum("ij,ij->i", curl, n).mean())
    return 1 if score > 0.004 else -1


def process_letter(model: str, front_dir: Path | None, side_dir: Path | None, letter: str, debug: Path | None):
    front_videos = videos_by_key(front_dir) if front_dir else {}
    side_videos = videos_by_key(side_dir) if side_dir else {}
    keys = sorted(set(front_videos) | set(side_videos))
    both = [k for k in keys if k in front_videos and k in side_videos]
    print(f"  {letter}: {len(front_videos)} frontales, {len(side_videos)} de perfil, {len(both)} pares")

    primary = front_videos if front_videos else side_videos
    candidates = []
    for n, key in enumerate(sorted(primary), 1):
        f = score_view(model, primary[key])
        s = score_view(model, side_videos[key]) if (front_videos and key in side_videos) else None
        print(f"\r  {letter}: evaluando {n}/{len(primary)}", end="", flush=True)
        if f is None:
            continue
        sig = signature(f) if s is None else np.concatenate([signature(f), signature(s)])
        candidates.append((key, f, s, sig))
    print()

    paired = [c for c in candidates if c[2] is not None]
    pool = paired if len(paired) >= 3 else [c for c in candidates if len(c[3]) == len(candidates[0][3])]
    if len(pool) < 3:
        print(f"  {letter}: muy pocas ejecuciones válidas, se omite")
        return None
    best, dist = medoid(np.stack([c[3] for c in pool]))
    key = pool[best][0]

    front = clean(track(model, primary[key], 1))
    side = clean(track(model, side_videos[key], 1)) if (front_videos and key in side_videos) else None
    assert front is not None

    shape = smooth(front.world)  # origin at the hand's geometric center
    traj, depth_mode = trajectory(front, side)
    frames = shape + smooth(traj)[:, None, :]
    frames = resample(frames, max(2, int(round(len(frames) * OUT_FPS / front.fps))))

    travel = [float(np.linalg.norm(np.diff(frames[:, t], axis=0), axis=1).sum()) for t in TIPS]
    trail: int | None = TRAIL.get(letter, TIPS[int(np.argmax(travel))])
    if travel[TIPS.index(trail)] < MIN_TRAIL_METERS:
        trail = None

    print(
        f"  {letter}: elegido {primary[key].name}{' + ' + side_videos[key].name if side else ''} · "
        f"{len(frames)} cuadros · detección {pool[best][1].rate:.0%} · distancia {dist[best]:.2f} "
        f"(mediana {np.median(dist):.2f}) · profundidad: {depth_mode} · estela {trail}"
    )

    if debug:
        write_strip(debug / f"{IDS.get(letter, letter)}.jpg", primary[key], front, side_videos.get(key), side)

    return {
        "fps": OUT_FPS,
        "trail": trail,
        "depth": depth_mode,
        "palmar": palmar_side(shape),
        "source": {"front": primary[key].name, "side": side_videos[key].name if side else None},
        "frames": np.round(frames, 4).tolist(),
    }


def write_strip(path: Path, front_video: Path, front: Clean, side_video: Path | None, side: Clean | None):
    """Video frames with the tracked skeleton, both views, for manual review."""
    bones = [(0, 1), (1, 2), (2, 3), (3, 4), (0, 5), (5, 6), (6, 7), (7, 8), (5, 9), (9, 10), (10, 11),
             (11, 12), (9, 13), (13, 14), (14, 15), (15, 16), (13, 17), (0, 17), (17, 18), (18, 19), (19, 20)]

    def strip(video: Path, c: Clean) -> np.ndarray:
        cap = cv2.VideoCapture(str(video))
        imgs = []
        while True:
            ok, im = cap.read()
            if not ok:
                break
            imgs.append(im)
        cells = []
        for t in np.linspace(0, len(c.image) - 1, 6).astype(int):
            im = imgs[min(len(imgs) - 1, c.start + t)].copy()
            p = c.image[t][:, :2].astype(int)
            for a, b in bones:
                cv2.line(im, tuple(p[a]), tuple(p[b]), (99, 30, 233), 3)
            cells.append(cv2.resize(im, (260, 260)))
        return np.hstack(cells)

    rows = [strip(front_video, front)]
    if side_video and side:
        rows.append(strip(side_video, side))
    path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(path), np.vstack(rows))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--front", type=str)
    parser.add_argument("--side", type=str)
    parser.add_argument("--letters", nargs="+", default=["J", "Ñ", "Q", "X", "Z"])
    parser.add_argument("--debug-dir", type=Path)
    args = parser.parse_args()

    def folders(root: str | None) -> dict[str, Path]:
        if not root:
            return {}
        base = Path(os.path.expanduser(root))
        return {nfc(p.name): p for p in base.iterdir() if p.is_dir()}

    front, side = folders(args.front), folders(args.side)
    model = model_path()
    result = json.loads(OUT.read_text()) if OUT.exists() else {}
    for letter in (nfc(l.upper()) for l in args.letters):
        if letter not in front and letter not in side:
            print(f"  {letter}: carpeta no encontrada")
            continue
        data = process_letter(model, front.get(letter), side.get(letter), letter, args.debug_dir)
        if data:
            result[IDS.get(letter, letter.lower())] = data

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, separators=(",", ":"), ensure_ascii=False))
    print(f"Escrito {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
