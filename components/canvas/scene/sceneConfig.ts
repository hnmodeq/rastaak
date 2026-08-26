/**
 * RASTAAK 3D SCENE CONTROLLER CONFIG
 * Saved automatically from 3D Studio
 */

import { LIGHTS_CONFIG } from './lightingConfig';
import type { CameraStop, MaterialsConfig, SceneConfig } from './sceneTypes';

export type { CameraKeyframe, CameraMethod, CameraStop, MaterialsConfig, LightConfig, SceneConfig } from './sceneTypes';
export { LIGHTS_CONFIG } from './lightingConfig';

export const SCENE_CONFIG: SceneConfig = {
  cameraMethod: "progress",
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
      progress: 0.112961,
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
      progress: 0.803805,
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
    },
    {
      id: "stop_10_custom",
      progress: 1,
      camera: [17.18, 3.16, -6.47],
      target: [9.7, -0.03, -0.79],
      fov: 41.59453
    },
    {
      id: "stop_11_custom",
      progress: 1,
      camera: [14.39, 5.98, 0.24],
      target: [9.7, -0.03, -0.79],
      fov: 32.527273
    }
  ] as CameraStop[],
  progressKeyframes: [
    {
      id: "keyframe_1_stop_1_overview",
      progress: 0,
      camera: [-2.6937, 15.1755, -17.4141],
      target: [14.1353, 2.5182, 0.8316],
      fov: 49
    },
    {
      id: "keyframe_2",
      progress: 0.036176,
      camera: [11.1999, 3.7547, 1.2224],
      target: [12.0853, 3.0753, 2.5591],
      fov: 49
    },
    {
      id: "keyframe_6",
      progress: 0.115848,
      camera: [11.3718, 3.7308, -1.1382],
      target: [12.6049, 3.1319, 2.5538],
      fov: 49
    },
    {
      id: "keyframe_5",
      progress: 0.195952,
      camera: [15.0667, 5.6958, -0.5407],
      target: [13.0881, 3.2161, 2.3516],
      fov: 49
    },
    {
      id: "keyframe_9",
      progress: 0.260551,
      camera: [16.0194, 8.1266, -2.6064],
      target: [14.0097, 0.4826, -3.8801],
      fov: 49
    },
    {
      id: "keyframe_10",
      progress: 0.361326,
      camera: [21.2146, 7.6692, 3.3204],
      target: [14.0473, 0.1755, -4.7079],
      fov: 49
    },
    {
      id: "keyframe_12",
      progress: 0.44143,
      camera: [15.3283, 1.9694, -2.6041],
      target: [13.3434, 0.3321, -4.1831],
      fov: 49
    },
    {
      id: "keyframe_14",
      progress: 0.511628,
      camera: [16.3103, 2.0871, -10.6386],
      target: [10.679, -0.1192, -3.5793],
      fov: 49
    },
    {
      id: "keyframe_16",
      progress: 0.608958,
      camera: [8.8424, 0.7005, -7.481],
      target: [10.7944, 0.1979, -3.7686],
      fov: 49
    },
    {
      id: "keyframe_18",
      progress: 0.698536,
      camera: [4.7788, 1.6871, -9.0411],
      target: [11.1825, 1.0736, -4.2228],
      fov: 49
    },
    {
      id: "keyframe_21",
      progress: 0.816968,
      camera: [16.3508, 1.767, -1.0968],
      target: [14.3604, -0.1302, 0.2354],
      fov: 49
    },
    {
      id: "keyframe_23",
      progress: 0.8816,
      camera: [13.9413, 0.3202, -1.504],
      target: [14.5728, 1.1893, 0.4942],
      fov: 49
    },
    {
      id: "keyframe_24",
      progress: 0.944444,
      camera: [11.0118, 0.2203, -6.2749],
      target: [14.4953, 1.1013, 0.3802],
      fov: 49
    },
    {
      id: "keyframe_25",
      progress: 1,
      camera: [5.9688, 0.1853, -17.8058],
      target: [14.5411, 2.2306, 0.2988],
      fov: 49
    }
  ] as CameraStop[],

  scroll: {
    headerScrollMultiplier: 5,
    journeyScrollLength: 6,
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
    fogColor: 0x000000,
    fogStart: 0,
    fogEnd: 92,
    fogEnabled: true,
    skyEnabled: true,
    sky: {
      zenithColor: 0x00025b,
      upperColor: 0x081a31,
      horizonColor: 0x27375c,
      warmthColor: 0x000000,
      moonColor: 0xffffff,
      starColor: 0xffffff,
      rotationY: 178,
      moonAzimuth: -68,
      moonElevation: 39,
      moonSize: 1.53,
      moonGlow: 0.53,
      horizonGlow: 1.51,
      starDensity: 2,
      starIntensity: 3,
      exposure: 3
    },
    horizon: {
      enabled: true,
      color: 0x000000,
      opacity: 0.92,
      height: -0.03,
      softness: 0.72
    },
    shadowColor: 0x111b31,
    shadowOpacity: 0.32
  },

  renderer: {
    toneMappingExposure: 2.05,
    shadowMapType: "pcf"
  },

  materials: {
    buildingColor: 0x0a0a0a,
    windowColor: 0x6e6e6e,
    rastaakColor: 0x000000,
    logoColor: 0x6e6e6e,
    groundColor: 0x000000,
    plateColor: 0x1d1d1d,
    borderColor: 0x282828,
    treeTrunkColor: 0x000000,
    treeLeafColor: 0x00240c,
    globalFacadeColor: 0x0a0a0a,
    globalWindowColor: 0x6e6e6e,
    roughness: 0.65,
    metalness: 0.48,
    envMapIntensity: 1.3,
    groundRoughness: 0.64,
    groundMetalness: 0.74,
    groundEnvMapIntensity: 0.85,
    overrides: {}
  } as MaterialsConfig,

  visibility: {
    showBigTrees: true,
    showSmallTrees: false,
    buildings: {
      "Building 6": false
    }
  },
};
