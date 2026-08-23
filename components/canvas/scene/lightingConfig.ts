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
    intensity: 1200,
    position: [13.5, 15, -4.5],
    distance: 68,
    decay: 2.1,
    radius: 16.6,
    castShadow: true,
    shadowMapSize: 512,
    shadowBias: -0.0002
  },
  {
    id: "area_soft_key",
    type: "rectarea",
    color: 0xffffff,
    intensity: 8,
    position: [13.5, 18, -4.5],
    target: [13.5, 0, -4.5],
    width: 8,
    height: 8
  }
];
