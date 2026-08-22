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
      camera: [5.5, 8.5, -7.5],
      target: [13.4, 1.2, -0.5],
      fov: 45
    },
    {
      id: "stop_2_hyper",
      progress: 0.16,
      camera: [11.2, 2.6, -2],
      target: [14.9, 1.2, 1.2],
      fov: 40
    },
    {
      id: "stop_3_hyper_reply",
      progress: 0.3,
      camera: [10.4, 4.2, -3.2],
      target: [15.1, 1.8, 1.5],
      fov: 42
    },
    {
      id: "stop_4_building7",
      progress: 0.44,
      camera: [9.6, 3.4, 6.4],
      target: [14.2, 2.2, 2.9],
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
    backgroundColor: 0x1c1d22,
    fogColor: 0x1c1d22,
    fogStart: 15,
    fogEnd: 110
  },

  renderer: {
    toneMappingExposure: 1.15
  },

  materials: {
    globalFacadeColor: 0xffffff,
    globalWindowColor: 0x9e9e9e,
    globalFacadeRoughness: 0.7,
    globalFacadeMetalness: 0.44,
    globalWindowRoughness: 0.6,
    globalWindowMetalness: 0.12,
    overrides: {
      Plane001__facade: {
        color: 0x535353,
        roughness: 0.7,
        metalness: 0.44
      },
      Plane001_1__window: {
        color: 0x959595,
        roughness: 0.6,
        metalness: 0.12
      },
      Plane003_1__facade: {
        color: 0x4d4d4d,
        roughness: 0.7,
        metalness: 0.44
      },
      Hyper_Market_Building__facade: {
        color: 0x000762,
        roughness: 0.7,
        metalness: 0
      },
      Hyper_Market_Building__window: {
        color: 0xffffff,
        roughness: 0.6,
        metalness: 0
      },
      Building_30__facade: {
        color: 0x8c8c8c,
        roughness: 0.7,
        metalness: 0
      },
      Building_30__window: {
        color: 0x222222,
        roughness: 0.6,
        metalness: 0
      },
      Building_7__facade: {
        color: 0x000762,
        roughness: 0.7,
        metalness: 0
      },
      Building_7__window: {
        color: 0xffffff,
        roughness: 0.6,
        metalness: 0
      },
      Rastaak_Building__facade: {
        color: 0x09006a,
        roughness: 0.7,
        metalness: 0
      },
      Rastaak_Building__window: {
        color: 0xffffff,
        roughness: 0.6,
        metalness: 0
      },
      Building_34__facade: {
        color: 0x8c8c8c,
        roughness: 0.7,
        metalness: 0
      },
      Building_34__window: {
        color: 0x222222,
        roughness: 0.6,
        metalness: 0
      }
    }
  } as MaterialsConfig,
};
