/**
 * Scene look — reflections, film grain, vignette.
 * Saved automatically from 3D Studio.
 */

import * as THREE from 'three';

export interface LookConfig {
  envEnabled: boolean;
  envIntensity: number;
  grain: number;
  grainSize: number;
  vignette: number;
}

export const LOOK_CONFIG: LookConfig = {
  envEnabled: true,
  envIntensity: 0.85,
  grain: 0,
  grainSize: 1.15,
  vignette: 0,
};

let envTexture: THREE.Texture | null = null;
let pmrem: THREE.PMREMGenerator | null = null;

export function applySceneEnvironment(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  if (!LOOK_CONFIG.envEnabled) {
    scene.environment = null;
    if ('environmentIntensity' in scene) {
      (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity = 0;
    }
    return;
  }

  if (!envTexture) {
    pmrem?.dispose();
    pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.add(new THREE.AmbientLight(0xffffff, 0.35));
    envScene.add(new THREE.HemisphereLight(0xf2f4ff, 0x1a1b22, 0.9));

    const shell = new THREE.Mesh(
      new THREE.BoxGeometry(20, 12, 20),
      new THREE.MeshStandardMaterial({ color: 0x8a8c94, side: THREE.BackSide, roughness: 0.85, metalness: 0 }),
    );
    envScene.add(shell);

    const panelMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xf4f6ff,
      emissiveIntensity: 2.4,
      roughness: 1,
      metalness: 0,
    });
    const makePanel = (w: number, h: number, x: number, y: number, z: number, rotY = 0) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), panelMat);
      mesh.position.set(x, y, z);
      mesh.rotation.y = rotY;
      envScene.add(mesh);
    };
    makePanel(6, 4, 0, 2.2, -9.6);
    makePanel(3.2, 5, -9.6, 1.4, 0, Math.PI / 2);
    makePanel(3.2, 5, 9.6, 1.4, 0, -Math.PI / 2);
    makePanel(8, 1.2, 0, 5.4, 0, 0);
    const floorGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshStandardMaterial({ color: 0xd8dbe3, roughness: 0.4, metalness: 0.05 }),
    );
    floorGlow.rotation.x = -Math.PI / 2;
    floorGlow.position.y = -5.8;
    envScene.add(floorGlow);

    envTexture = pmrem.fromScene(envScene, 0.04).texture;
    envScene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if ((mesh as THREE.Mesh & { isMesh?: boolean }).isMesh) {
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => mat?.dispose());
      }
    });
  }

  scene.environment = envTexture;
  if ('environmentIntensity' in scene) {
    (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity = LOOK_CONFIG.envIntensity;
  }
}

export function disposeSceneEnvironment(scene?: THREE.Scene) {
  if (scene) scene.environment = null;
  envTexture?.dispose();
  envTexture = null;
  pmrem?.dispose();
  pmrem = null;
}

export function applyLookOverlay() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--look-grain', String(Math.max(0, Math.min(0.55, LOOK_CONFIG.grain))));
  root.style.setProperty('--look-grain-size', String(Math.max(0.4, LOOK_CONFIG.grainSize)));
  root.style.setProperty('--look-vignette', String(Math.max(0, Math.min(0.9, LOOK_CONFIG.vignette))));
  ensureLookOverlay();
}

export function ensureLookOverlay(host?: HTMLElement | null) {
  if (typeof document === 'undefined') return;
  injectLookCss();
  let overlay = document.getElementById('rastaak-look-overlay') as HTMLDivElement | null;
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'rastaak-look-overlay';
    overlay.innerHTML = '<i class="look-grain"></i><i class="look-vignette"></i>';
    (host ?? document.body).appendChild(overlay);
  } else if (host && overlay.parentElement !== host) {
    host.appendChild(overlay);
  }
}

export function tickLookOverlay(elapsed: number) {
  if (LOOK_CONFIG.grain <= 0.004) return;
  const grain = document.querySelector('#rastaak-look-overlay .look-grain') as HTMLElement | null;
  if (!grain) return;
  const x = ((elapsed * 37) % 100).toFixed(2);
  const y = ((elapsed * 53) % 100).toFixed(2);
  grain.style.backgroundPosition = x + '% ' + y + '%';
}

function injectLookCss() {
  if (document.getElementById('rastaak-look-css')) return;
  const style = document.createElement('style');
  style.id = 'rastaak-look-css';
  style.textContent = `
    #rastaak-look-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 2;
      overflow: hidden;
    }
    #rastaak-hero-canvas #rastaak-look-overlay {
      position: absolute;
    }
    #rastaak-look-overlay .look-grain {
      position: absolute;
      inset: -40%;
      opacity: var(--look-grain, 0);
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size: calc(180px * var(--look-grain-size, 1)) calc(180px * var(--look-grain-size, 1));
      mix-blend-mode: overlay;
    }
    #rastaak-look-overlay .look-vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at center, rgba(0,0,0,0) 42%, rgba(0,0,0,var(--look-vignette, 0)) 100%);
    }
  `;
  document.head.appendChild(style);
}
