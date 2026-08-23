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
  envIntensity: 1.2,
  grain: 0,
  grainSize: 1.15,
  vignette: 0,
};

let envTexture: THREE.Texture | null = null;
let pmrem: THREE.PMREMGenerator | null = null;

function unlit(color: number) {
  return new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
}

function buildStudioEnv(renderer: THREE.WebGLRenderer): THREE.Texture {
  pmrem?.dispose();
  pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x8b93a3);

  const shell = new THREE.Mesh(new THREE.SphereGeometry(16, 24, 16), unlit(0x6a7180));
  const shellMat = shell.material as THREE.MeshBasicMaterial;
  shellMat.side = THREE.BackSide;
  envScene.add(shell);

  const key = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), unlit(0xffffff));
  key.position.set(0, 3.2, -11);
  envScene.add(key);

  const fill = new THREE.Mesh(new THREE.PlaneGeometry(6, 7), unlit(0xd5e4ff));
  fill.position.set(-11, 2.2, 1);
  fill.rotation.y = Math.PI / 2;
  envScene.add(fill);

  const rim = new THREE.Mesh(new THREE.PlaneGeometry(6, 7), unlit(0xffe2c0));
  rim.position.set(11, 2.2, 1);
  rim.rotation.y = -Math.PI / 2;
  envScene.add(rim);

  const zenith = new THREE.Mesh(new THREE.PlaneGeometry(12, 4), unlit(0xf4f6fb));
  zenith.position.set(0, 8.4, 0);
  zenith.rotation.x = Math.PI / 2;
  envScene.add(zenith);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(12, 32), unlit(0xc8ccd4));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -6.2;
  envScene.add(floor);

  const texture = pmrem.fromScene(envScene, 0.03).texture;
  envScene.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!(mesh as THREE.Mesh & { isMesh?: boolean }).isMesh) return;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((mat) => mat?.dispose());
  });
  return texture;
}

export function applySceneEnvironment(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  if (!LOOK_CONFIG.envEnabled) {
    scene.environment = null;
    if ('environmentIntensity' in scene) {
      (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity = 0;
    }
    return;
  }

  if (!envTexture) {
    envTexture = buildStudioEnv(renderer);
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
