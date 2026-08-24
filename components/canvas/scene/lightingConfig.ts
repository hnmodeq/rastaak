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
    color: 0x9bb4d4,
    groundColor: 0x1c1614,
    intensity: 0.38,
    enabled: true
  },
  {
    id: "moon_key",
    type: "directional",
    color: 0xd7e6ff,
    intensity: 2.2,
    position: [24, 26, 10],
    target: [13.36, 0.15, -0.7],
    castShadow: true,
    shadowMapSize: 2048,
    shadowBias: -0.00035,
    shadowNormalBias: 0.038,
    shadowNear: 4,
    shadowFar: 90,
    radius: 2.8,
    enabled: true
  },
  {
    id: "plaza_soft",
    type: "rectarea",
    color: 0xfff1dd,
    intensity: 11,
    position: [13.4, 13.5, -0.7],
    target: [13.4, 0, -0.7],
    width: 16,
    height: 10,
    enabled: true
  },
  {
    id: "plaza_lamp",
    type: "point",
    color: 0xffe4c4,
    intensity: 55,
    position: [13.4, 6.8, -0.7],
    distance: 22,
    decay: 2,
    radius: 4,
    castShadow: false,
    enabled: true
  },
  {
    id: "rim_cool",
    type: "point",
    color: 0x7aa8ff,
    intensity: 48,
    position: [5.5, 9, -5.5],
    distance: 32,
    decay: 2,
    castShadow: false,
    enabled: true
  },
  {
    id: "accent_rastaak",
    type: "point",
    color: 0xc5dcff,
    intensity: 32,
    position: [16.2, 6.2, 2.1],
    distance: 14,
    decay: 2,
    castShadow: false,
    enabled: true
  }
];
