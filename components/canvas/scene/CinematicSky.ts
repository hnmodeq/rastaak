import * as THREE from 'three';
import { tokens } from '@/tokens/design-tokens';

const SKY_RADIUS = 400;

const SKY_VERTEX = `
varying vec3 vSkyDirection;

void main() {
  vSkyDirection = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_FRAGMENT = `
uniform vec3 uZenith;
uniform vec3 uUpper;
uniform vec3 uHorizon;
uniform vec3 uWarmth;
uniform vec3 uMoon;
uniform vec3 uStar;
uniform vec3 uMoonDirection;

varying vec3 vSkyDirection;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec3 direction = normalize(vSkyDirection);
  float height = clamp(direction.y * 0.5 + 0.5, 0.0, 1.0);

  vec3 sky = mix(uHorizon, uUpper, smoothstep(0.02, 0.52, height));
  sky = mix(sky, uZenith, smoothstep(0.46, 1.0, height));

  float horizonBand = pow(max(0.0, 1.0 - abs(direction.y + 0.05) * 4.2), 5.0);
  sky += uWarmth * horizonBand * 0.24;

  float moonDot = max(dot(direction, normalize(uMoonDirection)), 0.0);
  float moonHalo = pow(moonDot, 18.0);
  float moonDisc = pow(moonDot, 900.0);
  sky += uMoon * (moonHalo * 0.10 + moonDisc * 1.25);

  // Sparse, deterministic stars keep the sky alive without competing with the scene.
  float starFade = smoothstep(0.08, 0.45, direction.y);
  vec2 starGrid = floor(direction.xz / max(0.18, abs(direction.y)) * 52.0);
  float star = step(0.996, hash21(starGrid));
  sky += uStar * star * starFade * 0.14;

  gl_FragColor = vec4(sky, 1.0);
}
`;

type CinematicSkyMesh = THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;

const skies = new WeakMap<THREE.Scene, CinematicSkyMesh>();

function makeSky(): CinematicSkyMesh {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uZenith: { value: new THREE.Color(tokens.experimentalScene.cinematicSkyZenith) },
      uUpper: { value: new THREE.Color(tokens.experimentalScene.cinematicSkyUpper) },
      uHorizon: { value: new THREE.Color(tokens.experimentalScene.cinematicSkyHorizon) },
      uWarmth: { value: new THREE.Color(tokens.experimentalScene.cinematicSkyWarmth) },
      uMoon: { value: new THREE.Color(tokens.experimentalScene.cinematicSkyMoon) },
      uStar: { value: new THREE.Color(tokens.experimentalScene.cinematicSkyStar) },
      uMoonDirection: { value: new THREE.Vector3(-0.28, 0.52, -0.81).normalize() },
    },
    vertexShader: SKY_VERTEX,
    fragmentShader: SKY_FRAGMENT,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
    toneMapped: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(SKY_RADIUS, 64, 32), material);
  sky.name = 'rastaak-cinematic-sky';
  sky.frustumCulled = false;
  sky.renderOrder = -1000;
  sky.layers.set(0);
  return sky;
}

export function ensureCinematicSky(scene: THREE.Scene, enabled = true): CinematicSkyMesh {
  const existing = skies.get(scene);
  if (existing) {
    existing.visible = enabled;
    return existing;
  }
  const sky = makeSky();
  sky.visible = enabled;
  scene.add(sky);
  skies.set(scene, sky);
  return sky;
}

export function setCinematicSkyEnabled(scene: THREE.Scene, enabled: boolean) {
  const sky = skies.get(scene) ?? ensureCinematicSky(scene, enabled);
  sky.visible = enabled;
}

export function disposeCinematicSky(scene: THREE.Scene) {
  const sky = skies.get(scene);
  if (!sky) return;
  scene.remove(sky);
  sky.geometry.dispose();
  sky.material.dispose();
  skies.delete(scene);
}
