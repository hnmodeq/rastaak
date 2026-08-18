/**
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

export const LIGHTS_CONFIG: LightConfig[] = [
  {
    "id": "blender_single_point_light",
    "type": "point",
    "color": 0x2607d8,
    "intensity": 1200,
    "position": [
      13.5,
      18,
      -4
    ],
    "distance": 50,
    "decay": 1.8,
    "radius": 2.27,
    "castShadow": true,
    "shadowMapSize": 2048,
    "shadowBias": -0.0001
  }
];
