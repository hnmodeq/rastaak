import * as THREE from 'three';
import { SCENE_CONFIG } from './sceneConfig';
import { LIGHTS_CONFIG } from './lightingConfig';
import { applySceneShadows } from './shadowTint';
import {
  applyLightShadow,
  applyRendererShadowFilter,
  filterFromRenderer,
  resolveShadowFilter,
  type ShadowFilter,
} from './shadowSetup';
import type { CameraKeyframe, CameraStop, LightConfig, StudioSavePayload } from './sceneTypes';
import { STORY_CONFIG, STORY_FRAME_EVENT, applyStoryTheme, needEndAt, storyBuildingLabel, type StoryFrame } from './storyConfig';
import { sampleSceneJourney } from './journeyMath';
import { FLOW_CONFIG, FLOW_CHROME, applyFlowChrome, syncFlowDom } from '@/components/home/flowConfig';
import { HERO_COPY, applyHeroCopy } from '@/components/home/heroCopy';
import {
  TYPE_CHROME,
  TYPE_WEIGHTS,
  applyTypeChrome,
  applyStudioChrome,
  type TypeFace,
} from '@/components/home/typeChrome';
import {
  applyCategoryColor,
  applyCategorySurface,
  collectCategoryGroups,
  collectMaterialsConfig,
  GROUND_SURFACE_CATEGORIES,
  OBJECT_SURFACE_CATEGORIES,
  resolvePalette,
  sampleCategoryColor,
  type CategoryPalette,
  type MaterialCategory,
  type SurfaceParams,
} from './materialKeys';
import { applyTreeVisibility } from './treeVisibility';
import { StoryTimelinePanel } from './StoryTimelinePanel';
import { LightGizmoSet } from './LightGizmos';
import { CameraGizmoSet } from './CameraGizmos';
import { BlenderViewport } from './BlenderViewport';
import { publishLive } from '@/components/live/liveChannel';
import { SITE_CONTENT } from '@/components/home/siteContent';
import { LOOK_CONFIG, applyLookOverlay, applySceneEnvironment } from './lookConfig';
import {
  DEFAULT_CINEMATIC_HORIZON,
  DEFAULT_CINEMATIC_SKY,
  setCinematicHorizonConfig,
  setCinematicSkyConfig,
  setCinematicSkyEnabled,
} from './CinematicSky';
import { BUILDING_NAMES } from './buildingNamesConfig';
import { notifyBuildingNamesChanged } from './BuildingNamePlates';
import { STUDIO_OVERLAY } from './studioOverlay';
import {
  LOADER_CONFIG,
  applyLoaderChrome,
  notifyLoaderChanged,
  previewLoader,
} from '@/components/home/loaderConfig';

const isPointLight = (l: THREE.Light) =>
  (l as THREE.PointLight).isPointLight || l.type === 'PointLight';
const isSpotLight = (l: THREE.Light) =>
  (l as THREE.SpotLight).isSpotLight || l.type === 'SpotLight';
const isHemisphereLight = (l: THREE.Light) =>
  (l as THREE.HemisphereLight).isHemisphereLight || l.type === 'HemisphereLight';
const isAreaLight = (l: THREE.Light) =>
  (l as THREE.RectAreaLight).isRectAreaLight || l.type === 'RectAreaLight';

function colorToHexNumber(color: THREE.Color): number {
  return color.getHex();
}

const MIN_FLIGHT = 0.02;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function clampOrdered(value: number, min: number, max: number): number {
  if (max < min) return clamp01(value);
  return Math.min(max, Math.max(min, value));
}

function headingFromLook(
  camera: readonly [number, number, number],
  target: readonly [number, number, number],
): { yaw: number; pitch: number; dist: number } {
  const dx = target[0] - camera[0];
  const dy = target[1] - camera[1];
  const dz = target[2] - camera[2];
  const dist = Math.max(0.2, Math.hypot(dx, dy, dz));
  const yaw = THREE.MathUtils.radToDeg(Math.atan2(dx, -dz));
  const pitch = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(dy / dist, -1, 1)));
  return { yaw, pitch, dist };
}

function lookFromHeading(
  camera: readonly [number, number, number],
  yaw: number,
  pitch: number,
  dist: number,
): [number, number, number] {
  const yawRad = THREE.MathUtils.degToRad(yaw);
  const pitchRad = THREE.MathUtils.degToRad(THREE.MathUtils.clamp(pitch, -89, 89));
  const reach = Math.max(0.2, dist);
  const cosPitch = Math.cos(pitchRad);
  return [
    camera[0] + Math.sin(yawRad) * cosPitch * reach,
    camera[1] + Math.sin(pitchRad) * reach,
    camera[2] - Math.cos(yawRad) * cosPitch * reach,
  ];
}

export class SceneStudioGUI {
  private gui: any = null;
  private guis: any[] = [];
  private GUICtor: any = null;
  private disposed = false;
  private studioEdge: HTMLButtonElement | null = null;
  private foldAllBtn: HTMLButtonElement | null = null;
  private applyBtn: HTMLButtonElement | null = null;
  private applyBusy = false;
  private panelOpacity = 1;
  private isOpen = false;
  private studioCollapsed = true;
  private foldersExpanded = false;
  private chromeObserver: ResizeObserver | null = null;
  private materialsFolderPopulated = false;
  private lightsFolderPopulated = false;
  private pointerHandler: ((e: MouseEvent) => void) | null = null;
  private timelinePanel: StoryTimelinePanel | null = null;
  private lightGizmos: LightGizmoSet | null = null;
  private cameraGizmos: CameraGizmoSet | null = null;
  private showLightGizmos = STUDIO_OVERLAY.showLightGizmos !== false;
  private showCamGizmo = STUDIO_OVERLAY.showCamGizmo !== false;
  private showTargetGizmo = STUDIO_OVERLAY.showTargetGizmo !== false;
  private showCamPath = STUDIO_OVERLAY.showCamPath !== false;
  private showTargetPath = STUDIO_OVERLAY.showTargetPath !== false;
  private showHero = STUDIO_OVERLAY.showHero !== false;
  private cameraPathMode: 'Full path' | 'Current segment' = 'Full path';
  private lookAtTarget = true;
  private grabMode = false;
  private grabCamera = false;
  private preGrabOrbit = false;
  private orbitLockedByGizmo = false;
  private currentStopIndex = 0;
  private playheadT = 0;
  private refreshNeedTimes = () => {};
  private onStudioTiming = () => {
    this.refreshNeedTimes();
  };
  private readonly journeySample = {
    camera: [0, 0, 0] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    fov: 45,
  };
  private lightUi = new Map<
    string,
    {
      params: {
        enabled: boolean;
        intensity: number;
        color: string;
        posX: number;
        posY: number;
        posZ: number;
        width: number;
        height: number;
        aimX: number;
        aimY: number;
        aimZ: number;
      };
      persist: () => void;
      pullFromLight: () => void;
    }
  >();
  private palette = {
    building: '#a3a3a3',
    window: '#ffffff',
    rastaak: '#09006a',
    logo: '#ffffff',
    ground: '#ffffff',
    plate: '#7f7f7f',
    border: '#888888',
    treeTrunk: '#6b4f2a',
    treeLeaf: '#3d6b3a',
  };
  private objectSurface: SurfaceParams & { roughness: number; metalness: number; envMapIntensity: number } = {
    roughness: 0.72,
    metalness: 0.04,
    envMapIntensity: 1,
  };
  private groundSurface: SurfaceParams & { roughness: number; metalness: number; envMapIntensity: number } = {
    roughness: 0.72,
    metalness: 0.04,
    envMapIntensity: 1,
  };
  private objectSurfaceTouched = false;
  private groundSurfaceTouched = false;

  public isManualMode = false;
  public isOrbitMode = false;

