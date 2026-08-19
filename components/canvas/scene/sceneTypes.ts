export type LightType = 'directional' | 'point' | 'spot' | 'ambient' | 'hemisphere';

export interface LightConfig {
  id: string;
  type: LightType;
  color: number;
  groundColor?: number;
  intensity: number;
  position?: [number, number, number];
  target?: [number, number, number];
  distance?: number;
  decay?: number;
  radius?: number;
  angle?: number;
  penumbra?: number;
  castShadow?: boolean;
  shadowMapSize?: number;
  shadowBias?: number;
}

export interface CameraStop {
  id: string;
  progress: number;
  camera: [number, number, number];
  target: [number, number, number];
  fov?: number;
}

export interface BuildingMaterialOverride {
  color?: number;
  roughness?: number;
  metalness?: number;
}

export interface MaterialsConfig {
  globalFacadeColor?: number;
  globalWindowColor?: number;
  globalFacadeRoughness?: number;
  globalFacadeMetalness?: number;
  globalWindowRoughness?: number;
  globalWindowMetalness?: number;
  overrides?: Record<string, BuildingMaterialOverride>;
}

export interface SceneScrollConfig {
  headerScrollMultiplier: number;
  cameraDamping: number;
  idleFloatAmount: number;
  idleFloatSpeed: number;
}

export interface SceneCameraConfig {
  defaultFov: number;
  near: number;
  far: number;
}

export interface SceneEnvironmentConfig {
  backgroundColor: number;
  fogStart: number;
  fogEnd: number;
}

export interface SceneRendererConfig {
  toneMappingExposure: number;
}

export interface SceneConfig {
  stops: CameraStop[];
  scroll: SceneScrollConfig;
  camera: SceneCameraConfig;
  lights: LightConfig[];
  environment: SceneEnvironmentConfig;
  renderer: SceneRendererConfig;
  materials: MaterialsConfig;
}

export interface StudioSavePayload {
  cameraStops: CameraStop[];
  lights: LightConfig[];
  environment: SceneEnvironmentConfig;
  renderer: SceneRendererConfig;
  scroll: SceneScrollConfig;
  camera: SceneCameraConfig;
  materials: MaterialsConfig;
}
