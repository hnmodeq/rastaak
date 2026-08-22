/**
 * RASTAAK 3D LIGHTING CONTROLLER CONFIG
 * Saved automatically from 3D Studio
 */

import type { LightConfig } from './sceneTypes';

export type { LightConfig };

export const LIGHTS_CONFIG: LightConfig[] = [
  {
    id: "blender_single_point_light",
    type: "point",
    color: 0xffffff,
    intensity: 1570,
    position: [-4.5, 16.5, -4],
    distance: 72,
    decay: 1.6,
    radius: 5.6,
    castShadow: true,
    shadowMapSize: 2048,
    shadowBias: -0.0008
  }
];
