/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  RASTAAK 3D LIGHTING CONTROLLER CONFIG
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Replicating exact Blender viewport rendering (blender.png):
 *  - Far back-left directional sun angle so shadows cast toward front-right.
 *  - Soft ambient fill so shadow faces stay smooth grey instead of pitch black.
 */

import { tokens } from '@/tokens/design-tokens';

export interface LightConfig {
  /** Identifier label */
  id: string;

  /** Light Type */
  type: 'directional' | 'point' | 'spot' | 'ambient' | 'hemisphere';

  /** Light color */
  color: number;

  /** Ground color (ONLY for hemisphere lights) */
  groundColor?: number;

  /** Power / Intensity multiplier */
  intensity: number;

  /** Position in 3D world space: [X, Y, Z] */
  position?: [number, number, number];

  /** Target point in 3D world space: [X, Y, Z] */
  target?: [number, number, number];

  /** Distance falloff range for Point / Spot lights (0 = infinite) */
  distance?: number;

  /** Soft shadow blur radius (matches Blender's Radius setting e.g. 2.27m) */
  radius?: number;

  /** Cone angle in degrees for Spot lights */
  angle?: number;

  /** Cone edge softness for Spot lights (0.0 to 1.0) */
  penumbra?: number;

  /** Whether this light casts shadows (true / false) */
  castShadow?: boolean;

  /** Shadow map resolution */
  shadowMapSize?: number;

  /** Shadow bias */
  shadowBias?: number;
}

export const LIGHTS_CONFIG: LightConfig[] = [
  {
    id: 'ambient_fill',
    type: 'ambient',
    color: tokens.experimentalScene.ambient,
    intensity: 1.2,
  },
  {
    id: 'hemisphere_sky_ground',
    type: 'hemisphere',
    color: tokens.experimentalScene.keyLight,
    groundColor: tokens.experimentalScene.hemisphereGround,
    intensity: 0.8,
  },
  {
    id: 'blender_main_sun',
    type: 'directional',
    color: tokens.experimentalScene.keyLight, // 6500K daylight white
    intensity: 2.2,
    position: [-60, 50, -40], // Far back-left angle matching blender.png
    target: [14, 2, 0],
    castShadow: true,
    shadowMapSize: 2048,
    shadowBias: -0.0003,
    radius: 4.0, // Soft diffused shadows
  },
  {
    id: 'soft_fill_light',
    type: 'directional',
    color: tokens.experimentalScene.fillLight,
    intensity: 0.8,
    position: [40, 30, 40],
    target: [14, 2, 0],
    castShadow: false,
  },
];
