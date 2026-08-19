/**
 * RASTAAK 3D LIGHTING CONTROLLER CONFIG
 * Saved automatically from 3D Studio
 */

import type { LightConfig } from './sceneTypes';

export type { LightConfig };

export const LIGHTS_CONFIG: LightConfig[] = [
  {
    id: 'blender_single_point_light',
    type: 'point',
    color: 0x2607d8,
    intensity: 1200,
    position: [13.5, 18, -4],
    distance: 50,
    decay: 1.8,
    radius: 2.27,
    castShadow: true,
    shadowMapSize: 2048,
    shadowBias: -0.0001,
  },
];
