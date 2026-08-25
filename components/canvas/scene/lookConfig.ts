/**
 * Scene look — reflections, film grain, vignette, bloom, grade.
 * Saved automatically from 3D Studio.
 */

import * as THREE from 'three';

export const STORY_BLOOM_LAYER = 1;

export interface LookConfig {
  envEnabled: boolean;
  envIntensity: number;
  grain: number;
  grainSize: number;
  vignette: number;
  vignetteStart: number;
  vignetteSoft: number;
  bloom: number;
  bloomRadius: number;
  gradeShadows: number;
  gradeMids: number;
  gradeHighlights: number;
}

export const LOOK_CONFIG: LookConfig = {
  envEnabled: true,
  envIntensity: 0.9,
  // Keep the cinematic texture subtle; the architecture should stay crisp.
  grain: 0.08,
  grainSize: 1.45,
  vignette: 0.32,
  vignetteStart: 0.5,
  vignetteSoft: 0.6,
  bloom: 0.22,
  bloomRadius: 0.58,
  gradeShadows: 0.08,
  gradeMids: 0.04,
  gradeHighlights: 0.06
};

let envTexture: THREE.Texture | null = null;
let pmrem: THREE.PMREMGenerator | null = null;

export function markStoryBloom(object: THREE.Object3D) {
  object.layers.set(STORY_BLOOM_LAYER);
}

function unlit(color: number) {
  return new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
}

function hushPmremPrecisionWarning() {
  const current = console.warn as typeof console.warn & { __rastaakX4122?: boolean };
  if (current.__rastaakX4122) return;
  const original = console.warn;
  const next = ((...args: unknown[]) => {
    const first = args[0];
    if (typeof first === 'string' && first.includes('X4122')) return;
    original.apply(console, args as Parameters<typeof console.warn>);
  }) as typeof console.warn & { __rastaakX4122?: boolean };
  next.__rastaakX4122 = true;
  console.warn = next;
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

  hushPmremPrecisionWarning();
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
  const inner = Math.max(0.12, Math.min(0.75, LOOK_CONFIG.vignetteStart ?? 0.42));
  const soft = Math.max(0.15, Math.min(0.85, LOOK_CONFIG.vignetteSoft ?? 0.55));
  const outer = Math.min(1, inner + (1 - inner) * soft);
  root.style.setProperty('--look-grain', String(Math.max(0, Math.min(0.55, LOOK_CONFIG.grain))));
  root.style.setProperty('--look-grain-size', String(Math.max(0.4, LOOK_CONFIG.grainSize)));
  root.style.setProperty('--look-vignette', String(Math.max(0, Math.min(0.9, LOOK_CONFIG.vignette))));
  root.style.setProperty('--look-vignette-inner', `${(inner * 100).toFixed(1)}%`);
  root.style.setProperty('--look-vignette-outer', `${(outer * 100).toFixed(1)}%`);
  root.style.setProperty('--look-grade-shadows', String(Math.max(0, Math.min(0.55, LOOK_CONFIG.gradeShadows ?? 0))));
  root.style.setProperty('--look-grade-highlights', String(Math.max(0, Math.min(0.45, LOOK_CONFIG.gradeHighlights ?? 0))));
  const mids = LOOK_CONFIG.gradeMids ?? 0;
  const canvas = document.querySelector('#rastaak-hero-canvas canvas, #rastaak-admin-canvas canvas') as HTMLElement | null;
  if (canvas) {
    canvas.style.filter = Math.abs(mids) < 0.008 ? '' : `contrast(${(1 + mids * 0.38).toFixed(3)})`;
  }
  ensureLookOverlay();
}

