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

export class SceneStudioGUI {
  private gui: any = null;
  private toggleButton: HTMLButtonElement | null = null;
  private isOpen = false;
  private materialsFolderPopulated = false;

  // Real-time camera override state
  public isManualMode = false;
  public manualCamPos = new THREE.Vector3();
  public manualLookAt = new THREE.Vector3();

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera,
    private renderer: THREE.WebGLRenderer,
    private lightsMap: Map<string, THREE.Light>,
    private worldGroupSupplier: () => THREE.Group | null,
    private onProgressChange?: (t: number) => void,
  ) {
    if (typeof window === 'undefined') return;
    this.createToggleButton();
    this.initGUI();
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

      this.gui.domElement.style.zIndex = '999999';
      this.gui.domElement.style.position = 'fixed';
      this.gui.domElement.style.top = '90px';
      this.gui.domElement.style.right = '24px';

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
              parseFloat(this.manualCamPos.x.toFixed(1)),
              parseFloat(this.manualCamPos.y.toFixed(1)),
              parseFloat(this.manualCamPos.z.toFixed(1)),
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
        .add(camParams, 'mode', ['Scroll Journey', 'Manual Live Camera'])
        .name('Mode')
        .onChange((v: string) => {
          this.isManualMode = v === 'Manual Live Camera';
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

      // ─────────────────────────────────────────────────────────────────────────
      // 2. Real-time Lights Controller
      // ─────────────────────────────────────────────────────────────────────────
      const lightFolder = this.gui.addFolder('Lighting Controller');

      for (const [id, light] of this.lightsMap.entries()) {
        const sub = lightFolder.addFolder(id);

        const lightParams = {
          intensity: light.intensity,
          color: '#' + light.color.getHexString(),
          posX: light.position ? light.position.x : 0,
          posY: light.position ? light.position.y : 0,
          posZ: light.position ? light.position.z : 0,
          distance: (light as any).distance ?? 40,
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
          sub
            .add(lightParams, 'posX', -100, 100, 0.5)
            .name('Position X')
            .listen()
            .onChange((v: number) => {
              light.position.x = v;
              if ((light as any).target) (light as any).target.updateMatrixWorld();
              const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
              if (cfg && cfg.position) cfg.position[0] = v;
            });

          sub
            .add(lightParams, 'posY', -10, 100, 0.5)
            .name('Position Y')
            .listen()
            .onChange((v: number) => {
              light.position.y = v;
              if ((light as any).target) (light as any).target.updateMatrixWorld();
              const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
              if (cfg && cfg.position) cfg.position[1] = v;
            });

          sub
            .add(lightParams, 'posZ', -100, 100, 0.5)
            .name('Position Z')
            .listen()
            .onChange((v: number) => {
              light.position.z = v;
              if ((light as any).target) (light as any).target.updateMatrixWorld();
              const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
              if (cfg && cfg.position) cfg.position[2] = v;
            });
        }

        if (light instanceof THREE.PointLight || light instanceof THREE.SpotLight) {
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
      }

      // ─────────────────────────────────────────────────────────────────────────
      // 3. Dedicated Shadows Controller
      // ─────────────────────────────────────────────────────────────────────────
      const shadowFolder = this.gui.addFolder('Shadows Controller');

      for (const [id, light] of this.lightsMap.entries()) {
        const shadowObj = (light as any).shadow;
        if (!shadowObj) continue;

        const sub = shadowFolder.addFolder(id);

        const shadowParams = {
          castShadow: light.castShadow,
          radius: shadowObj.radius ?? 2.27,
          bias: shadowObj.bias ?? -0.0001,
          mapSize: shadowObj.mapSize?.width ?? 2048,
        };

        sub
          .add(shadowParams, 'castShadow')
          .name('Enable Shadow')
          .listen()
          .onChange((v: boolean) => {
            light.castShadow = v;
            const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
            if (cfg) cfg.castShadow = v;
          });

        sub
          .add(shadowParams, 'radius', 0, 20, 0.1)
          .name('Soft Shadow Radius')
          .listen()
          .onChange((v: number) => {
            shadowObj.radius = v;
            const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
            if (cfg) cfg.radius = v;
          });

        sub
          .add(shadowParams, 'bias', -0.005, 0.005, 0.0001)
          .name('Shadow Bias')
          .listen()
          .onChange((v: number) => {
            shadowObj.bias = v;
            const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
            if (cfg) cfg.shadowBias = v;
          });

        sub
          .add(shadowParams, 'mapSize', [512, 1024, 2048, 4096])
          .name('Shadow Map Resolution')
          .onChange((v: number) => {
            const size = parseInt(String(v), 10);
            shadowObj.mapSize.width = size;
            shadowObj.mapSize.height = size;
            if (shadowObj.map) {
              shadowObj.map.dispose();
              shadowObj.map = null;
            }
            const cfg = LIGHTS_CONFIG.find((l) => l.id === id);
            if (cfg) cfg.shadowMapSize = size;
          });
      }

      // Populate materials
      this.populateMaterials();

      // ─────────────────────────────────────────────────────────────────────────
      // 4. Atmosphere & Background
      // ─────────────────────────────────────────────────────────────────────────
      const envFolder = this.gui.addFolder('Environment & Atmosphere');
      const currentBgHex = '#' + (this.scene.background as THREE.Color).getHexString();

      const envParams = {
        exposure: this.renderer.toneMappingExposure,
        bgColor: currentBgHex,
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
                fogStart: SCENE_CONFIG.environment.fogStart,
                fogEnd: SCENE_CONFIG.environment.fogEnd,
              },
            };

            const res = await fetch('/api/save-studio-config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok) {
              alert('✅ Success! Your 3D camera, lighting, and shadow edits have been written directly to your local TypeScript source files (sceneConfig.ts & lightingConfig.ts)!');
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

  public populateMaterials() {
    if (!this.gui || this.materialsFolderPopulated) return;

    const worldGroup = this.worldGroupSupplier();
    if (!worldGroup) return;

    const matFolder = this.gui.addFolder('Materials Controller');
    this.materialsFolderPopulated = true;

    const buildingMeshes: { name: string; mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial }[] = [];

    worldGroup.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m: any) => {
          if (m && (m.isMeshStandardMaterial || m.isMeshBasicMaterial || m.isMeshPhysicalMaterial)) {
            const meshName = child.name || `Building_${child.id}`;
            buildingMeshes.push({ name: meshName, mesh: child, mat: m });
          }
        });
      }
    });

    if (buildingMeshes.length === 0) return;

    const lightBuildingMeshes = buildingMeshes.filter((b) => {
      if (!b.mat.color) return false;
      const l = (b.mat.color.r + b.mat.color.g + b.mat.color.b) / 3;
      return l >= 0.5;
    });

    // Group 1: Light Color Materials (Batch Control)
    if (lightBuildingMeshes.length > 0) {
      const lightGroupSub = matFolder.addFolder('💡 ALL Light Buildings (Batch)');
      const defaultLightHex = '#' + lightBuildingMeshes[0].mat.color.getHexString();

      const lightParams = {
        color: defaultLightHex,
        roughness: lightBuildingMeshes[0].mat.roughness ?? 0.6,
        metalness: lightBuildingMeshes[0].mat.metalness ?? 0.1,
      };

      lightGroupSub
        .addColor(lightParams, 'color')
        .name('All Light Buildings Color')
        .listen()
        .onChange((hex: string) => {
          const col = new THREE.Color(hex);
          lightBuildingMeshes.forEach((b) => {
            b.mat.color.copy(col);
            b.mat.needsUpdate = true;
          });
        });

      lightGroupSub
        .add(lightParams, 'roughness', 0.0, 1.0, 0.02)
        .name('Roughness')
        .listen()
        .onChange((v: number) => {
          lightBuildingMeshes.forEach((b) => {
            b.mat.roughness = v;
            b.mat.needsUpdate = true;
          });
        });

      lightGroupSub
        .add(lightParams, 'metalness', 0.0, 1.0, 0.02)
        .name('Metalness')
        .listen()
        .onChange((v: number) => {
          lightBuildingMeshes.forEach((b) => {
            b.mat.metalness = v;
            b.mat.needsUpdate = true;
          });
        });
    }

    // Group 2: Individual Building Colors
    const indBldgSub = matFolder.addFolder('🏢 Individual Building Colors');

    buildingMeshes.forEach((b) => {
      const sub = indBldgSub.addFolder(b.name);

      const defaultColorHex = '#' + new THREE.Color(tokens.experimentalScene.keyLight).getHexString();

      const bldgParams = {
        color: b.mat.color ? '#' + b.mat.color.getHexString() : defaultColorHex,
        roughness: b.mat.roughness ?? 0.6,
        metalness: b.mat.metalness ?? 0.1,
        wireframe: b.mat.wireframe ?? false,
      };

      if (b.mat.color) {
        sub
          .addColor(bldgParams, 'color')
          .name('Building Color')
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
