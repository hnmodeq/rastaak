/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  RASTAAK 3D LIGHTING CONTROLLER CONFIG
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Exact Blender 5.1.2 Single Point Light Setup (image.png):
 *  - Type: Point Light
 *  - Position: [13.5, 18.0, -4.0] (Hovering over central skyscraper cluster)
 *  - Temperature: 6500K pure white
 *  - Power: 763.4W
 *  - Radius: 2.27m (Soft falloff)
 *  - Custom Distance: 40m
 *  - Shadows: Enabled
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

  /** Distance falloff range in meters (matches Blender Custom Distance: 40m) */
  distance?: number;

  /** Light decay exponent (2 = physical inverse square decay) */
  decay?: number;

  /** Soft shadow blur radius (matches Blender Radius: 2.27m) */
  radius?: number;

  /** Cone angle in degrees for Spot lights */
  angle?: number;

  /** Cone edge softness for Spot lights */
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
    id: 'blender_single_point_light',
    type: 'point',
    color: tokens.experimentalScene.keyLight, // 6500K daylight white
    intensity: 950,                           // 763.4W Blender power
    position: [13.5, 18.0, -4.0],             // Hovering above central skyscraper cluster
    distance: 40,                             // Blender Custom Distance: 40m
    decay: 1.8,                               // Soft physical falloff
    radius: 2.27,                             // Blender Radius: 2.27m
    castShadow: true,
    shadowMapSize: 2048,
    shadowBias: -0.0001,
  },
];