export function ensureLookOverlay(host?: HTMLElement | null) {
  if (typeof document === 'undefined') return;
  injectLookCss();
  let overlay = document.getElementById('rastaak-look-overlay') as HTMLDivElement | null;
  const markup =
    '<i class="look-grade-shadows"></i><i class="look-grade-highlights"></i><i class="look-grain"></i><i class="look-vignette"></i>';
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'rastaak-look-overlay';
    overlay.innerHTML = markup;
    (host ?? document.body).appendChild(overlay);
  } else {
    if (!overlay.querySelector('.look-grade-shadows')) overlay.innerHTML = markup;
    if (host && overlay.parentElement !== host) host.appendChild(overlay);
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
    #rastaak-look-overlay .look-grade-shadows,
    #rastaak-look-overlay .look-grade-highlights,
    #rastaak-look-overlay .look-grain,
    #rastaak-look-overlay .look-vignette {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    #rastaak-look-overlay .look-grade-shadows {
      background: #0a1422;
      opacity: var(--look-grade-shadows, 0);
      mix-blend-mode: multiply;
    }
    #rastaak-look-overlay .look-grade-highlights {
      background: #fff4e4;
      opacity: var(--look-grade-highlights, 0);
      mix-blend-mode: screen;
    }
    #rastaak-look-overlay .look-grain {
      inset: -40%;
      opacity: var(--look-grain, 0);
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size: calc(180px * var(--look-grain-size, 1)) calc(180px * var(--look-grain-size, 1));
      mix-blend-mode: overlay;
    }
    #rastaak-look-overlay .look-vignette {
      background: radial-gradient(ellipse at center, rgba(0,0,0,0) var(--look-vignette-inner, 42%), rgba(0,0,0,var(--look-vignette, 0)) var(--look-vignette-outer, 100%));
    }
  `;
  document.head.appendChild(style);
}

const BLUR_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const BLUR_FRAG = `
uniform sampler2D tDiffuse;
uniform vec2 direction;
varying vec2 vUv;
void main() {
  vec4 color = vec4(0.0);
  color += texture2D(tDiffuse, vUv - direction * 3.230769) * 0.07027;
  color += texture2D(tDiffuse, vUv - direction * 1.384615) * 0.316216;
  color += texture2D(tDiffuse, vUv) * 0.227027;
  color += texture2D(tDiffuse, vUv + direction * 1.384615) * 0.316216;
  color += texture2D(tDiffuse, vUv + direction * 3.230769) * 0.07027;
  gl_FragColor = color;
}
`;

const COMP_FRAG = `
uniform sampler2D tDiffuse;
uniform float strength;
varying vec2 vUv;
void main() {
  vec4 bloom = texture2D(tDiffuse, vUv);
  gl_FragColor = vec4(bloom.rgb * strength, 0.0);
}
`;

function makeTarget(width: number, height: number) {
  return new THREE.WebGLRenderTarget(Math.max(1, width), Math.max(1, height), {
    depthBuffer: false,
    stencilBuffer: false,
  });
}

export class LookComposer {
  private readonly bloomScene = new THREE.Scene();
  private readonly bloomCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly quad: THREE.Mesh;
  private readonly blurMat: THREE.ShaderMaterial;
  private readonly compMat: THREE.ShaderMaterial;
  private src: THREE.WebGLRenderTarget;
  private blurA: THREE.WebGLRenderTarget;
  private blurB: THREE.WebGLRenderTarget;
  private width = 1;
  private height = 1;

  constructor(private readonly renderer: THREE.WebGLRenderer) {
    this.blurMat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        direction: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: BLUR_VERT,
      fragmentShader: BLUR_FRAG,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    this.compMat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        strength: { value: 0 },
      },
      vertexShader: BLUR_VERT,
      fragmentShader: COMP_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.blurMat);
    this.bloomScene.add(this.quad);
    this.src = makeTarget(1, 1);
    this.blurA = makeTarget(1, 1);
    this.blurB = makeTarget(1, 1);
  }

  setSize(width: number, height: number) {
    const w = Math.max(1, Math.floor(width * 0.35));
    const h = Math.max(1, Math.floor(height * 0.35));
    if (w === this.width && h === this.height) return;
    this.width = w;
    this.height = h;
    this.src.setSize(w, h);
    this.blurA.setSize(w, h);
    this.blurB.setSize(w, h);
  }

  composite(scene: THREE.Scene, camera: THREE.Camera) {
    const strength = LOOK_CONFIG.bloom ?? 0;
    if (strength <= 0.01) return;

    const prevTarget = this.renderer.getRenderTarget();
    const prevAutoClear = this.renderer.autoClear;
    const prevTone = this.renderer.toneMapping;
    const prevBg = scene.background;
    const prevFog = scene.fog;
    const prevMask = camera.layers.mask;

    camera.layers.set(STORY_BLOOM_LAYER);
    scene.background = null;
    scene.fog = null;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.setRenderTarget(this.src);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.clear();
    this.renderer.render(scene, camera);

    const radius = Math.max(0.15, LOOK_CONFIG.bloomRadius ?? 0.55);
    const hx = (1.15 * radius) / this.width;
    const hy = (1.15 * radius) / this.height;
    this.quad.material = this.blurMat;
    this.blurMat.uniforms.tDiffuse.value = this.src.texture;
    this.blurMat.uniforms.direction.value.set(hx, 0);
    this.renderer.setRenderTarget(this.blurA);
    this.renderer.clear();
    this.renderer.render(this.bloomScene, this.bloomCam);
    this.blurMat.uniforms.tDiffuse.value = this.blurA.texture;
    this.blurMat.uniforms.direction.value.set(0, hy);
    this.renderer.setRenderTarget(this.blurB);
    this.renderer.clear();
    this.renderer.render(this.bloomScene, this.bloomCam);

    this.quad.material = this.compMat;
    this.compMat.uniforms.tDiffuse.value = this.blurB.texture;
    this.compMat.uniforms.strength.value = strength * 1.35;
    this.renderer.setRenderTarget(null);
    this.renderer.autoClear = false;
    this.renderer.render(this.bloomScene, this.bloomCam);

    camera.layers.mask = prevMask;
    scene.background = prevBg;
    scene.fog = prevFog;
    this.renderer.toneMapping = prevTone;
    this.renderer.autoClear = prevAutoClear;
    this.renderer.setRenderTarget(prevTarget);
  }

  dispose() {
    this.src.dispose();
    this.blurA.dispose();
    this.blurB.dispose();
    this.blurMat.dispose();
    this.compMat.dispose();
    this.quad.geometry.dispose();
  }
}
