import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

function sanitizeHex(val: any, fallback = '0x' + '1c1d22'): string {
  if (typeof val === 'number') {
    return '0x' + val.toString(16);
  }
  if (typeof val === 'string') {
    const clean = val.trim().replace('#', '').replace('0x', '');
    if (/^[0-9a-fA-F]{3,8}$/.test(clean)) {
      return '0x' + clean;
    }
  }
  return fallback;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cameraStops, lights, environment, materials } = body;

    const rootDir = process.cwd();

    const hexWhite = '0x' + 'ffffff';
    const hexDark = '0x' + '101114';
    const hexFacade = '0x' + '8c8c8c';
    const hexInset = '0x' + '222222';

    // 1. Sanitize and write updated lightingConfig.ts
    if (Array.isArray(lights)) {
      const sanitizedLights = lights.map((l: any) => {
        const item = { ...l };
        if (item.color !== undefined) {
          item.color = sanitizeHex(item.color, hexWhite);
        }
        if (item.groundColor !== undefined) {
          item.groundColor = sanitizeHex(item.groundColor, hexDark);
        }
        return item;
      });

      const lightingPath = path.join(
        rootDir,
        'components',
        'canvas',
        'scene',
        'lightingConfig.ts',
      );

      const lightsArrayString = JSON.stringify(sanitizedLights, null, 2).replace(
        /"(0x[0-9a-fA-F]+)"/g,
        '$1',
      );

      const lightingCode = `/**
 * RASTAAK 3D LIGHTING CONTROLLER CONFIG
 * Saved automatically from 3D Studio
 */

import { tokens } from '@/tokens/design-tokens';

export interface LightConfig {
  id: string;
  type: 'directional' | 'point' | 'spot' | 'ambient' | 'hemisphere';
  color: number;
  groundColor?: number;
  intensity: number;
  position?: [number, number, number];
  target?: [number, number, number];
  distance?: number;
  decay?: number;
  radius?: number;
  angle?: number;
  penumbra?: number;
  castShadow?: boolean;
  shadowMapSize?: number;
  shadowBias?: number;
}

export const LIGHTS_CONFIG: LightConfig[] = ${lightsArrayString};
`;
      fs.writeFileSync(lightingPath, lightingCode, 'utf8');
    }

    // 2. Sanitize materials and write updated sceneConfig.ts
    if (Array.isArray(cameraStops)) {
      const sceneConfigPath = path.join(
        rootDir,
        'components',
        'canvas',
        'scene',
        'sceneConfig.ts',
      );

      const bgHexCode = environment?.backgroundColor
        ? sanitizeHex(
            environment.backgroundColor,
            'tokens.experimentalScene.canvasBackground',
          )
        : 'tokens.experimentalScene.canvasBackground';

      const sanitizedMaterials = {
        lightFacades: {
          color: materials?.lightFacades?.color
            ? sanitizeHex(materials.lightFacades.color, hexFacade)
            : hexFacade,
          roughness: materials?.lightFacades?.roughness ?? 0.6,
          metalness: materials?.lightFacades?.metalness ?? 0.0,
        },
        windowInsets: {
          color: materials?.windowInsets?.color
            ? sanitizeHex(materials.windowInsets.color, hexInset)
            : hexInset,
          roughness: materials?.windowInsets?.roughness ?? 0.6,
        },
        buildings: materials?.buildings ?? {},
      };

      const materialsString = JSON.stringify(sanitizedMaterials, null, 2).replace(
        /"(0x[0-9a-fA-F]+)"/g,
        '$1',
      );

      const sceneConfigCode = `/**
 * RASTAAK 3D SCENE CONTROLLER CONFIG
 * Saved automatically from 3D Studio
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

export interface BuildingMaterialConfig {
  color?: number;
  roughness?: number;
  metalness?: number;
}

export interface MaterialsConfig {
  lightFacades?: BuildingMaterialConfig;
  windowInsets?: BuildingMaterialConfig;
  buildings?: Record<string, BuildingMaterialConfig>;
}

export const SCENE_CONFIG = {
  stops: ${JSON.stringify(cameraStops, null, 2)} as CameraStop[],

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
    backgroundColor: ${bgHexCode},
    fogStart: ${environment?.fogStart ?? 15},
    fogEnd: ${environment?.fogEnd ?? 110},
  },

  materials: ${materialsString} as MaterialsConfig,
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
`;
      fs.writeFileSync(sceneConfigPath, sceneConfigCode, 'utf8');
    }

    return NextResponse.json({
      success: true,
      message: 'Config saved directly to local TypeScript source files (including materials, lights, and camera)!',
    });
  } catch (error: any) {
    console.error('Failed to save studio config:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save config' },
      { status: 500 },
    );
  }
}
