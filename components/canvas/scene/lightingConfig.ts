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
    intensity: 150,
    position: [13.5, 8, -0.5],
    distance: 18,
    decay: 0.2,
    radius: 6.7,
    castShadow: true,
    enabled: true,
    shadowMapSize: 512,
    shadowBias: 0.0005
  },
  {
    id: "area_soft_key",
    type: "rectarea",
    color: 0xffffff,
    intensity: 0,
    position: [13.5, 18, -0.5],
    target: [13.5, 0, -0.5],
    width: 68.1,
    height: 38.3,
    enabled: false
  }
];
