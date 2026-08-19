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
      camera: [0.0, 22.0, -18.0],
      target: [14.0, 2.0, -1.0],
      fov: 45,
    },
    {
      id: 'stop_2_approach',
      progress: 0.25,
      camera: [6.0, 7.0, -6.0],
      target: [15.9, 2.0, 2.6],
      fov: 45,
    },
    {
      id: 'stop_3_ascent',
      progress: 0.5,
      camera: [26.0, 14.0, 6.0],
      target: [15.9, 8.0, 2.6],
      fov: 45,
    },
    {
      id: 'stop_4_spire',
      progress: 0.75,
      camera: [20.0, 22.0, 10.0],
      target: [12.0, 2.0, -2.0],
      fov: 45,
    },
    {
      id: 'stop_5_logo_finale',
      progress: 1.0,
      camera: [8.0, 24.0, -6.0],
      target: [16.0, 3.8, 2.2],
      fov: 45,
    },
  ] as CameraStop[],

  scroll: {
    headerScrollMultiplier: 2.5,
    cameraDamping: 3.71,
    idleFloatAmount: 0.2,
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
