/**
 * RASTAAK 3D LIGHTING CONTROLLER CONFIG
 * Saved automatically from 3D Studio
 */

import type { LightConfig } from './sceneTypes';

export type { LightConfig };

export const LIGHTS_CONFIG: LightConfig[] = [
  {
    id: "sky_fill",
    type: "hemisphere",
    color: 0x9db5d8,
    intensity: 0.14,
    groundColor: 0x151822,
    position: [0, 1, 0],
    enabled: true
  },
  {
    id: "moon_key",
    type: "directional",
    color: 0xc3d8f6,
    intensity: 1.35,
    position: [22, 28, 13],
    target: [13.36, 0.2, -0.7],
    radius: 3.4,
    castShadow: true,
    enabled: true,
    shadowMapSize: 2048,
    shadowBias: -0.0004,
    shadowNormalBias: 0.04,
    shadowNear: 6,
    shadowFar: 88,
    shadowIntensity: 1
  },
  {
    id: "sky_soft",
    type: "rectarea",
    color: 0xc9c9c9,
    intensity: 2.8,
    position: [13.4, 21, -0.7],
    target: [13.4, 0, -0.7],
    width: 40,
    height: 26,
    enabled: true
  },
  {
    id: "cam_soft",
    type: "rectarea",
    color: 0xd6e6ff,
    intensity: 4.1,
    position: [20.8, 7.2, -0.45],
    target: [13.36, 1.35, -0.7],
    width: 9,
    height: 5.5,
    enabled: true
  },
  {
    id: "plaza_warm",
    type: "rectarea",
    color: 0xffc98f,
    intensity: 6.4,
    position: [13.4, 10.5, -0.7],
    target: [13.4, 0, -0.7],
    width: 12,
    height: 8,
    enabled: true
  },
  {
    id: "ground_bounce",
    type: "rectarea",
    color: 0xffdfb8,
    intensity: 1.2,
    position: [13.4, 0.32, -0.7],
    target: [13.4, 7.5, -0.7],
    width: 18,
    height: 12,
    enabled: true
  },
  {
    id: "rim_cool",
    type: "point",
    color: 0x6797ff,
    intensity: 25,
    position: [4.4, 10.8, -6.4],
    distance: 30,
    decay: 2,
    radius: 1,
    castShadow: false,
    enabled: false,
    shadowMapSize: 512,
    shadowBias: 0,
    shadowNormalBias: 0,
    shadowNear: 0.5,
    shadowFar: 250,
    shadowIntensity: 1
  },
  {
    id: "accent_rastaak",
    type: "point",
    color: 0xb7d2ff,
    intensity: 17,
    position: [16.4, 6.5, 2.15],
    distance: 12,
    decay: 2,
    radius: 1,
    castShadow: false,
    enabled: true,
    shadowMapSize: 512,
    shadowBias: 0,
    shadowNormalBias: 0,
    shadowNear: 0.5,
    shadowFar: 250,
    shadowIntensity: 1
  }
];
