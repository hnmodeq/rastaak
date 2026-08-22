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
      Earth__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
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
      Building_9__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_9__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_11__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_11__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_25__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_25__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_8__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_8__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_22__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_22__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_4__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_4__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_23__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_23__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_12__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_12__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_5__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_5__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Plane003_1__facade: {
        color: 0x4d4d4d,
        roughness: 0.7,
        metalness: 0.44
      },
      Plane003_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_18__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_18__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_19__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_19__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_20__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_20__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_26__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_26__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_27__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_27__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_28__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_28__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_29__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_29__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube017_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube017_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube018_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube018_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube019_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube019_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube020__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube020_1__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_10__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_10__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube022__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube022_1__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Hyper_Market_Building__facade: {
        color: 0x8c8c8c,
        roughness: 0.7,
        metalness: 0
      },
      Hyper_Market_Building__window: {
        color: 0x222222,
        roughness: 0.6,
        metalness: 0
      },
      Cube024_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube024_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube025_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube025_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube026_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube026_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube027_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube027_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube028_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube028_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube029_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube029_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube030_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube030_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube031_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube031_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube032_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube032_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube033_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube033_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube034_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube034_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube035_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube035_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube036_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube036_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube037_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube037_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube038_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube038_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube039_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube039_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube040_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube040_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube041_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube041_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube042_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube042_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube043_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube043_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube044_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube044_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube045_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube045_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube046_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube046_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube047_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube047_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube048_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube048_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube049__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube049_1__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
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
      Cube051__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube051_1__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_36__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_36__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_17__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_17__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_14__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_14__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_16__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_16__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_7__facade: {
        color: 0x8c8c8c,
        roughness: 0.7,
        metalness: 0
      },
      Building_7__window: {
        color: 0x222222,
        roughness: 0.6,
        metalness: 0
      },
      Building_3__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_3__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
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
      Building_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_1__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_2__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_32__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_32__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_24__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_24__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_35__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_35__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
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
      },
      Building_33__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_33__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube065_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube065_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube066_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube066_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube067__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube067_1__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Building_6__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Building_6__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube069_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube069_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube070_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube070_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube071_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube071_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube072_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube072_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube073_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube073_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube074_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube074_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube075_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube075_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube076_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube076_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube077_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube077_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube078_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube078_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube079_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube079_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube080_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube080_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube081_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube081_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube082_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube082_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube083_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube083_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube084_1__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube084_2__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Cube085__facade: {
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.44
      },
      Cube085_1__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      },
      Logo__window: {
        color: 0x9e9e9e,
        roughness: 0.6,
        metalness: 0.12
      }
    }
  } as MaterialsConfig,
};
