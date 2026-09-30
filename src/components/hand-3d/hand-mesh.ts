import * as THREE from 'three';

import { HandColors } from '@/constants/theme';
import type { HandFrame } from '@/data/sign-animations';

/** Scene units per meter (a hand is ~2 units tall). */
export const SCALE = 10;

/** Radius (meters) at each of the 21 landmarks: a soft, realistic hand thickness. */
const RADII = [
  0.02, // wrist
  0.014, 0.0118, 0.0106, 0.0096, // thumb
  0.0105, 0.0095, 0.0088, 0.008, // index
  0.0108, 0.0098, 0.009, 0.0082, // middle
  0.0102, 0.0092, 0.0085, 0.0078, // ring
  0.0095, 0.0084, 0.0077, 0.007, // pinky
];
const FINGER_BONES: [number, number][] = [
  [1, 2], [2, 3], [3, 4],
  [5, 6], [6, 7], [7, 8],
  [9, 10], [10, 11], [11, 12],
  [13, 14], [14, 15], [15, 16],
  [17, 18], [18, 19], [19, 20],
];
/** Palm outline (wrist → thumb base → knuckles). Its edges are rounded with cylinders. */
const PALM = [0, 1, 5, 9, 13, 17];
const PALM_HALF_THICKNESS = 0.0105;
const WRIST_STUB = 0.05; // meters of forearm that fade out

const UP = new THREE.Vector3(0, 1, 0);

/** Data (x right, y down, z away) → three.js (x right, y up, z towards the viewer). */
export function toScene([x, y, z]: number[], out = new THREE.Vector3()) {
  return out.set(x * SCALE, -y * SCALE, -z * SCALE);
}

type Bone = { mesh: THREE.Mesh; a: number; b: number };

/**
 * Minimal, soft 3D hand built from primitives (no model, no textures):
 * spheres at the joints + tapered cylinders for phalanges + a rounded palm slab.
 */
export class HandModel {
  readonly group = new THREE.Group();

  private readonly points = Array.from({ length: 21 }, () => new THREE.Vector3());
  private readonly joints: THREE.Mesh[] = [];
  private readonly bones: Bone[] = [];
  private readonly palmTop: THREE.Mesh;
  private readonly palmBottom: THREE.Mesh;
  private readonly stub: THREE.Mesh;
  private readonly disposables: { dispose(): void }[] = [];
  private readonly tmp = { dir: new THREE.Vector3(), n: new THREE.Vector3(), c: new THREE.Vector3() };

