import * as THREE from 'three';
import { tokens } from '@/tokens/design-tokens';
import { SCENE_CONFIG } from './sceneConfig';
import { LIGHTS_CONFIG } from './lightingConfig';
import type { CameraStop, LightConfig, StudioSavePayload } from './sceneTypes';
import { STORY_CONFIG, applyStoryTheme } from './storyConfig';
import { FLOW_CONFIG } from '@/components/home/flowConfig';
import {
  collectMaterialsConfig,
  collectTrackedMaterials,
  countMaterialOverrides,
  isSiteMesh,
  type TrackedMaterial,
} from './materialKeys';

function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const isPointLight = (l: THREE.Light) =>
  (l as THREE.PointLight).isPointLight || l.type === 'PointLight';
const isSpotLight = (l: THREE.Light) =>
  (l as THREE.SpotLight).isSpotLight || l.type === 'SpotLight';
const isHemisphereLight = (l: THREE.Light) =>
  (l as THREE.HemisphereLight).isHemisphereLight || l.type === 'HemisphereLight';

function colorToHexNumber(color: THREE.Color): number {
  return color.getHex();
}

function syncFlowDom() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll<HTMLElement>('.flow__step').forEach((el, index) => {
    const step = FLOW_CONFIG[index];
    if (!step) return;
    const title = el.querySelector('.flow__title');
    const description = el.querySelector('.flow__description');
    if (title) title.textContent = step.title;
    if (description) {
      description.textContent = '';
      if (step.subtitle) {
        description.append(step.subtitle, document.createElement('br'));
      }
      description.append(step.caption);
    }
  });
}

