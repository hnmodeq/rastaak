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
      camera: [21.44, 6.02, -0.41],
      target: [9.7, -0.03, -0.79],
      fov: 47
    },
    {
      id: "stop_2_hyper",
      progress: 0.1,
      camera: [14.93, 0.3, -1.5],
      target: [14, 0.5, 1.5],
      fov: 15
    },
    {
      id: "stop_3_hyper_reply",
      progress: 0.2,
      camera: [15.054576, 0.5, -1.830526],
      target: [15, 2, 0.5],
      fov: 42
    },
    {
      id: "stop_4_building7",
      progress: 0.4,
      camera: [15, 1, -1.5],
      target: [15, 0.5, 0.5],
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
    },
    {
      id: "stop_9_custom",
      progress: 1,
      camera: [21.44, 6.02, -0.41],
      target: [9.7, -0.03, -0.79],
      fov: 89.995445
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
    backgroundColor: 0x05060a,
    fogColor: 0x07080e,
    fogStart: 16,
    fogEnd: 48,
    fogEnabled: true,
    shadowColor: 0x0a1422,
    shadowOpacity: 0.32
  },

  renderer: {
    toneMappingExposure: 0.88,
    shadowMapType: "pcfsoft"
  },

  materials: {
    buildingColor: 0x12151c,
    windowColor: 0xf3d7a4,
    rastaakColor: 0x0c1018,
    logoColor: 0xffffff,
    groundColor: 0x08090e,
    plateColor: 0x16181e,
    borderColor: 0x0a0b14,
    treeTrunkColor: 0x2c241c,
    treeLeafColor: 0x0e1812,
    globalFacadeColor: 0x12151c,
    globalWindowColor: 0xf3d7a4,
    globalWindowRoughness: 0.2,
    globalWindowMetalness: 0.04,
    roughness: 0.2,
    metalness: 0.94,
    envMapIntensity: 1.65,
    groundRoughness: 0.32,
    groundMetalness: 0.62,
    groundEnvMapIntensity: 1.85,
    windowEmissiveIntensity: 1.45,
    logoEmissiveIntensity: 0.55,
    clearcoat: 0.62,
    clearcoatRoughness: 0.14,
    overrides: {}
  } as MaterialsConfig,

  visibility: {
    showBigTrees: true,
    showSmallTrees: false
  },
};