  public get isEditing() {
    return this.isOpen || this.isManualMode || this.isOrbitMode;
  }
  public manualCamPos = new THREE.Vector3();
  public manualLookAt = new THREE.Vector3();

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera,
    private renderer: THREE.WebGLRenderer,
    private lightsMap: Map<string, THREE.Light>,
    private worldGroupSupplier: () => THREE.Group | null,
    private onProgressChange?: (t: number) => void,
    private onOrbitModeToggle?: (enabled: boolean) => void,
    private viewportNav?: BlenderViewport | null,
    private currentViewTarget?: () => THREE.Vector3 | null,
  ) {
    if (typeof window === 'undefined') return;
    this.hydrateGlobalsFromConfig();
    try {
      this.lightGizmos = new LightGizmoSet(
        scene,
        camera,
        renderer,
        lightsMap,
        (id) => {
          const row = this.lightUi.get(id);
          row?.pullFromLight();
          row?.persist();
        },
        (locked) => {
          this.orbitLockedByGizmo = locked;
          if (this.anyGrab()) this.onOrbitModeToggle?.(!locked);
        },
      );
    } catch (error) {
      console.warn('[studio] lamp gizmos failed to start', error);
      this.lightGizmos = null;
    }
    try {
      this.cameraGizmos = new CameraGizmoSet(
        scene,
        camera,
        renderer,
        () => this.pullCamSlidersFromStop(),
        (locked) => {
          this.orbitLockedByGizmo = locked;
          if (this.anyGrab()) this.onOrbitModeToggle?.(!locked);
        },
      );
    } catch (error) {
      console.warn('[studio] camera gizmos failed to start', error);
      this.cameraGizmos = null;
    }
    const mats = SCENE_CONFIG.materials;
    if (mats.roughness !== undefined) this.objectSurface.roughness = mats.roughness;
    if (mats.metalness !== undefined) this.objectSurface.metalness = mats.metalness;
    if (mats.envMapIntensity !== undefined) this.objectSurface.envMapIntensity = mats.envMapIntensity;
    this.objectSurfaceTouched =
      mats.roughness !== undefined || mats.metalness !== undefined || mats.envMapIntensity !== undefined;
    this.groundSurface.roughness = mats.groundRoughness ?? mats.roughness ?? this.groundSurface.roughness;
    this.groundSurface.metalness = mats.groundMetalness ?? mats.metalness ?? this.groundSurface.metalness;
    this.groundSurface.envMapIntensity =
      mats.groundEnvMapIntensity ?? mats.envMapIntensity ?? this.groundSurface.envMapIntensity;
    this.groundSurfaceTouched =
      mats.groundRoughness !== undefined ||
      mats.groundMetalness !== undefined ||
      mats.groundEnvMapIntensity !== undefined;
    window.addEventListener('rastaak-studio-toggle', this.onExternalToggle);
    window.addEventListener('rastaak-studio-chrome-layout', this.onChromeLayout);
    window.addEventListener('resize', this.onChromeLayout);
    window.addEventListener(STORY_FRAME_EVENT, this.onStoryFrame);
    window.addEventListener('rastaak-studio-timing-changed', this.onStudioTiming);
    window.addEventListener('rastaak-camera-point-selected', this.onCameraPointSelected);
    this.initGUI();
    this.initRaycaster();
    this.syncHeroVisibility();
  }

  private activeCameraPoints(): CameraStop[] {
    if (SCENE_CONFIG.cameraMethod === 'progress' && SCENE_CONFIG.progressKeyframes.length) {
      return SCENE_CONFIG.progressKeyframes;
    }
    return SCENE_CONFIG.stops;
  }

  private ensureProgressKeyframes() {
    if (SCENE_CONFIG.progressKeyframes.length || !SCENE_CONFIG.stops.length) return;
    const seen = new Map<number, CameraKeyframe>();
    for (const stop of SCENE_CONFIG.stops) {
      // Progress keyframes need unique times. If a legacy stop config has two
      // points at the same time, the later point is the useful one to keep.
      seen.set(Number(stop.progress.toFixed(6)), {
        id: `keyframe_${seen.size + 1}_${stop.id}`,
        progress: stop.progress,
        camera: [...stop.camera],
        target: [...stop.target],
        fov: stop.fov,
      });
    }
    SCENE_CONFIG.progressKeyframes.splice(
      0,
      SCENE_CONFIG.progressKeyframes.length,
      ...Array.from(seen.values()).sort((a, b) => a.progress - b.progress),
    );
  }

  private readCurrentViewTarget(): THREE.Vector3 {
    if (this.viewportNav?.enabled) return this.viewportNav.target.clone();
    if (this.isOrbitMode) {
      const supplied = this.currentViewTarget?.();
      if (supplied) return supplied.clone();
    }
    return this.manualLookAt.clone();
  }

  private cameraPointsForGizmos() {
    return this.activeCameraPoints();
  }

  private hydrateGlobalsFromConfig() {
    const palette = resolvePalette(SCENE_CONFIG.materials);
    if (palette.buildingColor !== undefined) this.palette.building = '#' + new THREE.Color(palette.buildingColor).getHexString();
    if (palette.windowColor !== undefined) this.palette.window = '#' + new THREE.Color(palette.windowColor).getHexString();
    if (palette.rastaakColor !== undefined) this.palette.rastaak = '#' + new THREE.Color(palette.rastaakColor).getHexString();
    if (palette.logoColor !== undefined) this.palette.logo = '#' + new THREE.Color(palette.logoColor).getHexString();
    if (palette.groundColor !== undefined) this.palette.ground = '#' + new THREE.Color(palette.groundColor).getHexString();
    if (palette.plateColor !== undefined) this.palette.plate = '#' + new THREE.Color(palette.plateColor).getHexString();
    if (palette.borderColor !== undefined) this.palette.border = '#' + new THREE.Color(palette.borderColor).getHexString();
    if (palette.treeTrunkColor !== undefined) this.palette.treeTrunk = '#' + new THREE.Color(palette.treeTrunkColor).getHexString();
    if (palette.treeLeafColor !== undefined) this.palette.treeLeaf = '#' + new THREE.Color(palette.treeLeafColor).getHexString();
  }

  private applyPanelOpacity(value: number) {
    const next = Math.min(1, Math.max(0.2, Number.isFinite(value) ? value : 1));
    this.panelOpacity = next;
    const host = document.getElementById('rastaak-studio-panel');
    const sheet = this.timelinePanel?.sheetElement() ?? document.querySelector('#rastaak-story-timeline .stl-sheet');
    if (host) host.style.opacity = String(next);
    if (sheet instanceof HTMLElement) sheet.style.opacity = String(next);
  }

  private studioEdgeSvg(collapsed: boolean) {
    return collapsed
      ? '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M8 2L4 6l4 4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  private injectPanelCss() {
    let style = document.getElementById('rastaak-studio-panel-css') as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = 'rastaak-studio-panel-css';
      document.head.appendChild(style);
    }
    style.textContent = `
      #rastaak-studio-dock {
        position: fixed !important;
        top: calc((100dvh - var(--studio-bottom, 28px)) / 2) !important;
        left: 0 !important;
        right: auto !important;
        bottom: auto !important;
        transform: translateY(-50%);
        z-index: 1000000 !important;
        width: 300px !important;
        height: auto !important;
        max-height: calc(100dvh - var(--studio-bottom, 28px)) !important;
        pointer-events: none !important;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        overflow: visible !important;
      }
      #rastaak-studio-dock .rastaak-studio-edge {
        position: fixed !important;
        top: 50% !important;
        left: 300px !important;
        right: auto !important;
        bottom: auto !important;
        transform: translateY(-50%);
        width: 22px;
        height: 64px;
        border: 1px solid rgba(255,255,255,0.14);
        border-left: 0;
        border-radius: 0 8px 8px 0;
        background: rgba(12, 13, 18, 0.92);
        color: #f3f3f0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        pointer-events: auto;
        z-index: 1000002;
        transition: left 0.28s ease;
      }
      #rastaak-studio-dock[data-collapsed='true'] .rastaak-studio-edge {
        left: 0 !important;
        border-left: 1px solid rgba(255,255,255,0.14);
      }
      #rastaak-studio-panel {
        position: relative !important;
        inset: auto !important;
        z-index: 1 !important;
        width: 100% !important;
        height: auto !important;
        max-height: inherit !important;
        overflow-x: hidden !important;
        overflow-y: auto !important;
        pointer-events: auto !important;
        background: rgba(12, 13, 18, 0.92);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 14px;
        box-shadow: 0 16px 40px rgba(0,0,0,0.28);
        display: flex;
        flex-direction: column;
        flex: 0 0 auto;
        transform: translateX(0);
        opacity: 1;
        transition: transform 0.28s ease, opacity 0.22s ease;
        direction: ltr !important;
        unicode-bidi: isolate;
      }
      #rastaak-studio-dock[data-collapsed='true'] #rastaak-studio-panel {
        transform: translateX(calc(-100% - 18px));
        opacity: 0;
        pointer-events: none !important;
      }
      #rastaak-studio-toolbar {
        position: sticky;
        top: 0;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 8px;
        padding: 8px 10px;
        background: rgba(12, 13, 18, 0.94);
        border-bottom: 1px solid rgba(255,255,255,0.08);
        flex: 0 0 auto;
      }
      #rastaak-studio-foldall,
      #rastaak-studio-apply {
        border: 1px solid rgba(255,255,255,0.16);
        background: rgba(255,255,255,0.08);
        color: #f3f3f0;
        border-radius: 999px;
        padding: 4px 10px;
        font: 11px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        cursor: pointer;
      }
      #rastaak-studio-apply {
        background: rgba(56, 132, 255, 0.28);
        border-color: rgba(120, 170, 255, 0.45);
      }
      #rastaak-studio-apply:disabled {
        opacity: 0.35;
        cursor: default;
      }
      #rastaak-studio-panel .lil-gui,
      #rastaak-studio-panel .lil-gui.root,
      #rastaak-studio-panel .rastaak-studio-gui {
        position: relative !important;
        top: auto !important;
        right: auto !important;
        left: auto !important;
        bottom: auto !important;
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        --max-height: none;
        z-index: 1 !important;
        flex: 0 0 auto;
      }
      #rastaak-studio-panel .lil-gui:not(.root) {
        position: static !important;
        top: auto !important;
        right: auto !important;
        left: auto !important;
        bottom: auto !important;
      }
      #rastaak-studio-panel .lil-gui.root {
        margin: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      #rastaak-studio-panel .lil-gui.root + .lil-gui.root {
        border-top: 1px solid rgba(255,255,255,0.08);
      }
      html[data-studio='true'] #rastaak-studio-btn,
      html[data-studio='true'] #rastaak-studio-logout,
      html[data-studio='true'] #rastaak-studio-opacity {
        display: none !important;
      }
    `;
  }

  private ensurePanelHost(): HTMLDivElement {
    this.injectPanelCss();
    let dock = document.getElementById('rastaak-studio-dock') as HTMLDivElement | null;
    if (!dock) {
      dock = document.createElement('div');
      dock.id = 'rastaak-studio-dock';
      dock.dir = 'ltr';
      dock.dataset.collapsed = 'true';
      const edge = document.createElement('button');
      edge.type = 'button';
      edge.className = 'rastaak-studio-edge';
      edge.title = 'Show 3D Studio';
      edge.setAttribute('aria-label', 'Show 3D Studio');
      edge.innerHTML = this.studioEdgeSvg(true);
      edge.addEventListener('click', () => {
        this.setStudioCollapsed(!this.studioCollapsed);
      });
      const host = document.createElement('div');
      host.id = 'rastaak-studio-panel';
      host.dir = 'ltr';
      const toolbar = document.createElement('div');
      toolbar.id = 'rastaak-studio-toolbar';
      const fold = document.createElement('button');
      fold.type = 'button';
      fold.id = 'rastaak-studio-foldall';
      fold.textContent = 'Expand all';
      fold.addEventListener('click', () => this.setAllFoldersOpen(!this.foldersExpanded));
      const apply = document.createElement('button');
      apply.type = 'button';
      apply.id = 'rastaak-studio-apply';
      apply.textContent = 'Apply & Save';
      apply.addEventListener('click', () => {
        void this.handleApplyClick();
      });
      toolbar.appendChild(fold);
      toolbar.appendChild(apply);
      host.appendChild(toolbar);
      dock.appendChild(edge);
      dock.appendChild(host);
      document.body.appendChild(dock);
      this.studioEdge = edge;
      this.foldAllBtn = fold;
      this.applyBtn = apply;
    } else {
      this.studioEdge = dock.querySelector('.rastaak-studio-edge');
      this.foldAllBtn = dock.querySelector('#rastaak-studio-foldall');
      this.applyBtn = dock.querySelector('#rastaak-studio-apply');
      if (!this.applyBtn) {
        const toolbar = dock.querySelector('#rastaak-studio-toolbar');
        const apply = document.createElement('button');
        apply.type = 'button';
        apply.id = 'rastaak-studio-apply';
        apply.textContent = 'Apply & Save';
        apply.addEventListener('click', () => {
          void this.handleApplyClick();
        });
        toolbar?.appendChild(apply);
        this.applyBtn = apply;
      }
    }
    return document.getElementById('rastaak-studio-panel') as HTMLDivElement;
  }

  private addTab(title: string): any {
    const host = this.ensurePanelHost();
    const gui = new this.GUICtor({
      title,
      autoPlace: false,
      width: 288,
      container: host,
    });
    const guiEl = gui.domElement as HTMLElement;
    guiEl.classList.add('rastaak-studio-gui');
    guiEl.dir = 'ltr';
    guiEl.style.direction = 'ltr';
    guiEl.style.position = 'relative';
    guiEl.style.top = 'auto';
    guiEl.style.right = 'auto';
    guiEl.style.left = 'auto';
    guiEl.style.bottom = 'auto';
    guiEl.style.width = '100%';
    guiEl.style.maxHeight = 'none';
    guiEl.style.pointerEvents = 'auto';
    this.guis.push(gui);
    this.gui = gui;
    gui.close?.();
    return gui;
  }

  private setAllFoldersOpen(open: boolean) {
    const walk = (folder: { folders?: unknown; open?: () => void; close?: () => void }) => {
      const kids = folder?.folders;
      if (!Array.isArray(kids)) return;
      for (const child of kids) {
        const next = child as { folders?: unknown; open?: () => void; close?: () => void };
        if (open) next.open?.();
        else next.close?.();
        walk(next);
      }
    };
    for (const gui of this.guis) {
      if (open) gui.open?.();
      else gui.close?.();
      walk(gui);
    }
    this.foldersExpanded = open;
    if (this.foldAllBtn) this.foldAllBtn.textContent = open ? 'Collapse all' : 'Expand all';
    this.syncStudioDockBottom();
  }

  private onChromeLayout = () => {
    this.syncStudioDockBottom();
  };

  private observeChromeLayout() {
    this.chromeObserver?.disconnect();
    const sheet = document.querySelector('#rastaak-story-timeline .stl-sheet');
    if (typeof ResizeObserver === 'undefined' || !(sheet instanceof HTMLElement)) return;
    this.chromeObserver = new ResizeObserver(() => this.syncStudioDockBottom());
    this.chromeObserver.observe(sheet);
  }

  private syncStudioDockBottom() {
    const dock = document.getElementById('rastaak-studio-dock');
    if (!dock) return;
    const timeline = document.getElementById('rastaak-story-timeline');
    const sheet = timeline?.querySelector('.stl-sheet') as HTMLElement | null;
    const hidden = !timeline || timeline.dataset.collapsed === 'true';
    const bottom = hidden ? 28 : Math.max(28, Math.ceil((sheet?.offsetHeight ?? 0) + 24));
    dock.style.setProperty('--studio-bottom', `${bottom}px`);
  }

  private initRaycaster() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    this.pointerHandler = (e: MouseEvent) => {
      if (!this.isOpen && !this.isManualMode && !this.isOrbitMode && !this.anyGrab()) return;
      if (
        (e.target as HTMLElement)?.closest('.lil-gui') ||
        (e.target as HTMLElement)?.closest('#rastaak-studio-dock') ||
        (e.target as HTMLElement)?.closest('#rastaak-story-timeline')
      ) {
        return;
      }

      const rect = this.renderer.domElement.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);

      if (this.grabCamera && this.cameraGizmos) {
        const camHit = this.cameraGizmos.pick(raycaster);
        if (camHit) {
          this.cameraGizmos.select(camHit.handle);
          return;
        }
      }

      if (this.grabMode && this.lightGizmos) {
        const hit = this.lightGizmos.pick(raycaster);
        if (hit) this.lightGizmos.select(hit.id, hit.handle);
        return;
      }

      const worldGroup = this.worldGroupSupplier();
      if (!worldGroup) return;

      const intersects = raycaster.intersectObjects(worldGroup.children, true);
      if (intersects.length > 0) {
        const clickedObj = intersects[0].object;
        if (clickedObj?.name) {
          console.log(`[3D Studio] Clicked Object: '${clickedObj.name}'`);
        }
      }
    };

    window.addEventListener('pointerdown', this.pointerHandler, true);
  }

  private collectCurrentLights(): LightConfig[] {
    const result: LightConfig[] = [];

    for (const [id, light] of this.lightsMap.entries()) {
      const origCfg = LIGHTS_CONFIG.find((l) => l.id === id);
      const lightType =
        origCfg?.type ||
        (light.type ? light.type.toLowerCase().replace('light', '') : 'point');

      const item: LightConfig = {
        id,
        type: lightType as LightConfig['type'],
        color: colorToHexNumber(light.color),
        intensity: light.intensity,
        enabled: light.visible !== false,
      };

      if (isHemisphereLight(light)) {
        item.groundColor = colorToHexNumber((light as THREE.HemisphereLight).groundColor);
      }

      if (light.position) {
        item.position = [
          parseFloat(light.position.x.toFixed(4)),
          parseFloat(light.position.y.toFixed(4)),
          parseFloat(light.position.z.toFixed(4)),
        ];
      }

      const targeted = light as THREE.DirectionalLight | THREE.SpotLight;
      if (targeted.target?.position) {
        const tp = targeted.target.position;
        item.target = [
          parseFloat(tp.x.toFixed(4)),
          parseFloat(tp.y.toFixed(4)),
          parseFloat(tp.z.toFixed(4)),
        ];
      }

      if (isPointLight(light) || isSpotLight(light)) {
        const ranged = light as THREE.PointLight | THREE.SpotLight;
        item.distance = ranged.distance;
        item.decay = ranged.decay;
      }

      if (isSpotLight(light)) {
        const spot = light as THREE.SpotLight;
        item.angle = THREE.MathUtils.radToDeg(spot.angle);
        item.penumbra = spot.penumbra;
      }

      if (isAreaLight(light)) {
        const area = light as THREE.RectAreaLight;
        item.type = 'rectarea';
        item.width = area.width;
        item.height = area.height;
        const aim = (area.userData.lookTarget as [number, number, number] | undefined) || [area.position.x, 0, area.position.z];
        item.target = [aim[0], aim[1], aim[2]];
      }

      const shadowObj = (light as THREE.Light & { shadow?: THREE.LightShadow }).shadow;
      if (shadowObj || light.castShadow) {
        item.castShadow = Boolean(light.castShadow);
        item.shadowMapSize = shadowObj?.mapSize?.width ?? 2048;
        item.shadowBias = shadowObj?.bias ?? 0;
        item.shadowNormalBias = shadowObj?.normalBias ?? 0;
        item.radius = shadowObj?.radius ?? 1;
        const cam = shadowObj?.camera as THREE.PerspectiveCamera | undefined;
        if (cam) {
          item.shadowNear = cam.near;
          item.shadowFar = cam.far;
        }
        if (shadowObj && 'intensity' in shadowObj) {
          item.shadowIntensity = (shadowObj as THREE.LightShadow & { intensity: number }).intensity;
        }
      }

      result.push(item);
    }

    return result;
  }

  private collectCurrentMaterials() {
    const palette: CategoryPalette = {
      buildingColor: new THREE.Color(this.palette.building).getHex(),
      windowColor: new THREE.Color(this.palette.window).getHex(),
      rastaakColor: new THREE.Color(this.palette.rastaak).getHex(),
      logoColor: new THREE.Color(this.palette.logo).getHex(),
      groundColor: new THREE.Color(this.palette.ground).getHex(),
      plateColor: new THREE.Color(this.palette.plate).getHex(),
      borderColor: new THREE.Color(this.palette.border).getHex(),
      treeTrunkColor: new THREE.Color(this.palette.treeTrunk).getHex(),
      treeLeafColor: new THREE.Color(this.palette.treeLeaf).getHex(),
    };
    const objectSurface = this.objectSurfaceTouched
      ? {
          roughness: this.objectSurface.roughness,
          metalness: this.objectSurface.metalness,
          envMapIntensity: this.objectSurface.envMapIntensity,
        }
      : undefined;
    const groundSurface = this.groundSurfaceTouched
      ? {
          roughness: this.groundSurface.roughness,
          metalness: this.groundSurface.metalness,
          envMapIntensity: this.groundSurface.envMapIntensity,
        }
      : undefined;
    const collected = collectMaterialsConfig(palette, objectSurface, groundSurface);
    SCENE_CONFIG.materials = { ...SCENE_CONFIG.materials, ...palette, ...collected, overrides: {} };
    return collected;
  }

  private notifyTimingChanged() {
    this.timelinePanel?.refresh();
    this.refreshNeedTimes();
    window.dispatchEvent(new CustomEvent('rastaak-studio-timing-changed'));
  }

  private async handleApplyClick() {
    if (!this.applyBtn || this.applyBusy) return;
    const previous = this.applyBtn.textContent;
    this.applyBusy = true;
    this.applyBtn.disabled = true;
    this.applyBtn.textContent = 'Saving…';
    try {
      await this.applyAndSave();
      this.applyBtn.textContent = 'Saved';
      window.setTimeout(() => {
        if (this.applyBtn && this.applyBtn.textContent === 'Saved') {
          this.applyBtn.textContent = previous || 'Apply & Save';
        }
      }, 1400);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error saving config: ${message}`);
      this.applyBtn.textContent = previous || 'Apply & Save';
    } finally {
      this.applyBusy = false;
      if (this.applyBtn) this.applyBtn.disabled = false;
    }
  }

  private async applyAndSave() {
    const focused = document.activeElement;
    if (focused instanceof HTMLElement) focused.blur();
    window.dispatchEvent(new CustomEvent('rastaak-studio-before-save'));
    const payload = this.buildSavePayload();
    this.writePayloadIntoMemory(payload);

    const res = await fetch('/api/save-studio-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok) {
      applyTypeChrome();
      applyHeroCopy();
      applyFlowChrome();
      applyStoryTheme();
      applyLoaderChrome();
      notifyBuildingNamesChanged();
      window.dispatchEvent(new CustomEvent('rastaak-studio-after-save'));
      return;
    }
    throw new Error(data.error || 'Unknown error');
  }

  private buildSavePayload(): StudioSavePayload {
    const bg = this.scene.background instanceof THREE.Color
      ? this.scene.background
      : new THREE.Color(SCENE_CONFIG.environment.backgroundColor);
    const fog = this.scene.fog as THREE.Fog | null;

    return {
      cameraMethod: SCENE_CONFIG.cameraMethod,
      cameraStops: SCENE_CONFIG.stops.map((stop) => ({
        id: stop.id,
        progress: stop.progress,
        camera: [...stop.camera] as [number, number, number],
        target: [...stop.target] as [number, number, number],
        fov: stop.fov ?? SCENE_CONFIG.camera.defaultFov,
      })),
      progressKeyframes: SCENE_CONFIG.progressKeyframes.map((keyframe) => ({
        id: keyframe.id,
        progress: keyframe.progress,
        camera: [...keyframe.camera] as [number, number, number],
        target: [...keyframe.target] as [number, number, number],
        fov: keyframe.fov ?? SCENE_CONFIG.camera.defaultFov,
      })),
      lights: this.collectCurrentLights(),
      environment: {
        backgroundColor: colorToHexNumber(bg),
        fogColor: fog ? colorToHexNumber(fog.color) : (SCENE_CONFIG.environment.fogColor ?? colorToHexNumber(bg)),
        fogStart: fog?.near ?? SCENE_CONFIG.environment.fogStart,
        fogEnd: fog?.far ?? SCENE_CONFIG.environment.fogEnd,
        fogEnabled: Boolean(fog) && SCENE_CONFIG.environment.fogEnabled !== false,
        skyEnabled: SCENE_CONFIG.environment.skyEnabled !== false,
        sky: { ...(SCENE_CONFIG.environment.sky ?? DEFAULT_CINEMATIC_SKY) },
        horizon: { ...(SCENE_CONFIG.environment.horizon ?? DEFAULT_CINEMATIC_HORIZON) },
        shadowColor: SCENE_CONFIG.environment.shadowColor ?? 0x000000,
        shadowOpacity: SCENE_CONFIG.environment.shadowOpacity ?? 1,
      },
      renderer: {
        toneMappingExposure: this.renderer.toneMappingExposure,
        shadowMapType: filterFromRenderer(this.renderer),
      },
      scroll: { ...SCENE_CONFIG.scroll },
      camera: { ...SCENE_CONFIG.camera },
      materials: this.collectCurrentMaterials(),
      visibility: {
        showBigTrees: SCENE_CONFIG.visibility?.showBigTrees !== false,
        showSmallTrees: SCENE_CONFIG.visibility?.showSmallTrees !== false,
      },
      story: {
        hub: STORY_CONFIG.hub,
        logo: STORY_CONFIG.logo,
        colors: { ...STORY_CONFIG.colors },
        clients: STORY_CONFIG.clients.map((client) => ({ ...client })),
        captions: STORY_CONFIG.captions.map((caption) => ({
          ...caption,
          range: [...caption.range] as [number, number],
        })),
        chipHoldAfterArrive: STORY_CONFIG.chipHoldAfterArrive,
        captionFadeIn: STORY_CONFIG.captionFadeIn,
        packetIntensity: STORY_CONFIG.packetIntensity,
        packetDistance: STORY_CONFIG.packetDistance,
        packetGlow: STORY_CONFIG.packetGlow,
        packetGlowSize: STORY_CONFIG.packetGlowSize,
        packetCoreSize: STORY_CONFIG.packetCoreSize,
        packetTrail: STORY_CONFIG.packetTrail,
        burstDelay: STORY_CONFIG.burstDelay,
        burstSpan: STORY_CONFIG.burstSpan,
        burstLight: STORY_CONFIG.burstLight,
        burstLightRadius: STORY_CONFIG.burstLightRadius,
        burstSize: STORY_CONFIG.burstSize,
        burstExposure: STORY_CONFIG.burstExposure,
        burstSparks: STORY_CONFIG.burstSparks,
        chipBorder: STORY_CONFIG.chipBorder,
        chipBorderOpacity: STORY_CONFIG.chipBorderOpacity,
        chipBackground: STORY_CONFIG.chipBackground,
        chipBackgroundOpacity: STORY_CONFIG.chipBackgroundOpacity,
        chipText: STORY_CONFIG.chipText,
        chipMaxWidth: STORY_CONFIG.chipMaxWidth,
      },
      flowSteps: FLOW_CONFIG.map((step) => ({
        ...step,
        progressRange: [...step.progressRange] as [number, number],
      })),
      heroCopy: { ...HERO_COPY },
      flowChrome: { ...FLOW_CHROME },
      look: { ...LOOK_CONFIG },
      loader: { ...LOADER_CONFIG },
      studioOverlay: {
        showCamGizmo: this.showCamGizmo,
        showTargetGizmo: this.showTargetGizmo,
        showCamPath: this.showCamPath,
        showTargetPath: this.showTargetPath,
        showLightGizmos: this.showLightGizmos,
        showHero: this.showHero,
      },
      buildingNames: BUILDING_NAMES.map((plate) => ({
        ...plate,
        position: [...plate.position] as [number, number, number],
        rotation: [...(plate.rotation || [0, 0, 0])] as [number, number, number],
      })),
      typeChrome: {
        siteName: TYPE_CHROME.siteName,
        siteNameColor: TYPE_CHROME.siteNameColor,
        siteNameLayoutColor: TYPE_CHROME.siteNameLayoutColor,
        siteNamePaddingTop: TYPE_CHROME.siteNamePaddingTop,
        showSiteLogo: TYPE_CHROME.showSiteLogo !== false,
        siteLogoSize: TYPE_CHROME.siteLogoSize ?? 36,
        siteLogoGap: TYPE_CHROME.siteLogoGap ?? 10,
        siteLogoOffsetX: TYPE_CHROME.siteLogoOffsetX ?? 0,
        siteLogoOffsetY: TYPE_CHROME.siteLogoOffsetY ?? 0,
        siteLogoSide: TYPE_CHROME.siteLogoSide === 'right' ? 'right' : 'left',
        studioCorner: TYPE_CHROME.studioCorner,
        heroTitle: { ...TYPE_CHROME.heroTitle },
        heroSubtitle: { ...TYPE_CHROME.heroSubtitle },
        scrollHint: { ...TYPE_CHROME.scrollHint },
        flowTitle: { ...TYPE_CHROME.flowTitle },
        flowNumber: { ...TYPE_CHROME.flowNumber },
        flowDescription: { ...TYPE_CHROME.flowDescription },
        chipText: { ...TYPE_CHROME.chipText },
        siteNameType: { ...TYPE_CHROME.siteNameType },
      },
    };
  }

  private writePayloadIntoMemory(payload: StudioSavePayload) {
    SCENE_CONFIG.cameraMethod = payload.cameraMethod ?? SCENE_CONFIG.cameraMethod;
    SCENE_CONFIG.stops.splice(0, SCENE_CONFIG.stops.length, ...payload.cameraStops);
    SCENE_CONFIG.progressKeyframes.splice(
      0,
      SCENE_CONFIG.progressKeyframes.length,
      ...(payload.progressKeyframes ?? []),
    );
    SCENE_CONFIG.environment.backgroundColor = payload.environment.backgroundColor;
    SCENE_CONFIG.environment.fogColor = payload.environment.fogColor ?? payload.environment.backgroundColor;
    SCENE_CONFIG.environment.fogStart = payload.environment.fogStart;
    SCENE_CONFIG.environment.fogEnd = payload.environment.fogEnd;
    SCENE_CONFIG.environment.fogEnabled = payload.environment.fogEnabled !== false;
    SCENE_CONFIG.environment.skyEnabled = payload.environment.skyEnabled !== false;
    SCENE_CONFIG.environment.sky = {
      ...DEFAULT_CINEMATIC_SKY,
      ...(payload.environment.sky ?? {}),
    };
    SCENE_CONFIG.environment.horizon = {
      ...DEFAULT_CINEMATIC_HORIZON,
      ...(payload.environment.horizon ?? {}),
    };
    setCinematicSkyConfig(this.scene, SCENE_CONFIG.environment.sky, SCENE_CONFIG.environment.horizon);
    setCinematicSkyEnabled(this.scene, SCENE_CONFIG.environment.skyEnabled);
    SCENE_CONFIG.environment.shadowColor = payload.environment.shadowColor ?? 0x000000;
    SCENE_CONFIG.environment.shadowOpacity = payload.environment.shadowOpacity ?? 1;
    SCENE_CONFIG.renderer.toneMappingExposure = payload.renderer.toneMappingExposure;
    if (payload.renderer.shadowMapType) {
      SCENE_CONFIG.renderer.shadowMapType = payload.renderer.shadowMapType;
    }
    SCENE_CONFIG.scroll.headerScrollMultiplier = payload.scroll.headerScrollMultiplier;
    SCENE_CONFIG.scroll.cameraDamping = payload.scroll.cameraDamping;
    SCENE_CONFIG.scroll.idleFloatAmount = payload.scroll.idleFloatAmount;
    SCENE_CONFIG.scroll.idleFloatSpeed = payload.scroll.idleFloatSpeed;
    SCENE_CONFIG.camera.defaultFov = payload.camera.defaultFov;
    SCENE_CONFIG.camera.near = payload.camera.near;
    SCENE_CONFIG.camera.far = payload.camera.far;
    SCENE_CONFIG.materials = payload.materials;

    LIGHTS_CONFIG.splice(0, LIGHTS_CONFIG.length, ...payload.lights);
    if (payload.look) Object.assign(LOOK_CONFIG, payload.look);
    if (payload.studioOverlay) Object.assign(STUDIO_OVERLAY, payload.studioOverlay);
    if (payload.loader) {
      Object.assign(LOADER_CONFIG, payload.loader);
      applyLoaderChrome();
    }
  }

  private isAdminHost() {
    return (
      document.documentElement.dataset.admin === 'true' ||
      window.location.pathname.startsWith('/admin')
    );
  }

  private async initGUI(forceOpen = false) {
    if (this.disposed) return;
    if (this.guis.length) {
      if (forceOpen) this.setStudioCollapsed(false);
      return;
    }

    try {
      const { GUI } = await import('lil-gui');
      if (this.disposed) return;
      this.GUICtor = GUI;

      const isAdmin = this.isAdminHost();
      const host = this.ensurePanelHost();
      host.querySelectorAll(':scope > .lil-gui').forEach((el) => el.remove());
      applyStudioChrome();
      host.addEventListener(
        'wheel',
        (e: WheelEvent) => {
          e.stopPropagation();
        },
        { capture: true, passive: false },
      );
      host.addEventListener(
        'touchmove',
        (e: TouchEvent) => {
          e.stopPropagation();
        },
        { capture: true, passive: false },
      );

      this.manualCamPos.copy(this.camera.position);
      const initialCameraPoint = this.activeCameraPoints()[0] ?? SCENE_CONFIG.stops[0];
      this.manualLookAt.set(
        initialCameraPoint?.target[0] ?? 14,
        initialCameraPoint?.target[1] ?? 2,
        initialCameraPoint?.target[2] ?? 0,
      );

      const camFolder = this.addTab('Camera & Stop Points');

      this.currentStopIndex = 0;
      if (SCENE_CONFIG.cameraMethod === 'progress') this.ensureProgressKeyframes();
      const getActivePoints = () => this.activeCameraPoints();
      const getPointNames = () => getActivePoints().map((s, i) => `${i + 1}. ${s.id}`);
      const COPY_NONE = '— pick a point —';
      const viewportLabel = 'Viewport (Blender)';
      const methodLabels = {
        stops: 'Stop points',
        progress: 'Progress keyframes',
      } as const;
      const firstPoint = getActivePoints()[0] ?? SCENE_CONFIG.stops[0];
      const firstHeading = headingFromLook(
        firstPoint?.camera ?? [0, 0, 0],
        firstPoint?.target ?? [0, 0, -1],
      );

      const camParams = {
        cameraMethod: methodLabels[SCENE_CONFIG.cameraMethod],
        mode: isAdmin ? viewportLabel : 'Scroll Journey',
        selectedPoint: getPointNames()[0],
        copyFrom: COPY_NONE,
        scrollT: firstPoint?.progress ?? 0.0,
        camX: firstPoint?.camera[0] ?? this.camera.position.x,
        camY: firstPoint?.camera[1] ?? this.camera.position.y,
        camZ: firstPoint?.camera[2] ?? this.camera.position.z,
        targetX: firstPoint?.target[0] ?? 14.0,
        targetY: firstPoint?.target[1] ?? 2.0,
        targetZ: firstPoint?.target[2] ?? 0.0,
        fov: firstPoint?.fov ?? 45,
        showCamGizmo: this.showCamGizmo,
        showTargetGizmo: this.showTargetGizmo,
        showCamPath: this.showCamPath,
        showTargetPath: this.showTargetPath,
        cameraPathMode: this.cameraPathMode,
        grabCamera: this.grabCamera,
        lookAtTarget: this.lookAtTarget,
        yaw: 0,
        pitch: 0,
        lookDist: firstHeading.dist,

        copyViewportToSelectedStop: () => {
          const point = SCENE_CONFIG.stops[this.currentStopIndex];
          if (!point) return;
          const points = SCENE_CONFIG.stops;
          const prev = this.currentStopIndex > 0 ? points[this.currentStopIndex - 1].progress : 0;
          const next = this.currentStopIndex < points.length - 1 ? points[this.currentStopIndex + 1].progress : 1;
          const progress = clampOrdered(this.playheadT, prev, next);
          copyCurrentViewToPoint(point, progress);
          if (progress !== this.playheadT) {
            alert(`The playhead was clamped to ${progress.toFixed(3)} to keep stop points ordered.`);
          }
        },
        setKeyframeFromViewport: () => {
          setProgressKeyframeFromView();
        },
        removeCameraKeyframe: () => {
          if (SCENE_CONFIG.cameraMethod !== 'progress') return;
          const points = SCENE_CONFIG.progressKeyframes;
          if (points.length <= 1) {
            alert('Keep at least one progress keyframe.');
            return;
          }
          points.splice(this.currentStopIndex, 1);
          this.currentStopIndex = Math.min(this.currentStopIndex, points.length - 1);
          loadActivePointIntoControls();
          pointDropdownController?.options(getPointNames());
          pointDropdownController?.setValue(camParams.selectedPoint);
          syncCameraMethodUi();
          this.notifyTimingChanged();
        },
        addNewStop: () => {
          const look = this.readCurrentViewTarget();
          const points = SCENE_CONFIG.stops;
          const progress = clamp01(this.playheadT);
          const newId = `stop_${points.length + 1}_custom`;
          const existingIndex = points.findIndex((point) => Math.abs(point.progress - progress) < 0.0005);
          if (existingIndex >= 0) {
            this.currentStopIndex = existingIndex;
            copyCurrentViewToPoint(points[existingIndex], progress);
            pointDropdownController?.setValue(getPointNames()[existingIndex]);
            alert(`Updated the existing stop point at t ${progress.toFixed(3)}.`);
            return;
          }

          const newStop: CameraStop = {
            id: newId,
            progress,
            camera: [
              parseFloat(this.camera.position.x.toFixed(2)),
              parseFloat(this.camera.position.y.toFixed(2)),
              parseFloat(this.camera.position.z.toFixed(2)),
            ],
            target: [
              parseFloat(look.x.toFixed(2)),
              parseFloat(look.y.toFixed(2)),
              parseFloat(look.z.toFixed(2)),
            ],
            fov: this.camera.fov,
          };
          const insertIndex = points.findIndex((point) => point.progress > progress);
          const index = insertIndex < 0 ? points.length : insertIndex;
          points.splice(index, 0, newStop);
          this.currentStopIndex = index;
          loadActivePointIntoControls();

          pointDropdownController?.options(getPointNames());
          camParams.selectedPoint = getPointNames()[index];
          pointDropdownController?.setValue(camParams.selectedPoint);
          copyFromCtrl?.options([COPY_NONE, ...getPointNames()]);
          camParams.copyFrom = COPY_NONE;
          copyFromCtrl?.updateDisplay();
          this.refreshCamDisplay();
          this.notifyTimingChanged();
          alert(`Added new stop point '${newId}' at t ${progress.toFixed(3)}.`);
        },

        copyStopsConfig: () => {
          const text = JSON.stringify(SCENE_CONFIG.stops, null, 2);
          if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            alert('Copied all stop points to clipboard!');
          }
        },
      };

      const headingBase = { yaw: firstHeading.yaw, pitch: firstHeading.pitch };
      const captureHeadingBase = () => {
        const heading = headingFromLook(
          [camParams.camX, camParams.camY, camParams.camZ],
          [camParams.targetX, camParams.targetY, camParams.targetZ],
        );
        headingBase.yaw = heading.yaw;
        headingBase.pitch = heading.pitch;
        camParams.yaw = 0;
        camParams.pitch = 0;
        camParams.lookDist = heading.dist;
      };
      const aimedLook = (camera: readonly [number, number, number]) =>
        lookFromHeading(camera, headingBase.yaw + camParams.yaw, headingBase.pitch + camParams.pitch, camParams.lookDist);

      let pointDropdownController: any = null;
      let copyFromCtrl: any = null;
      let addStopCtrl: any = null;
      let setKeyframeCtrl: any = null;
      let removeCameraKeyframeCtrl: any = null;
      let copyViewportCtrl: any = null;

      const loadActivePointIntoControls = () => {
        const points = getActivePoints();
        const point = points[this.currentStopIndex];
        if (!point) return;
        camParams.selectedPoint = getPointNames()[this.currentStopIndex];
        camParams.scrollT = point.progress;
        camParams.camX = point.camera[0];
        camParams.camY = point.camera[1];
        camParams.camZ = point.camera[2];
        camParams.targetX = point.target[0];
        camParams.targetY = point.target[1];
        camParams.targetZ = point.target[2];
        camParams.fov = point.fov ?? 45;
        this.manualCamPos.set(...point.camera);
        this.manualLookAt.set(...point.target);
        if (!this.isOrbitMode) {
          this.camera.position.copy(this.manualCamPos);
          this.camera.lookAt(this.manualLookAt);
          this.camera.fov = camParams.fov;
          this.camera.updateProjectionMatrix();
        }
        this.cameraGizmos?.bindStop(point);
        if (!this.lookAtTarget) captureHeadingBase();
        else {
          camParams.yaw = 0;
          camParams.pitch = 0;
        }
        this.refreshCamDisplay();
      };

      const syncCameraMethodUi = () => {
        const progress = SCENE_CONFIG.cameraMethod === 'progress';
        pointDropdownController?.name(progress ? 'Edit Keyframe' : 'Edit Stop Point');
        addStopCtrl?.[progress ? 'hide' : 'show']?.();
        setKeyframeCtrl?.[progress ? 'show' : 'hide']?.();
        removeCameraKeyframeCtrl?.[progress ? 'show' : 'hide']?.();
        copyViewportCtrl?.[progress ? 'hide' : 'show']?.();
        if (pointDropdownController) {
          pointDropdownController.options(getPointNames());
          pointDropdownController.setValue(camParams.selectedPoint);
        }
        copyFromCtrl?.options([COPY_NONE, ...getPointNames()]);
        camParams.copyFrom = COPY_NONE;
        copyFromCtrl?.updateDisplay();
      };

      const copyCurrentViewToPoint = (point: CameraStop, progress: number) => {
        const target = this.readCurrentViewTarget();
        point.camera = [
          Number(this.camera.position.x.toFixed(4)),
          Number(this.camera.position.y.toFixed(4)),
          Number(this.camera.position.z.toFixed(4)),
        ];
        point.target = [
          Number(target.x.toFixed(4)),
          Number(target.y.toFixed(4)),
          Number(target.z.toFixed(4)),
        ];
        point.fov = Number(this.camera.fov.toFixed(2));
        point.progress = clamp01(progress);
        this.manualCamPos.set(...point.camera);
        this.manualLookAt.set(...point.target);
        loadActivePointIntoControls();
        this.cameraGizmos?.bindStop(point);
        this.refreshCamDisplay();
        this.notifyTimingChanged();
      };

      const setProgressKeyframeFromView = () => {
        this.ensureProgressKeyframes();
        const t = this.playheadT;
        const points = SCENE_CONFIG.progressKeyframes;
        let index = points.findIndex((point) => Math.abs(point.progress - t) < 0.004);
        let point = index >= 0 ? points[index] : null;
        if (!point) {
          const number = points.length + 1;
          point = {
            id: `keyframe_${number}`,
            progress: t,
            camera: [0, 0, 0],
            target: [0, 0, -1],
            fov: this.camera.fov,
          };
          points.push(point);
        }
        points.sort((a, b) => a.progress - b.progress);
        this.currentStopIndex = points.indexOf(point);
        if (this.currentStopIndex < 0) this.currentStopIndex = 0;
        copyCurrentViewToPoint(point, t);
        camParams.selectedPoint = getPointNames()[this.currentStopIndex];
        pointDropdownController?.options(getPointNames());
        pointDropdownController?.setValue(camParams.selectedPoint);
        pointDropdownController?.updateDisplay();
        syncCameraMethodUi();
      };

      camFolder
        .add(camParams, 'cameraMethod', [methodLabels.stops, methodLabels.progress])
        .name('Camera method')
        .onChange((value: string) => {
          SCENE_CONFIG.cameraMethod = value === methodLabels.progress ? 'progress' : 'stops';
          if (SCENE_CONFIG.cameraMethod === 'progress') this.ensureProgressKeyframes();
          this.currentStopIndex = Math.min(this.currentStopIndex, Math.max(0, getActivePoints().length - 1));
          loadActivePointIntoControls();
          syncCameraMethodUi();
          this.notifyTimingChanged();
          this.broadcastLive();
        });

      if (isAdmin) {
        this.isOrbitMode = true;
        this.onOrbitModeToggle?.(true);
      }

      camFolder
        .add(camParams, 'mode', ['Scroll Journey', viewportLabel])
        .name('Mode')
        .onChange((v: string) => {
          this.isManualMode = false;
          this.isOrbitMode = v === viewportLabel;
          this.onOrbitModeToggle?.(this.isOrbitMode);
        });

      camFolder
        .add(camParams, 'showCamGizmo')
        .name('Show camera gizmo')
        .onChange((value: boolean) => {
          this.showCamGizmo = value;
          this.syncGizmoVisibility();
        });
      camFolder
        .add(camParams, 'showTargetGizmo')
        .name('Show target gizmo')
        .onChange((value: boolean) => {
          this.showTargetGizmo = value;
          this.syncGizmoVisibility();
        });
      camFolder
        .add(camParams, 'showCamPath')
        .name('Show camera path')
        .onChange((value: boolean) => {
          this.showCamPath = value;
          this.syncGizmoVisibility();
        });
      camFolder
        .add(camParams, 'showTargetPath')
        .name('Show target path')
        .onChange((value: boolean) => {
          this.showTargetPath = value;
          this.syncGizmoVisibility();
        });
      camFolder
        .add(camParams, 'cameraPathMode', ['Full path', 'Current segment'])
        .name('Path range')
        .onChange((value: 'Full path' | 'Current segment') => {
          this.cameraPathMode = value;
          this.syncGizmoVisibility();
        });
      camFolder
        .add(camParams, 'grabCamera')
        .name('Move camera in scene')
        .onChange((value: boolean) => {
          this.setCameraGrabMode(value);
        });
      camFolder
        .add(camParams, 'lookAtTarget')
        .name('Look at target')
        .onChange((value: boolean) => {
          this.lookAtTarget = value;
          if (!value) captureHeadingBase();
          else {
            camParams.yaw = 0;
            camParams.pitch = 0;
          }
          this.cameraGizmos?.setCarryLook(!value);
          syncAimMode();
          yawCtrl.updateDisplay();
          pitchCtrl.updateDisplay();
          lookDistCtrl.updateDisplay();
        });

      pointDropdownController = camFolder
        .add(camParams, 'selectedPoint', getPointNames())
        .name(SCENE_CONFIG.cameraMethod === 'progress' ? 'Edit Keyframe' : 'Edit Stop Point')
        .onChange((name: string) => {
          const names = getPointNames();
          const points = getActivePoints();
          const idx = names.indexOf(name);
          if (idx >= 0 && idx < points.length) {
            this.currentStopIndex = idx;
            const stop = points[idx];

            camParams.scrollT = stop.progress;
            camParams.camX = stop.camera[0];
            camParams.camY = stop.camera[1];
            camParams.camZ = stop.camera[2];
            camParams.targetX = stop.target[0];
            camParams.targetY = stop.target[1];
            camParams.targetZ = stop.target[2];
            camParams.fov = stop.fov ?? 45;

            this.manualCamPos.set(...stop.camera);
            this.manualLookAt.set(...stop.target);
            if (!this.isOrbitMode) {
              this.camera.position.copy(this.manualCamPos);
              this.camera.lookAt(this.manualLookAt);
              this.camera.fov = camParams.fov;
              this.camera.updateProjectionMatrix();
            }
            this.cameraGizmos?.bindStop(stop);
            if (!this.lookAtTarget) captureHeadingBase();
            else {
              camParams.yaw = 0;
              camParams.pitch = 0;
            }

            this.refreshCamDisplay();

            if (this.onProgressChange) this.onProgressChange(stop.progress);
          }
        });

      copyFromCtrl = camFolder
        .add(camParams, 'copyFrom', [COPY_NONE, ...getPointNames()])
        .name('Copy camera from')
        .onChange((name: string) => {
          if (!name || name === COPY_NONE) return;
          const names = getPointNames();
          const points = getActivePoints();
          const srcIdx = names.indexOf(name);
          const dest = points[this.currentStopIndex];
          const src = points[srcIdx];
          if (!dest || !src) {
            camParams.copyFrom = COPY_NONE;
            copyFromCtrl.updateDisplay();
            return;
          }
          dest.camera = [src.camera[0], src.camera[1], src.camera[2]];
          dest.target = [src.target[0], src.target[1], src.target[2]];
          dest.fov = src.fov ?? dest.fov ?? 45;
          camParams.camX = dest.camera[0];
          camParams.camY = dest.camera[1];
          camParams.camZ = dest.camera[2];
          camParams.targetX = dest.target[0];
          camParams.targetY = dest.target[1];
          camParams.targetZ = dest.target[2];
          camParams.fov = dest.fov ?? 45;
          this.manualCamPos.set(...dest.camera);
          this.manualLookAt.set(...dest.target);
          if (!this.isOrbitMode) {
            this.camera.position.copy(this.manualCamPos);
            this.camera.lookAt(this.manualLookAt);
            this.camera.fov = camParams.fov;
            this.camera.updateProjectionMatrix();
          }
          this.cameraGizmos?.bindStop(dest);
          if (!this.lookAtTarget) captureHeadingBase();
          else {
            camParams.yaw = 0;
            camParams.pitch = 0;
          }
          this.refreshCamDisplay();
          camParams.copyFrom = COPY_NONE;
          copyFromCtrl.updateDisplay();
        });

      this.pullCamSlidersFromStop = () => {
        const stop = getActivePoints()[this.currentStopIndex];
        if (!stop) return;
        camParams.scrollT = stop.progress;
        camParams.camX = stop.camera[0];
        camParams.camY = stop.camera[1];
        camParams.camZ = stop.camera[2];
        camParams.targetX = stop.target[0];
        camParams.targetY = stop.target[1];
        camParams.targetZ = stop.target[2];
        camParams.fov = stop.fov ?? 45;
        this.manualCamPos.set(...stop.camera);
        this.manualLookAt.set(...stop.target);
        this.refreshCamDisplay();
      };

      const writeStopCamera = (axis: 0 | 1 | 2, value: number) => {
        this.manualCamPos.setComponent(axis, value);
        const stop = getActivePoints()[this.currentStopIndex];
        if (stop) stop.camera[axis] = value;
        if (!this.lookAtTarget && stop) {
          const next = aimedLook(stop.camera);
          stop.target = next;
          camParams.targetX = next[0];
          camParams.targetY = next[1];
          camParams.targetZ = next[2];
          this.manualLookAt.set(...next);
          targetXCtrl.updateDisplay();
          targetYCtrl.updateDisplay();
          targetZCtrl.updateDisplay();
        }
        if (!this.isOrbitMode) {
          this.camera.position.setComponent(axis, value);
          if (!this.lookAtTarget) this.camera.lookAt(this.manualLookAt);
        }
      };

      const writeStopTarget = (axis: 0 | 1 | 2, value: number) => {
        this.manualLookAt.setComponent(axis, value);
        const stop = getActivePoints()[this.currentStopIndex];
        if (stop) stop.target[axis] = value;
        if (!this.isOrbitMode) this.camera.lookAt(this.manualLookAt);
      };

      const scrollCtrl = camFolder
        .add(camParams, 'scrollT', 0.0, 1.0, 0.01)
        .name('Scroll t')
        .listen()
        .onChange((val: number) => {
          const points = getActivePoints();
          const point = points[this.currentStopIndex];
          if (!point) return;
          const prev = this.currentStopIndex > 0 ? points[this.currentStopIndex - 1].progress : 0;
          const next = this.currentStopIndex < points.length - 1 ? points[this.currentStopIndex + 1].progress : 1;
          const clamped = clampOrdered(val, prev, next);
          point.progress = clamped;
          camParams.scrollT = clamped;
          if (this.onProgressChange) this.onProgressChange(clamped);
          this.notifyTimingChanged();
        });

      const camXCtrl = camFolder
        .add(camParams, 'camX', -100, 100, 0.01)
        .name('Cam X')
        .listen()
        .onChange((v: number) => writeStopCamera(0, v));

      const camYCtrl = camFolder
        .add(camParams, 'camY', -10, 100, 0.01)
        .name('Cam Y')
        .listen()
        .onChange((v: number) => writeStopCamera(1, v));

      const camZCtrl = camFolder
        .add(camParams, 'camZ', -100, 100, 0.01)
        .name('Cam Z')
        .listen()
        .onChange((v: number) => writeStopCamera(2, v));

      const targetXCtrl = camFolder
        .add(camParams, 'targetX', -100, 100, 0.01)
        .name('Target X')
        .listen()
        .onChange((v: number) => writeStopTarget(0, v));

      const targetYCtrl = camFolder
        .add(camParams, 'targetY', -50, 100, 0.01)
        .name('Target Y')
        .listen()
        .onChange((v: number) => writeStopTarget(1, v));

      const targetZCtrl = camFolder
        .add(camParams, 'targetZ', -100, 100, 0.01)
        .name('Target Z')
        .listen()
        .onChange((v: number) => writeStopTarget(2, v));

      const fovCtrl = camFolder
        .add(camParams, 'fov', 15, 90, 1)
        .name('FOV Zoom')
        .listen()
        .onChange((v: number) => {
          if (!this.isOrbitMode) {
            this.camera.fov = v;
            this.camera.updateProjectionMatrix();
          }
          const point = getActivePoints()[this.currentStopIndex];
          if (point) {
            point.fov = v;
          }
        });

      const writeHeading = () => {
        const stop = getActivePoints()[this.currentStopIndex];
        if (!stop) return;
        camParams.yaw = THREE.MathUtils.clamp(camParams.yaw, -180, 180);
        camParams.pitch = THREE.MathUtils.clamp(camParams.pitch, -89, 89);
        const next = aimedLook(stop.camera);
        stop.target = next;
        camParams.targetX = next[0];
        camParams.targetY = next[1];
        camParams.targetZ = next[2];
        this.manualLookAt.set(...next);
        if (!this.isOrbitMode) this.camera.lookAt(this.manualLookAt);
        this.cameraGizmos?.bindStop(stop);
        targetXCtrl.updateDisplay();
        targetYCtrl.updateDisplay();
        targetZCtrl.updateDisplay();
      };

      const yawCtrl = camFolder
        .add(camParams, 'yaw', -180, 180, 0.5)
        .name('Yaw')
        .listen()
        .onChange(writeHeading);
      const pitchCtrl = camFolder
        .add(camParams, 'pitch', -89, 89, 0.5)
        .name('Pitch')
        .listen()
        .onChange(writeHeading);
      const lookDistCtrl = camFolder
        .add(camParams, 'lookDist', 0.4, 40, 0.1)
        .name('Look distance')
        .listen()
        .onChange(writeHeading);

      const syncAimMode = () => {
        if (this.lookAtTarget) {
          targetXCtrl.enable?.();
          targetYCtrl.enable?.();
          targetZCtrl.enable?.();
          yawCtrl.disable?.();
          pitchCtrl.disable?.();
          lookDistCtrl.disable?.();
        } else {
          targetXCtrl.disable?.();
          targetYCtrl.disable?.();
          targetZCtrl.disable?.();
          yawCtrl.enable?.();
          pitchCtrl.enable?.();
          lookDistCtrl.enable?.();
        }
      };
      syncAimMode();

      addStopCtrl = camFolder.add(camParams, 'addNewStop').name('➕ Add Current View as Stop');
      setKeyframeCtrl = camFolder
        .add(camParams, 'setKeyframeFromViewport')
        .name('Set Current View as Keyframe');
      removeCameraKeyframeCtrl = camFolder
        .add(camParams, 'removeCameraKeyframe')
        .name('Remove Selected Keyframe');
      copyViewportCtrl = camFolder
        .add(camParams, 'copyViewportToSelectedStop')
        .name('Copy Viewport to Selected Stop');
      camFolder.add(camParams, 'copyStopsConfig').name('📋 Copy Stops JSON');

      this.refreshCamDisplay = () => {
        const heading = headingFromLook(
          [camParams.camX, camParams.camY, camParams.camZ],
          [camParams.targetX, camParams.targetY, camParams.targetZ],
        );
        camParams.lookDist = heading.dist;
        if (this.lookAtTarget) {
          camParams.yaw = 0;
          camParams.pitch = 0;
        }
        scrollCtrl.updateDisplay();
        camXCtrl.updateDisplay();
        camYCtrl.updateDisplay();
        camZCtrl.updateDisplay();
        targetXCtrl.updateDisplay();
        targetYCtrl.updateDisplay();
        targetZCtrl.updateDisplay();
        fovCtrl.updateDisplay();
        yawCtrl.updateDisplay();
        pitchCtrl.updateDisplay();
        lookDistCtrl.updateDisplay();
      };

      this.selectCameraPointFromTimeline = (index: number) => {
        const points = getActivePoints();
        if (!points[index]) return;
        this.currentStopIndex = index;
        camParams.selectedPoint = getPointNames()[index];
        pointDropdownController?.setValue(camParams.selectedPoint);
        loadActivePointIntoControls();
        this.onProgressChange?.(points[index].progress);
      };

      syncCameraMethodUi();

      this.populateLightsAndShadows();
      this.populateMaterials();
      this.populateStoryControls();
      this.populateShootingLogo();
      this.populateLoadingScreen();
      this.populateStoryTiming();
      this.populateBuildingNames();
      if (!this.timelinePanel) {
        this.timelinePanel = new StoryTimelinePanel((t) => this.seekStory(t), {
          onApply: async () => {
            try {
              await this.applyAndSave();
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : 'Unknown error';
              alert(`Error saving config: ${message}`);
              throw error;
            }
          },
          onLogout: () => {
            void fetch('/api/admin/logout', { method: 'POST' }).finally(() => {
              window.location.reload();
            });
          },
          onOpacity: (value) => this.applyPanelOpacity(value),
          initialOpacity: this.panelOpacity,
        });
        const dock = document.getElementById('admin-timeline-dock');
        this.timelinePanel.mount(dock);
        this.timelinePanel.setCollapsed(true);
        this.observeChromeLayout();
        this.applyPanelOpacity(this.panelOpacity);
      }

      const envFolder = this.addTab('Environment');
      const currentBgHex = '#' + (
        this.scene.background instanceof THREE.Color
          ? this.scene.background.getHexString()
          : new THREE.Color(SCENE_CONFIG.environment.backgroundColor).getHexString()
      );
      const currentFogHex = '#' + (
        this.scene.fog
          ? (this.scene.fog as THREE.Fog).color.getHexString()
          : new THREE.Color(SCENE_CONFIG.environment.fogColor ?? SCENE_CONFIG.environment.backgroundColor).getHexString()
      );

      const envParams = {
        exposure: this.renderer.toneMappingExposure,
        bgColor: currentBgHex,
        fogColor: currentFogHex,
        fogNear: (this.scene.fog as THREE.Fog)?.near ?? SCENE_CONFIG.environment.fogStart,
        fogFar: (this.scene.fog as THREE.Fog)?.far ?? SCENE_CONFIG.environment.fogEnd,
        skyEnabled: SCENE_CONFIG.environment.skyEnabled !== false,
        shadowColor: '#' + new THREE.Color(SCENE_CONFIG.environment.shadowColor ?? 0x000000).getHexString(),
        shadowOpacity: SCENE_CONFIG.environment.shadowOpacity ?? 1,
      };

      const activeSky = SCENE_CONFIG.environment.sky ?? DEFAULT_CINEMATIC_SKY;
      const skyColor = (value: number) => '#' + new THREE.Color(value).getHexString();
      const skyParams = {
        zenithColor: skyColor(activeSky.zenithColor),
        upperColor: skyColor(activeSky.upperColor),
        horizonColor: skyColor(activeSky.horizonColor),
        warmthColor: skyColor(activeSky.warmthColor),
        moonColor: skyColor(activeSky.moonColor),
        starColor: skyColor(activeSky.starColor),
        rotationY: activeSky.rotationY,
        moonAzimuth: activeSky.moonAzimuth,
        moonElevation: activeSky.moonElevation,
        moonSize: activeSky.moonSize,
        moonGlow: activeSky.moonGlow,
        horizonGlow: activeSky.horizonGlow,
        starDensity: activeSky.starDensity,
        starIntensity: activeSky.starIntensity,
        exposure: activeSky.exposure,
      };
      const skyFolder = this.addTab('Sky');
      skyFolder
        .add(envParams, 'skyEnabled')
        .name('Enable sky')
        .onChange((value: boolean) => {
          SCENE_CONFIG.environment.skyEnabled = value;
          setCinematicSkyEnabled(this.scene, value);
          this.broadcastLive();
        });
      const applySky = () => {
        const nextSky = {
          zenithColor: new THREE.Color(skyParams.zenithColor).getHex(),
          upperColor: new THREE.Color(skyParams.upperColor).getHex(),
          horizonColor: new THREE.Color(skyParams.horizonColor).getHex(),
          warmthColor: new THREE.Color(skyParams.warmthColor).getHex(),
          moonColor: new THREE.Color(skyParams.moonColor).getHex(),
          starColor: new THREE.Color(skyParams.starColor).getHex(),
          rotationY: skyParams.rotationY,
          moonAzimuth: skyParams.moonAzimuth,
          moonElevation: skyParams.moonElevation,
          moonSize: skyParams.moonSize,
          moonGlow: skyParams.moonGlow,
          horizonGlow: skyParams.horizonGlow,
          starDensity: skyParams.starDensity,
          starIntensity: skyParams.starIntensity,
          exposure: skyParams.exposure,
        };
        SCENE_CONFIG.environment.sky = nextSky;
        setCinematicSkyConfig(this.scene, nextSky, SCENE_CONFIG.environment.horizon);
        this.broadcastLive();
      };
      skyFolder.addColor(skyParams, 'zenithColor').name('Zenith color').onChange(applySky);
      skyFolder.addColor(skyParams, 'upperColor').name('Upper sky color').onChange(applySky);
      skyFolder.addColor(skyParams, 'horizonColor').name('Horizon color').onChange(applySky);
      skyFolder.addColor(skyParams, 'warmthColor').name('Horizon warmth').onChange(applySky);
      skyFolder.addColor(skyParams, 'moonColor').name('Moon color').onChange(applySky);
      skyFolder.addColor(skyParams, 'starColor').name('Star color').onChange(applySky);
      skyFolder.add(skyParams, 'rotationY', 0, 360, 1).name('Sky rotation Y').onChange(applySky);
      skyFolder.add(skyParams, 'moonAzimuth', -180, 180, 1).name('Moon azimuth').onChange(applySky);
      skyFolder.add(skyParams, 'moonElevation', -10, 90, 1).name('Moon elevation').onChange(applySky);
      skyFolder.add(skyParams, 'moonSize', 0.2, 3, 0.01).name('Moon size').onChange(applySky);
      skyFolder.add(skyParams, 'moonGlow', 0, 3, 0.01).name('Moon glow').onChange(applySky);
      skyFolder.add(skyParams, 'horizonGlow', 0, 3, 0.01).name('Horizon glow').onChange(applySky);
      skyFolder.add(skyParams, 'starDensity', 0, 2, 0.01).name('Star density').onChange(applySky);
      skyFolder.add(skyParams, 'starIntensity', 0, 3, 0.01).name('Star intensity').onChange(applySky);
      skyFolder.add(skyParams, 'exposure', 0, 3, 0.01).name('Sky exposure').onChange(applySky);

      const activeHorizon = SCENE_CONFIG.environment.horizon ?? DEFAULT_CINEMATIC_HORIZON;
      const horizonParams = {
        enabled: activeHorizon.enabled,
        color: skyColor(activeHorizon.color),
        opacity: activeHorizon.opacity,
        height: activeHorizon.height,
        softness: activeHorizon.softness,
      };
      const horizonFolder = this.addTab('Horizon');
      const applyHorizon = () => {
        const nextHorizon = {
          enabled: horizonParams.enabled,
          color: new THREE.Color(horizonParams.color).getHex(),
          opacity: horizonParams.opacity,
          height: horizonParams.height,
          softness: horizonParams.softness,
        };
        SCENE_CONFIG.environment.horizon = nextHorizon;
        // Match the scene fog to the horizon veil so the far ground dissolves
        // into the same atmospheric color instead of forming a second seam.
        SCENE_CONFIG.environment.fogColor = nextHorizon.color;
        if (this.scene.fog) (this.scene.fog as THREE.Fog).color.setHex(nextHorizon.color);
        setCinematicHorizonConfig(this.scene, nextHorizon);
        this.broadcastLive();
      };
      horizonFolder.add(horizonParams, 'enabled').name('Horizon atmosphere').onChange(applyHorizon);
      horizonFolder.addColor(horizonParams, 'color').name('Mist color').onChange(applyHorizon);
      horizonFolder.add(horizonParams, 'opacity', 0, 1, 0.01).name('Mist amount').onChange(applyHorizon);
      horizonFolder.add(horizonParams, 'height', -0.6, 0.6, 0.01).name('Horizon height').onChange(applyHorizon);
      horizonFolder.add(horizonParams, 'softness', 0.02, 1, 0.01).name('Blend softness').onChange(applyHorizon);

      envFolder
        .add(envParams, 'exposure', 0.1, 3.0, 0.05)
        .name('Exposure')
        .listen()
        .onChange((v: number) => {
          this.renderer.toneMappingExposure = v;
          SCENE_CONFIG.renderer.toneMappingExposure = v;
        });

      envFolder
        .addColor(envParams, 'bgColor')
        .name('Unified Background Color')
        .listen()
        .onChange((v: string) => {
          const col = new THREE.Color(v);
          this.scene.background = col;
          document.body.style.backgroundColor = v;
          SCENE_CONFIG.environment.backgroundColor = col.getHex();
        });

      envFolder
        .addColor(envParams, 'shadowColor')
        .name('Building shadow color')
        .onChange((v: string) => {
          SCENE_CONFIG.environment.shadowColor = new THREE.Color(v).getHex();
          applySceneShadows(this.lightsMap.values());
        });
      envFolder
        .add(envParams, 'shadowOpacity', 0, 1, 0.01)
        .name('Shadow tint amount')
        .onChange((v: number) => {
          SCENE_CONFIG.environment.shadowOpacity = v;
          applySceneShadows(this.lightsMap.values());
        });

      const fogFolder = this.addTab('Fog');
      const fogParams = {
        enabled: Boolean(this.scene.fog) && SCENE_CONFIG.environment.fogEnabled !== false,
        fogColor: envParams.fogColor,
        fogNear: envParams.fogNear,
        fogFar: envParams.fogFar,
      };
      const applyFog = () => {
        if (!fogParams.enabled) {
          this.scene.fog = null;
          SCENE_CONFIG.environment.fogEnabled = false;
          return;
        }
        const col = new THREE.Color(fogParams.fogColor);
        if (this.scene.fog) {
          this.scene.fog.color.copy(col);
          (this.scene.fog as THREE.Fog).near = fogParams.fogNear;
          (this.scene.fog as THREE.Fog).far = fogParams.fogFar;
        } else {
          this.scene.fog = new THREE.Fog(col, fogParams.fogNear, fogParams.fogFar);
        }
        SCENE_CONFIG.environment.fogEnabled = true;
        SCENE_CONFIG.environment.fogColor = col.getHex();
        SCENE_CONFIG.environment.fogStart = fogParams.fogNear;
        SCENE_CONFIG.environment.fogEnd = fogParams.fogFar;
      };
      fogFolder.add(fogParams, 'enabled').name('Fog on').onChange(applyFog);
      fogFolder.addColor(fogParams, 'fogColor').name('Fog color').onChange(applyFog);
      fogFolder.add(fogParams, 'fogNear', 0, 100, 1).name('Fog start').onChange(applyFog);
      fogFolder.add(fogParams, 'fogFar', 10, 250, 2).name('Fog end').onChange(applyFog);

      const lookFolder = this.addTab('Look');
      const lookParams = {
        envEnabled: LOOK_CONFIG.envEnabled,
        envIntensity: LOOK_CONFIG.envIntensity,
        grain: LOOK_CONFIG.grain,
        grainSize: LOOK_CONFIG.grainSize,
        vignette: LOOK_CONFIG.vignette,
        vignetteStart: LOOK_CONFIG.vignetteStart ?? 0.42,
        vignetteSoft: LOOK_CONFIG.vignetteSoft ?? 0.55,
        bloom: LOOK_CONFIG.bloom ?? 0.4,
        bloomRadius: LOOK_CONFIG.bloomRadius ?? 0.55,
        gradeShadows: LOOK_CONFIG.gradeShadows ?? 0,
        gradeMids: LOOK_CONFIG.gradeMids ?? 0,
        gradeHighlights: LOOK_CONFIG.gradeHighlights ?? 0,
      };
      const applyLook = () => {
        LOOK_CONFIG.envEnabled = lookParams.envEnabled;
        LOOK_CONFIG.envIntensity = lookParams.envIntensity;
        LOOK_CONFIG.grain = lookParams.grain;
        LOOK_CONFIG.grainSize = lookParams.grainSize;
        LOOK_CONFIG.vignette = lookParams.vignette;
        LOOK_CONFIG.vignetteStart = lookParams.vignetteStart;
        LOOK_CONFIG.vignetteSoft = lookParams.vignetteSoft;
        LOOK_CONFIG.bloom = lookParams.bloom;
        LOOK_CONFIG.bloomRadius = lookParams.bloomRadius;
        LOOK_CONFIG.gradeShadows = lookParams.gradeShadows;
        LOOK_CONFIG.gradeMids = lookParams.gradeMids;
        LOOK_CONFIG.gradeHighlights = lookParams.gradeHighlights;
        applySceneEnvironment(this.scene, this.renderer);
        applyLookOverlay();
        this.broadcastLive();
      };
      lookFolder.add(lookParams, 'envEnabled').name('Environment reflections').onChange(applyLook);
      lookFolder.add(lookParams, 'envIntensity', 0, 3, 0.05).name('Reflection strength').onChange(applyLook);
      lookFolder.add(lookParams, 'bloom', 0, 2, 0.02).name('Story light bloom').onChange(applyLook);
      lookFolder.add(lookParams, 'bloomRadius', 0.15, 1.2, 0.02).name('Bloom size').onChange(applyLook);
      lookFolder.add(lookParams, 'gradeShadows', 0, 0.5, 0.01).name('Grade shadows').onChange(applyLook);
      lookFolder.add(lookParams, 'gradeMids', -0.4, 0.5, 0.01).name('Grade contrast').onChange(applyLook);
      lookFolder.add(lookParams, 'gradeHighlights', 0, 0.4, 0.01).name('Grade highlights').onChange(applyLook);
      lookFolder.add(lookParams, 'grain', 0, 0.45, 0.01).name('Film grain').onChange(applyLook);
      lookFolder.add(lookParams, 'grainSize', 0.5, 2.5, 0.05).name('Grain size').onChange(applyLook);
      lookFolder.add(lookParams, 'vignette', 0, 0.8, 0.01).name('Vignette').onChange(applyLook);
      lookFolder.add(lookParams, 'vignetteStart', 0.15, 0.7, 0.01).name('Vignette start').onChange(applyLook);
      lookFolder.add(lookParams, 'vignetteSoft', 0.2, 0.85, 0.01).name('Vignette softness').onChange(applyLook);

      this.setAllFoldersOpen(false);
      this.setStudioCollapsed(true);
      this.syncStudioDockBottom();
    } catch (e) {
      console.log('[SceneStudioGUI] lil-gui dynamic import skipped:', e);
    }
  }

  private addTypeControls(folder: any, face: TypeFace, hex: (value: number) => string, label = '') {
    if (face.lineHeight === undefined) face.lineHeight = 1.15;
    if (face.letterSpacing === undefined) face.letterSpacing = 0;
    const named = (name: string) => (label ? `${label} ${name[0].toLowerCase()}${name.slice(1)}` : name);
    const params = {
      size: face.size,
      weight: face.weight,
      lineHeight: face.lineHeight,
      letterSpacing: face.letterSpacing,
      shadowColor: hex(face.shadowColor),
      shadowOpacity: face.shadowOpacity,
      shadowBlur: face.shadowBlur,
      shadowX: face.shadowX,
      shadowY: face.shadowY,
    };
    const sync = () => applyTypeChrome();
    folder.add(params, 'size', 8, 160, 1).name(named('Size')).onChange((value: number) => {
      face.size = value;
      sync();
    });
    folder.add(params, 'weight', TYPE_WEIGHTS).name(named('Weight')).onChange((value: number) => {
      face.weight = Number(value);
      sync();
    });
    folder.add(params, 'lineHeight', 0.5, 3.2, 0.02).name(named('Line spacing')).onChange((value: number) => {
      face.lineHeight = value;
      sync();
    });
    folder.add(params, 'letterSpacing', -20, 20, 0.1).name(named('Letter spacing')).onChange((value: number) => {
      face.letterSpacing = value;
      sync();
    });
    folder.addColor(params, 'shadowColor').name(named('Shadow color')).onChange((value: string) => {
      face.shadowColor = new THREE.Color(value).getHex();
      sync();
    });
    folder.add(params, 'shadowOpacity', 0, 1, 0.01).name(named('Shadow opacity')).onChange((value: number) => {
      face.shadowOpacity = value;
      sync();
    });
    folder.add(params, 'shadowBlur', 0, 40, 0.5).name(named('Shadow blur')).onChange((value: number) => {
      face.shadowBlur = value;
      sync();
    });
    folder.add(params, 'shadowX', -20, 20, 0.5).name(named('Shadow X')).onChange((value: number) => {
      face.shadowX = value;
      sync();
    });
    folder.add(params, 'shadowY', -20, 20, 0.5).name(named('Shadow Y')).onChange((value: number) => {
      face.shadowY = value;
      sync();
    });
  }

  private populateStoryControls() {
    if (!this.gui) return;
    applyStoryTheme();
    applyHeroCopy();
    applyFlowChrome();
    applyTypeChrome();

    const hex = (value: number) => '#' + new THREE.Color(value).getHexString();

    const heroFolder = this.addTab('Hero');
    const heroVis = { showHero: this.showHero };
    heroFolder
      .add(heroVis, 'showHero')
      .name('Show hero')
      .onChange((value: boolean) => {
        this.showHero = value;
        STUDIO_OVERLAY.showHero = value;
        this.syncHeroVisibility();
      });
    const brandParams = {
      siteName: TYPE_CHROME.siteName,
      siteNameColor: hex(TYPE_CHROME.siteNameColor),
      siteNameLayoutColor: hex(TYPE_CHROME.siteNameLayoutColor ?? 0x1a1b22),
      paddingTop: TYPE_CHROME.siteNamePaddingTop ?? 0,
    };
    heroFolder.add(brandParams, 'siteName').name('Site name').onChange((value: string) => {
      TYPE_CHROME.siteName = value;
      applyTypeChrome();
    });
    heroFolder.addColor(brandParams, 'siteNameColor').name('Name 3D scene color').onChange((value: string) => {
      TYPE_CHROME.siteNameColor = new THREE.Color(value).getHex();
      applyTypeChrome();
    });
    heroFolder.addColor(brandParams, 'siteNameLayoutColor').name('Name website layout color').onChange((value: string) => {
      TYPE_CHROME.siteNameLayoutColor = new THREE.Color(value).getHex();
      applyTypeChrome();
    });
    heroFolder
      .add(brandParams, 'paddingTop', -200, 400, 1)
      .name('Name top padding')
      .onChange((value: number) => {
        TYPE_CHROME.siteNamePaddingTop = value;
        applyTypeChrome();
      });
    this.addTypeControls(heroFolder, TYPE_CHROME.siteNameType, hex, 'Name');
    const logoParams = {
      showSiteLogo: TYPE_CHROME.showSiteLogo !== false,
      siteLogoSize: TYPE_CHROME.siteLogoSize ?? 36,
      siteLogoGap: TYPE_CHROME.siteLogoGap ?? 10,
      siteLogoOffsetX: TYPE_CHROME.siteLogoOffsetX ?? 0,
      siteLogoOffsetY: TYPE_CHROME.siteLogoOffsetY ?? 0,
      siteLogoSide: TYPE_CHROME.siteLogoSide === 'right' ? 'right' : 'left',
    };
    const pushHeroLogo = () => {
      TYPE_CHROME.showSiteLogo = logoParams.showSiteLogo;
      TYPE_CHROME.siteLogoSize = logoParams.siteLogoSize;
      TYPE_CHROME.siteLogoGap = logoParams.siteLogoGap;
      TYPE_CHROME.siteLogoOffsetX = logoParams.siteLogoOffsetX;
      TYPE_CHROME.siteLogoOffsetY = logoParams.siteLogoOffsetY;
      TYPE_CHROME.siteLogoSide = logoParams.siteLogoSide === 'right' ? 'right' : 'left';
      applyTypeChrome();
    };
    heroFolder.add(logoParams, 'showSiteLogo').name('Show logo').onChange(pushHeroLogo);
    heroFolder.add(logoParams, 'siteLogoSide', { Left: 'left', Right: 'right' }).name('Logo side').onChange(pushHeroLogo);
    heroFolder.add(logoParams, 'siteLogoSize', 8, 160, 1).name('Logo size').onChange(pushHeroLogo);
    heroFolder.add(logoParams, 'siteLogoGap', 0, 120, 1).name('Logo gap').onChange(pushHeroLogo);
    heroFolder.add(logoParams, 'siteLogoOffsetX', -120, 120, 1).name('Logo offset X').onChange(pushHeroLogo);
    heroFolder.add(logoParams, 'siteLogoOffsetY', -120, 120, 1).name('Logo offset Y').onChange(pushHeroLogo);
    const heroParams = {
      titleLine1: HERO_COPY.titleLine1,
      titleLine2: HERO_COPY.titleLine2,
      titleColor: hex(HERO_COPY.titleColor),
      titlePaddingTop: HERO_COPY.titlePaddingTop ?? 0,
      subtitleLine1: HERO_COPY.subtitleLine1,
      subtitleLine2: HERO_COPY.subtitleLine2,
      subtitleColor: hex(HERO_COPY.subtitleColor),
      subtitlePaddingTop: HERO_COPY.subtitlePaddingTop ?? 0,
      stackGap: HERO_COPY.stackGap ?? 48,
      scrollHint: HERO_COPY.scrollHint,
      scrollHintColor: hex(HERO_COPY.scrollHintColor),
    };
    const applyHeroField = <K extends keyof typeof HERO_COPY>(key: K, value: (typeof HERO_COPY)[K]) => {
      HERO_COPY[key] = value;
      applyHeroCopy();
    };
    heroFolder.add(heroParams, 'titleLine1').name('Title line 1').onChange((value: string) => applyHeroField('titleLine1', value));
    heroFolder.add(heroParams, 'titleLine2').name('Title line 2').onChange((value: string) => applyHeroField('titleLine2', value));
    heroFolder
      .addColor(heroParams, 'titleColor')
      .name('Title color')
      .onChange((value: string) => applyHeroField('titleColor', new THREE.Color(value).getHex()));
    heroFolder
      .add(heroParams, 'titlePaddingTop', -200, 480, 1)
      .name('Title top padding')
      .onChange((value: number) => applyHeroField('titlePaddingTop', value));
    heroFolder.add(heroParams, 'subtitleLine1').name('Description line 1').onChange((value: string) => applyHeroField('subtitleLine1', value));
    heroFolder.add(heroParams, 'subtitleLine2').name('Description line 2').onChange((value: string) => applyHeroField('subtitleLine2', value));
    heroFolder
      .addColor(heroParams, 'subtitleColor')
      .name('Description color')
      .onChange((value: string) => applyHeroField('subtitleColor', new THREE.Color(value).getHex()));
    heroFolder
      .add(heroParams, 'subtitlePaddingTop', -200, 400, 1)
      .name('Description top padding')
      .onChange((value: number) => applyHeroField('subtitlePaddingTop', value));
    heroFolder
      .add(heroParams, 'stackGap', 0, 160, 1)
      .name('Title / description gap')
      .onChange((value: number) => applyHeroField('stackGap', value));
    heroFolder.add(heroParams, 'scrollHint').name('Scroll hint').onChange((value: string) => applyHeroField('scrollHint', value));
    heroFolder
      .addColor(heroParams, 'scrollHintColor')
      .name('Scroll hint color')
      .onChange((value: string) => applyHeroField('scrollHintColor', new THREE.Color(value).getHex()));
    this.addTypeControls(heroFolder, TYPE_CHROME.heroTitle, hex, 'Title');
    this.addTypeControls(heroFolder, TYPE_CHROME.heroSubtitle, hex, 'Description');
    this.addTypeControls(heroFolder, TYPE_CHROME.scrollHint, hex, 'Scroll hint');

    const storyFolder = this.addTab('Story colors');

    const colorParams = {
      packet: hex(STORY_CONFIG.colors.packet),
      packetBounce: hex(STORY_CONFIG.colors.packetBounce ?? STORY_CONFIG.colors.packet),
      packetCore: hex(STORY_CONFIG.colors.packetCore ?? STORY_CONFIG.colors.packet),
      packetInner: hex(STORY_CONFIG.colors.packetInner ?? STORY_CONFIG.colors.packet),
      packetOuter: hex(STORY_CONFIG.colors.packetOuter ?? STORY_CONFIG.colors.packet),
      packetSpark: hex(STORY_CONFIG.colors.packetSpark ?? STORY_CONFIG.colors.packet),
      hubPulse: hex(STORY_CONFIG.colors.hubPulse),
      hubPulseWindow: hex(STORY_CONFIG.colors.hubPulseWindow ?? STORY_CONFIG.colors.hubPulse),
      need: hex(STORY_CONFIG.colors.need),
      needWindow: hex(STORY_CONFIG.colors.needWindow ?? STORY_CONFIG.colors.need),
      resolved: hex(STORY_CONFIG.colors.resolved),
      resolvedWindow: hex(STORY_CONFIG.colors.resolvedWindow ?? STORY_CONFIG.colors.resolved),
      chipNeed: hex(STORY_CONFIG.colors.chipNeed ?? STORY_CONFIG.colors.need),
      chipResolved: hex(STORY_CONFIG.colors.chipResolved ?? STORY_CONFIG.colors.resolved),
    };

    const applyColor = (key: keyof typeof colorParams, value: string) => {
      STORY_CONFIG.colors[key] = new THREE.Color(value).getHex();
      applyStoryTheme();
    };

    storyFolder.addColor(colorParams, 'hubPulse').name('Rastaak building').onChange((v: string) => applyColor('hubPulse', v));
    storyFolder.addColor(colorParams, 'hubPulseWindow').name('Rastaak window').onChange((v: string) => applyColor('hubPulseWindow', v));
    storyFolder.addColor(colorParams, 'need').name('Client before — building').onChange((v: string) => applyColor('need', v));
    storyFolder.addColor(colorParams, 'needWindow').name('Client before — window').onChange((v: string) => applyColor('needWindow', v));
    storyFolder.addColor(colorParams, 'resolved').name('Client after — building').onChange((v: string) => applyColor('resolved', v));
    storyFolder.addColor(colorParams, 'resolvedWindow').name('Client after — window').onChange((v: string) => applyColor('resolvedWindow', v));
    storyFolder.addColor(colorParams, 'chipNeed').name('Tick before solve').onChange((v: string) => applyColor('chipNeed', v));
    storyFolder.addColor(colorParams, 'chipResolved').name('Tick after solve').onChange((v: string) => applyColor('chipResolved', v));

    const needsFolder = this.addTab('Needs');
    const needsBoxParams = {
      chipBorder: hex(STORY_CONFIG.chipBorder ?? 0xe0a01a),
      chipBorderOpacity: STORY_CONFIG.chipBorderOpacity ?? 0.55,
      chipBackground: hex(STORY_CONFIG.chipBackground ?? 0x14151a),
      chipBackgroundOpacity: STORY_CONFIG.chipBackgroundOpacity ?? 0.72,
      chipText: hex(STORY_CONFIG.chipText ?? 0xf5f5f2),
      chipSize: TYPE_CHROME.chipText.size ?? 13,
      chipMaxWidth: STORY_CONFIG.chipMaxWidth ?? 680,
    };
    needsFolder
      .addColor(needsBoxParams, 'chipBorder')
      .name('Border color')
      .onChange((value: string) => {
        STORY_CONFIG.chipBorder = new THREE.Color(value).getHex();
        applyStoryTheme();
      });
    needsFolder
      .add(needsBoxParams, 'chipBorderOpacity', 0, 1, 0.01)
      .name('Border opacity')
      .onChange((value: number) => {
        STORY_CONFIG.chipBorderOpacity = value;
        applyStoryTheme();
      });
    needsFolder
      .addColor(needsBoxParams, 'chipBackground')
      .name('Background color')
      .onChange((value: string) => {
        STORY_CONFIG.chipBackground = new THREE.Color(value).getHex();
        applyStoryTheme();
      });
    needsFolder
      .add(needsBoxParams, 'chipBackgroundOpacity', 0, 1, 0.01)
      .name('Background opacity')
      .onChange((value: number) => {
        STORY_CONFIG.chipBackgroundOpacity = value;
        applyStoryTheme();
      });
    needsFolder
      .addColor(needsBoxParams, 'chipText')
      .name('Text color')
      .onChange((value: string) => {
        STORY_CONFIG.chipText = new THREE.Color(value).getHex();
        applyStoryTheme();
      });
    needsFolder
      .add(needsBoxParams, 'chipSize', 10, 48, 1)
      .name('Size')
      .onChange((value: number) => {
        TYPE_CHROME.chipText.size = value;
        applyTypeChrome();
      });
    needsFolder
      .add(needsBoxParams, 'chipMaxWidth', 240, 960, 10)
      .name('Background width')
      .onChange((value: number) => {
        STORY_CONFIG.chipMaxWidth = value;
        applyStoryTheme();
      });
    this.addTypeControls(needsFolder, TYPE_CHROME.chipText, hex, 'Need');

    const needTimeRows: Array<{
      client: (typeof STORY_CONFIG.clients)[number];
      params: { start: number; end: number };
      startCtrl: { updateDisplay: () => void };
      endCtrl: { updateDisplay: () => void };
    }> = [];
    STORY_CONFIG.clients.forEach((client) => {
      const folder = needsFolder.addFolder(storyBuildingLabel(client));
      const params = {
        need: client.need,
        needAfter: client.needAfter ?? '',
        start: client.appear,
        end: needEndAt(client),
      };
      folder.add(params, 'need').name('Before explosion').onChange((value: string) => {
        client.need = value;
      });
      folder.add(params, 'needAfter').name('After explosion').onChange((value: string) => {
        client.needAfter = value;
      });
      const startCtrl = folder
        .add(params, 'start', 0, 1, 0.01)
        .name('Start')
        .onChange((value: number) => {
          const maxStart = Math.min(client.arrive - MIN_FLIGHT, needEndAt(client) - MIN_FLIGHT);
          client.appear = clampOrdered(value, 0, maxStart);
          if (client.dispatch < client.appear) client.dispatch = client.appear;
          if (client.arrive < client.dispatch + MIN_FLIGHT) {
            client.arrive = Math.min(1, client.dispatch + MIN_FLIGHT);
          }
          if (needEndAt(client) < client.appear + 0.01) client.needEnd = Math.min(1, client.appear + 0.01);
          params.start = client.appear;
          params.end = needEndAt(client);
          startCtrl.updateDisplay();
          endCtrl.updateDisplay();
          this.seekStory(client.appear);
          this.notifyTimingChanged();
        });
      const endCtrl = folder
        .add(params, 'end', 0, 1, 0.01)
        .name('End')
        .onChange((value: number) => {
          client.needEnd = clampOrdered(value, client.appear + 0.01, 1);
          params.end = needEndAt(client);
          endCtrl.updateDisplay();
          this.seekStory(client.needEnd);
          this.notifyTimingChanged();
        });
      const pos = {
        x: client.needOffset?.[0] ?? 0,
        y: client.needOffset?.[1] ?? 0,
        z: client.needOffset?.[2] ?? 0,
      };
      const writeNeedPos = () => {
        client.needOffset = [pos.x, pos.y, pos.z];
        this.seekStory(Math.min(0.99, client.appear + 0.02));
      };
      folder.add(pos, 'x', -8, 8, 0.05).name('Position X').onChange(writeNeedPos);
      folder.add(pos, 'y', -6, 8, 0.05).name('Position Y').onChange(writeNeedPos);
      folder.add(pos, 'z', -8, 8, 0.05).name('Position Z').onChange(writeNeedPos);
      needTimeRows.push({ client, params, startCtrl, endCtrl });
    });
    this.refreshNeedTimes = () => {
      needTimeRows.forEach((row) => {
        row.params.start = row.client.appear;
        row.params.end = needEndAt(row.client);
        row.startCtrl.updateDisplay();
        row.endCtrl.updateDisplay();
      });
    };

    const chapterFolder = this.addTab('Chapter panel');
    const timelineParams = {
      align: FLOW_CHROME.align,
      dir: FLOW_CHROME.dir,
      titleColor: hex(FLOW_CHROME.titleColor),
      numberColor: hex(FLOW_CHROME.numberColor),
      numberActiveColor: hex(FLOW_CHROME.numberActiveColor),
      numberBg: hex(FLOW_CHROME.numberBg),
      descriptionColor: hex(FLOW_CHROME.descriptionColor),
      trackColor: hex(FLOW_CHROME.trackColor),
      trackFillColor: hex(FLOW_CHROME.trackFillColor),
    };
    chapterFolder
      .add(timelineParams, 'align', ['left', 'right'])
      .name('Position')
      .onChange((value: 'left' | 'right') => {
        FLOW_CHROME.align = value;
        applyFlowChrome();
      });
    chapterFolder
      .add(timelineParams, 'dir', ['ltr', 'rtl'])
      .name('Direction')
      .onChange((value: 'ltr' | 'rtl') => {
        FLOW_CHROME.dir = value;
        applyFlowChrome();
      });
    const applyTimelineColor = (key: 'titleColor' | 'numberColor' | 'numberActiveColor' | 'numberBg' | 'descriptionColor' | 'trackColor' | 'trackFillColor', value: string) => {
      FLOW_CHROME[key] = new THREE.Color(value).getHex();
      applyFlowChrome();
    };
    chapterFolder.addColor(timelineParams, 'titleColor').name('Title color').onChange((value: string) => applyTimelineColor('titleColor', value));
    chapterFolder.addColor(timelineParams, 'numberColor').name('Number color').onChange((value: string) => applyTimelineColor('numberColor', value));
    chapterFolder.addColor(timelineParams, 'numberActiveColor').name('Active number color').onChange((value: string) => applyTimelineColor('numberActiveColor', value));
    chapterFolder.addColor(timelineParams, 'numberBg').name('Number background').onChange((value: string) => applyTimelineColor('numberBg', value));
    chapterFolder.addColor(timelineParams, 'descriptionColor').name('Description color').onChange((value: string) => applyTimelineColor('descriptionColor', value));
    chapterFolder.addColor(timelineParams, 'trackColor').name('Track color').onChange((value: string) => applyTimelineColor('trackColor', value));
    chapterFolder.addColor(timelineParams, 'trackFillColor').name('Track fill color').onChange((value: string) => applyTimelineColor('trackFillColor', value));
    const chapterBg = {
      titleBg: hex(FLOW_CHROME.titleBg ?? 0x0c0d12),
      titleBgOpacity: FLOW_CHROME.titleBgOpacity ?? 0,
      descriptionBg: hex(FLOW_CHROME.descriptionBg ?? 0x0c0d12),
      descriptionBgOpacity: FLOW_CHROME.descriptionBgOpacity ?? 0,
    };
    chapterFolder.addColor(chapterBg, 'titleBg').name('Title background').onChange((value: string) => {
      FLOW_CHROME.titleBg = new THREE.Color(value).getHex();
      applyFlowChrome();
    });
    chapterFolder.add(chapterBg, 'titleBgOpacity', 0, 1, 0.01).name('Title background opacity').onChange((value: number) => {
      FLOW_CHROME.titleBgOpacity = value;
      applyFlowChrome();
    });
    chapterFolder.addColor(chapterBg, 'descriptionBg').name('Description background').onChange((value: string) => {
      FLOW_CHROME.descriptionBg = new THREE.Color(value).getHex();
      applyFlowChrome();
    });
    chapterFolder.add(chapterBg, 'descriptionBgOpacity', 0, 1, 0.01).name('Description background opacity').onChange((value: number) => {
      FLOW_CHROME.descriptionBgOpacity = value;
      applyFlowChrome();
    });
    this.addTypeControls(chapterFolder, TYPE_CHROME.flowTitle, hex, 'Title');
    this.addTypeControls(chapterFolder, TYPE_CHROME.flowDescription, hex, 'Description');
    this.addTypeControls(chapterFolder, TYPE_CHROME.flowNumber, hex, 'Number');

    const titlesFolder = chapterFolder;
    FLOW_CONFIG.forEach((step, index) => {
      const folder = titlesFolder.addFolder(`${step.num} ${step.title}`);
      const params = {
        title: step.title,
        subtitle: step.subtitle,
        caption: step.caption,
      };
      folder.add(params, 'title').name('Title').onChange((value: string) => {
        step.title = value;
        syncFlowDom();
      });
      folder.add(params, 'subtitle').name('Subtitle').onChange((value: string) => {
        step.subtitle = value;
        syncFlowDom();
      });
      folder.add(params, 'caption').name('Description').onChange((value: string) => {
        step.caption = value;
        syncFlowDom();
      });
      void index;
    });
  }

  private seekStory(t: number) {
    this.playheadT = clamp01(t);
    this.onProgressChange?.(this.playheadT);
  }

  private onStoryFrame = (event: Event) => {
    const detail = (event as CustomEvent<StoryFrame>).detail;
    if (!detail || typeof detail.t !== 'number') return;
    this.playheadT = detail.t;
  };

  private populateStoryTiming() {
    if (!this.gui) return;

    const root = this.addTab('Story Timing');

    const playhead = { t: this.playheadT };
    root
      .add(playhead, 't', 0, 1, 0.01)
      .name('Playhead')
      .listen()
      .onChange((value: number) => {
        this.seekStory(value);
      });

    const cameraFolder = root;
    const cameraPoints = this.activeCameraPoints();
    SCENE_CONFIG.cameraMethod === 'progress' && cameraPoints.length
      ? root.add({ info: 'Use the bottom timeline to add or drag keyframes' }, 'info').name('Progress mode')
      : undefined;
    cameraPoints.forEach((stop, index) => {
      const row = { progress: stop.progress };
      const ctrl = cameraFolder
        .add(row, 'progress', 0, 1, 0.01)
        .name(`${index + 1}. ${stop.id}`)
        .listen()
        .onChange((value: number) => {
          const prev = index > 0 ? cameraPoints[index - 1].progress : 0;
          const next = index < cameraPoints.length - 1 ? cameraPoints[index + 1].progress : 1;
          const clamped = clampOrdered(value, prev, next);
          row.progress = clamped;
          stop.progress = clamped;
          ctrl.updateDisplay();
          this.seekStory(clamped);
          this.notifyTimingChanged();
        });
    });

    const timelineFolder = root;
    const stepCtrls: Array<{ refresh: () => void }> = [];
    const refreshTimelineSteps = () => {
      stepCtrls.forEach((item) => item.refresh());
    };
    FLOW_CONFIG.forEach((step, index) => {
      const folder = timelineFolder.addFolder(`${step.num} ${step.title}`);
      const row = {
        start: step.progressRange[0],
        end: step.progressRange[1],
        preview: () => this.seekStory(step.progressRange[0]),
      };
      const startCtrl = folder
        .add(row, 'start', 0, 1, 0.01)
        .name('Active from')
        .onChange((value: number) => {
          const prevStart = index > 0 ? FLOW_CONFIG[index - 1].progressRange[0] + 0.01 : 0;
          const maxStart = step.progressRange[1] - 0.01;
          const next = clampOrdered(value, prevStart, maxStart);
          step.progressRange[0] = next;
          if (index > 0) FLOW_CONFIG[index - 1].progressRange[1] = next;
          refreshTimelineSteps();
          this.seekStory(next);
          this.notifyTimingChanged();
        });
      const endCtrl = folder
        .add(row, 'end', 0, 1, 0.01)
        .name('Active until')
        .onChange((value: number) => {
          const minEnd = step.progressRange[0] + 0.01;
          const nextLimit =
            index < FLOW_CONFIG.length - 1 ? FLOW_CONFIG[index + 1].progressRange[1] - 0.01 : 1;
          const next = clampOrdered(value, minEnd, nextLimit);
          step.progressRange[1] = next;
          if (index < FLOW_CONFIG.length - 1) FLOW_CONFIG[index + 1].progressRange[0] = next;
          refreshTimelineSteps();
          this.seekStory(next);
          this.notifyTimingChanged();
        });
      folder.add(row, 'preview').name('Preview this step');
      stepCtrls.push({
        refresh: () => {
          row.start = step.progressRange[0];
          row.end = step.progressRange[1];
          startCtrl.updateDisplay();
          endCtrl.updateDisplay();
        },
      });
    });

    const beatsFolder = root;

    STORY_CONFIG.clients.forEach((client) => {
      const folder = beatsFolder.addFolder(storyBuildingLabel(client));
      const row = {
        appear: client.appear,
        dispatch: client.dispatch,
        arrive: client.arrive,
        flight: Math.max(MIN_FLIGHT, client.arrive - client.dispatch),
        previewRequest: () => this.seekStory(client.appear),
        previewShooting: () => this.seekStory(client.dispatch),
        previewArrive: () => this.seekStory(client.arrive),
        previewBurst: () => this.seekStory(client.arrive + (STORY_CONFIG.burstDelay ?? 0.045)),
      };

      const syncRow = () => {
        row.appear = client.appear;
        row.dispatch = client.dispatch;
        row.arrive = client.arrive;
        row.flight = Math.max(MIN_FLIGHT, client.arrive - client.dispatch);
        appearCtrl.updateDisplay();
        dispatchCtrl.updateDisplay();
        arriveCtrl.updateDisplay();
        flightCtrl.updateDisplay();
      };

      const appearCtrl = folder
        .add(row, 'appear', 0, 1, 0.01)
        .name('Request starts')
        .onChange((value: number) => {
          client.appear = clampOrdered(value, 0, client.arrive - MIN_FLIGHT);
          if (client.dispatch < client.appear) client.dispatch = client.appear;
          if (client.arrive < client.dispatch + MIN_FLIGHT) {
            client.arrive = Math.min(1, client.dispatch + MIN_FLIGHT);
          }
          syncRow();
          this.seekStory(client.appear);
          this.notifyTimingChanged();
        });

      const dispatchCtrl = folder
        .add(row, 'dispatch', 0, 1, 0.01)
        .name('Shooting starts')
        .onChange((value: number) => {
          client.dispatch = clampOrdered(value, client.appear, client.arrive - MIN_FLIGHT);
          syncRow();
          this.seekStory(client.dispatch);
          this.notifyTimingChanged();
        });

      const arriveCtrl = folder
        .add(row, 'arrive', 0, 1, 0.01)
        .name('Solved starts')
        .onChange((value: number) => {
          client.arrive = clampOrdered(value, client.dispatch + MIN_FLIGHT, 1);
          syncRow();
          this.seekStory(client.arrive);
          this.notifyTimingChanged();
        });

      const flightCtrl = folder
        .add(row, 'flight', MIN_FLIGHT, 0.4, 0.01)
        .name('Flight duration')
        .onChange((value: number) => {
          const duration = clampOrdered(value, MIN_FLIGHT, 1 - client.dispatch);
          client.arrive = client.dispatch + duration;
          syncRow();
          this.seekStory(client.arrive);
          this.notifyTimingChanged();
        });

      folder.add(row, 'previewRequest').name('Preview — Request');
      folder.add(row, 'previewShooting').name('Preview — Shooting');
      folder.add(row, 'previewArrive').name('Preview — Solved');
      folder.add(row, 'previewBurst').name('Preview — explosion');
    });

    const hold = {
      chipHoldAfterArrive: STORY_CONFIG.chipHoldAfterArrive,
    };
    root
      .add(hold, 'chipHoldAfterArrive', 0, 0.4, 0.01)
      .name('Needs hold after arrive')
      .onChange((value: number) => {
        STORY_CONFIG.chipHoldAfterArrive = clamp01(value);
        this.notifyTimingChanged();
      });
  }

  private populateShootingLogo() {
    if (!this.gui) return;
    const hex = (value: number) => '#' + new THREE.Color(value).getHexString();
    const root = this.addTab('Shooting logo');

    const colorParams = {
      packet: hex(STORY_CONFIG.colors.packet),
      packetBounce: hex(STORY_CONFIG.colors.packetBounce ?? STORY_CONFIG.colors.packet),
      packetCore: hex(STORY_CONFIG.colors.packetCore ?? STORY_CONFIG.colors.packet),
      packetInner: hex(STORY_CONFIG.colors.packetInner ?? STORY_CONFIG.colors.packet),
      packetOuter: hex(STORY_CONFIG.colors.packetOuter ?? STORY_CONFIG.colors.packet),
      packetSpark: hex(STORY_CONFIG.colors.packetSpark ?? STORY_CONFIG.colors.packet),
    };
    const applyColor = (key: keyof typeof colorParams, value: string) => {
      STORY_CONFIG.colors[key] = new THREE.Color(value).getHex();
    };
    root.addColor(colorParams, 'packet').name('Trail color').onChange((v: string) => applyColor('packet', v));
    root.addColor(colorParams, 'packetCore').name('Core color').onChange((v: string) => applyColor('packetCore', v));
    root.addColor(colorParams, 'packetInner').name('Inner glow').onChange((v: string) => applyColor('packetInner', v));
    root.addColor(colorParams, 'packetOuter').name('Outer glow').onChange((v: string) => applyColor('packetOuter', v));
    root.addColor(colorParams, 'packetSpark').name('Spark color').onChange((v: string) => applyColor('packetSpark', v));
    root.addColor(colorParams, 'packetBounce').name('Reflection color').onChange((v: string) => applyColor('packetBounce', v));

    const lookParams = {
      packetIntensity: STORY_CONFIG.packetIntensity ?? 260,
      packetDistance: STORY_CONFIG.packetDistance ?? 9,
      packetGlow: STORY_CONFIG.packetGlow ?? 1,
      packetGlowSize: STORY_CONFIG.packetGlowSize ?? 0.22,
      packetCoreSize: STORY_CONFIG.packetCoreSize ?? 0.07,
      packetTrail: STORY_CONFIG.packetTrail ?? 0.7,
    };
    root.add(lookParams, 'packetIntensity', 0, 800, 5).name('Reflection').onChange((value: number) => {
      STORY_CONFIG.packetIntensity = value;
    });
    root.add(lookParams, 'packetDistance', 0.5, 20, 0.1).name('Reach').onChange((value: number) => {
      STORY_CONFIG.packetDistance = value;
    });
    root.add(lookParams, 'packetGlow', 0, 2, 0.05).name('Glow').onChange((value: number) => {
      STORY_CONFIG.packetGlow = value;
    });
    root.add(lookParams, 'packetGlowSize', 0.04, 0.8, 0.01).name('Glow size').onChange((value: number) => {
      STORY_CONFIG.packetGlowSize = value;
    });
    root.add(lookParams, 'packetCoreSize', 0.02, 0.8, 0.005).name('Logo size').onChange((value: number) => {
      STORY_CONFIG.packetCoreSize = value;
    });
    root.add(lookParams, 'packetTrail', 0, 1, 0.02).name('Trail').onChange((value: number) => {
      STORY_CONFIG.packetTrail = value;
    });

    const burstFolder = root;
    const burstParams = {
      burstDelay: STORY_CONFIG.burstDelay ?? 0.045,
      burstSpan: STORY_CONFIG.burstSpan ?? 0.06,
      burstLight: STORY_CONFIG.burstLight ?? 3.2,
      burstLightRadius: STORY_CONFIG.burstLightRadius ?? 10,
      burstSize: STORY_CONFIG.burstSize ?? 1,
      burstExposure: STORY_CONFIG.burstExposure ?? 1,
      burstSparks: STORY_CONFIG.burstSparks ?? 1,
    };
    burstFolder.add(burstParams, 'burstDelay', 0, 0.16, 0.005).name('Delay after hit').onChange((value: number) => {
      STORY_CONFIG.burstDelay = value;
    });
    burstFolder.add(burstParams, 'burstSpan', 0.015, 0.16, 0.005).name('Explosion duration').onChange((value: number) => {
      STORY_CONFIG.burstSpan = value;
    });
    burstFolder.add(burstParams, 'burstLight', 0, 8, 0.05).name('Explosion light amount').onChange((value: number) => {
      STORY_CONFIG.burstLight = value;
    });
    burstFolder
      .add(burstParams, 'burstLightRadius', 0.5, 30, 0.1)
      .name('Explosion reflection reach')
      .onChange((value: number) => {
        STORY_CONFIG.burstLightRadius = value;
      });
    burstFolder.add(burstParams, 'burstSize', 0.2, 3, 0.05).name('Explosion flare size').onChange((value: number) => {
      STORY_CONFIG.burstSize = value;
    });
    burstFolder.add(burstParams, 'burstExposure', 0, 3, 0.05).name('Explosion exposure').onChange((value: number) => {
      STORY_CONFIG.burstExposure = value;
    });
    burstFolder.add(burstParams, 'burstSparks', 0, 2, 0.05).name('Explosion sparks').onChange((value: number) => {
      STORY_CONFIG.burstSparks = value;
    });

    STORY_CONFIG.clients.forEach((client) => {
      const folder = root.addFolder(storyBuildingLabel(client));
      const row = {
        startX: client.launch?.[0] ?? 0,
        startY: client.launch?.[1] ?? 0,
        startZ: client.launch?.[2] ?? 0,
        endX: client.land?.[0] ?? 0,
        endY: client.land?.[1] ?? 0,
        endZ: client.land?.[2] ?? 0,
        previewStart: () => this.seekStory(client.dispatch),
        previewEnd: () => this.seekStory(client.arrive),
        previewBurst: () => this.seekStory(client.arrive + (STORY_CONFIG.burstDelay ?? 0.045)),
      };
      const writeStart = () => {
        client.launch = [row.startX, row.startY, row.startZ];
      };
      const writeEnd = () => {
        client.land = [row.endX, row.endY, row.endZ];
      };
      folder.add(row, 'startX', -12, 12, 0.01).name('Start X').onChange(writeStart);
      folder.add(row, 'startY', -8, 12, 0.01).name('Start Y').onChange(writeStart);
      folder.add(row, 'startZ', -12, 12, 0.01).name('Start Z').onChange(writeStart);
      folder.add(row, 'endX', -12, 12, 0.01).name('End X').onChange(writeEnd);
      folder.add(row, 'endY', -8, 12, 0.01).name('End Y').onChange(writeEnd);
      folder.add(row, 'endZ', -12, 12, 0.01).name('End Z').onChange(writeEnd);
      folder.add(row, 'previewStart').name('Preview — start');
      folder.add(row, 'previewEnd').name('Preview — end');
      folder.add(row, 'previewBurst').name('Preview — explosion');
    });
  }

  private populateLoadingScreen() {
    if (!this.gui) return;
    const hex = (value: number) => '#' + new THREE.Color(value).getHexString();
    const root = this.addTab('Loading screen');
    applyLoaderChrome();

    const cfg = LOADER_CONFIG;
    const params = {
      title: cfg.title,
      subtitle: cfg.subtitle,
      dir: cfg.dir,
      logoSide: cfg.logoSide === 'right' ? 'right' : 'left',
      showLogo: cfg.showLogo,
      showTitle: cfg.showTitle,
      showSubtitle: cfg.showSubtitle,
      showBar: cfg.showBar,
      copyAlign: cfg.copyAlign === 'center' || cfg.copyAlign === 'end' ? cfg.copyAlign : 'start',
      logoSize: cfg.logoSize,
      rowGap: cfg.rowGap,
      copyGap: cfg.copyGap,
      stackGap: cfg.stackGap,
      titleSize: cfg.titleSize,
      titleWeight: cfg.titleWeight,
      titleColor: hex(cfg.titleColor),
      titleTracking: cfg.titleTracking,
      subtitleSize: cfg.subtitleSize,
      subtitleWeight: cfg.subtitleWeight,
      subtitleColor: hex(cfg.subtitleColor),
      subtitleTracking: cfg.subtitleTracking,
      barWidth: cfg.barWidth,
      barHeight: cfg.barHeight,
      barColor: hex(cfg.barColor),
      trackColor: hex(cfg.trackColor),
      trackOpacity: cfg.trackOpacity,
      bgColor: hex(cfg.bgColor),
      preview: () => previewLoader(true),
      hidePreview: () => previewLoader(false),
    };

    const push = () => {
      cfg.title = params.title;
      cfg.subtitle = params.subtitle;
      cfg.dir = params.dir === 'ltr' ? 'ltr' : 'rtl';
      cfg.logoSide = params.logoSide === 'right' ? 'right' : 'left';
      cfg.showLogo = params.showLogo;
      cfg.showTitle = params.showTitle;
      cfg.showSubtitle = params.showSubtitle;
      cfg.showBar = params.showBar;
      cfg.copyAlign =
        params.copyAlign === 'center' || params.copyAlign === 'end' ? params.copyAlign : 'start';
      cfg.logoSize = params.logoSize;
      cfg.rowGap = params.rowGap;
      cfg.copyGap = params.copyGap;
      cfg.stackGap = params.stackGap;
      cfg.titleSize = params.titleSize;
      cfg.titleWeight = Number(params.titleWeight);
      cfg.titleColor = new THREE.Color(params.titleColor).getHex();
      cfg.titleTracking = params.titleTracking;
      cfg.subtitleSize = params.subtitleSize;
      cfg.subtitleWeight = Number(params.subtitleWeight);
      cfg.subtitleColor = new THREE.Color(params.subtitleColor).getHex();
      cfg.subtitleTracking = params.subtitleTracking;
      cfg.barWidth = params.barWidth;
      cfg.barHeight = params.barHeight;
      cfg.barColor = new THREE.Color(params.barColor).getHex();
      cfg.trackColor = new THREE.Color(params.trackColor).getHex();
      cfg.trackOpacity = params.trackOpacity;
      cfg.bgColor = new THREE.Color(params.bgColor).getHex();
      notifyLoaderChanged();
      previewLoader(true);
    };

    root.add(params, 'preview').name('Preview');
    root.add(params, 'hidePreview').name('Hide preview');
    root.addColor(params, 'bgColor').name('Background').onChange(push);
    root.add(params, 'dir', { RTL: 'rtl', LTR: 'ltr' }).name('Direction').onChange(push);

    const brand = root;
    brand.add(params, 'showLogo').name('Show logo').onChange(push);
    brand.add(params, 'logoSide', { Left: 'left', Right: 'right' }).name('Logo side').onChange(push);
    brand.add(params, 'logoSize', 24, 160, 1).name('Logo size').onChange(push);
    brand.add(params, 'rowGap', 0, 48, 1).name('Logo gap').onChange(push);
    brand.add(params, 'showTitle').name('Show title').onChange(push);
    brand.add(params, 'title').name('Title').onChange(push);
    brand.add(params, 'titleSize', 10, 72, 1).name('Title size').onChange(push);
    brand.add(params, 'titleWeight', TYPE_WEIGHTS).name('Title weight').onChange(push);
    brand.addColor(params, 'titleColor').name('Title color').onChange(push);
    brand.add(params, 'titleTracking', -8, 8, 0.1).name('Title spacing').onChange(push);
    brand.add(params, 'showSubtitle').name('Show subtitle').onChange(push);
    brand.add(params, 'subtitle').name('Subtitle').onChange(push);
    brand.add(params, 'subtitleSize', 8, 40, 1).name('Subtitle size').onChange(push);
    brand.add(params, 'subtitleWeight', TYPE_WEIGHTS).name('Subtitle weight').onChange(push);
    brand.addColor(params, 'subtitleColor').name('Subtitle color').onChange(push);
    brand.add(params, 'subtitleTracking', -4, 8, 0.1).name('Subtitle spacing').onChange(push);
    brand.add(params, 'copyGap', 0, 24, 1).name('Title / subtitle gap').onChange(push);
    brand
      .add(params, 'copyAlign', { Start: 'start', Center: 'center', End: 'end' })
      .name('Title / subtitle align')
      .onChange(push);

    const bar = root;
    bar.add(params, 'showBar').name('Show bar').onChange(push);
    bar.add(params, 'barWidth', 80, 480, 4).name('Bar width').onChange(push);
    bar.add(params, 'barHeight', 1, 12, 1).name('Bar height').onChange(push);
    bar.addColor(params, 'barColor').name('Bar color').onChange(push);
    bar.addColor(params, 'trackColor').name('Track color').onChange(push);
    bar.add(params, 'trackOpacity', 0, 1, 0.01).name('Track opacity').onChange(push);
    bar.add(params, 'stackGap', 4, 48, 1).name('Bar gap').onChange(push);
  }

  private populateBuildingNames() {
    if (!this.gui) return;
    const hex = (value: number) => '#' + new THREE.Color(value).getHexString();
    const sides = { Front: 'front', Back: 'back', Left: 'left', Right: 'right' };
    const root = this.addTab('Building Names');
    BUILDING_NAMES.forEach((plate, index) => {
      const folder = root.addFolder(`${index + 1}. ${plate.text || plate.building}`);
      const row = {
        text: plate.text,
        size: plate.size,
        color: hex(plate.color),
        side: plate.side || 'front',
        posX: plate.position[0],
        posY: plate.position[1],
        posZ: plate.position[2],
        rotX: plate.rotation?.[0] ?? 0,
        rotY: plate.rotation?.[1] ?? 0,
        rotZ: plate.rotation?.[2] ?? 0,
        extrude: plate.extrude,
      };
      const push = () => {
        plate.text = row.text;
        plate.size = row.size;
        plate.color = new THREE.Color(row.color).getHex();
        plate.side = row.side === 'back' || row.side === 'left' || row.side === 'right' ? row.side : 'front';
        plate.position = [row.posX, row.posY, row.posZ];
        plate.rotation = [row.rotX, row.rotY, row.rotZ];
        plate.extrude = row.extrude;
        notifyBuildingNamesChanged();
      };
      folder.add(row, 'text').name('Text').onChange(push);
      folder.add(row, 'size', 0.02, 1.2, 0.005).name('Size').onChange(push);
      folder.addColor(row, 'color').name('Color').onChange(push);
      folder.add(row, 'side', sides).name('Side').onChange(push);
      folder.add(row, 'posX', -4, 4, 0.02).name('Position X').onChange(push);
      folder.add(row, 'posY', -3, 4, 0.02).name('Position Y').onChange(push);
      folder.add(row, 'posZ', -2, 2, 0.01).name('Position Z').onChange(push);
      folder.add(row, 'rotX', -180, 180, 1).name('Rotation X').onChange(push);
      folder.add(row, 'rotY', -180, 180, 1).name('Rotation Y').onChange(push);
      folder.add(row, 'rotZ', -180, 180, 1).name('Rotation Z').onChange(push);
      folder.add(row, 'extrude', 0.002, 0.28, 0.001).name('Extrude').onChange(push);
    });
  }

  public populateLightsAndShadows() {
    if (!this.gui || this.lightsFolderPopulated) return;
    this.lightsFolderPopulated = true;

    const lightFolder = this.addTab('Lighting Controller');

    const view = {
      showGizmos: this.showLightGizmos,
      grabLamps: this.grabMode,
    };
    lightFolder
      .add(view, 'showGizmos')
      .name('Show lamp gizmos')
      .onChange((value: boolean) => {
        this.showLightGizmos = value;
        this.syncGizmoVisibility();
      });
    lightFolder
      .add(view, 'grabLamps')
      .name('Move lamps in scene')
      .onChange((value: boolean) => {
        this.setGrabMode(value);
      });
    const filterParams = { filter: filterFromRenderer(this.renderer) };
    lightFolder
      .add(filterParams, 'filter', { Soft: 'pcfsoft', PCF: 'pcf', Sharp: 'basic' })
      .name('Shadow filter')
      .onChange((value: ShadowFilter) => {
        const next = resolveShadowFilter(value);
        SCENE_CONFIG.renderer.shadowMapType = next;
        applyRendererShadowFilter(this.renderer, next);
        this.broadcastLive();
      });

    for (const [id, light] of this.lightsMap.entries()) {
      const sub = lightFolder.addFolder(id);
      const isPt = isPointLight(light);
      const isSpot = isSpotLight(light);
      const isArea = isAreaLight(light);
      const area = light as THREE.RectAreaLight;
      const look = (isArea
        ? ((area.userData.lookTarget as [number, number, number] | undefined) || [area.position.x, 0, area.position.z])
        : [0, 0, 0]) as [number, number, number];

      const lightParams = {
        enabled: light.visible !== false,
        type: light.type,
        intensity: light.intensity,
        color: '#' + light.color.getHexString(),
        posX: light.position ? light.position.x : 0,
        posY: light.position ? light.position.y : 0,
        posZ: light.position ? light.position.z : 0,
        distance: (light as THREE.PointLight).distance ?? 40,
        decay: (light as THREE.PointLight).decay ?? 1.8,
        width: isArea ? area.width : 6,
        height: isArea ? area.height : 6,
        aimX: look[0],
        aimY: look[1],
        aimZ: look[2],
      };

      const persistLight = () => {
        const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
        if (!cfg) return;
        cfg.enabled = light.visible !== false;
        cfg.intensity = light.intensity;
        cfg.color = colorToHexNumber(light.color);
        if (light.position) {
          cfg.position = [light.position.x, light.position.y, light.position.z];
        }
        if (isPt || isSpot) {
          cfg.distance = (light as THREE.PointLight).distance;
          cfg.decay = (light as THREE.PointLight).decay;
        }
        if (isArea) {
          cfg.type = 'rectarea';
          cfg.width = area.width;
          cfg.height = area.height;
          const aim = (area.userData.lookTarget as [number, number, number]) || [area.position.x, 0, area.position.z];
          cfg.target = [aim[0], aim[1], aim[2]];
        }
        cfg.castShadow = light.castShadow;
        const sh = (light as THREE.Light & { shadow?: THREE.LightShadow }).shadow;
        if (sh) {
          cfg.radius = sh.radius;
          cfg.shadowBias = sh.bias;
          cfg.shadowNormalBias = sh.normalBias;
          cfg.shadowMapSize = sh.mapSize?.width;
          const cam = sh.camera as THREE.PerspectiveCamera | undefined;
          if (cam) {
            cfg.shadowNear = cam.near;
            cfg.shadowFar = cam.far;
          }
          if ('intensity' in sh) {
            cfg.shadowIntensity = (sh as THREE.LightShadow & { intensity: number }).intensity;
          }
        }
        this.broadcastLive();
      };

      const pullFromLight = () => {
        lightParams.enabled = light.visible !== false;
        lightParams.intensity = light.intensity;
        lightParams.color = '#' + light.color.getHexString();
        if (light.position) {
          lightParams.posX = light.position.x;
          lightParams.posY = light.position.y;
          lightParams.posZ = light.position.z;
        }
        if (isArea) {
          lightParams.width = area.width;
          lightParams.height = area.height;
          const aim = (area.userData.lookTarget as [number, number, number]) || [area.position.x, 0, area.position.z];
          lightParams.aimX = aim[0];
          lightParams.aimY = aim[1];
          lightParams.aimZ = aim[2];
        }
      };

      this.lightUi.set(id, { params: lightParams, persist: persistLight, pullFromLight });

      sub
        .add(lightParams, 'enabled')
        .name('On')
        .listen()
        .onChange((value: boolean) => {
          light.visible = value;
          persistLight();
        });

      if (isArea) {
        sub
          .add(lightParams, 'intensity', 0, 200, 0.1)
          .name('Power / Intensity')
          .listen()
          .onChange((v: number) => {
            light.intensity = v;
            persistLight();
          });
      } else {
        sub
          .add(lightParams, 'intensity', 0, 5000, 10)
          .name('Power / Intensity')
          .listen()
          .onChange((v: number) => {
            light.intensity = v;
            persistLight();
          });
      }

      sub
        .addColor(lightParams, 'color')
        .name('Color')
        .listen()
        .onChange((v: string) => {
          light.color.set(v);
          persistLight();
        });

      if (light.position) {
        const updateLightPos = () => {
          light.position.set(lightParams.posX, lightParams.posY, lightParams.posZ);
          light.updateMatrix();
          light.updateMatrixWorld(true);

          const targeted = light as THREE.DirectionalLight;
          if (targeted.target) {
            targeted.target.updateMatrixWorld(true);
          }
          if (isArea) {
            const aim = (area.userData.lookTarget as [number, number, number]) || [area.position.x, 0, area.position.z];
            area.lookAt(aim[0], aim[1], aim[2]);
          }

          const sh = (light as THREE.Light & { shadow?: THREE.LightShadow }).shadow;
          if (sh) {
            sh.needsUpdate = true;
            if (sh.camera) {
              sh.camera.updateMatrixWorld(true);
              const shadowCam = sh.camera as THREE.PerspectiveCamera;
              if (typeof shadowCam.updateProjectionMatrix === 'function') {
                shadowCam.updateProjectionMatrix();
              }
            }
          }
          this.renderer.shadowMap.needsUpdate = true;
          persistLight();
        };

        sub.add(lightParams, 'posX', -100, 100, 0.5).name('Position X').listen().onChange(updateLightPos);
        sub.add(lightParams, 'posY', -10, 100, 0.5).name('Position Y').listen().onChange(updateLightPos);
        sub.add(lightParams, 'posZ', -100, 100, 0.5).name('Position Z').listen().onChange(updateLightPos);
      }

      if (isArea) {
        const aimArea = () => {
          const aim: [number, number, number] = [lightParams.aimX, lightParams.aimY, lightParams.aimZ];
          area.userData.lookTarget = aim;
          area.lookAt(aim[0], aim[1], aim[2]);
          persistLight();
        };
        sub
          .add(lightParams, 'width', 0.2, 80, 0.1)
          .name('Lamp width')
          .listen()
          .onChange((v: number) => {
            area.width = v;
            persistLight();
          });
        sub
          .add(lightParams, 'height', 0.2, 80, 0.1)
          .name('Lamp height')
          .listen()
          .onChange((v: number) => {
            area.height = v;
            persistLight();
          });
        sub.add(lightParams, 'aimX', -80, 80, 0.5).name('Aim X').listen().onChange(aimArea);
        sub.add(lightParams, 'aimY', -10, 40, 0.5).name('Aim Y').listen().onChange(aimArea);
        sub.add(lightParams, 'aimZ', -80, 80, 0.5).name('Aim Z').listen().onChange(aimArea);
      }

      if (isPt || isSpot) {
        sub
          .add(lightParams, 'distance', 0, 800, 0.1)
          .name('Distance Falloff')
          .listen()
          .onChange((v: number) => {
            (light as THREE.PointLight).distance = v;
            persistLight();
          });

        sub
          .add(lightParams, 'decay', 0, 8, 0.05)
          .name('Decay Exponent')
          .listen()
          .onChange((v: number) => {
            (light as THREE.PointLight).decay = v;
            persistLight();
          });
      }

      if (isArea) continue;

      const shadowSub = sub;
      const sh = (light as THREE.Light & { shadow?: THREE.LightShadow }).shadow;
      const cam = sh?.camera as THREE.PerspectiveCamera | undefined;
      const ranged = light as THREE.PointLight;
      const shadowParams = {
        castShadow: light.castShadow ?? true,
        radius: sh ? sh.radius ?? 2.27 : 2.27,
        bias: sh ? sh.bias ?? 0 : 0,
        normalBias: sh ? sh.normalBias ?? (Math.abs(sh.bias) < 1e-8 ? 0.04 : 0) : 0.04,
        intensity: sh && 'intensity' in sh ? (sh as THREE.LightShadow & { intensity: number }).intensity : 1,
        near: cam?.near ?? 0.5,
        far: cam?.far ?? (ranged.distance > 0 ? ranged.distance : 80),
        mapSize: sh?.mapSize?.width ?? 1024,
      };

      const writeShadow = () => {
        light.castShadow = shadowParams.castShadow;
        applyLightShadow(light, {
          shadowMapSize: shadowParams.mapSize,
          shadowBias: shadowParams.bias,
          shadowNormalBias: shadowParams.normalBias,
          shadowNear: shadowParams.near,
          shadowFar: shadowParams.far,
          shadowIntensity: shadowParams.intensity,
          radius: shadowParams.radius,
          distance: ranged.distance,
        });
        this.renderer.shadowMap.needsUpdate = true;
        persistLight();
      };

      shadowSub.add(shadowParams, 'castShadow').name('Enable Shadows').listen().onChange(writeShadow);
      shadowSub.add(shadowParams, 'radius', 0, 32, 0.1).name('Soft Shadow Radius').listen().onChange(writeShadow);
      shadowSub.add(shadowParams, 'bias', -0.02, 0.02, 0.0001).name('Shadow Bias').listen().onChange(writeShadow);
      shadowSub.add(shadowParams, 'normalBias', 0, 0.2, 0.001).name('Normal bias').listen().onChange(writeShadow);
      shadowSub.add(shadowParams, 'intensity', 0, 2, 0.02).name('Shadow strength').listen().onChange(writeShadow);
      shadowSub.add(shadowParams, 'near', 0.05, 8, 0.05).name('Shadow near').listen().onChange(writeShadow);
      shadowSub.add(shadowParams, 'far', 8, 250, 1).name('Shadow far').listen().onChange(writeShadow);
      shadowSub
        .add(shadowParams, 'mapSize', [512, 1024, 2048, 4096])
        .name('Shadow Resolution')
        .onChange((v: number) => {
          shadowParams.mapSize = parseInt(String(v), 10);
          writeShadow();
        });
    }
  }

  public populateMaterials() {
    if (!this.gui || this.materialsFolderPopulated) return;

    const worldGroup = this.worldGroupSupplier();
    if (!worldGroup) return;

    const liveGroups = () => collectCategoryGroups(worldGroup);
    const groups = liveGroups();
    const seed = (key: keyof typeof this.palette, category: Exclude<MaterialCategory, 'ignore'>) => {
      const live = sampleCategoryColor(groups[category]);
      if (live === undefined) return;
      const already = resolvePalette(SCENE_CONFIG.materials);
      const named = `${category}Color` as keyof CategoryPalette;
      if (already[named] === undefined) {
        this.palette[key] = '#' + new THREE.Color(live).getHexString();
      }
    };
    seed('building', 'building');
    seed('window', 'window');
    seed('rastaak', 'rastaak');
    seed('logo', 'logo');
    seed('ground', 'ground');
    seed('plate', 'plate');
    seed('border', 'border');
    seed('treeTrunk', 'treeTrunk');
    seed('treeLeaf', 'treeLeaf');

    const matFolder = this.addTab('Scene colors');
    this.materialsFolderPopulated = true;

    const sampleObject =
      groups.building[0] || groups.window[0] || groups.rastaak[0] || groups.logo[0];
    const sampleGround = groups.ground[0] || groups.plate[0] || groups.border[0];
    if (!this.objectSurfaceTouched && sampleObject) {
      if (typeof sampleObject.roughness === 'number') this.objectSurface.roughness = sampleObject.roughness;
      if (typeof sampleObject.metalness === 'number') this.objectSurface.metalness = sampleObject.metalness;
      if (typeof sampleObject.envMapIntensity === 'number') {
        this.objectSurface.envMapIntensity = sampleObject.envMapIntensity;
      }
    }
    if (!this.groundSurfaceTouched && sampleGround) {
      if (typeof sampleGround.roughness === 'number') this.groundSurface.roughness = sampleGround.roughness;
      if (typeof sampleGround.metalness === 'number') this.groundSurface.metalness = sampleGround.metalness;
      if (typeof sampleGround.envMapIntensity === 'number') {
        this.groundSurface.envMapIntensity = sampleGround.envMapIntensity;
      }
    }

    const persistPalette = () => {
      const objectSurface = this.objectSurfaceTouched
        ? {
            roughness: this.objectSurface.roughness,
            metalness: this.objectSurface.metalness,
            envMapIntensity: this.objectSurface.envMapIntensity,
          }
        : undefined;
      const groundSurface = this.groundSurfaceTouched
        ? {
            roughness: this.groundSurface.roughness,
            metalness: this.groundSurface.metalness,
            envMapIntensity: this.groundSurface.envMapIntensity,
          }
        : undefined;
      SCENE_CONFIG.materials = {
        ...SCENE_CONFIG.materials,
        ...collectMaterialsConfig(
          {
            buildingColor: new THREE.Color(this.palette.building).getHex(),
            windowColor: new THREE.Color(this.palette.window).getHex(),
            rastaakColor: new THREE.Color(this.palette.rastaak).getHex(),
            logoColor: new THREE.Color(this.palette.logo).getHex(),
            groundColor: new THREE.Color(this.palette.ground).getHex(),
            plateColor: new THREE.Color(this.palette.plate).getHex(),
            borderColor: new THREE.Color(this.palette.border).getHex(),
            treeTrunkColor: new THREE.Color(this.palette.treeTrunk).getHex(),
            treeLeafColor: new THREE.Color(this.palette.treeLeaf).getHex(),
          },
          objectSurface,
          groundSurface,
        ),
      };
    };

    const paint = (category: Exclude<MaterialCategory, 'ignore'>, hex: string, storyIdle = false) => {
      applyCategoryColor(liveGroups()[category], hex);
      persistPalette();
      this.broadcastLive();
      if (storyIdle) {
        window.dispatchEvent(new CustomEvent('rastaak-studio-materials-changed'));
      }
    };

    matFolder.addColor(this.palette, 'building').name('Buildings').onChange((hex: string) => paint('building', hex, true));
    matFolder.addColor(this.palette, 'window').name('Windows').onChange((hex: string) => paint('window', hex, true));
    matFolder.addColor(this.palette, 'rastaak').name('Rastaak building').onChange((hex: string) => paint('rastaak', hex, true));
    matFolder.addColor(this.palette, 'logo').name('Logo').onChange((hex: string) => paint('logo', hex));
    matFolder.addColor(this.palette, 'ground').name('Ground').onChange((hex: string) => paint('ground', hex));
    matFolder.addColor(this.palette, 'plate').name('Plates').onChange((hex: string) => paint('plate', hex));
    matFolder.addColor(this.palette, 'border').name('Ground borders').onChange((hex: string) => paint('border', hex));
    matFolder.addColor(this.palette, 'treeTrunk').name('Tree trunks').onChange((hex: string) => paint('treeTrunk', hex));
    matFolder.addColor(this.palette, 'treeLeaf').name('Tree leaves').onChange((hex: string) => paint('treeLeaf', hex));
    const treeVis = {
      showBigTrees: SCENE_CONFIG.visibility?.showBigTrees !== false,
      showSmallTrees: SCENE_CONFIG.visibility?.showSmallTrees !== false,
    };
    const writeTreeVis = () => {
      SCENE_CONFIG.visibility = {
        showBigTrees: treeVis.showBigTrees,
        showSmallTrees: treeVis.showSmallTrees,
      };
      applyTreeVisibility(worldGroup, SCENE_CONFIG.visibility);
    };
    matFolder.add(treeVis, 'showBigTrees').name('Show big trees').onChange(writeTreeVis);
    matFolder.add(treeVis, 'showSmallTrees').name('Show small trees').onChange(writeTreeVis);

    const paintSurfaceGroup = (
      categories: readonly Exclude<MaterialCategory, 'ignore'>[],
      surface: SurfaceParams,
    ) => {
      const groupsNow = liveGroups();
      categories.forEach((category) => {
        applyCategorySurface(groupsNow[category], surface);
      });
      persistPalette();
      this.broadcastLive();
      window.dispatchEvent(new CustomEvent('rastaak-studio-materials-changed'));
    };
    const applyObjectSurface = () => {
      this.objectSurfaceTouched = true;
      paintSurfaceGroup(OBJECT_SURFACE_CATEGORIES, this.objectSurface);
    };
    const applyGroundSurface = () => {
      this.groundSurfaceTouched = true;
      paintSurfaceGroup(GROUND_SURFACE_CATEGORIES, this.groundSurface);
    };
    matFolder.add(this.objectSurface, 'metalness', 0, 1, 0.01).name('Objects metalness').onChange(applyObjectSurface);
    matFolder.add(this.objectSurface, 'roughness', 0, 1, 0.01).name('Objects roughness').onChange(applyObjectSurface);
    matFolder
      .add(this.objectSurface, 'envMapIntensity', 0, 3, 0.05)
      .name('Objects reflection')
      .onChange(applyObjectSurface);
    matFolder.add(this.groundSurface, 'metalness', 0, 1, 0.01).name('Ground metalness').onChange(applyGroundSurface);
    matFolder.add(this.groundSurface, 'roughness', 0, 1, 0.01).name('Ground roughness').onChange(applyGroundSurface);
    matFolder
      .add(this.groundSurface, 'envMapIntensity', 0, 3, 0.05)
      .name('Ground reflection')
      .onChange(applyGroundSurface);

    persistPalette();
    if (!this.foldersExpanded) matFolder.close?.();
  }

  private refreshCamDisplay = () => {};
  private pullCamSlidersFromStop = () => {};
  private selectCameraPointFromTimeline = (_index: number) => {};

  private onCameraPointSelected = (event: Event) => {
    const detail = (event as CustomEvent<{ method?: string; index?: number }>).detail;
    if (detail?.method !== SCENE_CONFIG.cameraMethod || typeof detail.index !== 'number') return;
    this.selectCameraPointFromTimeline(detail.index);
  };

  private broadcastLive() {
    publishLive({
      lights: this.collectCurrentLights(),
      materials: SCENE_CONFIG.materials,
      environment: SCENE_CONFIG.environment,
      renderer: { toneMappingExposure: this.renderer.toneMappingExposure },
      typeChrome: TYPE_CHROME,
      heroCopy: HERO_COPY,
      flowSteps: FLOW_CONFIG,
      flowChrome: FLOW_CHROME,
      siteContent: SITE_CONTENT,
      cameraMethod: SCENE_CONFIG.cameraMethod,
      cameraStops: SCENE_CONFIG.stops,
      progressKeyframes: SCENE_CONFIG.progressKeyframes,
      scroll: SCENE_CONFIG.scroll,
      look: LOOK_CONFIG,
    });
  }

  private onExternalToggle = () => {
    if (this.disposed) return;
    if (!this.guis.length) {
      void this.initGUI(true);
      return;
    }
    this.setStudioCollapsed(!this.studioCollapsed);
  };

  private setStudioCollapsed(collapsed: boolean) {
    this.studioCollapsed = collapsed;
    this.isOpen = !collapsed;
    const dock = document.getElementById('rastaak-studio-dock');
    if (dock) dock.dataset.collapsed = collapsed ? 'true' : 'false';
    if (this.studioEdge) {
      this.studioEdge.title = collapsed ? 'Show 3D Studio' : 'Hide 3D Studio';
      this.studioEdge.setAttribute('aria-label', this.studioEdge.title);
      this.studioEdge.innerHTML = this.studioEdgeSvg(collapsed);
    }
    this.timelinePanel?.layout();
    this.syncStudioDockBottom();
    this.syncGizmoVisibility();
    if (collapsed) {
      this.setGrabMode(false);
      this.setCameraGrabMode(false);
    }
    window.dispatchEvent(new CustomEvent('rastaak-studio-open', { detail: { open: !collapsed } }));
  }

  private anyGrab() {
    return this.grabMode || this.grabCamera;
  }

  private anyCameraOverlay() {
    return this.showCamGizmo || this.showTargetGizmo || this.showCamPath || this.showTargetPath;
  }

  private syncHeroVisibility() {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.studioHero = this.showHero ? 'on' : 'off';
  }

  private syncGizmoVisibility() {
    this.lightGizmos?.setVisible(this.isOpen && this.showLightGizmos);
    this.cameraGizmos?.setVisible(this.isOpen && this.anyCameraOverlay());
    this.cameraGizmos?.setDisplay({
      camGizmo: this.showCamGizmo,
      targetGizmo: this.showTargetGizmo,
      camPath: this.showCamPath,
      targetPath: this.showTargetPath,
      pathMode: this.cameraPathMode === 'Current segment' ? 'segment' : 'full',
    });
  }

  private applyGrabChrome(wasGrabbing: boolean) {
    const grabbing = this.anyGrab();
    document.body.classList.toggle('studio-grab-lamps', grabbing);
    if (grabbing && !wasGrabbing) {
      this.preGrabOrbit = this.isOrbitMode;
      this.isOrbitMode = true;
      this.onOrbitModeToggle?.(!this.orbitLockedByGizmo);
      this.renderer.domElement.style.pointerEvents = 'auto';
    } else if (!grabbing && wasGrabbing) {
      this.isOrbitMode = this.preGrabOrbit;
      this.onOrbitModeToggle?.(this.isOrbitMode);
      this.renderer.domElement.style.pointerEvents = '';
      this.orbitLockedByGizmo = false;
    }
  }

  private setGrabMode(on: boolean) {
    if (this.grabMode === on) return;
    const wasGrabbing = this.anyGrab();
    this.grabMode = on;
    this.lightGizmos?.setGrabEnabled(on);
    this.applyGrabChrome(wasGrabbing);
  }

  private setCameraGrabMode(on: boolean) {
    if (this.grabCamera === on) return;
    const wasGrabbing = this.anyGrab();
    this.grabCamera = on;
    this.cameraGizmos?.setGrabEnabled(on);
    this.applyGrabChrome(wasGrabbing);
  }

  public tick() {
    this.lightGizmos?.syncAll();
    if (!this.cameraGizmos) return;
    this.cameraGizmos.syncPath(this.cameraPointsForGizmos(), this.playheadT);
    const aspect = this.camera.aspect;
    if (this.grabCamera) {
      const stop = this.activeCameraPoints()[this.currentStopIndex];
      if (stop) this.cameraGizmos.sync(stop, aspect);
      return;
    }
    if (this.isOrbitMode && this.anyCameraOverlay()) {
      sampleSceneJourney(this.playheadT, this.journeySample);
      this.cameraGizmos.syncPose(this.journeySample, aspect);
      return;
    }
    const stop = this.activeCameraPoints()[this.currentStopIndex];
    if (stop) this.cameraGizmos.sync(stop, aspect);
  }

  public destroy() {
    this.disposed = true;
    window.removeEventListener('rastaak-studio-toggle', this.onExternalToggle);
    window.removeEventListener('rastaak-studio-chrome-layout', this.onChromeLayout);
    window.removeEventListener('resize', this.onChromeLayout);
    window.removeEventListener(STORY_FRAME_EVENT, this.onStoryFrame);
    window.removeEventListener('rastaak-studio-timing-changed', this.onStudioTiming);
    window.removeEventListener('rastaak-camera-point-selected', this.onCameraPointSelected);
    this.chromeObserver?.disconnect();
    this.chromeObserver = null;
    this.setGrabMode(false);
    this.setCameraGrabMode(false);
    document.body.classList.remove('studio-grab-lamps');
    if (this.pointerHandler) {
      window.removeEventListener('pointerdown', this.pointerHandler, true);
      this.pointerHandler = null;
    }
    document.getElementById('rastaak-studio-btn')?.remove();
    document.getElementById('rastaak-studio-logout')?.remove();
    document.getElementById('rastaak-studio-opacity')?.remove();
    for (const gui of this.guis) gui.destroy?.();
    this.guis = [];
    this.gui = null;
    this.GUICtor = null;
    document.getElementById('rastaak-studio-dock')?.remove();
    document.getElementById('rastaak-studio-panel')?.remove();
    this.studioEdge = null;
    this.foldAllBtn = null;
    this.applyBtn = null;
    this.lightGizmos?.dispose();
    this.lightGizmos = null;
    this.cameraGizmos?.dispose();
    this.cameraGizmos = null;
    this.lightUi.clear();
    this.timelinePanel?.destroy();
    this.timelinePanel = null;
    delete document.documentElement.dataset.studioHero;
  }
}
