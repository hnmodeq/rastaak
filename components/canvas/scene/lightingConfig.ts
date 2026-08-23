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
    intensity: 1500,
    position: [13.5, 15, -4.5],
    distance: 68,
    decay: 2.1,
    radius: 5.6,
    castShadow: true,
    enabled: false,
    shadowMapSize: 512,
    shadowBias: -0.0027
  },
  {
    id: "area_soft_key",
    type: "rectarea",
    color: 0xffffff,
    intensity: 9.1,
    position: [13.5, 18, -0.5],
    target: [13.5, 0, -0.5],
    width: 68.1,
    height: 38.3,
    enabled: true
  }
];
