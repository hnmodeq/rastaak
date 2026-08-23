import * as THREE from 'three';
import { SCENE_CONFIG } from './sceneConfig';
import { LIGHTS_CONFIG } from './lightingConfig';
import { applySceneShadows } from './shadowTint';
import type { CameraStop, LightConfig, StudioSavePayload } from './sceneTypes';
import { STORY_CONFIG, applyStoryTheme, resolveAt } from './storyConfig';
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
import { StoryTimelinePanel } from './StoryTimelinePanel';
import { LightGizmoSet } from './LightGizmos';
import { publishLive } from '@/components/live/liveChannel';
import { SITE_CONTENT } from '@/components/home/siteContent';
import { LOOK_CONFIG, applyLookOverlay, applySceneEnvironment } from './lookConfig';

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

export class SceneStudioGUI {
  private gui: any = null;
  private guis: any[] = [];
  private GUICtor: any = null;
  private disposed = false;
  private studioEdge: HTMLButtonElement | null = null;
  private foldAllBtn: HTMLButtonElement | null = null;
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
  private showGizmos = true;
  private grabMode = false;
  private preGrabOrbit = false;
  private orbitLockedByGizmo = false;
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
          if (this.grabMode) this.onOrbitModeToggle?.(!locked);
        },
      );
    } catch (error) {
      console.warn('[studio] lamp gizmos failed to start', error);
      this.lightGizmos = null;
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
    this.initGUI();
    this.initRaycaster();
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
      #rastaak-studio-foldall {
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
      const toolbar = document.createElement('div');
      toolbar.id = 'rastaak-studio-toolbar';
      const fold = document.createElement('button');
      fold.type = 'button';
      fold.id = 'rastaak-studio-foldall';
      fold.textContent = 'Expand all';
      fold.addEventListener('click', () => this.setAllFoldersOpen(!this.foldersExpanded));
      toolbar.appendChild(fold);
      host.appendChild(toolbar);
      dock.appendChild(edge);
      dock.appendChild(host);
      document.body.appendChild(dock);
      this.studioEdge = edge;
      this.foldAllBtn = fold;
    } else {
      this.studioEdge = dock.querySelector('.rastaak-studio-edge');
      this.foldAllBtn = dock.querySelector('#rastaak-studio-foldall');
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
      if (!this.isOpen && !this.isManualMode && !this.isOrbitMode && !this.grabMode) return;
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
        item.shadowBias = shadowObj?.bias ?? -0.0001;
        item.radius = shadowObj?.radius ?? 1;
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
    window.dispatchEvent(new CustomEvent('rastaak-studio-timing-changed'));
  }

  private async applyAndSave() {
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
      cameraStops: SCENE_CONFIG.stops.map((stop) => ({
        id: stop.id,
        progress: stop.progress,
        camera: [...stop.camera] as [number, number, number],
        target: [...stop.target] as [number, number, number],
        fov: stop.fov ?? SCENE_CONFIG.camera.defaultFov,
      })),
      lights: this.collectCurrentLights(),
      environment: {
        backgroundColor: colorToHexNumber(bg),
        fogColor: fog ? colorToHexNumber(fog.color) : (SCENE_CONFIG.environment.fogColor ?? colorToHexNumber(bg)),
        fogStart: fog?.near ?? SCENE_CONFIG.environment.fogStart,
        fogEnd: fog?.far ?? SCENE_CONFIG.environment.fogEnd,
        fogEnabled: Boolean(fog) && SCENE_CONFIG.environment.fogEnabled !== false,
        shadowColor: SCENE_CONFIG.environment.shadowColor ?? 0x000000,
        shadowOpacity: SCENE_CONFIG.environment.shadowOpacity ?? 1,
      },
      renderer: {
        toneMappingExposure: this.renderer.toneMappingExposure,
      },
      scroll: { ...SCENE_CONFIG.scroll },
      camera: { ...SCENE_CONFIG.camera },
      materials: this.collectCurrentMaterials(),
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
      },
      flowSteps: FLOW_CONFIG.map((step) => ({
        ...step,
        progressRange: [...step.progressRange] as [number, number],
      })),
      heroCopy: { ...HERO_COPY },
      flowChrome: { ...FLOW_CHROME },
      look: { ...LOOK_CONFIG },
      typeChrome: {
        siteName: TYPE_CHROME.siteName,
        siteNameColor: TYPE_CHROME.siteNameColor,
        siteNameLayoutColor: TYPE_CHROME.siteNameLayoutColor,
        siteNamePaddingTop: TYPE_CHROME.siteNamePaddingTop,
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
    SCENE_CONFIG.stops.splice(0, SCENE_CONFIG.stops.length, ...payload.cameraStops);
    SCENE_CONFIG.environment.backgroundColor = payload.environment.backgroundColor;
    SCENE_CONFIG.environment.fogColor = payload.environment.fogColor ?? payload.environment.backgroundColor;
    SCENE_CONFIG.environment.fogStart = payload.environment.fogStart;
    SCENE_CONFIG.environment.fogEnd = payload.environment.fogEnd;
    SCENE_CONFIG.environment.fogEnabled = payload.environment.fogEnabled !== false;
    SCENE_CONFIG.environment.shadowColor = payload.environment.shadowColor ?? 0x000000;
    SCENE_CONFIG.environment.shadowOpacity = payload.environment.shadowOpacity ?? 1;
    SCENE_CONFIG.renderer.toneMappingExposure = payload.renderer.toneMappingExposure;
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
      this.manualLookAt.set(
        SCENE_CONFIG.stops[0]?.target[0] ?? 14,
        SCENE_CONFIG.stops[0]?.target[1] ?? 2,
        SCENE_CONFIG.stops[0]?.target[2] ?? 0,
      );

      const camFolder = this.addTab('Camera & Stop Points');

      let currentStopIndex = 0;
      const getStopNames = () => SCENE_CONFIG.stops.map((s, i) => `${i + 1}. ${s.id}`);

      const camParams = {
        mode: isAdmin ? 'Free Orbit Camera' : 'Scroll Journey',
        selectedStop: getStopNames()[0],
        scrollT: SCENE_CONFIG.stops[0]?.progress ?? 0.0,
        camX: SCENE_CONFIG.stops[0]?.camera[0] ?? this.camera.position.x,
        camY: SCENE_CONFIG.stops[0]?.camera[1] ?? this.camera.position.y,
        camZ: SCENE_CONFIG.stops[0]?.camera[2] ?? this.camera.position.z,
        targetX: SCENE_CONFIG.stops[0]?.target[0] ?? 14.0,
        targetY: SCENE_CONFIG.stops[0]?.target[1] ?? 2.0,
        targetZ: SCENE_CONFIG.stops[0]?.target[2] ?? 0.0,
        fov: SCENE_CONFIG.stops[0]?.fov ?? 45,

        addNewStop: () => {
          const newId = `stop_${SCENE_CONFIG.stops.length + 1}_custom`;
          const newStop: CameraStop = {
            id: newId,
            progress: 1.0,
            camera: [
              parseFloat(this.camera.position.x.toFixed(2)),
              parseFloat(this.camera.position.y.toFixed(2)),
              parseFloat(this.camera.position.z.toFixed(2)),
            ],
            target: [
              parseFloat(this.manualLookAt.x.toFixed(2)),
              parseFloat(this.manualLookAt.y.toFixed(2)),
              parseFloat(this.manualLookAt.z.toFixed(2)),
            ],
            fov: this.camera.fov,
          };
          SCENE_CONFIG.stops.push(newStop);

          stopDropdownController.options(getStopNames());
          stopDropdownController.setValue(`${SCENE_CONFIG.stops.length}. ${newId}`);
          this.notifyTimingChanged();
          alert(`Added new stop point '${newId}'!`);
        },

        copyStopsConfig: () => {
          const text = JSON.stringify(SCENE_CONFIG.stops, null, 2);
          if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            alert('Copied all stop points to clipboard!');
          }
        },
      };

      if (isAdmin) {
        this.isOrbitMode = true;
        this.onOrbitModeToggle?.(true);
      }

      camFolder
        .add(camParams, 'mode', ['Scroll Journey', 'Manual Live Sliders', 'Free Orbit Camera'])
        .name('Mode')
        .onChange((v: string) => {
          this.isManualMode = v === 'Manual Live Sliders';
          this.isOrbitMode = v === 'Free Orbit Camera';

          if (this.onOrbitModeToggle) {
            this.onOrbitModeToggle(this.isOrbitMode);
          }

          if (this.isManualMode) {
            this.manualCamPos.copy(this.camera.position);
            camParams.camX = this.manualCamPos.x;
            camParams.camY = this.manualCamPos.y;
            camParams.camZ = this.manualCamPos.z;
            this.refreshCamDisplay();
          }
        });

      const stopDropdownController = camFolder
        .add(camParams, 'selectedStop', getStopNames())
        .name('Edit Stop Point')
        .onChange((name: string) => {
          const names = getStopNames();
          const idx = names.indexOf(name);
          if (idx >= 0 && idx < SCENE_CONFIG.stops.length) {
            currentStopIndex = idx;
            const stop = SCENE_CONFIG.stops[idx];

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
            this.camera.position.copy(this.manualCamPos);
            this.camera.lookAt(this.manualLookAt);
            this.camera.fov = camParams.fov;
            this.camera.updateProjectionMatrix();

            this.refreshCamDisplay();

            if (this.onProgressChange) this.onProgressChange(stop.progress);
          }
        });

      const scrollCtrl = camFolder
        .add(camParams, 'scrollT', 0.0, 1.0, 0.01)
        .name('Scroll t')
        .listen()
        .onChange((val: number) => {
          if (SCENE_CONFIG.stops[currentStopIndex]) {
            SCENE_CONFIG.stops[currentStopIndex].progress = val;
          }
          if (this.onProgressChange) this.onProgressChange(val);
          this.notifyTimingChanged();
        });

      const camXCtrl = camFolder
        .add(camParams, 'camX', -100, 100, 0.5)
        .name('Cam X')
        .listen()
        .onChange((v: number) => {
          this.manualCamPos.x = v;
          this.camera.position.x = v;
          if (SCENE_CONFIG.stops[currentStopIndex]) {
            SCENE_CONFIG.stops[currentStopIndex].camera[0] = v;
          }
        });

      const camYCtrl = camFolder
        .add(camParams, 'camY', 0, 100, 0.5)
        .name('Cam Y')
        .listen()
        .onChange((v: number) => {
          this.manualCamPos.y = v;
          this.camera.position.y = v;
          if (SCENE_CONFIG.stops[currentStopIndex]) {
            SCENE_CONFIG.stops[currentStopIndex].camera[1] = v;
          }
        });

      const camZCtrl = camFolder
        .add(camParams, 'camZ', -100, 100, 0.5)
        .name('Cam Z')
        .listen()
        .onChange((v: number) => {
          this.manualCamPos.z = v;
          this.camera.position.z = v;
          if (SCENE_CONFIG.stops[currentStopIndex]) {
            SCENE_CONFIG.stops[currentStopIndex].camera[2] = v;
          }
        });

      const targetXCtrl = camFolder
        .add(camParams, 'targetX', -100, 100, 0.5)
        .name('Target X')
        .listen()
        .onChange((v: number) => {
          this.manualLookAt.x = v;
          this.camera.lookAt(this.manualLookAt);
          if (SCENE_CONFIG.stops[currentStopIndex]) {
            SCENE_CONFIG.stops[currentStopIndex].target[0] = v;
          }
        });

      const targetYCtrl = camFolder
        .add(camParams, 'targetY', -50, 100, 0.5)
        .name('Target Y')
        .listen()
        .onChange((v: number) => {
          this.manualLookAt.y = v;
          this.camera.lookAt(this.manualLookAt);
          if (SCENE_CONFIG.stops[currentStopIndex]) {
            SCENE_CONFIG.stops[currentStopIndex].target[1] = v;
          }
        });

      const targetZCtrl = camFolder
        .add(camParams, 'targetZ', -100, 100, 0.5)
        .name('Target Z')
        .listen()
        .onChange((v: number) => {
          this.manualLookAt.z = v;
          this.camera.lookAt(this.manualLookAt);
          if (SCENE_CONFIG.stops[currentStopIndex]) {
            SCENE_CONFIG.stops[currentStopIndex].target[2] = v;
          }
        });

      const fovCtrl = camFolder
        .add(camParams, 'fov', 15, 90, 1)
        .name('FOV Zoom')
        .listen()
        .onChange((v: number) => {
          this.camera.fov = v;
          this.camera.updateProjectionMatrix();
          if (SCENE_CONFIG.stops[currentStopIndex]) {
            SCENE_CONFIG.stops[currentStopIndex].fov = v;
          }
        });

      camFolder.add(camParams, 'addNewStop').name('➕ Add Current View as Stop');
      camFolder.add(camParams, 'copyStopsConfig').name('📋 Copy Stops JSON');

      this.refreshCamDisplay = () => {
        scrollCtrl.updateDisplay();
        camXCtrl.updateDisplay();
        camYCtrl.updateDisplay();
        camZCtrl.updateDisplay();
        targetXCtrl.updateDisplay();
        targetYCtrl.updateDisplay();
        targetZCtrl.updateDisplay();
        fovCtrl.updateDisplay();
      };

      this.populateLightsAndShadows();
      this.populateMaterials();
      this.populateStoryControls();
      this.populateStoryTiming();
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
        shadowColor: '#' + new THREE.Color(SCENE_CONFIG.environment.shadowColor ?? 0x000000).getHexString(),
        shadowOpacity: SCENE_CONFIG.environment.shadowOpacity ?? 1,
      };

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
      };
      const applyLook = () => {
        LOOK_CONFIG.envEnabled = lookParams.envEnabled;
        LOOK_CONFIG.envIntensity = lookParams.envIntensity;
        LOOK_CONFIG.grain = lookParams.grain;
        LOOK_CONFIG.grainSize = lookParams.grainSize;
        LOOK_CONFIG.vignette = lookParams.vignette;
        applySceneEnvironment(this.scene, this.renderer);
        applyLookOverlay();
        this.broadcastLive();
      };
      lookFolder.add(lookParams, 'envEnabled').name('Environment reflections').onChange(applyLook);
      lookFolder.add(lookParams, 'envIntensity', 0, 3, 0.05).name('Reflection strength').onChange(applyLook);
      lookFolder.add(lookParams, 'grain', 0, 0.45, 0.01).name('Film grain').onChange(applyLook);
      lookFolder.add(lookParams, 'grainSize', 0.5, 2.5, 0.05).name('Grain size').onChange(applyLook);
      lookFolder.add(lookParams, 'vignette', 0, 0.8, 0.01).name('Vignette').onChange(applyLook);

      this.setAllFoldersOpen(false);
      this.setStudioCollapsed(true);
      this.syncStudioDockBottom();
    } catch (e) {
      console.log('[SceneStudioGUI] lil-gui dynamic import skipped:', e);
    }
  }

  private addTypeControls(folder: any, face: TypeFace, hex: (value: number) => string) {
    if (face.lineHeight === undefined) face.lineHeight = 1.15;
    if (face.letterSpacing === undefined) face.letterSpacing = 0;
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
    folder.add(params, 'size', 8, 160, 1).name('Size').onChange((value: number) => {
      face.size = value;
      sync();
    });
    folder.add(params, 'weight', TYPE_WEIGHTS).name('Weight').onChange((value: number) => {
      face.weight = Number(value);
      sync();
    });
    folder.add(params, 'lineHeight', 0.7, 2.4, 0.02).name('Line spacing').onChange((value: number) => {
      face.lineHeight = value;
      sync();
    });
    folder.add(params, 'letterSpacing', -12, 12, 0.1).name('Letter spacing').onChange((value: number) => {
      face.letterSpacing = value;
      sync();
    });
    folder.addColor(params, 'shadowColor').name('Shadow color').onChange((value: string) => {
      face.shadowColor = new THREE.Color(value).getHex();
      sync();
    });
    folder.add(params, 'shadowOpacity', 0, 1, 0.01).name('Shadow opacity').onChange((value: number) => {
      face.shadowOpacity = value;
      sync();
    });
    folder.add(params, 'shadowBlur', 0, 40, 0.5).name('Shadow blur').onChange((value: number) => {
      face.shadowBlur = value;
      sync();
    });
    folder.add(params, 'shadowX', -20, 20, 0.5).name('Shadow X').onChange((value: number) => {
      face.shadowX = value;
      sync();
    });
    folder.add(params, 'shadowY', -20, 20, 0.5).name('Shadow Y').onChange((value: number) => {
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
      .add(brandParams, 'paddingTop', 0, 120, 1)
      .name('Name top padding')
      .onChange((value: number) => {
        TYPE_CHROME.siteNamePaddingTop = value;
        applyTypeChrome();
      });
    this.addTypeControls(heroFolder.addFolder('Site name type'), TYPE_CHROME.siteNameType, hex);
    const heroParams = {
      titleLine1: HERO_COPY.titleLine1,
      titleLine2: HERO_COPY.titleLine2,
      titleColor: hex(HERO_COPY.titleColor),
      titlePaddingTop: HERO_COPY.titlePaddingTop ?? 0,
      subtitleLine1: HERO_COPY.subtitleLine1,
      subtitleLine2: HERO_COPY.subtitleLine2,
      subtitleColor: hex(HERO_COPY.subtitleColor),
      subtitlePaddingTop: HERO_COPY.subtitlePaddingTop ?? 0,
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
      .add(heroParams, 'titlePaddingTop', 0, 200, 1)
      .name('Title top padding')
      .onChange((value: number) => applyHeroField('titlePaddingTop', value));
    heroFolder.add(heroParams, 'subtitleLine1').name('Description line 1').onChange((value: string) => applyHeroField('subtitleLine1', value));
    heroFolder.add(heroParams, 'subtitleLine2').name('Description line 2').onChange((value: string) => applyHeroField('subtitleLine2', value));
    heroFolder
      .addColor(heroParams, 'subtitleColor')
      .name('Description color')
      .onChange((value: string) => applyHeroField('subtitleColor', new THREE.Color(value).getHex()));
    heroFolder
      .add(heroParams, 'subtitlePaddingTop', 0, 200, 1)
      .name('Description top padding')
      .onChange((value: number) => applyHeroField('subtitlePaddingTop', value));
    heroFolder.add(heroParams, 'scrollHint').name('Scroll hint').onChange((value: string) => applyHeroField('scrollHint', value));
    heroFolder
      .addColor(heroParams, 'scrollHintColor')
      .name('Scroll hint color')
      .onChange((value: string) => applyHeroField('scrollHintColor', new THREE.Color(value).getHex()));
    this.addTypeControls(heroFolder.addFolder('Title type'), TYPE_CHROME.heroTitle, hex);
    this.addTypeControls(heroFolder.addFolder('Description type'), TYPE_CHROME.heroSubtitle, hex);
    this.addTypeControls(heroFolder.addFolder('Scroll hint type'), TYPE_CHROME.scrollHint, hex);

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

    storyFolder.addColor(colorParams, 'packet').name('Shooting light trail').onChange((v: string) => applyColor('packet', v));
    storyFolder.addColor(colorParams, 'packetCore').name('Shooting light core').onChange((v: string) => applyColor('packetCore', v));
    storyFolder.addColor(colorParams, 'packetInner').name('Shooting logo inner glow').onChange((v: string) => applyColor('packetInner', v));
    storyFolder.addColor(colorParams, 'packetOuter').name('Shooting logo outer glow').onChange((v: string) => applyColor('packetOuter', v));
    storyFolder.addColor(colorParams, 'packetSpark').name('Shooting light sparks').onChange((v: string) => applyColor('packetSpark', v));
    storyFolder.addColor(colorParams, 'packetBounce').name('Shooting light reflection color').onChange((v: string) => applyColor('packetBounce', v));

    const bounceParams = {
      packetIntensity: STORY_CONFIG.packetIntensity ?? 260,
      packetDistance: STORY_CONFIG.packetDistance ?? 9,
      packetGlow: STORY_CONFIG.packetGlow ?? 1,
      packetGlowSize: STORY_CONFIG.packetGlowSize ?? 0.22,
      packetCoreSize: STORY_CONFIG.packetCoreSize ?? 0.07,
      packetTrail: STORY_CONFIG.packetTrail ?? 0.7,
    };
    storyFolder
      .add(bounceParams, 'packetIntensity', 0, 800, 5)
      .name('Shooting light reflection')
      .onChange((value: number) => {
        STORY_CONFIG.packetIntensity = value;
      });
    storyFolder
      .add(bounceParams, 'packetDistance', 0.5, 20, 0.1)
      .name('Shooting light reach')
      .onChange((value: number) => {
        STORY_CONFIG.packetDistance = value;
      });
    storyFolder
      .add(bounceParams, 'packetGlow', 0, 2, 0.05)
      .name('Shooting light glow')
      .onChange((value: number) => {
        STORY_CONFIG.packetGlow = value;
      });
    storyFolder
      .add(bounceParams, 'packetGlowSize', 0.04, 0.8, 0.01)
      .name('Shooting light glow size')
      .onChange((value: number) => {
        STORY_CONFIG.packetGlowSize = value;
      });
    storyFolder
      .add(bounceParams, 'packetCoreSize', 0.02, 0.8, 0.005)
      .name('Shooting logo size')
      .onChange((value: number) => {
        STORY_CONFIG.packetCoreSize = value;
      });
    storyFolder
      .add(bounceParams, 'packetTrail', 0, 1, 0.02)
      .name('Shooting light trail')
      .onChange((value: number) => {
        STORY_CONFIG.packetTrail = value;
      });

    const burstFolder = storyFolder.addFolder('Arrival explosion');
    const burstParams = {
      burstDelay: STORY_CONFIG.burstDelay ?? 0.045,
      burstSpan: STORY_CONFIG.burstSpan ?? 0.06,
      burstLight: STORY_CONFIG.burstLight ?? 3.2,
      burstLightRadius: STORY_CONFIG.burstLightRadius ?? 10,
      burstSize: STORY_CONFIG.burstSize ?? 1,
      burstExposure: STORY_CONFIG.burstExposure ?? 1,
      burstSparks: STORY_CONFIG.burstSparks ?? 1,
    };
    burstFolder
      .add(burstParams, 'burstDelay', 0, 0.16, 0.005)
      .name('Delay after hit')
      .onChange((value: number) => {
        STORY_CONFIG.burstDelay = value;
      });
    burstFolder
      .add(burstParams, 'burstSpan', 0.015, 0.16, 0.005)
      .name('Explosion duration')
      .onChange((value: number) => {
        STORY_CONFIG.burstSpan = value;
      });
    burstFolder
      .add(burstParams, 'burstLight', 0, 8, 0.05)
      .name('Explosion light amount')
      .onChange((value: number) => {
        STORY_CONFIG.burstLight = value;
      });
    burstFolder
      .add(burstParams, 'burstLightRadius', 0.5, 30, 0.1)
      .name('Explosion reflection reach')
      .onChange((value: number) => {
        STORY_CONFIG.burstLightRadius = value;
      });
    burstFolder
      .add(burstParams, 'burstSize', 0.2, 3, 0.05)
      .name('Explosion flare size')
      .onChange((value: number) => {
        STORY_CONFIG.burstSize = value;
      });
    burstFolder
      .add(burstParams, 'burstExposure', 0, 3, 0.05)
      .name('Explosion exposure')
      .onChange((value: number) => {
        STORY_CONFIG.burstExposure = value;
      });
    burstFolder
      .add(burstParams, 'burstSparks', 0, 2, 0.05)
      .name('Explosion sparks')
      .onChange((value: number) => {
        STORY_CONFIG.burstSparks = value;
      });

    storyFolder.addColor(colorParams, 'hubPulse').name('Rastaak building').onChange((v: string) => applyColor('hubPulse', v));
    storyFolder.addColor(colorParams, 'hubPulseWindow').name('Rastaak window').onChange((v: string) => applyColor('hubPulseWindow', v));
    storyFolder.addColor(colorParams, 'need').name('Client before — building').onChange((v: string) => applyColor('need', v));
    storyFolder.addColor(colorParams, 'needWindow').name('Client before — window').onChange((v: string) => applyColor('needWindow', v));
    storyFolder.addColor(colorParams, 'resolved').name('Client after — building').onChange((v: string) => applyColor('resolved', v));
    storyFolder.addColor(colorParams, 'resolvedWindow').name('Client after — window').onChange((v: string) => applyColor('resolvedWindow', v));
    storyFolder.addColor(colorParams, 'chipNeed').name('Tick before solve').onChange((v: string) => applyColor('chipNeed', v));
    storyFolder.addColor(colorParams, 'chipResolved').name('Tick after solve').onChange((v: string) => applyColor('chipResolved', v));

    const chipBoxFolder = storyFolder.addFolder('Need chip box');
    const chipBoxParams = {
      chipBorder: hex(STORY_CONFIG.chipBorder ?? 0xe0a01a),
      chipBorderOpacity: STORY_CONFIG.chipBorderOpacity ?? 0.55,
      chipBackground: hex(STORY_CONFIG.chipBackground ?? 0x14151a),
      chipBackgroundOpacity: STORY_CONFIG.chipBackgroundOpacity ?? 0.72,
      chipText: hex(STORY_CONFIG.chipText ?? 0xf5f5f2),
    };
    chipBoxFolder
      .addColor(chipBoxParams, 'chipBorder')
      .name('Border color')
      .onChange((value: string) => {
        STORY_CONFIG.chipBorder = new THREE.Color(value).getHex();
        applyStoryTheme();
      });
    chipBoxFolder
      .add(chipBoxParams, 'chipBorderOpacity', 0, 1, 0.01)
      .name('Border opacity')
      .onChange((value: number) => {
        STORY_CONFIG.chipBorderOpacity = value;
        applyStoryTheme();
      });
    chipBoxFolder
      .addColor(chipBoxParams, 'chipBackground')
      .name('Background color')
      .onChange((value: string) => {
        STORY_CONFIG.chipBackground = new THREE.Color(value).getHex();
        applyStoryTheme();
      });
    chipBoxFolder
      .add(chipBoxParams, 'chipBackgroundOpacity', 0, 1, 0.01)
      .name('Background opacity')
      .onChange((value: number) => {
        STORY_CONFIG.chipBackgroundOpacity = value;
        applyStoryTheme();
      });
    chipBoxFolder
      .addColor(chipBoxParams, 'chipText')
      .name('Text color')
      .onChange((value: string) => {
        STORY_CONFIG.chipText = new THREE.Color(value).getHex();
        applyStoryTheme();
      });
    this.addTypeControls(chipBoxFolder, TYPE_CHROME.chipText, hex);

    const chipsFolder = storyFolder.addFolder('Need chip titles');
    STORY_CONFIG.clients.forEach((client) => {
      const params = { need: client.need };
      chipsFolder
        .add(params, 'need')
        .name(client.building)
        .onChange((value: string) => {
          client.need = value;
        });
    });

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
    this.addTypeControls(chapterFolder.addFolder('Title type'), TYPE_CHROME.flowTitle, hex);
    this.addTypeControls(chapterFolder.addFolder('Description type'), TYPE_CHROME.flowDescription, hex);
    this.addTypeControls(chapterFolder.addFolder('Number type'), TYPE_CHROME.flowNumber, hex);

    const titlesFolder = chapterFolder.addFolder('Chapter titles');
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
    this.onProgressChange?.(clamp01(t));
  }

  private populateStoryTiming() {
    if (!this.gui) return;

    const root = this.addTab('Story Timing');

    const playhead = { t: SCENE_CONFIG.stops[0]?.progress ?? 0 };
    root
      .add(playhead, 't', 0, 1, 0.01)
      .name('Playhead')
      .listen()
      .onChange((value: number) => {
        this.seekStory(value);
      });

    const cameraFolder = root.addFolder('Camera moves');
    SCENE_CONFIG.stops.forEach((stop, index) => {
      const row = { progress: stop.progress };
      const ctrl = cameraFolder
        .add(row, 'progress', 0, 1, 0.01)
        .name(`${index + 1}. ${stop.id}`)
        .listen()
        .onChange((value: number) => {
          const prev = index > 0 ? SCENE_CONFIG.stops[index - 1].progress : 0;
          const next = index < SCENE_CONFIG.stops.length - 1 ? SCENE_CONFIG.stops[index + 1].progress : 1;
          const clamped = clampOrdered(value, prev, next);
          row.progress = clamped;
          stop.progress = clamped;
          ctrl.updateDisplay();
          this.seekStory(clamped);
          this.notifyTimingChanged();
        });
    });

    const timelineFolder = root.addFolder('Chapter ranges');
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

    const beatsFolder = root.addFolder('Story beats');

    STORY_CONFIG.clients.forEach((client) => {
      const folder = beatsFolder.addFolder(client.building);
      const row = {
        appear: client.appear,
        resolve: resolveAt(client),
        dispatch: client.dispatch,
        arrive: client.arrive,
        flight: Math.max(MIN_FLIGHT, client.arrive - client.dispatch),
        previewRed: () => this.seekStory(client.appear),
        previewBlue: () => this.seekStory(resolveAt(client)),
        previewLaunch: () => this.seekStory(client.dispatch),
        previewArrive: () => this.seekStory(client.arrive),
        previewBurst: () => this.seekStory(client.arrive + (STORY_CONFIG.burstDelay ?? 0.045)),
      };

      const syncRow = () => {
        row.appear = client.appear;
        row.resolve = resolveAt(client);
        row.dispatch = client.dispatch;
        row.arrive = client.arrive;
        row.flight = Math.max(MIN_FLIGHT, client.arrive - client.dispatch);
        appearCtrl.updateDisplay();
        resolveCtrl.updateDisplay();
        dispatchCtrl.updateDisplay();
        arriveCtrl.updateDisplay();
        flightCtrl.updateDisplay();
      };

      const appearCtrl = folder
        .add(row, 'appear', 0, 1, 0.01)
        .name('Turns red')
        .onChange((value: number) => {
          client.appear = clampOrdered(value, 0, client.arrive - MIN_FLIGHT);
          if (client.dispatch < client.appear) client.dispatch = client.appear;
          if (client.arrive < client.dispatch + MIN_FLIGHT) {
            client.arrive = Math.min(1, client.dispatch + MIN_FLIGHT);
          }
          if (resolveAt(client) < client.appear) client.resolve = client.appear;
          syncRow();
          this.seekStory(client.appear);
          this.notifyTimingChanged();
        });

      const resolveCtrl = folder
        .add(row, 'resolve', 0, 1, 0.01)
        .name('Building turns blue')
        .onChange((value: number) => {
          client.resolve = clampOrdered(value, client.appear, 1);
          syncRow();
          this.seekStory(client.resolve);
          this.notifyTimingChanged();
        });

      const dispatchCtrl = folder
        .add(row, 'dispatch', 0, 1, 0.01)
        .name('Logo launches')
        .onChange((value: number) => {
          client.dispatch = clampOrdered(value, client.appear, client.arrive - MIN_FLIGHT);
          syncRow();
          this.seekStory(client.dispatch);
          this.notifyTimingChanged();
        });

      const arriveCtrl = folder
        .add(row, 'arrive', 0, 1, 0.01)
        .name('Logo arrives')
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

      folder.add(row, 'previewRed').name('Preview — turns red');
      folder.add(row, 'previewBlue').name('Preview — turns blue');
      folder.add(row, 'previewLaunch').name('Preview — logo launches');
      folder.add(row, 'previewArrive').name('Preview — logo arrives');
      folder.add(row, 'previewBurst').name('Preview — explosion');
    });

    const captionFolder = root.addFolder('Captions');
    STORY_CONFIG.captions.forEach((caption) => {
      const folder = captionFolder.addFolder(caption.text || caption.id);
      const row = {
        start: caption.range[0],
        end: caption.range[1],
        preview: () => this.seekStory(caption.range[0]),
      };
      const sync = () => {
        row.start = caption.range[0];
        row.end = caption.range[1];
        startCtrl.updateDisplay();
        endCtrl.updateDisplay();
      };
      const startCtrl = folder
        .add(row, 'start', 0, 1, 0.01)
        .name('Start')
        .onChange((value: number) => {
          caption.range[0] = clampOrdered(value, 0, caption.range[1] - 0.01);
          sync();
          this.seekStory(caption.range[0]);
          this.notifyTimingChanged();
        });
      const endCtrl = folder
        .add(row, 'end', 0, 1, 0.01)
        .name('End')
        .onChange((value: number) => {
          caption.range[1] = clampOrdered(value, caption.range[0] + 0.01, 1);
          sync();
          this.seekStory(caption.range[1]);
          this.notifyTimingChanged();
        });
      folder.add(row, 'preview').name('Preview start');
    });

    const hold = {
      chipHoldAfterArrive: STORY_CONFIG.chipHoldAfterArrive,
      captionFadeIn: STORY_CONFIG.captionFadeIn,
    };
    root
      .add(hold, 'chipHoldAfterArrive', 0, 0.4, 0.01)
      .name('Chip hold after arrive')
      .onChange((value: number) => {
        STORY_CONFIG.chipHoldAfterArrive = clamp01(value);
        this.notifyTimingChanged();
      });
    root
      .add(hold, 'captionFadeIn', 0, 0.3, 0.01)
      .name('Captions appear after')
      .onChange((value: number) => {
        STORY_CONFIG.captionFadeIn = clamp01(value);
      });
  }

  public populateLightsAndShadows() {
    if (!this.gui || this.lightsFolderPopulated) return;
    this.lightsFolderPopulated = true;

    const lightFolder = this.addTab('Lighting Controller');

    const view = {
      showGizmos: this.showGizmos,
      grabLamps: this.grabMode,
    };
    lightFolder
      .add(view, 'showGizmos')
      .name('Show lamp gizmos')
      .onChange((value: boolean) => {
        this.showGizmos = value;
        this.syncGizmoVisibility();
      });
    lightFolder
      .add(view, 'grabLamps')
      .name('Move lamps in scene')
      .onChange((value: boolean) => {
        this.setGrabMode(value);
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
          cfg.shadowMapSize = sh.mapSize?.width;
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
          .add(lightParams, 'distance', 0, 300, 1)
          .name('Distance Falloff')
          .listen()
          .onChange((v: number) => {
            (light as THREE.PointLight).distance = v;
            persistLight();
          });

        sub
          .add(lightParams, 'decay', 0, 4.0, 0.1)
          .name('Decay Exponent')
          .listen()
          .onChange((v: number) => {
            (light as THREE.PointLight).decay = v;
            persistLight();
          });
      }

      if (isArea) continue;

      const shadowSub = sub.addFolder('Shadows Settings');
      const sh = (light as THREE.Light & { shadow?: THREE.LightShadow }).shadow;
      const shadowParams = {
        castShadow: light.castShadow ?? true,
        radius: sh ? sh.radius ?? 2.27 : 2.27,
        bias: sh ? sh.bias ?? -0.0001 : -0.0001,
        mapSize: sh?.mapSize?.width ?? 2048,
      };

      shadowSub
        .add(shadowParams, 'castShadow')
        .name('Enable Shadows')
        .listen()
        .onChange((v: boolean) => {
          light.castShadow = v;
          this.renderer.shadowMap.needsUpdate = true;
          persistLight();
        });

      shadowSub
        .add(shadowParams, 'radius', 0, 20, 0.1)
        .name('Soft Shadow Radius')
        .listen()
        .onChange((v: number) => {
          if (sh) {
            sh.radius = v;
            sh.needsUpdate = true;
          }
          this.renderer.shadowMap.needsUpdate = true;
          persistLight();
        });

      shadowSub
        .add(shadowParams, 'bias', -0.005, 0.005, 0.0001)
        .name('Shadow Bias')
        .listen()
        .onChange((v: number) => {
          if (sh) {
            sh.bias = v;
            sh.needsUpdate = true;
          }
          this.renderer.shadowMap.needsUpdate = true;
          persistLight();
        });

      shadowSub
        .add(shadowParams, 'mapSize', [512, 1024, 2048, 4096])
        .name('Shadow Resolution')
        .onChange((v: number) => {
          const size = parseInt(String(v), 10);
          if (sh?.mapSize) {
            sh.mapSize.width = size;
            sh.mapSize.height = size;
            if (sh.map) {
              sh.map.dispose();
              sh.map = null as unknown as THREE.WebGLRenderTarget;
            }
            sh.needsUpdate = true;
          }
          this.renderer.shadowMap.needsUpdate = true;
          persistLight();
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
  }

  private refreshCamDisplay = () => {};

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
      cameraStops: SCENE_CONFIG.stops,
      scroll: SCENE_CONFIG.scroll,
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
    if (collapsed) this.setGrabMode(false);
    window.dispatchEvent(new CustomEvent('rastaak-studio-open', { detail: { open: !collapsed } }));
  }

  private syncGizmoVisibility() {
    this.lightGizmos?.setVisible(this.isOpen && this.showGizmos);
  }

  private setGrabMode(on: boolean) {
    if (this.grabMode === on) return;
    this.grabMode = on;
    document.body.classList.toggle('studio-grab-lamps', on);
    this.lightGizmos?.setGrabEnabled(on);
    if (on) {
      this.preGrabOrbit = this.isOrbitMode;
      this.isOrbitMode = true;
      this.onOrbitModeToggle?.(!this.orbitLockedByGizmo);
      this.renderer.domElement.style.pointerEvents = 'auto';
    } else {
      this.isOrbitMode = this.preGrabOrbit;
      this.onOrbitModeToggle?.(this.isOrbitMode);
      this.renderer.domElement.style.pointerEvents = '';
      this.orbitLockedByGizmo = false;
    }
  }

  public tick() {
    this.lightGizmos?.syncAll();
  }

  public destroy() {
    this.disposed = true;
    window.removeEventListener('rastaak-studio-toggle', this.onExternalToggle);
    window.removeEventListener('rastaak-studio-chrome-layout', this.onChromeLayout);
    window.removeEventListener('resize', this.onChromeLayout);
    this.chromeObserver?.disconnect();
    this.chromeObserver = null;
    this.setGrabMode(false);
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
    this.lightGizmos?.dispose();
    this.lightGizmos = null;
    this.lightUi.clear();
    this.timelinePanel?.destroy();
    this.timelinePanel = null;
  }
}
