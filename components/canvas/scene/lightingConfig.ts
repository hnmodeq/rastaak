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
    intensity: 50,
    position: [13.5, 5, -0.5],
    distance: 72,
    decay: 0.8,
    radius: 2.5,
    castShadow: true,
    enabled: true,
    shadowMapSize: 512,
    shadowBias: -0.0013
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
