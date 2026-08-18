import * as THREE from 'three';
import { tokens } from '@/tokens/design-tokens';
import { SCENE_CONFIG } from './sceneConfig';
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

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera,
    private renderer: THREE.WebGLRenderer,
    private lightsMap: Map<string, THREE.Light>,
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

      // Position GUI at top right below site header
      this.gui.domElement.style.zIndex = '999999';
      this.gui.domElement.style.position = 'fixed';
      this.gui.domElement.style.top = '90px';
      this.gui.domElement.style.right = '24px';

      // ─────────────────────────────────────────────────────────────────────────
      // 1. Live Camera & Stop Points
      // ─────────────────────────────────────────────────────────────────────────
      const camFolder = this.gui.addFolder('Camera & Stop Points');

      const camParams = {
        progressT: 0.0,
        camX: this.camera.position.x,
        camY: this.camera.position.y,
        camZ: this.camera.position.z,
        fov: this.camera.fov,
        copyCamConfig: () => {
          const text = `camera: [${this.camera.position.x.toFixed(1)}, ${this.camera.position.y.toFixed(1)}, ${this.camera.position.z.toFixed(1)}], target: [14.0, 2.0, 0.0]`;
          if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            alert(`Copied camera coordinates to clipboard:\n${text}`);
          }
        },
      };

      camFolder
        .add(camParams, 'progressT', 0.0, 1.0, 0.01)
        .name('Scroll t')
        .onChange((val: number) => {
          if (this.onProgressChange) this.onProgressChange(val);
        });

      camFolder
        .add(camParams, 'camX', -100, 100, 0.5)
        .name('Camera X')
        .onChange((v: number) => {
          this.camera.position.x = v;
        });

      camFolder
        .add(camParams, 'camY', 0, 100, 0.5)
        .name('Camera Y')
        .onChange((v: number) => {
          this.camera.position.y = v;
        });

      camFolder
        .add(camParams, 'camZ', -100, 100, 0.5)
        .name('Camera Z')
        .onChange((v: number) => {
          this.camera.position.z = v;
        });

      camFolder
        .add(camParams, 'fov', 15, 90, 1)
        .name('Field of View (FOV)')
        .onChange((v: number) => {
          this.camera.fov = v;
          this.camera.updateProjectionMatrix();
        });

      camFolder.add(camParams, 'copyCamConfig').name('📋 Copy Camera Config');

      // ─────────────────────────────────────────────────────────────────────────
      // 2. Live Light Controls
      // ─────────────────────────────────────────────────────────────────────────
      const lightFolder = this.gui.addFolder('Lighting Controller');

      for (const [id, light] of this.lightsMap.entries()) {
        const sub = lightFolder.addFolder(id);

        const lightParams = {
          intensity: light.intensity,
          color: '#' + light.color.getHexString(),
          posX: light.position.x,
          posY: light.position.y,
          posZ: light.position.z,
        };

        sub
          .add(lightParams, 'intensity', 0, 3000, 10)
          .name('Intensity / Power')
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
            });

          sub
            .add(lightParams, 'posY', 0, 100, 0.5)
            .name('Position Y')
            .onChange((v: number) => {
              light.position.y = v;
            });

          sub
            .add(lightParams, 'posZ', -100, 100, 0.5)
            .name('Position Z')
            .onChange((v: number) => {
              light.position.z = v;
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
      // 3. Environment & Atmosphere
      // ─────────────────────────────────────────────────────────────────────────
      const envFolder = this.gui.addFolder('Environment & Tone');
      const envParams = {
        exposure: this.renderer.toneMappingExposure,
        bgColor: '#' + (this.scene.background as THREE.Color).getHexString(),
      };

      envFolder
        .add(envParams, 'exposure', 0.1, 3.0, 0.05)
        .name('Exposure')
        .onChange((v: number) => {
          this.renderer.toneMappingExposure = v;
        });

      envFolder
        .addColor(envParams, 'bgColor')
        .name('Background Color')
        .onChange((v: string) => {
          this.scene.background = new THREE.Color(v);
          if (this.scene.fog) {
            this.scene.fog.color = new THREE.Color(v);
          }
        });

      // ─────────────────────────────────────────────────────────────────────────
      // 4. Export JSON Tools
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
