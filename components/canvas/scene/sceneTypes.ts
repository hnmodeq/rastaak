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

export interface StudioStorySave {
  hub: string;
  logo: string;
  colors: {
    need: number;
    packet: number;
    resolved: number;
    hubPulse: number;
    chipNeed: number;
    chipResolved: number;
  };
  clients: Array<{
    id: string;
    building: string;
    need: string;
    appear: number;
    dispatch: number;
    arrive: number;
  }>;
  captions: Array<{ id: string; text: string; range: [number, number] }>;
  chipHoldAfterArrive: number;
  captionFadeIn: number;
}

export interface StudioFlowStepSave {
  num: string;
  title: string;
  subtitle: string;
  caption: string;
  progressRange: [number, number];
}

export interface StudioSavePayload {
  cameraStops: CameraStop[];
  lights: LightConfig[];
  environment: SceneEnvironmentConfig;
  renderer: SceneRendererConfig;
  scroll: SceneScrollConfig;
  camera: SceneCameraConfig;
  materials: MaterialsConfig;
  story?: StudioStorySave;
  flowSteps?: StudioFlowStepSave[];
}
