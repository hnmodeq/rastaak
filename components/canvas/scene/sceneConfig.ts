/**
 * RASTAAK 3D SCENE CONTROLLER CONFIG
 *
 * Source of truth for the homepage scene. 3D Studio reads this on load
 * and overwrites it when you click Apply & Save.
 */

import { tokens } from '@/tokens/design-tokens';
import { LIGHTS_CONFIG } from './lightingConfig';
import type { CameraStop, MaterialsConfig, SceneConfig } from './sceneTypes';

export type { CameraStop, MaterialsConfig, LightConfig, SceneConfig } from './sceneTypes';
export { LIGHTS_CONFIG } from './lightingConfig';

export const SCENE_CONFIG: SceneConfig = {
  stops: [
    {
      id: 'stop_1_overview',
      progress: 0.0,
      camera: [5.5, 8.5, -7.5],
      target: [13.4, 1.2, -0.5],
      fov: 45,
    },
    {
      id: 'stop_2_hyper',
      progress: 0.16,
      camera: [11.2, 2.6, -2.0],
      target: [14.9, 1.2, 1.2],
      fov: 40,
    },
    {
      id: 'stop_3_hyper_reply',
      progress: 0.3,
      camera: [10.4, 4.2, -3.2],
      target: [15.1, 1.8, 1.5],
      fov: 42,
    },
    {
      id: 'stop_4_building7',
      progress: 0.44,
      camera: [9.6, 3.4, 6.4],
      target: [14.2, 2.2, 2.9],
      fov: 40,
    },
    {
      id: 'stop_5_south',
      progress: 0.6,
      camera: [16.8, 3.4, -7.4],
      target: [14.0, 1.5, -1.0],
      fov: 42,
    },
    {
      id: 'stop_6_building34',
      progress: 0.74,
      camera: [6.6, 2.6, -7.6],
      target: [11.2, 1.1, -2.2],
      fov: 40,
    },
    {
      id: 'stop_7_tower',
      progress: 0.88,
      camera: [13.2, 6.2, -1.2],
      target: [16.0, 3.4, 2.3],
      fov: 36,
    },
    {
      id: 'stop_8_logo',
      progress: 1.0,
      camera: [15.35, 5.55, 0.55],
      target: [16.26, 4.1, 2.05],
      fov: 30,
    },
  ] as CameraStop[],

  scroll: {
    headerScrollMultiplier: 5.0,
    cameraDamping: 3.71,
    idleFloatAmount: 0.08,
    idleFloatSpeed: 0.4,
  },

  camera: {
    defaultFov: 45,
    near: 0.1,
    far: 1000,
  },

  lights: LIGHTS_CONFIG,

  environment: {
    backgroundColor: tokens.experimentalScene.canvasBackground,
    fogStart: 15,
    fogEnd: 110,
  },

  renderer: {
    toneMappingExposure: 1.15,
  },

  materials: {
    globalFacadeColor: tokens.experimentalScene.lightFacadeDefault,
    globalWindowColor: tokens.experimentalScene.windowInsetDefault,
    globalFacadeRoughness: 0.6,
    globalFacadeMetalness: 0.12,
    globalWindowRoughness: 0.6,
    globalWindowMetalness: 0.12,
    overrides: {},
  } as MaterialsConfig,
};
