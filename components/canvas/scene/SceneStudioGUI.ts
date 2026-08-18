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
      const stopNames = SCENE_CONFIG.stops.map((s, i) => `${i + 1}. ${s.id}`);

      const camParams = {
        mode: 'Scroll Journey',
        selectedStop: stopNames[0],
        scrollT: 0.0,
        camX: this.camera.position.x,
        camY: this.camera.position.y,
        camZ: this.camera.position.z,
        targetX: 14.0,
        targetY: 2.0,
        targetZ: 0.0,
        fov: this.camera.fov,

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
          }
        });

      camFolder
        .add(camParams, 'selectedStop', stopNames)
        .name('Edit Stop Point')
        .onChange((name: string) => {
          const idx = stopNames.indexOf(name);
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

            if (this.onProgressChange) this.onProgressChange(stop.progress);
          }
        });

      camFolder
        .add(camParams, 'scrollT', 0.0, 1.0, 0.01)
        .name('Scroll t')
        .onChange((val: number) => {
          if (this.onProgressChange) this.onProgressChange(val);
        });

      camFolder
        .add(camParams, 'camX', -100, 100, 0.5)
        .name('Cam X')
        .onChange((v: number) => {
          this.manualCamPos.x = v;
          this.camera.position.x = v;
          if (SCENE_CONFIG.stops[currentStopIndex]) {
            SCENE_CONFIG.stops[currentStopIndex].camera[0] = v;
          }
        });

      camFolder
        .add(camParams, 'camY', 0, 100, 0.5)
        .name('Cam Y')
        .onChange((v: number) => {
          this.manualCamPos.y = v;
          this.camera.position.y = v;
          if (SCENE_CONFIG.stops[currentStopIndex]) {
            SCENE_CONFIG.stops[currentStopIndex].camera[1] = v;
          }
        });

      camFolder
        .add(camParams, 'camZ', -100, 100, 0.5)
        .name('Cam Z')
        .onChange((v: number) => {
          this.manualCamPos.z = v;
          this.camera.position.z = v;
          if (SCENE_CONFIG.stops[currentStopIndex]) {
            SCENE_CONFIG.stops[currentStopIndex].camera[2] = v;
          }
        });

      camFolder
        .add(camParams, 'targetX', -100, 100, 0.5)
        .name('Target X')
        .onChange((v: number) => {
          this.manualLookAt.x = v;
          this.camera.lookAt(this.manualLookAt);
          if (SCENE_CONFIG.stops[currentStopIndex]) {
            SCENE_CONFIG.stops[currentStopIndex].target[0] = v;
          }
        });

      camFolder
        .add(camParams, 'targetY', -50, 100, 0.5)
        .name('Target Y')
        .onChange((v: number) => {
          this.manualLookAt.y = v;
          this.camera.lookAt(this.manualLookAt);
          if (SCENE_CONFIG.stops[currentStopIndex]) {
            SCENE_CONFIG.stops[currentStopIndex].target[1] = v;
          }
        });

      camFolder
        .add(camParams, 'targetZ', -100, 100, 0.5)
        .name('Target Z')
        .onChange((v: number) => {
          this.manualLookAt.z = v;
          this.camera.lookAt(this.manualLookAt);
          if (SCENE_CONFIG.stops[currentStopIndex]) {
            SCENE_CONFIG.stops[currentStopIndex].target[2] = v;
          }
        });

      camFolder
        .add(camParams, 'fov', 15, 90, 1)
        .name('FOV Zoom')
        .onChange((v: number) => {
          this.camera.fov = v;
          this.camera.updateProjectionMatrix();
          if (SCENE_CONFIG.stops[currentStopIndex]) {
            SCENE_CONFIG.stops[currentStopIndex].fov = v;
          }
        });

      camFolder.add(camParams, 'addNewStop').name('➕ Add Current View as Stop');
      camFolder.add(camParams, 'copyStopsConfig').name('📋 Copy Stops JSON');

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
        };

        sub
          .add(lightParams, 'intensity', 0, 3000, 10)
          .name('Power / Intensity')
          .onChange((v: number) => {
            light.intensity = v;
          });

        sub.addColor(lightParams, 'color').name('Color').onChange((v: string) => {
          light.color.set(v);
        });

        if (light.position) {
          sub
            .add(lightParams, 'posX', -100, 100, 0.5)
            .name('Position X')
            .onChange((v: number) => {
              light.position.x = v;
              if ((light as any).target) {
                (light as any).target.updateMatrixWorld();
              }
            });

          sub
            .add(lightParams, 'posY', -10, 100, 0.5)
            .name('Position Y')
            .onChange((v: number) => {
              light.position.y = v;
              if ((light as any).target) {
                (light as any).target.updateMatrixWorld();
              }
            });

          sub
            .add(lightParams, 'posZ', -100, 100, 0.5)
            .name('Position Z')
            .onChange((v: number) => {
              light.position.z = v;
              if ((light as any).target) {
                (light as any).target.updateMatrixWorld();
              }
            });
        }

        if (light instanceof THREE.PointLight || light instanceof THREE.SpotLight) {
          const extra = { distance: light.distance };
          sub
            .add(extra, 'distance', 0, 200, 1)
            .name('Distance Falloff')
            .onChange((v: number) => {
              light.distance = v;
            });
        }
      }

      // ─────────────────────────────────────────────────────────────────────────
      // 3. Real-time Materials Controller
      // ─────────────────────────────────────────────────────────────────────────
      const matFolder = this.gui.addFolder('Materials Controller');
      const worldGroup = this.worldGroupSupplier();

      if (worldGroup) {
        const uniqueMaterials = new Set<THREE.MeshStandardMaterial>();
        worldGroup.traverse((child: any) => {
          if (child.isMesh && child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((m: any) => {
              if (m.isMeshStandardMaterial || m.isMeshBasicMaterial) {
                uniqueMaterials.add(m);
              }
            });
          }
        });

        let matIdx = 1;
        const defaultColorHex = '#' + new THREE.Color(tokens.experimentalScene.keyLight).getHexString();

        uniqueMaterials.forEach((mat) => {
          const matName = mat.name ? mat.name : `Material_${matIdx++}`;
          const sub = matFolder.addFolder(matName);

          const matParams = {
            roughness: (mat as any).roughness ?? 0.5,
            metalness: (mat as any).metalness ?? 0.1,
            color: mat.color ? '#' + mat.color.getHexString() : defaultColorHex,
            wireframe: mat.wireframe ?? false,
          };

          if (typeof (mat as any).roughness === 'number') {
            sub
              .add(matParams, 'roughness', 0.0, 1.0, 0.02)
              .name('Roughness')
              .onChange((v: number) => {
                (mat as any).roughness = v;
                mat.needsUpdate = true;
              });
          }

          if (typeof (mat as any).metalness === 'number') {
            sub
              .add(matParams, 'metalness', 0.0, 1.0, 0.02)
              .name('Metalness')
              .onChange((v: number) => {
                (mat as any).metalness = v;
                mat.needsUpdate = true;
              });
          }

          if (mat.color) {
            sub.addColor(matParams, 'color').name('Color').onChange((v: string) => {
              mat.color.set(v);
              mat.needsUpdate = true;
            });
          }

          sub.add(matParams, 'wireframe').name('Wireframe').onChange((v: boolean) => {
            mat.wireframe = v;
            mat.needsUpdate = true;
          });
        });
      }

      // ─────────────────────────────────────────────────────────────────────────
      // 4. Atmosphere & Background (Unified Top Header Color Control)
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
        .onChange((v: number) => {
          this.renderer.toneMappingExposure = v;
        });

      envFolder
        .addColor(envParams, 'bgColor')
        .name('Unified Background Color')
        .onChange((v: string) => {
          const col = new THREE.Color(v);
          this.scene.background = col;
          if (this.scene.fog) {
            this.scene.fog.color = col;
          }
          // Unified document body background color to eliminate top bar seam
          document.body.style.backgroundColor = v;
        });

      // ─────────────────────────────────────────────────────────────────────────
      // 5. Export JSON Tools
      // ─────────────────────────────────────────────────────────────────────────
      const exportFolder = this.gui.addFolder('Export Tools');
      const exportParams = {
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
