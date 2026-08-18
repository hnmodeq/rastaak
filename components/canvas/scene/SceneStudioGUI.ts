import * as THREE from 'three';

export class SceneStudioGUI {
  private gui: any = null;

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera,
    private renderer: THREE.WebGLRenderer,
    private lightsMap: Map<string, THREE.Light>,
    private onProgressChange?: (t: number) => void,
  ) {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const isStudioMode =
      urlParams.has('studio') ||
      urlParams.has('debug') ||
      process.env.NODE_ENV === 'development';

    if (!isStudioMode) return;

    this.initGUI();
  }

  private async initGUI() {
    try {
      const { GUI } = await import('lil-gui');
      this.gui = new GUI({ title: 'Rastaak 3D Studio' });
      this.gui.domElement.style.zIndex = '99999';

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

      this.gui.close();
    } catch (e) {
      console.log('[SceneStudioGUI] lil-gui dynamic import skipped:', e);
    }
  }

  public destroy() {
    if (this.gui) {
      this.gui.destroy();
      this.gui = null;
    }
  }
}
