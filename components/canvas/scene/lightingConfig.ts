/**
 * RASTAAK 3D LIGHTING CONTROLLER CONFIG
 * Saved automatically from 3D Studio
 *
 * Night architectural rig for glossy black facades.
 * One shadow caster. Softboxes do the reflections. Practicals add warmth.
 */

import type { LightConfig } from './sceneTypes';

export type { LightConfig };

export const LIGHTS_CONFIG: LightConfig[] = [
  {
    id: "sky_fill",
    type: "hemisphere",
    color: 0x8ea8cc,
    groundColor: 0x1a1412,
    intensity: 0.22,
    enabled: true
  },
  {
    id: "moon_key",
    type: "directional",
    color: 0xc8dbf5,
    intensity: 1.75,
    position: [22, 28, 13],
    target: [13.36, 0.2, -0.7],
    castShadow: true,
    shadowMapSize: 2048,
    shadowBias: -0.0004,
    shadowNormalBias: 0.04,
    shadowNear: 6,
    shadowFar: 88,
    radius: 3.4,
    enabled: true
  },
  {
    id: "sky_soft",
    type: "rectarea",
    color: 0xb9cbe6,
    intensity: 4.6,
    position: [13.4, 21, -0.7],
    target: [13.4, 0, -0.7],
    width: 40,
    height: 26,
    enabled: true
  },
  {
    id: "cam_soft",
    type: "rectarea",
    color: 0xe7eef8,
    intensity: 7.2,
    position: [20.8, 7.2, -0.45],
    target: [13.36, 1.35, -0.7],
    width: 9,
    height: 5.5,
    enabled: true
  },
  {
    id: "plaza_warm",
    type: "rectarea",
    color: 0xffe3bf,
    intensity: 8.4,
    position: [13.4, 10.5, -0.7],
    target: [13.4, 0, -0.7],
    width: 12,
    height: 8,
    enabled: true
  },
  {
    id: "ground_bounce",
    type: "rectarea",
    color: 0xfff1dc,
    intensity: 2.8,
    position: [13.4, 0.32, -0.7],
    target: [13.4, 7.5, -0.7],
    width: 18,
    height: 12,
    enabled: true
  },
  {
    id: "rim_cool",
    type: "point",
    color: 0x6f9cff,
    intensity: 34,
    position: [4.4, 10.8, -6.4],
    distance: 30,
    decay: 2,
    castShadow: false,
    enabled: true
  },
  {
    id: "accent_rastaak",
    type: "point",
    color: 0xd4e6ff,
    intensity: 26,
    position: [16.4, 6.5, 2.15],
    distance: 12,
    decay: 2,
    castShadow: false,
    enabled: true
  }
];
