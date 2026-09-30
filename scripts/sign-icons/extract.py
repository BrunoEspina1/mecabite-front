"""Cuts the sign icons out of the Freepik "hand-drawn-sign-language-alphabet" sheet (372724).

Usage:
    python3 scripts/sign-icons/extract.py ~/Downloads/hand-drawn-sign-language-alphabet/372724-PBRMD8-332.ai

Needs `pdftocairo` (poppler) and Pillow. Writes assets/images/signs/<id>.png: pink strokes, white-filled
hand with a soft shadow, transparent background, 240x240, resting on the bottom edge (the app clips it
with a circle). The sheet is ASL; Ñ is the N drawing plus a wavy tilde. Words use a plain hand:
hand-one.png for one-handed signs and hand-two.png for two-handed ones.
"""

import math
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "assets" / "images" / "signs"
INK = (0xE9, 0x1E, 0x63)
FILL = (0xFF, 0xFF, 0xFF)  # inside of the hand
SIZE = 240
PADDING = 12
RENDER_PX = 6000
STROKE_GROW = 7  # px at RENDER_PX
FILL_GAP = 9  # px at RENDER_PX: outline gaps up to this size still count as closed
SHADOW_OFFSET = 5  # px at SIZE, to the right
SHADOW_BLUR = 5
SHADOW_OPACITY = 0.35
WIDE_SCALE = 0.8
WIDE_BOTTOM = 0.86  # of SIZE

# Where each hand sits on the sheet, in 1/1400 of the page: (x1, x2, y1, y2).
# The y range stops just above the printed letter, cutting the wrist; J keeps its arrow and Z its "Z→".
PAGE_UNITS = 1400
SIGNS = {
    "a": (135, 252, 262, 408),
    "b": (298, 417, 182, 408),
    "c": (446, 634, 255, 408),
    "l": (926, 1094, 468, 695),
    "y": (956, 1150, 1076, 1250),
    "j": (486, 674, 550, 695),
    "enie": (123, 247, 764, 952),  # the N drawing, plus a tilde
    "q": (701, 920, 852, 952),
    "x": (798, 894, 1072, 1250),
    "z": (1168, 1302, 1015, 1250),
}
# Plain hand for the words: the B drawing (open palm, fingers together).
PLAIN_HAND = SIGNS["b"]
# Two hands side by side: each one tilts toward the center so the fingertips stay inside the circle.
TWO_HANDS_TILT = 10  # degrees
TWO_HANDS_OVERLAP = 0.12  # of one hand's width


def render_page(ai: Path, tmp: Path) -> Image.Image:
    out = tmp / "page"
    subprocess.run(["pdftocairo", "-png", "-singlefile", "-scale-to", str(RENDER_PX), str(ai), str(out)], check=True)
    return Image.open(f"{out}.png").convert("L")


