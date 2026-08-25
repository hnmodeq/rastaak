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
  shadowNormalBias?: number;
  shadowNear?: number;
  shadowFar?: number;
  shadowIntensity?: number;
  enabled?: boolean;
}

export type CameraMethod = 'stops' | 'progress';

export interface CameraStop {
  id: string;
  progress: number;
  camera: [number, number, number];
  target: [number, number, number];
  fov?: number;
}

/** A camera pose placed on the continuous 0–100% progress timeline. */
export type CameraKeyframe = CameraStop;

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
  /** Multiplies the scroll distance of the camera journey. Higher means slower progression per wheel scroll. */
  journeyScrollLength?: number;
  cameraDamping: number;
  idleFloatAmount: number;
  idleFloatSpeed: number;
}

export interface SceneCameraConfig {
  defaultFov: number;
  near: number;
  far: number;
}

export interface SceneSkyConfig {
  zenithColor: number;
  upperColor: number;
  horizonColor: number;
  warmthColor: number;
  moonColor: number;
  starColor: number;
  /** Rotation of the entire sky dome around world Y, in degrees. */
  rotationY: number;
  moonAzimuth: number;
  moonElevation: number;
  moonSize: number;
  moonGlow: number;
  horizonGlow: number;
  starDensity: number;
  starIntensity: number;
  exposure: number;
}

export interface SceneHorizonConfig {
  enabled: boolean;
  color: number;
  opacity: number;
  height: number;
  softness: number;
}

export interface SceneEnvironmentConfig {
  backgroundColor: number;
  fogColor?: number;
  fogStart: number;
  fogEnd: number;
  fogEnabled?: boolean;
  skyEnabled?: boolean;
  sky?: SceneSkyConfig;
  horizon?: SceneHorizonConfig;
  shadowColor?: number;
  shadowOpacity?: number;
}

export interface SceneRendererConfig {
  toneMappingExposure: number;
  shadowMapType?: 'basic' | 'pcf' | 'pcfsoft';
}

export interface SceneVisibilityConfig {
  showBigTrees?: boolean;
  showSmallTrees?: boolean;
  /** Hidden buildings are stored as `false`; missing entries remain visible. */
  buildings?: Record<string, boolean>;
}

export interface LookConfigSave {
  envEnabled: boolean;
  envIntensity: number;
  grain: number;
  grainSize: number;
  vignette: number;
  vignetteStart?: number;
  vignetteSoft?: number;
  bloom?: number;
  bloomRadius?: number;
  gradeShadows?: number;
  gradeMids?: number;
  gradeHighlights?: number;
}

export interface SceneConfig {
  /** Which camera authoring system drives the public scene. */
  cameraMethod: CameraMethod;
  stops: CameraStop[];
  /** Kept separately so switching methods never destroys stop-point work. */
  progressKeyframes: CameraKeyframe[];
  scroll: SceneScrollConfig;
  camera: SceneCameraConfig;
  lights: LightConfig[];
  environment: SceneEnvironmentConfig;
  renderer: SceneRendererConfig;
  materials: MaterialsConfig;
  visibility?: SceneVisibilityConfig;
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
    label?: string;
    need: string;
    needAfter?: string;
    appear: number;
    dispatch: number;
    arrive: number;
    resolve?: number;
    needEnd?: number;
    land?: [number, number, number];
    launch?: [number, number, number];
    needOffset?: [number, number, number];
  }>;
  captions: Array<{ id: string; text: string; range: [number, number] }>;
  insaneShooting?: {
    enabled: boolean;
    start: number;
    end: number;
    launch?: [number, number, number];
    requestColor?: 'before' | 'after';
    shootingColor?: 'before' | 'after';
  };
  layoutReveal?: {
    start: number;
    end: number;
  };
  chipHoldAfterArrive: number;
  captionFadeIn: number;
  packetIntensity: number;
  packetDistance: number;
  packetGlow: number;
  packetGlowSize: number;
  packetCoreSize: number;
  packetTrail: number;
  burstDelay?: number;
  burstSpan?: number;
  burstLight?: number;
  burstLightRadius?: number;
  burstSize?: number;
  burstExposure?: number;
  burstSparks?: number;
  chipBorder: number;
  chipBorderOpacity: number;
  chipBackground: number;
  chipBackgroundOpacity: number;
  chipText: number;
  chipMaxWidth?: number;
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
  stackGap?: number;
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
  showSiteLogo?: boolean;
  siteLogoSize?: number;
  siteLogoGap?: number;
  siteLogoOffsetX?: number;
  siteLogoOffsetY?: number;
  siteLogoSide?: 'left' | 'right';
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
  cameraMethod: CameraMethod;
  cameraStops: CameraStop[];
  progressKeyframes: CameraKeyframe[];
  lights: LightConfig[];
  environment: SceneEnvironmentConfig;
  renderer: SceneRendererConfig;
  scroll: SceneScrollConfig;
  camera: SceneCameraConfig;
  materials: MaterialsConfig;
  visibility?: SceneVisibilityConfig;
  story?: StudioStorySave;
  flowSteps?: StudioFlowStepSave[];
  heroCopy?: StudioHeroCopySave;
  flowChrome?: StudioFlowChromeSave;
  typeChrome?: StudioTypeChromeSave;
  /** Homepage copy + section visibility, saved from the admin panel. */
  siteContent?: unknown;
  look?: LookConfigSave;
  studioOverlay?: {
    showCamGizmo: boolean;
    showTargetGizmo: boolean;
    showCamPath: boolean;
    showTargetPath: boolean;
    showLightGizmos: boolean;
    showHero?: boolean;
  };
  loader?: {
    title: string;
    subtitle: string;
    dir: 'rtl' | 'ltr';
    logoSide?: 'left' | 'right';
    showLogo: boolean;
    showTitle: boolean;
    showSubtitle: boolean;
    showBar: boolean;
    copyAlign?: 'start' | 'center' | 'end';
    logoSize: number;
    rowGap: number;
    copyGap: number;
    stackGap: number;
    titleSize: number;
    titleWeight: number;
    titleColor: number;
    titleTracking: number;
    subtitleSize: number;
    subtitleWeight: number;
    subtitleColor: number;
    subtitleTracking: number;
    barWidth: number;
    barHeight: number;
    barColor: number;
    trackColor: number;
    trackOpacity: number;
    bgColor: number;
  };
  buildingNames?: Array<{
    id: string;
    building: string;
    text: string;
    size: number;
    color: number;
    side?: 'front' | 'back' | 'left' | 'right';
    position: [number, number, number];
    rotation?: [number, number, number];
    extrude: number;
  }>;
}
