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
    intensity: 2100,
    position: [14, 5.5, 0],
    distance: 10,
    decay: 2.7,
    radius: 5.6,
    castShadow: true,
    enabled: true,
    shadowMapSize: 4096,
    shadowBias: 0.0012,
    shadowNormalBias: 0.035,
    shadowNear: 1.4,
    shadowFar: 10,
    shadowIntensity: 1
  },
  {
    id: "area_soft_key",
    type: "rectarea",
    color: 0xffffff,
    intensity: 2,
    position: [13.5, 18, -0.5],
    target: [13.5, 0, -0.5],
    width: 68.1,
    height: 38.3,
    enabled: true
  }
];
