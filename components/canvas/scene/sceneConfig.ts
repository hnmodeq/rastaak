/**
 * RASTAAK 3D SCENE CONTROLLER CONFIG
 * Saved automatically from 3D Studio
 */

import { LIGHTS_CONFIG } from './lightingConfig';
import type { CameraStop, MaterialsConfig, SceneConfig } from './sceneTypes';

export type { CameraKeyframe, CameraMethod, CameraStop, MaterialsConfig, LightConfig, SceneConfig } from './sceneTypes';
export { LIGHTS_CONFIG } from './lightingConfig';

export const SCENE_CONFIG: SceneConfig = {
  cameraMethod: "stops",
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
  progressKeyframes: [] as CameraStop[],

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
    backgroundColor: 0x050812,
    fogColor: 0x020406,
    fogStart: 12,
    fogEnd: 60,
    fogEnabled: true,
    skyEnabled: true,
    sky: {
      zenithColor: 0x00025b,
      upperColor: 0x081a31,
      horizonColor: 0x27375c,
      warmthColor: 0x000000,
      moonColor: 0xffffff,
      starColor: 0xc8dcff,
      rotationY: 0,
      moonAzimuth: -94,
      moonElevation: 39,
      moonSize: 1.15,
      moonGlow: 1,
      horizonGlow: 1,
      starDensity: 0.88,
      starIntensity: 1.72,
      exposure: 3
    },
    horizon: {
      enabled: true,
      color: 0x050910,
      opacity: 0.92,
      height: -0.03,
      softness: 0.72
    },
    shadowColor: 0x111b31,
    shadowOpacity: 0.32
  },

  renderer: {
    toneMappingExposure: 0.88,
    shadowMapType: "pcf"
  },

  materials: {
    buildingColor: 0x0b101a,
    windowColor: 0x9dbfe8,
    rastaakColor: 0x060a28,
    logoColor: 0xf4f8ff,
    groundColor: 0x080d19,
    plateColor: 0x141c2c,
    borderColor: 0x2b3c5d,
    treeTrunkColor: 0x3b2b25,
    treeLeafColor: 0x101b25,
    globalFacadeColor: 0x0b101a,
    globalWindowColor: 0x9dbfe8,
    roughness: 0.38,
    metalness: 0.68,
    envMapIntensity: 1.25,
    groundRoughness: 0.64,
    groundMetalness: 0.16,
    groundEnvMapIntensity: 0.92,
    overrides: {}
  } as MaterialsConfig,

  visibility: {
    showBigTrees: true,
    showSmallTrees: false
  },
};
