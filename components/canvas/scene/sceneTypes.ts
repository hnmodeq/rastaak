export type LightType = 'directional' | 'point' | 'spot' | 'ambient' | 'hemisphere' | 'rectarea';

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
  width?: number;
  height?: number;
  angle?: number;
  penumbra?: number;
  castShadow?: boolean;
  shadowMapSize?: number;
  shadowBias?: number;
  enabled?: boolean;
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
  buildingColor?: number;
  windowColor?: number;
  rastaakColor?: number;
  logoColor?: number;
  groundColor?: number;
  plateColor?: number;
  borderColor?: number;
  treeTrunkColor?: number;
  treeLeafColor?: number;
  globalFacadeColor?: number;
  globalWindowColor?: number;
  globalFacadeRoughness?: number;
  globalFacadeMetalness?: number;
  globalWindowRoughness?: number;
  globalWindowMetalness?: number;
  roughness?: number;
  metalness?: number;
  envMapIntensity?: number;
  groundRoughness?: number;
  groundMetalness?: number;
  groundEnvMapIntensity?: number;
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
  fogColor?: number;
  fogStart: number;
  fogEnd: number;
  fogEnabled?: boolean;
  shadowColor?: number;
  shadowOpacity?: number;
}

export interface SceneRendererConfig {
  toneMappingExposure: number;
}

export interface LookConfigSave {
  envEnabled: boolean;
  envIntensity: number;
  grain: number;
  grainSize: number;
  vignette: number;
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
    needWindow: number;
    packet: number;
    packetBounce: number;
    packetCore?: number;
    packetInner?: number;
    packetOuter?: number;
    packetSpark?: number;
    resolved: number;
    resolvedWindow: number;
    hubPulse: number;
    hubPulseWindow: number;
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
  packetIntensity: number;
  packetDistance: number;
  packetGlow: number;
  packetGlowSize: number;
  packetCoreSize: number;
  packetTrail: number;
  chipBorder: number;
  chipBorderOpacity: number;
  chipBackground: number;
  chipBackgroundOpacity: number;
  chipText: number;
}

export interface StudioFlowStepSave {
  num: string;
  title: string;
  subtitle: string;
  caption: string;
  progressRange: [number, number];
}

export interface StudioHeroCopySave {
  titleLine1: string;
  titleLine2: string;
  titleColor: number;
  titlePaddingTop?: number;
  subtitleLine1: string;
  subtitleLine2: string;
  subtitleColor: number;
  subtitlePaddingTop?: number;
  scrollHint: string;
  scrollHintColor: number;
}

export interface StudioFlowChromeSave {
  align: 'left' | 'right';
  dir: 'ltr' | 'rtl';
  titleColor: number;
  titleBg?: number;
  titleBgOpacity?: number;
  numberColor: number;
  numberActiveColor: number;
  numberBg: number;
  descriptionColor: number;
  descriptionBg?: number;
  descriptionBgOpacity?: number;
  trackColor: number;
  trackFillColor: number;
}

export interface StudioTypeFaceSave {
  size: number;
  weight: number;
  lineHeight?: number;
  letterSpacing?: number;
  shadowColor: number;
  shadowOpacity: number;
  shadowBlur: number;
  shadowX: number;
  shadowY: number;
}

export interface StudioTypeChromeSave {
  siteName: string;
  siteNameColor: number;
  siteNameLayoutColor?: number;
  siteNamePaddingTop?: number;
  studioCorner: 'top-right' | 'top-left' | 'bottom-left' | 'bottom-right';
  heroTitle: StudioTypeFaceSave;
  heroSubtitle: StudioTypeFaceSave;
  scrollHint: StudioTypeFaceSave;
  flowTitle: StudioTypeFaceSave;
  flowNumber: StudioTypeFaceSave;
  flowDescription: StudioTypeFaceSave;
  chipText: StudioTypeFaceSave;
  siteNameType: StudioTypeFaceSave;
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
  heroCopy?: StudioHeroCopySave;
  flowChrome?: StudioFlowChromeSave;
  typeChrome?: StudioTypeChromeSave;
  look?: LookConfigSave;
}
