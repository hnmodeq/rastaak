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
 *  6. Shadows (castShadow, shadowMapSize, shadowBias)
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

  /** Distance falloff for Point / Spot lights (0 = infinite distance) */
  distance?: number;

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
    intensity: 1.4,
  },
  {
    id: 'hemisphere_sky_ground',
    type: 'hemisphere',
    color: tokens.experimentalScene.keyLight,
    groundColor: tokens.experimentalScene.hemisphereGround,
    intensity: 1.1,
  },
  {
    id: 'blender_main_sun',
    type: 'directional',
    color: tokens.experimentalScene.keyLight, // 6500K daylight white
    intensity: 1.8,
    position: [-20, 55, -15],
    target: [14, 2, -1],
    castShadow: true,
    shadowMapSize: 2048,
    shadowBias: -0.0005,
  },
  {
    id: 'soft_fill_light',
    type: 'directional',
    color: tokens.experimentalScene.fillLight,
    intensity: 1.0,
    position: [40, 30, 30],
    target: [14, 2, -1],
    castShadow: false,
  },
];
