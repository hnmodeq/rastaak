/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  RASTAAK 3D LIGHTING CONTROLLER CONFIG
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Edit this file to have FULL CONTROL over all lights in your 3D scene:
 *  1. Light Type ('directional', 'point', 'spot', 'ambient', 'hemisphere')
 *  2. Position [X, Y, Z]
 *  3. Direction / Target [X, Y, Z]
 *  4. Power / Intensity
 *  5. Color
 *  6. Light Radius & Falloff Distance (matching Blender's Radius e.g. 2.27m)
 *  7. Shadows (castShadow, shadowMapSize, shadowBias, radius)
 */

import { tokens } from '@/tokens/design-tokens';

export interface LightConfig {
  /** Identifier label (e.g. 'blender_main_sun', 'ambient_sky', 'rastaak_spot') */
  id: string;

  /**
   * LIGHT TYPE:
   *  - 'directional' : Sun-like parallel light rays (best for realistic shadows)
   *  - 'point'       : Emits light in all directions from a 3D point
   *  - 'spot'        : Cone-shaped spotlight pointing from position to target
   *  - 'ambient'     : Universal background fill light (no direction/shadows)
   *  - 'hemisphere'  : Sky color vs Ground color gradient fill light
   */
  type: 'directional' | 'point' | 'spot' | 'ambient' | 'hemisphere';

  /** Light color (hex number or token reference) */
  color: number;

  /** Ground color (ONLY used for hemisphere lights) */
  groundColor?: number;

  /** Power / Intensity multiplier (e.g. 1.8 for bright sun, 0.4 for soft fill) */
  intensity: number;

  /** Light position in 3D world space: [X, Y, Z] */
  position?: [number, number, number];

  /** Target point in 3D world space [X, Y, Z] for directional or spot lights */
  target?: [number, number, number];

  /** Distance falloff range in meters for Point / Spot lights (0 = infinite distance) */
  distance?: number;

  /**
   * Light Radius in meters (matches Blender's Radius setting e.g. 2.27m).
   * Also controls soft shadow blur radius.
   */
  radius?: number;

  /** Cone angle in degrees for Spot lights (e.g. 45) */
  angle?: number;

  /** Cone edge softness for Spot lights (0.0 = hard edge, 1.0 = soft edge) */
  penumbra?: number;

  /** Whether this light casts shadows on buildings & ground (true / false) */
  castShadow?: boolean;

  /** Shadow map resolution (512, 1024, 2048, or 4096) */
  shadowMapSize?: number;

  /** Shadow bias to avoid acne artifacts (e.g. -0.0005) */
  shadowBias?: number;
}

export const LIGHTS_CONFIG: LightConfig[] = [
  {
    id: 'ambient_fill',
    type: 'ambient',
    color: tokens.experimentalScene.ambient,
    intensity: 0,
  },
  {
    id: 'hemisphere_sky_ground',
    type: 'hemisphere',
    color: tokens.experimentalScene.keyLight,
    groundColor: tokens.experimentalScene.hemisphereGround,
    intensity: 0,
  },
  {
    id: 'blender_main_sun',
    type: 'point',
    color: tokens.experimentalScene.keyLight, // 6500K daylight white
    intensity: 400,
    position: [13, 15, -4],
    target: [0, 0, 0],
    castShadow: true,
    shadowMapSize: 2048,
    shadowBias: -0.0001,
    radius: 10, // Soft shadow blur radius matching Blender 2.27m radius
  },
  {
    id: 'soft_fill_light',
    type: 'directional',
    color: tokens.experimentalScene.fillLight,
    intensity: 0.0,
    position: [40, 30, 30],
    target: [14, 2, -1],
    castShadow: false,
  },
];
