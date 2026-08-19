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
    out.target[axis] = catmullRom(
      p0.target[axis],
      p1.target[axis],
      p2.target[axis],
      p3.target[axis],
      f,
    );
  }

  const fov1 = p1.fov ?? SCENE_CONFIG.camera.defaultFov;
  const fov2 = p2.fov ?? SCENE_CONFIG.camera.defaultFov;
  out.fov = fov1 + (fov2 - fov1) * f;
}
