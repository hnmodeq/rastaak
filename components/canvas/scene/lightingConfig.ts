/**
 * RASTAAK 3D LIGHTING CONTROLLER CONFIG
 * Saved automatically from 3D Studio
 *
 * Midnight plaza rig for wet black-chrome facades.
 * Moon is the only shadow caster. Softboxes write the reflections.
 * Street practicals and a shop spill keep the court alive.
 */

import type { LightConfig } from './sceneTypes';

export type { LightConfig };

export const LIGHTS_CONFIG: LightConfig[] = [
  {
    id: "sky_fill",
    type: "hemisphere",
    color: 0x6d82a3,
    groundColor: 0x1c1410,
    intensity: 0.26,
    enabled: true
  },
  {
    id: "moon_key",
    type: "directional",
    color: 0xd7e6fb,
    intensity: 1.42,
    position: [24.5, 31, 15.5],
    target: [13.36, 0.15, -0.7],
    castShadow: true,
    shadowMapSize: 2048,
    shadowBias: -0.00035,
    shadowNormalBias: 0.045,
    shadowNear: 8,
    shadowFar: 78,
    radius: 3.8,
    enabled: true
  },
  {
    id: "moon_fill",
    type: "directional",
    color: 0x9bb0d0,
    intensity: 0.28,
    position: [-16, 22, -14],
    target: [13.36, 1.2, -0.7],
    castShadow: false,
    enabled: true
  },
  {
    id: "sky_soft",
    type: "rectarea",
    color: 0xa9bed8,
    intensity: 3.2,
    position: [13.4, 22, -0.7],
    target: [13.4, 0, -0.7],
    width: 38,
    height: 24,
    enabled: true
  },
  {
    id: "cam_soft",
    type: "rectarea",
    color: 0xf3f7ff,
    intensity: 9.8,
    position: [21.2, 7.4, -0.4],
    target: [13.36, 1.45, -0.7],
    width: 10.5,
    height: 6.2,
    enabled: true
  },
  {
    id: "plaza_warm",
    type: "rectarea",
    color: 0xffd4a3,
    intensity: 6.4,
    position: [13.4, 9.6, -0.7],
    target: [13.4, 0, -0.7],
    width: 11,
    height: 7.5,
    enabled: true
  },
  {
    id: "ground_bounce",
    type: "rectarea",
    color: 0xffead0,
    intensity: 3.6,
    position: [13.4, 0.28, -0.7],
    target: [13.4, 8, -0.7],
    width: 20,
    height: 14,
    enabled: true
  },
  {
    id: "rim_cool",
    type: "point",
    color: 0x6ea0ff,
    intensity: 40,
    position: [4.2, 11.2, -6.8],
    distance: 32,
    decay: 2,
    castShadow: false,
    enabled: true
  },
  {
    id: "accent_rastaak",
    type: "point",
    color: 0xe4f0ff,
    intensity: 34,
    position: [16.55, 6.7, 2.2],
    distance: 11,
    decay: 2,
    castShadow: false,
    enabled: true
  },
  {
    id: "street_ne",
    type: "point",
    color: 0xffc27a,
    intensity: 22,
    position: [17.45, 4.15, 2.45],
    distance: 9.5,
    decay: 2,
    castShadow: false,
    enabled: true
  },
  {
    id: "street_nw",
    type: "point",
    color: 0xffc27a,
    intensity: 20,
    position: [9.95, 3.85, 3.15],
    distance: 9,
    decay: 2,
    castShadow: false,
    enabled: true
  },
  {
    id: "street_se",
    type: "point",
    color: 0xffc27a,
    intensity: 20,
    position: [17.55, 3.85, -4.15],
    distance: 9,
    decay: 2,
    castShadow: false,
    enabled: true
  },
  {
    id: "street_sw",
    type: "point",
    color: 0xffc27a,
    intensity: 18,
    position: [10.05, 3.85, -4.35],
    distance: 9,
    decay: 2,
    castShadow: false,
    enabled: true
  },
  {
    id: "shop_warm",
    type: "point",
    color: 0xffd09a,
    intensity: 16,
    position: [14.28, 2.15, 0.52],
    distance: 6.5,
    decay: 2,
    castShadow: false,
    enabled: true
  }
];
