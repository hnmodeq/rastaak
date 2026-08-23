import * as THREE from 'three';
import { SCENE_CONFIG } from './sceneConfig';

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

const _from = new THREE.Vector3();
const _to = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _matrix = new THREE.Matrix4();
const _qA = new THREE.Quaternion();
const _qB = new THREE.Quaternion();
const _forward = new THREE.Vector3();

function lookQuat(
  camera: readonly [number, number, number],
  target: readonly [number, number, number],
  out: THREE.Quaternion,
) {
  _from.set(camera[0], camera[1], camera[2]);
  _to.set(target[0], target[1], target[2]);
  if (_from.distanceToSquared(_to) < 1e-8) {
    _to.z -= 1;
  }
  _matrix.lookAt(_from, _to, _up);
  out.setFromRotationMatrix(_matrix);
}

export function sampleSceneJourney(
  t: number,
  out: { camera: [number, number, number]; target: [number, number, number]; fov: number },
): void {
  const stops = SCENE_CONFIG.stops;
  if (!stops || stops.length === 0) return;

  if (stops.length === 1) {
    out.camera = [...stops[0].camera];
    out.target = [...stops[0].target];
    out.fov = stops[0].fov ?? SCENE_CONFIG.camera.defaultFov;
    return;
  }

  const clamped = Math.max(0, Math.min(1, t));

  let idx = 0;
  while (idx < stops.length - 1 && stops[idx + 1].progress <= clamped) {
    idx++;
  }

  if (idx >= stops.length - 1) {
    const last = stops[stops.length - 1];
    out.camera = [...last.camera];
    out.target = [...last.target];
    out.fov = last.fov ?? SCENE_CONFIG.camera.defaultFov;
    return;
  }

  const p1 = stops[idx];
  const p2 = stops[idx + 1];
  const p0 = stops[Math.max(0, idx - 1)];
  const p3 = stops[Math.min(stops.length - 1, idx + 2)];

  const pRange = p2.progress - p1.progress;
  const f = pRange > 0 ? (clamped - p1.progress) / pRange : 0;

  for (let axis = 0; axis < 3; axis++) {
    out.camera[axis] = catmullRom(
      p0.camera[axis],
      p1.camera[axis],
      p2.camera[axis],
      p3.camera[axis],
      f,
    );
  }

  // Slerp the look, do not Catmull-Rom the target. Independent target curves
  // overshoot and make lookAt spin around world-up with no stop to edit.
  lookQuat(p1.camera, p1.target, _qA);
  lookQuat(p2.camera, p2.target, _qB);
  if (_qA.dot(_qB) < 0) _qB.set(-_qB.x, -_qB.y, -_qB.z, -_qB.w);
  _qA.slerp(_qB, f);
  _forward.set(0, 0, -1).applyQuaternion(_qA).normalize();
  const d1 = Math.hypot(p1.target[0] - p1.camera[0], p1.target[1] - p1.camera[1], p1.target[2] - p1.camera[2]);
  const d2 = Math.hypot(p2.target[0] - p2.camera[0], p2.target[1] - p2.camera[1], p2.target[2] - p2.camera[2]);
  const dist = THREE.MathUtils.lerp(Math.max(0.2, d1), Math.max(0.2, d2), f);
  out.target[0] = out.camera[0] + _forward.x * dist;
  out.target[1] = out.camera[1] + _forward.y * dist;
  out.target[2] = out.camera[2] + _forward.z * dist;

  const fov1 = p1.fov ?? SCENE_CONFIG.camera.defaultFov;
  const fov2 = p2.fov ?? SCENE_CONFIG.camera.defaultFov;
  out.fov = fov1 + (fov2 - fov1) * f;
}