export class SceneStudioGUI {
  private gui: any = null;
  private toggleButton: HTMLButtonElement | null = null;
  private isOpen = false;
  private materialsFolderPopulated = false;
  private lightsFolderPopulated = false;
  private pointerHandler: ((e: MouseEvent) => void) | null = null;
  private trackedMaterials: TrackedMaterial[] = [];
  private globalFacade = {
    color: '#' + new THREE.Color(tokens.experimentalScene.lightFacadeDefault).getHexString(),
    roughness: 0.6,
    metalness: 0.12,
  };
  private globalWindow = {
    color: '#' + new THREE.Color(tokens.experimentalScene.windowInsetDefault).getHexString(),
    roughness: 0.6,
    metalness: 0.0,
  };

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
    this.createToggleButton();
    this.initGUI();
    this.initRaycaster();
  }

  private hydrateGlobalsFromConfig() {
    const mats = SCENE_CONFIG.materials;
    if (mats.globalFacadeColor !== undefined) {
      this.globalFacade.color = '#' + new THREE.Color(mats.globalFacadeColor).getHexString();
    }
    if (mats.globalWindowColor !== undefined) {
      this.globalWindow.color = '#' + new THREE.Color(mats.globalWindowColor).getHexString();
    }
    if (mats.globalFacadeRoughness !== undefined) this.globalFacade.roughness = mats.globalFacadeRoughness;
    if (mats.globalFacadeMetalness !== undefined) this.globalFacade.metalness = mats.globalFacadeMetalness;
    if (mats.globalWindowRoughness !== undefined) this.globalWindow.roughness = mats.globalWindowRoughness;
    if (mats.globalWindowMetalness !== undefined) this.globalWindow.metalness = mats.globalWindowMetalness;
  }

  private createToggleButton() {
    if (document.getElementById('rastaak-studio-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'rastaak-studio-btn';
    btn.innerHTML = '🎛️ 3D Studio';
    btn.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      background: ${tokens.colors.debugPanelBg};
      color: ${tokens.colors.textLight};
      border: 1px solid ${tokens.colors.borderDarkSubtle};
      padding: 10px 18px;
      border-radius: 9999px;
      font-size: 13px;
      font-family: monospace;
      font-weight: bold;
      cursor: pointer;
      box-shadow: ${tokens.shadows.glass};
      backdrop-filter: blur(10px);
      transition: all 0.2s ease;
      pointer-events: auto;
    `;

    btn.addEventListener('click', () => {
      if (!this.gui) {
        this.initGUI(true);
      } else {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
          this.gui.show();
          this.gui.open();
        } else {
          this.gui.hide();
        }
      }
    });

    document.body.appendChild(btn);
    this.toggleButton = btn;
  }

  private initRaycaster() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    this.pointerHandler = (e: MouseEvent) => {
      if (!this.isOpen && !this.isManualMode && !this.isOrbitMode) return;
      if (
        (e.target as HTMLElement)?.closest('.lil-gui') ||
        (e.target as HTMLElement)?.id === 'rastaak-studio-btn'
      ) {
        return;
      }

      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
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

    window.addEventListener('pointerdown', this.pointerHandler);
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
    const worldGroup = this.worldGroupSupplier();
    if (!worldGroup) {
      return {
        globalFacadeColor: new THREE.Color(this.globalFacade.color).getHex(),
        globalWindowColor: new THREE.Color(this.globalWindow.color).getHex(),
        globalFacadeRoughness: this.globalFacade.roughness,
        globalFacadeMetalness: this.globalFacade.metalness,
        globalWindowRoughness: this.globalWindow.roughness,
        globalWindowMetalness: this.globalWindow.metalness,
        overrides: { ...SCENE_CONFIG.materials.overrides },
      };
    }

    return collectMaterialsConfig(worldGroup, {
      globalFacadeColor: new THREE.Color(this.globalFacade.color).getHex(),
      globalWindowColor: new THREE.Color(this.globalWindow.color).getHex(),
      globalFacadeRoughness: this.globalFacade.roughness,
      globalFacadeMetalness: this.globalFacade.metalness,
      globalWindowRoughness: this.globalWindow.roughness,
      globalWindowMetalness: this.globalWindow.metalness,
    });
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
        fogStart: fog?.near ?? SCENE_CONFIG.environment.fogStart,
        fogEnd: fog?.far ?? SCENE_CONFIG.environment.fogEnd,
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
      },
      flowSteps: FLOW_CONFIG.map((step) => ({
        ...step,
        progressRange: [...step.progressRange] as [number, number],
      })),
    };
  }

  private writePayloadIntoMemory(payload: StudioSavePayload) {
    SCENE_CONFIG.stops.splice(0, SCENE_CONFIG.stops.length, ...payload.cameraStops);
    SCENE_CONFIG.environment.backgroundColor = payload.environment.backgroundColor;
    SCENE_CONFIG.environment.fogStart = payload.environment.fogStart;
    SCENE_CONFIG.environment.fogEnd = payload.environment.fogEnd;
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
  }

  private async initGUI(forceOpen = false) {
    if (this.gui) {
      if (forceOpen) {
        this.isOpen = true;
        this.gui.show();
        this.gui.open();
      }
      return;
    }

    try {
      const { GUI } = await import('lil-gui');
      this.gui = new GUI({ title: 'Rastaak 3D Studio' });

      const guiEl = this.gui.domElement;
      guiEl.style.zIndex = '999999';
      guiEl.style.position = 'fixed';
      guiEl.style.top = '90px';
      guiEl.style.right = '24px';
      guiEl.style.maxHeight = '80vh';
      guiEl.style.overflowY = 'auto';
      guiEl.style.pointerEvents = 'auto';

      guiEl.addEventListener(
        'wheel',
        (e: WheelEvent) => {
          e.stopPropagation();
        },
        { capture: true, passive: false },
      );

      guiEl.addEventListener(
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

      const camFolder = this.gui.addFolder('Camera & Stop Points');

      let currentStopIndex = 0;
      const getStopNames = () => SCENE_CONFIG.stops.map((s, i) => `${i + 1}. ${s.id}`);

      const camParams = {
        mode: 'Scroll Journey',
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

      const envFolder = this.gui.addFolder('Environment & Fog');
      const currentBgHex = '#' + (
        this.scene.background instanceof THREE.Color
          ? this.scene.background.getHexString()
          : new THREE.Color(SCENE_CONFIG.environment.backgroundColor).getHexString()
      );

      const envParams = {
        exposure: this.renderer.toneMappingExposure,
        bgColor: currentBgHex,
        fogNear: (this.scene.fog as THREE.Fog)?.near ?? SCENE_CONFIG.environment.fogStart,
        fogFar: (this.scene.fog as THREE.Fog)?.far ?? SCENE_CONFIG.environment.fogEnd,
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
          if (this.scene.fog) {
            this.scene.fog.color = col;
          }
          document.body.style.backgroundColor = v;
          SCENE_CONFIG.environment.backgroundColor = col.getHex();
        });

      if (this.scene.fog) {
        envFolder
          .add(envParams, 'fogNear', 0, 100, 1)
          .name('Fog Clear Distance')
          .listen()
          .onChange((v: number) => {
            (this.scene.fog as THREE.Fog).near = v;
            SCENE_CONFIG.environment.fogStart = v;
          });

        envFolder
          .add(envParams, 'fogFar', 10, 250, 2)
          .name('Fog Max Distance')
          .listen()
          .onChange((v: number) => {
            (this.scene.fog as THREE.Fog).far = v;
            SCENE_CONFIG.environment.fogEnd = v;
          });
      }

      const exportFolder = this.gui.addFolder('Save & Export Tools');
      const exportParams = {
        applyAndSaveToCode: async () => {
          try {
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
              alert(
                'Saved. Camera, lights, story colors, timeline titles, and materials were written to code. Refresh will restore this exact scene.',
              );
            } else {
              alert(`Error saving config: ${data.error || 'Unknown error'}`);
            }
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            alert(`Error saving config: ${message}`);
          }
        },
        exportSceneJSON: () => {
          if (!this.scene) return;
          const json = this.scene.toJSON();
          downloadJSON('rastaak-threejs-scene.json', json);
        },
        exportConfigJSON: () => {
          downloadJSON('rastaak-scene-config.json', this.buildSavePayload());
        },
      };

      exportFolder.add(exportParams, 'applyAndSaveToCode').name('💾 Apply & Save directly to Code');
      exportFolder.add(exportParams, 'exportSceneJSON').name('📥 Export Scene (.json)');
      exportFolder.add(exportParams, 'exportConfigJSON').name('📥 Export Config (.json)');

      const urlParams = new URLSearchParams(window.location.search);
      const startOpen =
        forceOpen || urlParams.has('studio') || urlParams.has('debug');

      this.isOpen = startOpen;
      if (startOpen) {
        this.gui.show();
        this.gui.open();
      } else {
        this.gui.hide();
      }
    } catch (e) {
      console.log('[SceneStudioGUI] lil-gui dynamic import skipped:', e);
    }
  }

  private populateStoryControls() {
    if (!this.gui) return;
    applyStoryTheme();

    const hex = (value: number) => '#' + new THREE.Color(value).getHexString();
    const storyFolder = this.gui.addFolder('Story Colors & Titles');

    const colorParams = {
      packet: hex(STORY_CONFIG.colors.packet),
      hubPulse: hex(STORY_CONFIG.colors.hubPulse),
      need: hex(STORY_CONFIG.colors.need),
      resolved: hex(STORY_CONFIG.colors.resolved),
      chipNeed: hex(STORY_CONFIG.colors.chipNeed ?? STORY_CONFIG.colors.need),
      chipResolved: hex(STORY_CONFIG.colors.chipResolved ?? STORY_CONFIG.colors.resolved),
    };

    const applyColor = (key: keyof typeof colorParams, value: string) => {
      STORY_CONFIG.colors[key] = new THREE.Color(value).getHex();
      applyStoryTheme();
    };

    storyFolder.addColor(colorParams, 'packet').name('Shooting light').onChange((v: string) => applyColor('packet', v));
    storyFolder.addColor(colorParams, 'hubPulse').name('Rastaak glow').onChange((v: string) => applyColor('hubPulse', v));
    storyFolder.addColor(colorParams, 'need').name('Client before solve').onChange((v: string) => applyColor('need', v));
    storyFolder.addColor(colorParams, 'resolved').name('Client after solve').onChange((v: string) => applyColor('resolved', v));
    storyFolder.addColor(colorParams, 'chipNeed').name('Tick before solve').onChange((v: string) => applyColor('chipNeed', v));
    storyFolder.addColor(colorParams, 'chipResolved').name('Tick after solve').onChange((v: string) => applyColor('chipResolved', v));

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

    const titlesFolder = storyFolder.addFolder('Timeline titles');
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

  public populateLightsAndShadows() {
    if (!this.gui || this.lightsFolderPopulated) return;
    this.lightsFolderPopulated = true;

    const lightFolder = this.gui.addFolder('Lighting Controller');

    for (const [id, light] of this.lightsMap.entries()) {
      const sub = lightFolder.addFolder(id);
      const isPt = isPointLight(light);
      const isSpot = isSpotLight(light);

      const lightParams = {
        type: light.type,
        intensity: light.intensity,
        color: '#' + light.color.getHexString(),
        posX: light.position ? light.position.x : 0,
        posY: light.position ? light.position.y : 0,
        posZ: light.position ? light.position.z : 0,
        distance: (light as THREE.PointLight).distance ?? 40,
        decay: (light as THREE.PointLight).decay ?? 1.8,
      };

      const persistLight = () => {
        const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
        if (!cfg) return;
        cfg.intensity = light.intensity;
        cfg.color = colorToHexNumber(light.color);
        if (light.position) {
          cfg.position = [light.position.x, light.position.y, light.position.z];
        }
        if (isPt || isSpot) {
          cfg.distance = (light as THREE.PointLight).distance;
          cfg.decay = (light as THREE.PointLight).decay;
        }
        cfg.castShadow = light.castShadow;
        const sh = (light as THREE.Light & { shadow?: THREE.LightShadow }).shadow;
        if (sh) {
          cfg.radius = sh.radius;
          cfg.shadowBias = sh.bias;
          cfg.shadowMapSize = sh.mapSize?.width;
        }
      };

      sub
        .add(lightParams, 'intensity', 0, 5000, 10)
        .name('Power / Intensity')
        .listen()
        .onChange((v: number) => {
          light.intensity = v;
          persistLight();
        });

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

    this.trackedMaterials = collectTrackedMaterials(worldGroup);
    if (this.trackedMaterials.length === 0) {
      console.warn('[3D Studio] No building materials found to edit.');
      return;
    }

    const matFolder = this.gui.addFolder('Materials Controller');
    this.materialsFolderPopulated = true;

    const facades = this.trackedMaterials.filter((entry) => entry.role === 'facade');
    const windows = this.trackedMaterials.filter((entry) => entry.role === 'window');

    const applyGroup = (
      entries: TrackedMaterial[],
      patch: Partial<{ color: string; roughness: number; metalness: number }>,
    ) => {
      const col = patch.color ? new THREE.Color(patch.color) : null;
      entries.forEach((entry) => {
        const targets = entry.mats?.length ? entry.mats : [entry.mat];
        targets.forEach((mat) => {
          if (col) mat.color.copy(col);
          if (patch.roughness !== undefined && 'roughness' in mat) mat.roughness = patch.roughness;
          if (patch.metalness !== undefined && 'metalness' in mat) mat.metalness = patch.metalness;
          mat.needsUpdate = true;
        });
        if (col) entry.params.color = patch.color!;
        if (patch.roughness !== undefined) entry.params.roughness = patch.roughness;
        if (patch.metalness !== undefined) entry.params.metalness = patch.metalness;
      });
    };

    const addMaterialControls = (
      folder: any,
      params: { color: string; roughness: number; metalness: number },
      onChange: (patch: Partial<{ color: string; roughness: number; metalness: number }>) => void,
      labels: { color: string },
    ) => {
      folder
        .addColor(params, 'color')
        .name(labels.color)
        .listen()
        .onChange((hex: string) => onChange({ color: hex }));
      folder
        .add(params, 'roughness', 0.0, 1.0, 0.02)
        .name('Roughness')
        .listen()
        .onChange((v: number) => onChange({ roughness: v }));
      folder
        .add(params, 'metalness', 0.0, 1.0, 0.02)
        .name('Metalness')
        .listen()
        .onChange((v: number) => onChange({ metalness: v }));
    };

    if (facades.length > 0) {
      const facadeGroupSub = matFolder.addFolder('All Building Facades');
      addMaterialControls(
        facadeGroupSub,
        this.globalFacade,
        (patch) => applyGroup(facades, patch),
        { color: 'Facade Color' },
      );
    }

    if (windows.length > 0) {
      const windowGroupSub = matFolder.addFolder('All Building Windows');
      addMaterialControls(
        windowGroupSub,
        this.globalWindow,
        (patch) => applyGroup(windows, patch),
        { color: 'Window Color' },
      );
    }

    const buildings = new Map<string, { name: string; facade?: TrackedMaterial; window?: TrackedMaterial }>();
    for (const entry of this.trackedMaterials) {
      if (isSiteMesh(entry.displayName)) continue;
      const group = buildings.get(entry.buildingId) ?? { name: entry.displayName };
      if (entry.role === 'window') group.window = entry;
      else group.facade = entry;
      buildings.set(entry.buildingId, group);
    }

    const indBldgSub = matFolder.addFolder('Each Building (Body + Windows)');
    buildings.forEach((group) => {
      const sub = indBldgSub.addFolder(group.name);
      if (group.facade) {
        addMaterialControls(
          sub,
          group.facade.params,
          (patch) => applyGroup([group.facade!], patch),
          { color: 'Building Color' },
        );
      }
      if (group.window) {
        addMaterialControls(
          sub,
          group.window.params,
          (patch) => applyGroup([group.window!], patch),
          { color: 'Window Color' },
        );
      }
    });
  }

  private refreshCamDisplay = () => {};

  public destroy() {
    if (this.pointerHandler) {
      window.removeEventListener('pointerdown', this.pointerHandler);
      this.pointerHandler = null;
    }
    if (this.toggleButton) {
      this.toggleButton.remove();
      this.toggleButton = null;
    }
    if (this.gui) {
      this.gui.destroy();
      this.gui = null;
    }
  }
}
