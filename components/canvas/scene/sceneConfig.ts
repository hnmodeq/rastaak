/**
 * RASTAAK 3D SCENE CONTROLLER CONFIG
 * Saved automatically from 3D Studio
 */

import { LIGHTS_CONFIG } from './lightingConfig';
import type { CameraStop, MaterialsConfig, SceneConfig } from './sceneTypes';

export type { CameraStop, MaterialsConfig, LightConfig, SceneConfig } from './sceneTypes';
export { LIGHTS_CONFIG } from './lightingConfig';

export const SCENE_CONFIG: SceneConfig = {
  stops: [
    {
      id: "stop_1_overview",
      progress: 0,
      camera: [15.036727, 1.036661, -12],
      target: [15, 1.2, 1.5],
      fov: 45
    },
    {
      id: "stop_2_hyper",
      progress: 0.16,
      camera: [15.005536, 0.720672, -5.544793],
      target: [15, 1, 1.5],
      fov: 45
    },
    {
      id: "stop_3_hyper_reply",
      progress: 0.3,
      camera: [15.054576, 0.5, -1.830526],
      target: [13, 3, 2.5],
      fov: 42
    },
    {
      id: "stop_4_building7",
      progress: 0.44,
      camera: [14.190916, 1, -1.66638],
      target: [14.2, 1, 2.9],
      fov: 40
    },
    {
      id: "stop_5_south",
      progress: 0.6,
      camera: [16.8, 3.4, -7.4],
      target: [14, 1.5, -1],
      fov: 42
    },
    {
      id: "stop_6_building34",
      progress: 0.74,
      camera: [6.6, 2.6, -7.6],
      target: [11.2, 1.1, -2.2],
      fov: 40
    },
    {
      id: "stop_7_tower",
      progress: 0.88,
      camera: [13.2, 6.2, -1.2],
      target: [16, 3.4, 2.3],
      fov: 36
    },
    {
      id: "stop_8_logo",
      progress: 1,
      camera: [15.35, 5.55, 0.55],
      target: [16.26, 4.1, 2.05],
      fov: 30
    }
  ] as CameraStop[],

  scroll: {
    headerScrollMultiplier: 5,
    cameraDamping: 3.71,
    idleFloatAmount: 0.08,
    idleFloatSpeed: 0.4
  },

  camera: {
    defaultFov: 45,
    near: 0.1,
    far: 1000
  },

  lights: LIGHTS_CONFIG,

  environment: {
    backgroundColor: 0x0b0b0b,
    fogColor: 0x0b0b0b,
    fogStart: 19,
    fogEnd: 34,
    fogEnabled: true,
    shadowColor: 0x202020,
    shadowOpacity: 0
  },

  renderer: {
    toneMappingExposure: 0.7
  },

  materials: {
    buildingColor: 0x000000,
    windowColor: 0xc1c1c1,
    rastaakColor: 0x000000,
    logoColor: 0xffffff,
    groundColor: 0x000000,
    plateColor: 0x7f7f7f,
    borderColor: 0x191919,
    treeTrunkColor: 0x6b4f2a,
    treeLeafColor: 0x3d6b3a,
    globalFacadeColor: 0x000000,
    globalWindowColor: 0xc1c1c1,
    roughness: 0.8,
    metalness: 0.25,
    envMapIntensity: 1.55,
    groundRoughness: 1,
    groundMetalness: 1,
    groundEnvMapIntensity: 1.4,
    overrides: {}
  } as MaterialsConfig,
};
