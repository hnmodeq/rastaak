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
      camera: [6.9408, 1.2996, -13.7121],
      target: [12.0468, 2.906, 2.5048],
      fov: 49
    },
    {
      id: "keyframe_2",
      progress: 0.081395,
      camera: [11.4339, 2.7132, 0.5583],
      target: [12.0468, 2.906, 2.5048],
      fov: 49
    },
    {
      id: "keyframe_3",
      progress: 0.124462,
      camera: [11.0072, 2.5731, -0.903],
      target: [12.0772, 2.9096, 2.4949],
      fov: 49
    },
    {
      id: "keyframe_6",
      progress: 0.153316,
      camera: [11.3718, 3.7308, -1.1382],
      target: [12.6049, 3.1319, 2.5538],
      fov: 49
    },
    {
      id: "keyframe_4",
      progress: 0.18174,
      camera: [11.7309, 4.8713, -1.3698],
      target: [13.052, 3.2161, 2.3644],
      fov: 49
    },
    {
      id: "keyframe_5",
      progress: 0.23385,
      camera: [15.0667, 5.6958, -0.5407],
      target: [13.0881, 3.2161, 2.3516],
      fov: 49
    },
    {
      id: "keyframe_7",
      progress: 0.307063,
      camera: [25.6677, 14.8045, -17.4701],
      target: [13.7552, -0.125, -0.0565],
      fov: 49
    },
    {
      id: "keyframe_9",
      progress: 0.352283,
      camera: [16.0194, 8.1266, -2.6064],
      target: [14.0097, 0.4826, -3.8801],
      fov: 49
    },
    {
      id: "keyframe_8",
      progress: 0.42851,
      camera: [15.9173, 4.0936, -2.0509],
      target: [13.4718, 0.2887, -4.3058],
      fov: 49
    },
    {
      id: "keyframe_10",
      progress: 0.455642,
      camera: [21.2082, 5.4418, 4.934],
      target: [14.0473, 0.1755, -4.7079],
      fov: 49
    },
    {
      id: "keyframe_11",
      progress: 0.495263,
      camera: [20.1931, 10.5551, 0.4371],
      target: [14.0473, 0.1755, -4.7079],
      fov: 49
    },
    {
      id: "keyframe_12",
      progress: 0.557709,
      camera: [15.3283, 1.9694, -2.6041],
      target: [13.3434, 0.3321, -4.1831],
      fov: 49
    },
    {
      id: "keyframe_13",
      progress: 0.590439,
      camera: [15.7075, 0.5552, -7.3162],
      target: [11.2659, 0.4204, -3.5903],
      fov: 49
    },
    {
      id: "keyframe_14",
      progress: 0.624031,
      camera: [6.6149, 2.743, -8.271],
      target: [10.9557, -0.5494, -4.157],
      fov: 49
    },
    {
      id: "keyframe_15",
      progress: 0.659776,
      camera: [8.8887, 0.8424, -5.8719],
      target: [10.8082, -0.6135, -4.0527],
      fov: 49
    },
    {
      id: "keyframe_16",
      progress: 0.722222,
      camera: [8.7952, 0.5503, -5.9522],
      target: [10.8829, -0.3223, -3.9537],
      fov: 49
    },
    {
      id: "keyframe_17",
      progress: 0.771748,
      camera: [6.2484, 0.3931, -7.2115],
      target: [11.0375, 0.8957, -3.9801],
      fov: 49
    },
    {
      id: "keyframe_18",
      progress: 0.821705,
      camera: [8.2501, 2.181, -11.6464],
      target: [11.1823, 1.0737, -4.2454],
      fov: 49
    },
    {
      id: "keyframe_19",
      progress: 0.86348,
      camera: [13.5886, 4.9144, -10.883],
      target: [11.1823, 1.0737, -4.2454],
      fov: 49
    },
    {
      id: "keyframe_20",
      progress: 0.918174,
      camera: [19.1987, 5.6433, -3.4876],
      target: [13.3924, 1.1502, -0.2169],
      fov: 49
    },
    {
      id: "keyframe_21",
      progress: 0.935401,
      camera: [15.2322, 1.247, -0.2125],
      target: [14.2969, 0.127, 0.3713],
      fov: 49
    },
    {
      id: "keyframe_22",
      progress: 0.947459,
      camera: [15.0766, 0.3979, -0.9661],
      target: [14.2969, 0.127, 0.3713],
      fov: 49
    },
    {
      id: "keyframe_23",
      progress: 0.966408,
      camera: [13.5507, 0.0298, -2.0754],
      target: [14.4953, 1.1013, 0.3802],
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
    roughness: 0.37,
    metalness: 0.8,
    envMapIntensity: 1.3,
    groundRoughness: 0.64,
    groundMetalness: 0.74,
    groundEnvMapIntensity: 0.95,
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
