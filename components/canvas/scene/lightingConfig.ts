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
    "color": 0xffffff,
    "intensity": 5000,
    "position": [
      10.5,
      10,
      1.5
    ],
    "distance": 27,
    "decay": 3,
    "radius": 20,
    "castShadow": true,
    "shadowMapSize": 512,
    "shadowBias": -0.005
  }
];
