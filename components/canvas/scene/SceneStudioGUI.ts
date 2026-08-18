import * as THREE from 'three';
import { tokens } from '@/tokens/design-tokens';
import { SCENE_CONFIG, CameraStop } from './sceneConfig';
import { LIGHTS_CONFIG } from './lightingConfig';

function downloadJSON(filename: string, data: any) {
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

const isPointLight = (l: any) =>
  l && (l.isPointLight || l.type === 'PointLight' || l.type === 'point');
const isSpotLight = (l: any) =>
  l && (l.isSpotLight || l.type === 'SpotLight' || l.type === 'spot');

export class SceneStudioGUI {
  private gui: any = null;
  private toggleButton: HTMLButtonElement | null = null;
  private isOpen = false;
  private materialsFolderPopulated = false;
  private lightsFolderPopulated = false;

  // Real-time camera override state
  public isManualMode = false;
  public isOrbitMode = false;
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
    this.createToggleButton();
    this.initGUI();
    this.initRaycaster();
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

    const onPointerDown = (e: MouseEvent) => {
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
        if (clickedObj && clickedObj.name) {
          const name = clickedObj.name;
          if (!name.toLowerCase().startsWith('cube') && !name.toLowerCase().startsWith('plane')) {
            console.log(`[3D Studio] Clicked Object: '${name}'`);
          }
        }
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
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

      // Enable smooth vertical mouse wheel scrolling on GUI panel
      const guiEl = this.gui.domElement;
      guiEl.style.zIndex = '999999';
      guiEl.style.position = 'fixed';
      guiEl.style.top = '90px';
      guiEl.style.right = '24px';
      guiEl.style.maxHeight = '80vh';
      guiEl.style.overflowY = 'auto';
      guiEl.style.pointerEvents = 'auto';

      // Prevent wheel event propagation to page scroll
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
      this.manualLookAt.set(14.0, 2.0, 0.0);

      // ─────────────────────────────────────────────────────────────────────────
      // 1. Camera & Stop Points Editor
      // ─────────────────────────────────────────────────────────────────────────
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
              parseFloat(this.camera.position.x.toFixed(1)),
              parseFloat(this.camera.position.y.toFixed(1)),
              parseFloat(this.camera.position.z.toFixed(1)),
            ],
            target: [
              parseFloat(this.manualLookAt.x.toFixed(1)),
              parseFloat(this.manualLookAt.y.toFixed(1)),
              parseFloat(this.manualLookAt.z.toFixed(1)),
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
            alert(`Copied all stop points to clipboard!`);
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

      // Populate lights, shadows, and materials
      this.populateLightsAndShadows();
      this.populateMaterials();

      // ─────────────────────────────────────────────────────────────────────────
      // 4. Atmosphere & Background & Fog
      // ─────────────────────────────────────────────────────────────────────────
      const envFolder = this.gui.addFolder('Environment & Fog');
      const currentBgHex = '#' + (this.scene.background as THREE.Color).getHexString();

      const envParams = {
        exposure: this.renderer.toneMappingExposure,
        bgColor: currentBgHex,
        fogNear: (this.scene.fog as THREE.Fog)?.near ?? 15,
        fogFar: (this.scene.fog as THREE.Fog)?.far ?? 110,
      };

      envFolder
        .add(envParams, 'exposure', 0.1, 3.0, 0.05)
        .name('Exposure')
        .listen()
        .onChange((v: number) => {
          this.renderer.toneMappingExposure = v;
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

      // ─────────────────────────────────────────────────────────────────────────
      // 5. Apply & Save directly to Source Code + Export JSON Tools
      // ─────────────────────────────────────────────────────────────────────────
      const exportFolder = this.gui.addFolder('Save & Export Tools');
      const exportParams = {
        applyAndSaveToCode: async () => {
          try {
            const payload = {
              cameraStops: SCENE_CONFIG.stops,
              lights: LIGHTS_CONFIG,
              environment: {
                backgroundColor: '#' + (this.scene.background as THREE.Color).getHexString(),
                fogStart: (this.scene.fog as THREE.Fog)?.near ?? SCENE_CONFIG.environment.fogStart,
                fogEnd: (this.scene.fog as THREE.Fog)?.far ?? SCENE_CONFIG.environment.fogEnd,
              },
            };

            const res = await fetch('/api/save-studio-config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok) {
              alert(
                '✅ Success! Your 3D camera, lighting, shadow, and fog edits have been written directly to your local TypeScript source files (sceneConfig.ts & lightingConfig.ts)!',
              );
            } else {
              alert(`⚠️ Error saving config: ${data.error || 'Unknown error'}`);
            }
          } catch (e: any) {
            alert(`⚠️ Error saving config: ${e.message}`);
          }
        },
        exportSceneJSON: () => {
          if (!this.scene) return;
          const json = this.scene.toJSON();
          downloadJSON('rastaak-threejs-scene.json', json);
        },
        exportConfigJSON: () => {
          const configData = {
            cameraStops: SCENE_CONFIG.stops,
            lights: LIGHTS_CONFIG,
            scroll: SCENE_CONFIG.scroll,
            environment: SCENE_CONFIG.environment,
          };
          downloadJSON('rastaak-scene-config.json', configData);
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

  public populateLightsAndShadows() {
    if (!this.gui || this.lightsFolderPopulated) return;
    this.lightsFolderPopulated = true;

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Real-time Lights & Shadows Controller
    // ─────────────────────────────────────────────────────────────────────────
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
        distance: (light as any).distance ?? 50,
        decay: (light as any).decay ?? 1.8,
      };

      sub
        .add(lightParams, 'intensity', 0, 5000, 10)
        .name('Power / Intensity')
        .listen()
        .onChange((v: number) => {
          light.intensity = v;
          const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
          if (cfg) cfg.intensity = v;
        });

      sub
        .addColor(lightParams, 'color')
        .name('Color')
        .listen()
        .onChange((v: string) => {
          light.color.set(new THREE.Color(v));
        });

      if (light.position) {
        const updateLightPos = () => {
          light.position.set(lightParams.posX, lightParams.posY, lightParams.posZ);
          light.updateMatrix();
          light.updateMatrixWorld(true);

          if ((light as any).target) {
            (light as any).target.updateMatrixWorld(true);
          }

          const sh = (light as any).shadow;
          if (sh) {
            sh.needsUpdate = true;
            if (sh.camera) {
              sh.camera.updateMatrixWorld(true);
              sh.camera.updateProjectionMatrix();
            }
          }
          this.renderer.shadowMap.needsUpdate = true;

          const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
          if (cfg && cfg.position) {
            cfg.position[0] = lightParams.posX;
            cfg.position[1] = lightParams.posY;
            cfg.position[2] = lightParams.posZ;
          }
        };

        sub
          .add(lightParams, 'posX', -100, 100, 0.5)
          .name('Position X')
          .listen()
          .onChange(() => updateLightPos());

        sub
          .add(lightParams, 'posY', -10, 100, 0.5)
          .name('Position Y')
          .listen()
          .onChange(() => updateLightPos());

        sub
          .add(lightParams, 'posZ', -100, 100, 0.5)
          .name('Position Z')
          .listen()
          .onChange(() => updateLightPos());
      }

      if (isPt || isSpot) {
        sub
          .add(lightParams, 'distance', 0, 300, 1)
          .name('Distance Falloff')
          .listen()
          .onChange((v: number) => {
            (light as any).distance = v;
            const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
            if (cfg) cfg.distance = v;
          });

        sub
          .add(lightParams, 'decay', 0, 4.0, 0.1)
          .name('Decay Exponent')
          .listen()
          .onChange((v: number) => {
            (light as any).decay = v;
            const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
            if (cfg) cfg.decay = v;
          });
      }

      // Add Shadow Settings directly inside each light subfolder
      const shadowSub = sub.addFolder('Shadows Settings');
      const sh = (light as any).shadow;

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
          const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
          if (cfg) cfg.castShadow = v;
        });

      shadowSub
        .add(shadowParams, 'radius', 0, 20, 0.1)
        .name('Soft Shadow Radius')
        .listen()
        .onChange((v: number) => {
          if ((light as any).shadow) {
            (light as any).shadow.radius = v;
            (light as any).shadow.needsUpdate = true;
          }
          this.renderer.shadowMap.needsUpdate = true;
          const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
          if (cfg) cfg.radius = v;
        });

      shadowSub
        .add(shadowParams, 'bias', -0.005, 0.005, 0.0001)
        .name('Shadow Bias')
        .listen()
        .onChange((v: number) => {
          if ((light as any).shadow) {
            (light as any).shadow.bias = v;
            (light as any).shadow.needsUpdate = true;
          }
          this.renderer.shadowMap.needsUpdate = true;
          const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
          if (cfg) cfg.shadowBias = v;
        });

      shadowSub
        .add(shadowParams, 'mapSize', [512, 1024, 2048, 4096])
        .name('Shadow Resolution')
        .onChange((v: number) => {
          const size = parseInt(String(v), 10);
          const shadowObj = (light as any).shadow;
          if (shadowObj && shadowObj.mapSize) {
            shadowObj.mapSize.width = size;
            shadowObj.mapSize.height = size;
            if (shadowObj.map) {
              shadowObj.map.dispose();
              shadowObj.map = null;
            }
            shadowObj.needsUpdate = true;
          }
          this.renderer.shadowMap.needsUpdate = true;
          const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
          if (cfg) cfg.shadowMapSize = size;
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Dedicated Shadows Controller (Duck-typing check)
    // ─────────────────────────────────────────────────────────────────────────
    const shadowFolder = this.gui.addFolder('Shadows Controller');

    for (const [id, light] of this.lightsMap.entries()) {
      const shadowObj = (light as any).shadow;
      const isShadowCapable =
        shadowObj ||
        (light as any).isPointLight ||
        (light as any).isDirectionalLight ||
        (light as any).isSpotLight ||
        light.type === 'PointLight' ||
        light.type === 'DirectionalLight' ||
        light.type === 'SpotLight';

      if (isShadowCapable) {
        const sub = shadowFolder.addFolder(id);

        const shadowParams = {
          castShadow: light.castShadow ?? true,
          radius: shadowObj ? shadowObj.radius ?? 2.27 : 2.27,
          bias: shadowObj ? shadowObj.bias ?? -0.0001 : -0.0001,
          mapSize: shadowObj?.mapSize?.width ?? 2048,
        };

        sub
          .add(shadowParams, 'castShadow')
          .name('Enable Shadows')
          .listen()
          .onChange((v: boolean) => {
            light.castShadow = v;
            this.renderer.shadowMap.needsUpdate = true;
            const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
            if (cfg) cfg.castShadow = v;
          });

        sub
          .add(shadowParams, 'radius', 0, 20, 0.1)
          .name('Soft Shadow Radius')
          .listen()
          .onChange((v: number) => {
            if ((light as any).shadow) {
              (light as any).shadow.radius = v;
              (light as any).shadow.needsUpdate = true;
            }
            this.renderer.shadowMap.needsUpdate = true;
            const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
            if (cfg) cfg.radius = v;
          });

        sub
          .add(shadowParams, 'bias', -0.005, 0.005, 0.0001)
          .name('Shadow Bias')
          .listen()
          .onChange((v: number) => {
            if ((light as any).shadow) {
              (light as any).shadow.bias = v;
              (light as any).shadow.needsUpdate = true;
            }
            this.renderer.shadowMap.needsUpdate = true;
            const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
            if (cfg) cfg.shadowBias = v;
          });

        sub
          .add(shadowParams, 'mapSize', [512, 1024, 2048, 4096])
          .name('Shadow Resolution')
          .onChange((v: number) => {
            const size = parseInt(String(v), 10);
            const sh = (light as any).shadow;
            if (sh && sh.mapSize) {
              sh.mapSize.width = size;
              sh.mapSize.height = size;
              if (sh.map) {
                sh.map.dispose();
                sh.map = null;
              }
              sh.needsUpdate = true;
            }
            this.renderer.shadowMap.needsUpdate = true;
            const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
            if (cfg) cfg.shadowMapSize = size;
          });
      }
    }
  }

  public populateMaterials() {
    if (!this.gui || this.materialsFolderPopulated) return;

    const worldGroup = this.worldGroupSupplier();
    if (!worldGroup) return;

    const matFolder = this.gui.addFolder('Materials Controller');
    this.materialsFolderPopulated = true;

    const isValidNamedObject = (name: string) => {
      if (!name) return false;
      const lower = name.toLowerCase().trim();
      if (
        lower.startsWith('cube') ||
        lower.startsWith('plane') ||
        lower.startsWith('mesh') ||
        lower.startsWith('object')
      ) {
        return false;
      }
      return true;
    };

    const facadeMaterials: { name: string; mat: THREE.MeshStandardMaterial }[] = [];
    const windowMaterials: { name: string; mat: THREE.MeshStandardMaterial }[] = [];

    worldGroup.traverse((child: any) => {
      let displayName = child.name;
      if (child.parent && child.parent.name && isValidNamedObject(child.parent.name)) {
        displayName = child.parent.name;
      }

      if (child.isMesh && child.material && isValidNamedObject(displayName)) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        if (mats[0] && (mats[0].isMeshStandardMaterial || mats[0].isMeshBasicMaterial)) {
          facadeMaterials.push({ name: `${displayName} (Facade)`, mat: mats[0] });
        }
        if (mats[1] && (mats[1].isMeshStandardMaterial || mats[1].isMeshBasicMaterial)) {
          windowMaterials.push({ name: `${displayName} (Windows/Insets)`, mat: mats[1] });
        }
      }
    });

    if (facadeMaterials.length === 0 && windowMaterials.length === 0) return;

    // Group 1: Light Building Facades (Main Body Color)
    if (facadeMaterials.length > 0) {
      const facadeGroupSub = matFolder.addFolder('💡 Light Building Facades (Main Body)');
      const defaultLightHex = '#' + (facadeMaterials[0].mat.color ? facadeMaterials[0].mat.color.getHexString() : 'ffffff');

      const facadeParams = {
        color: defaultLightHex,
        roughness: facadeMaterials[0].mat.roughness ?? 0.6,
        metalness: facadeMaterials[0].mat.metalness ?? 0.1,
      };

      facadeGroupSub
        .addColor(facadeParams, 'color')
        .name('Light Facades Color')
        .listen()
        .onChange((hex: string) => {
          const col = new THREE.Color(hex);
          facadeMaterials.forEach((b) => {
            if (b.mat.color) b.mat.color.copy(col);
            b.mat.needsUpdate = true;
          });
        });

      facadeGroupSub
        .add(facadeParams, 'roughness', 0.0, 1.0, 0.02)
        .name('Roughness')
        .listen()
        .onChange((v: number) => {
          facadeMaterials.forEach((b) => {
            b.mat.roughness = v;
            b.mat.needsUpdate = true;
          });
        });

      facadeGroupSub
        .add(facadeParams, 'metalness', 0.0, 1.0, 0.02)
        .name('Metalness')
        .listen()
        .onChange((v: number) => {
          facadeMaterials.forEach((b) => {
            b.mat.metalness = v;
            b.mat.needsUpdate = true;
          });
        });
    }

    // Group 2: Building Windows & Insets (Dark Accents)
    if (windowMaterials.length > 0) {
      const windowGroupSub = matFolder.addFolder('🪟 Building Windows & Insets (Dark Accents)');
      const defaultWindowHex = '#' + (windowMaterials[0].mat.color ? windowMaterials[0].mat.color.getHexString() : '222222');

      const windowParams = {
        color: defaultWindowHex,
        roughness: windowMaterials[0].mat.roughness ?? 0.6,
      };

      windowGroupSub
        .addColor(windowParams, 'color')
        .name('Windows & Insets Color')
        .listen()
        .onChange((hex: string) => {
          const col = new THREE.Color(hex);
          windowMaterials.forEach((b) => {
            if (b.mat.color) b.mat.color.copy(col);
            b.mat.needsUpdate = true;
          });
        });

      windowGroupSub
        .add(windowParams, 'roughness', 0.0, 1.0, 0.02)
        .name('Roughness')
        .listen()
        .onChange((v: number) => {
          windowMaterials.forEach((b) => {
            b.mat.roughness = v;
            b.mat.needsUpdate = true;
          });
        });
    }

    // Group 3: Individual Building Main Body Colors
    const indBldgSub = matFolder.addFolder('🏢 Individual Building Facades');

    facadeMaterials.forEach((b) => {
      const sub = indBldgSub.addFolder(b.name);
      const defaultColorHex = '#' + (b.mat.color ? b.mat.color.getHexString() : 'ffffff');

      const bldgParams = {
        color: defaultColorHex,
        roughness: b.mat.roughness ?? 0.6,
        metalness: b.mat.metalness ?? 0.1,
        wireframe: b.mat.wireframe ?? false,
      };

      if (b.mat.color) {
        sub
          .addColor(bldgParams, 'color')
          .name('Main Body Color')
          .listen()
          .onChange((hex: string) => {
            b.mat.color.set(new THREE.Color(hex));
            b.mat.needsUpdate = true;
          });
      }

      sub
        .add(bldgParams, 'roughness', 0.0, 1.0, 0.02)
        .name('Roughness')
        .listen()
        .onChange((v: number) => {
          b.mat.roughness = v;
          b.mat.needsUpdate = true;
        });

      sub
        .add(bldgParams, 'metalness', 0.0, 1.0, 0.02)
        .name('Metalness')
        .listen()
        .onChange((v: number) => {
          b.mat.metalness = v;
          b.mat.needsUpdate = true;
        });

      sub
        .add(bldgParams, 'wireframe')
        .name('Wireframe')
        .listen()
        .onChange((v: boolean) => {
          b.mat.wireframe = v;
          b.mat.needsUpdate = true;
        });
    });
  }

  private refreshCamDisplay = () => {};

  public destroy() {
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