  constructor(private readonly palmar: 1 | -1) {
    const skin = this.track(new THREE.MeshStandardMaterial({ color: HandColors.skin, roughness: 0.78, metalness: 0 }));
    const palm = this.track(new THREE.MeshStandardMaterial({ color: HandColors.palm, roughness: 0.8, metalness: 0 }));

    const sphere = this.track(new THREE.SphereGeometry(1, 24, 16));
    RADII.forEach((r) => {
      const mesh = new THREE.Mesh(sphere, skin);
      mesh.scale.setScalar(r * SCALE);
      this.joints.push(mesh);
      this.group.add(mesh);
    });

    const addBone = (a: number, b: number, ra: number, rb: number) => {
      // Unit-height cylinder along +y, from a (bottom) to b (top); scaled to length each frame.
      const geometry = this.track(new THREE.CylinderGeometry(rb * SCALE, ra * SCALE, 1, 24, 1, true));
      const mesh = new THREE.Mesh(geometry, skin);
      this.bones.push({ mesh, a, b });
      this.group.add(mesh);
    };
    FINGER_BONES.forEach(([a, b]) => addBone(a, b, RADII[a], RADII[b]));
    PALM.forEach((a, i) => addBone(a, PALM[(i + 1) % PALM.length], PALM_HALF_THICKNESS, PALM_HALF_THICKNESS));

    // Palm faces: a fan around the centroid, offset ± half thickness along the palm normal.
    const makeFace = (material: THREE.Material) => {
      const geometry = this.track(new THREE.BufferGeometry());
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((PALM.length + 1) * 3), 3));
      const index: number[] = [];
      PALM.forEach((_, i) => index.push(PALM.length, i, (i + 1) % PALM.length));
      geometry.setIndex(index);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      this.group.add(mesh);
      return mesh;
    };
    this.palmTop = makeFace(palm);
    this.palmBottom = makeFace(skin);
    (this.palmTop.material as THREE.Material).side = THREE.DoubleSide;
    (this.palmBottom.material as THREE.Material).side = THREE.DoubleSide;

    // Short forearm that fades to transparent, so the hand doesn't look "cut off".
    const stubGeometry = this.track(new THREE.CylinderGeometry(0.0185 * SCALE, 0.021 * SCALE, 1, 24, 6, true));
    const pos = stubGeometry.getAttribute('position');
    const color = new THREE.Color(HandColors.skin);
    const colors = new Float32Array(pos.count * 4);
    for (let i = 0; i < pos.count; i++) {
      const alpha = Math.pow(pos.getY(i) + 0.5, 1.6); // 1 at the wrist (top), 0 at the far end
      colors.set([color.r, color.g, color.b, alpha], i * 4);
    }
    stubGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
    const stubMaterial = this.track(
      new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, depthWrite: false, roughness: 0.8 }),
    );
    this.stub = new THREE.Mesh(stubGeometry, stubMaterial);
    this.stub.renderOrder = -1;
    this.group.add(this.stub);
  }

  private track<T extends { dispose(): void }>(resource: T): T {
    this.disposables.push(resource);
    return resource;
  }

  update(frame: HandFrame) {
    const { points, tmp } = this;
    frame.forEach((p, i) => toScene(p, points[i]));

    this.joints.forEach((mesh, i) => mesh.position.copy(points[i]));

    for (const { mesh, a, b } of this.bones) {
      tmp.dir.subVectors(points[b], points[a]);
      const length = tmp.dir.length();
      mesh.position.addVectors(points[a], points[b]).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(UP, tmp.dir.divideScalar(length || 1));
      mesh.scale.set(1, Math.max(length, 1e-4), 1);
    }

    // Palm normal (towards the palm side).
    tmp.n
      .subVectors(points[5], points[0])
      .cross(tmp.c.subVectors(points[17], points[0]))
      .normalize()
      .multiplyScalar(this.palmar * PALM_HALF_THICKNESS * SCALE);
    // In scene space y and z are flipped (a 180° rotation), which keeps handedness: no sign change needed.
    tmp.c.set(0, 0, 0);
    PALM.forEach((i) => tmp.c.add(points[i]));
    tmp.c.divideScalar(PALM.length);
    this.writeFace(this.palmTop, tmp.n, 1);
    this.writeFace(this.palmBottom, tmp.n, -1);

    // Forearm stub: continues the palm axis away from the knuckles.
    tmp.dir.subVectors(points[0], points[9]).normalize();
    const length = WRIST_STUB * SCALE;
    this.stub.position.copy(points[0]).addScaledVector(tmp.dir, length / 2);
    this.stub.quaternion.setFromUnitVectors(UP, tmp.dir.negate());
    this.stub.scale.set(1, length, 1);
  }

  private writeFace(mesh: THREE.Mesh, offset: THREE.Vector3, sign: 1 | -1) {
    const attr = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    PALM.forEach((i, k) => {
      const p = this.points[i];
      attr.setXYZ(k, p.x + offset.x * sign, p.y + offset.y * sign, p.z + offset.z * sign);
    });
    const c = this.tmp.c;
    attr.setXYZ(PALM.length, c.x + offset.x * sign, c.y + offset.y * sign, c.z + offset.z * sign);
    attr.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}

/** Faint full path + the part already drawn, for the fingertip that traces the letter. */
export class Trail {
  readonly group = new THREE.Group();
  private readonly drawn: THREE.Mesh;
  private readonly segments: number;
  private readonly radial = 8;
  private readonly disposables: { dispose(): void }[] = [];

  constructor(path: THREE.Vector3[]) {
    const curve = new THREE.CatmullRomCurve3(path);
    this.segments = Math.max(8, path.length * 3);
    const geometry = new THREE.TubeGeometry(curve, this.segments, 0.0028 * SCALE, this.radial, false);
    const faint = new THREE.MeshBasicMaterial({ color: HandColors.trail, transparent: true, opacity: 0.14, depthWrite: false });
    const strong = new THREE.MeshBasicMaterial({ color: HandColors.trail, transparent: true, opacity: 0.55, depthWrite: false });
    this.disposables.push(geometry, faint, strong);
    this.group.add(new THREE.Mesh(geometry, faint));
    this.drawn = new THREE.Mesh(geometry.clone(), strong);
    this.disposables.push(this.drawn.geometry);
    this.group.add(this.drawn);
  }

  /** progress: 0..1 along the movement. */
  setProgress(progress: number) {
    const count = Math.floor(Math.min(1, Math.max(0, progress)) * this.segments) * this.radial * 6;
    this.drawn.geometry.setDrawRange(0, count);
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}
