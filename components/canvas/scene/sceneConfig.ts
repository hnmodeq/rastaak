/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  RASTAAK 3D SCENE CONTROLLER CONFIG
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Edit this file or click "💾 Apply & Save directly to Code" in 3D Studio
 * to save camera, lighting, atmosphere, AND building materials!
 */

import { tokens } from '@/tokens/design-tokens';
import { LIGHTS_CONFIG, LightConfig } from './lightingConfig';

export { LIGHTS_CONFIG };
export type { LightConfig };

export interface CameraStop {
  id: string;
  progress: number;
  camera: [number, number, number];
  target: [number, number, number];
  fov?: number;
}

export interface BuildingMaterialOverride {
  color?: number;
  roughness?: number;
  metalness?: number;
}

export interface MaterialsConfig {
  globalFacadeColor?: number;
  globalWindowColor?: number;
  overrides?: Record<string, BuildingMaterialOverride>;
}

export const SCENE_CONFIG = {
  stops: [
    {
      id: 'stop_1_overview',
      progress: 0.0,
      camera: [0.0, 22.0, -18.0],
      target: [14.0, 2.0, -1.0],
      fov: 45,
    },
    {
      id: 'stop_2_approach',
      progress: 0.25,
      camera: [6.0, 7.0, -6.0],
      target: [15.9, 2.0, 2.6],
      fov: 45,
    },
    {
      id: 'stop_3_ascent',
      progress: 0.5,
      camera: [26.0, 14.0, 6.0],
      target: [15.9, 8.0, 2.6],
      fov: 45,
    },
    {
      id: 'stop_4_spire',
      progress: 0.75,
      camera: [20.0, 22.0, 10.0],
      target: [12.0, 2.0, -2.0],
      fov: 45,
    },
    {
      id: 'stop_5_logo_finale',
      progress: 1.0,
      camera: [8.0, 24.0, -6.0],
      target: [16.0, 3.8, 2.2],
      fov: 45,
    },
  ] as CameraStop[],

  scroll: {
    headerScrollMultiplier: 2.5,
    cameraDamping: 3.71,
    idleFloatAmount: 0.2,
    idleFloatSpeed: 0.4,
  },

  camera: {
    defaultFov: 45,
    near: 0.1,
    far: 1000,
  },

  lights: LIGHTS_CONFIG,

  environment: {
    backgroundColor: tokens.experimentalScene.canvasBackground,
    fogStart: 15,
    fogEnd: 110,
  },

  materials: {
    globalFacadeColor: tokens.experimentalScene.lightFacadeDefault,
    globalWindowColor: tokens.experimentalScene.windowInsetDefault,
    overrides: {},
  } as MaterialsConfig,
};

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