def crop(page: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    x1, x2, y1, y2 = box
    margin = 4  # page units, so strokes on the edge are not cut
    return page.crop(tuple(round(v / PAGE_UNITS * page.width) for v in (x1 - margin, y1 - margin, x2 + margin, y2)))


def to_icon(gray: Image.Image) -> Image.Image:
    # Background is white to light gray, strokes are dark: darkness becomes alpha.
    alpha = gray.point(lambda v: 0 if v > 200 else min(255, round((200 - v) * 255 / 150)))
    # Thicker strokes so the drawing still reads at card size.
    alpha = alpha.filter(ImageFilter.MaxFilter(STROKE_GROW)).crop(alpha.getbbox())
    lines = Image.new("RGBA", alpha.size, INK + (0,))
    lines.putalpha(alpha)
    icon = Image.new("RGBA", alpha.size, FILL + (0,))
    icon.putalpha(inside(alpha))
    icon.alpha_composite(lines)
    return icon


def inside(alpha: Image.Image) -> Image.Image:
    """Mask of the area enclosed by the strokes (the hand), found by flooding the outside from the top
    and the sides. The bottom edge counts as a wall, so the cut wrist closes the shape."""
    pad = FILL_GAP
    # Strokes grown a bit more so small gaps in the outline don't let the flood in.
    walls = alpha.point(lambda v: 255 if v > 60 else 0).filter(ImageFilter.MaxFilter(FILL_GAP))
    mask = Image.new("L", (walls.width + 2 * pad, walls.height + pad), 0)
    mask.paste(walls, (pad, pad))
    ImageDraw.Draw(mask).line([(0, mask.height - 1), (mask.width, mask.height - 1)], fill=255)
    ImageDraw.floodfill(mask, (0, 0), 128)
    mask = mask.crop((pad, pad, pad + walls.width, pad + walls.height))
    return mask.point(lambda v: 255 if v != 128 else 0)


def add_tilde(icon: Image.Image) -> Image.Image:
    # Room on the left for the wave, then draw a "~" beside the hand.
    width = icon.width
    wide = Image.new("RGBA", (round(width * 1.6), icon.height), INK + (0,))
    wide.alpha_composite(icon, (wide.width - width, 0))
    draw = ImageDraw.Draw(wide)
    stroke = max(4, round(icon.height / 45))
    left, right = stroke * 2, wide.width - width - stroke * 2
    mid, amp = icon.height * 0.22, icon.height * 0.06
    points = [(left + (right - left) * t / 40, mid - amp * math.sin(2 * math.pi * t / 40)) for t in range(41)]
    draw.line(points, fill=INK + (255,), width=stroke, joint="curve")
    for x, y in (points[0], points[-1]):
        r = stroke / 2
        draw.ellipse((x - r, y - r, x + r, y + r), fill=INK + (255,))
    return wide


def two_hands(hand: Image.Image) -> Image.Image:
    """The hand and its mirror image, tilted toward each other, bottoms on the same line."""
    right = hand.rotate(TWO_HANDS_TILT, resample=Image.BICUBIC, expand=True)
    left = ImageOps.mirror(right)
    step = round(right.width * (1 - TWO_HANDS_OVERLAP))
    pair = Image.new("RGBA", (step + right.width, right.height), INK + (0,))
    pair.alpha_composite(left, (0, 0))
    pair.alpha_composite(right, (step, 0))
    return pair.crop(pair.getbbox())


def fit(icon: Image.Image, wrist_down: bool = False) -> Image.Image:
    # The circle is narrow near the bottom: wide drawings (C, J, Q) are smaller and sit higher,
    # unless their wrists must reach the bottom edge (the two plain hands).
    wide = icon.width > icon.height * 1.1 and not wrist_down
    inner = (SIZE - PADDING) * (WIDE_SCALE if wide else 1)
    ratio = inner / max(icon.size)
    icon = icon.resize((round(icon.width * ratio), round(icon.height * ratio)), Image.LANCZOS)
    canvas = Image.new("RGBA", (SIZE, SIZE), INK + (0,))
    bottom = round(SIZE * (WIDE_BOTTOM if wide else 1))
    position = ((SIZE - icon.width) // 2, bottom - icon.height)
    # Soft pink shadow behind the hand for depth.
    shadow = Image.new("RGBA", (SIZE, SIZE), INK + (0,))
    silhouette = Image.new("L", (SIZE, SIZE), 0)
    silhouette.paste(icon.getchannel("A").point(lambda v: round(v * SHADOW_OPACITY)), (position[0] + SHADOW_OFFSET, position[1]))
    shadow.putalpha(silhouette.filter(ImageFilter.GaussianBlur(SHADOW_BLUR)))
    canvas.alpha_composite(shadow)
    # Sits on the bottom edge: the app clips it with a circle so the wrist comes out of it.
    canvas.alpha_composite(icon, position)
    return canvas


def main() -> None:
    ai = Path(sys.argv[1]).expanduser()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        page = render_page(ai, Path(tmp))
    icons = {sign_id: to_icon(crop(page, box)) for sign_id, box in SIGNS.items()}
    icons["enie"] = add_tilde(icons["enie"])
    plain = to_icon(crop(page, PLAIN_HAND))
    icons["hand-one"] = plain
    icons["hand-two"] = two_hands(plain)
    for name, icon in icons.items():
        fit(icon, wrist_down=name == "hand-two").save(OUT_DIR / f"{name}.png", optimize=True)
        print(OUT_DIR / f"{name}.png")


if __name__ == "__main__":
    main()
