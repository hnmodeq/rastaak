import * as THREE from 'three';
import { tokens } from '@/tokens/design-tokens';
import type { SceneHorizonConfig, SceneSkyConfig } from './sceneTypes';

const SKY_RADIUS = 400;

export const DEFAULT_CINEMATIC_SKY: SceneSkyConfig = {
  zenithColor: tokens.experimentalScene.cinematicSkyZenith,
  upperColor: tokens.experimentalScene.cinematicSkyUpper,
  horizonColor: tokens.experimentalScene.cinematicSkyHorizon,
  warmthColor: tokens.experimentalScene.cinematicSkyWarmth,
  moonColor: tokens.experimentalScene.cinematicSkyMoon,
  starColor: tokens.experimentalScene.cinematicSkyStar,
  rotationY: 0,
  moonAzimuth: -109,
  moonElevation: 31,
  moonSize: 1,
  moonGlow: 1,
  horizonGlow: 1,
  starDensity: 1,
  starIntensity: 1,
  exposure: 1,
};

export const DEFAULT_CINEMATIC_HORIZON: SceneHorizonConfig = {
  enabled: true,
  color: tokens.experimentalScene.cinematicHorizonMist,
  opacity: 0.92,
  height: -0.03,
  softness: 0.72,
};

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
uniform float uMoonSize;
uniform float uMoonGlow;
uniform float uHorizonGlow;
uniform float uStarDensity;
uniform float uStarIntensity;
uniform float uExposure;
uniform float uRotationY;
uniform float uTime;
uniform vec3 uHorizonMist;
uniform float uHorizonMistOpacity;
uniform float uHorizonHeight;
uniform float uHorizonSoftness;

varying vec3 vSkyDirection;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  float rotationCos = cos(uRotationY);
  float rotationSin = sin(uRotationY);
  vec3 direction = normalize(vec3(
    rotationCos * vSkyDirection.x - rotationSin * vSkyDirection.z,
    vSkyDirection.y,
    rotationSin * vSkyDirection.x + rotationCos * vSkyDirection.z
  ));
  float height = clamp(direction.y * 0.5 + 0.5, 0.0, 1.0);

  vec3 sky = mix(uHorizon, uUpper, smoothstep(0.02, 0.52, height));
  sky = mix(sky, uZenith, smoothstep(0.46, 1.0, height));

  // A wide atmospheric veil hides the finite ground boundary and makes the
  // distant terrain dissolve into the sky instead of ending on a hard line.
  float mistWidth = max(0.02, uHorizonSoftness);
  float horizonMist = 1.0 - smoothstep(0.0, mistWidth, abs(direction.y - uHorizonHeight));
  sky = mix(sky, uHorizonMist, horizonMist * clamp(uHorizonMistOpacity, 0.0, 1.0));

  float horizonBand = pow(max(0.0, 1.0 - abs(direction.y + 0.05) * 4.2), 5.0);
  sky += uWarmth * horizonBand * 0.24 * uHorizonGlow;

  float moonDot = max(dot(direction, normalize(uMoonDirection)), 0.0);
  float moonSize = max(0.2, uMoonSize);
  float moonHalo = pow(moonDot, 18.0 / max(0.7, moonSize));
  float moonDisc = pow(moonDot, 900.0 / moonSize);
  sky += uMoon * (moonHalo * 0.10 + moonDisc * 1.25) * uMoonGlow;

  // Render stars as anti-aliased radial points instead of full grid cells.
  // A tiny animated pulse gives the brightest points a restrained sparkle.
  float starFade = smoothstep(0.08, 0.45, direction.y);
  vec2 starSpace = direction.xz / max(0.22, abs(direction.y)) * 44.0;
  vec2 starCell = floor(starSpace);
  vec2 starLocal = fract(starSpace) - 0.5;
  float starSeed = hash21(starCell);
  vec2 starOffset = vec2(
    hash21(starCell + 17.0),
    hash21(starCell + 43.0)
  ) - 0.5;
  float starDistance = length(starLocal - starOffset * 0.58);
  float starRadius = mix(0.035, 0.085, hash21(starCell + 61.0));
  float starCore = 1.0 - smoothstep(starRadius * 0.12, starRadius, starDistance);
  float starHalo = 1.0 - smoothstep(starRadius, starRadius * 3.2, starDistance);
  float threshold = 1.0 - 0.004 * clamp(uStarDensity, 0.0, 2.0);
  float starVisible = step(threshold, starSeed);
  float sparkle = 0.88 + 0.12 * sin(uTime * 1.7 + starSeed * 6.28318);
  float starShape = (starCore + starHalo * 0.16) * sparkle;
  sky += uStar * starVisible * starShape * starFade * 0.18 * uStarIntensity;

  gl_FragColor = vec4(sky * max(0.0, uExposure), 1.0);
}
`;

type CinematicSkyMesh = THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;

const skies = new WeakMap<THREE.Scene, CinematicSkyMesh>();

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function normalizeHorizonConfig(config?: Partial<SceneHorizonConfig>): SceneHorizonConfig {
  return {
    ...DEFAULT_CINEMATIC_HORIZON,
    ...(config ?? {}),
    opacity: clamp(config?.opacity ?? DEFAULT_CINEMATIC_HORIZON.opacity, 0, 1),
    height: clamp(config?.height ?? DEFAULT_CINEMATIC_HORIZON.height, -0.6, 0.6),
    softness: clamp(config?.softness ?? DEFAULT_CINEMATIC_HORIZON.softness, 0.02, 1),
  };
}

function normalizeSkyConfig(config?: Partial<SceneSkyConfig>): SceneSkyConfig {
  return {
    ...DEFAULT_CINEMATIC_SKY,
    ...(config ?? {}),
    rotationY: clamp(config?.rotationY ?? DEFAULT_CINEMATIC_SKY.rotationY, 0, 360),
    moonAzimuth: clamp(config?.moonAzimuth ?? DEFAULT_CINEMATIC_SKY.moonAzimuth, -180, 180),
    moonElevation: clamp(config?.moonElevation ?? DEFAULT_CINEMATIC_SKY.moonElevation, -10, 90),
    moonSize: clamp(config?.moonSize ?? DEFAULT_CINEMATIC_SKY.moonSize, 0.2, 3),
    moonGlow: clamp(config?.moonGlow ?? DEFAULT_CINEMATIC_SKY.moonGlow, 0, 3),
    horizonGlow: clamp(config?.horizonGlow ?? DEFAULT_CINEMATIC_SKY.horizonGlow, 0, 3),
    starDensity: clamp(config?.starDensity ?? DEFAULT_CINEMATIC_SKY.starDensity, 0, 2),
    starIntensity: clamp(config?.starIntensity ?? DEFAULT_CINEMATIC_SKY.starIntensity, 0, 3),
    exposure: clamp(config?.exposure ?? DEFAULT_CINEMATIC_SKY.exposure, 0, 3),
  };
}

function applySkyConfig(
  material: THREE.ShaderMaterial,
  rawConfig?: Partial<SceneSkyConfig>,
  rawHorizon?: Partial<SceneHorizonConfig>,
) {
  const config = rawConfig ? normalizeSkyConfig(rawConfig) : null;
  const horizon = normalizeHorizonConfig(rawHorizon);
  const uniforms = material.uniforms;
  if (config) {
    uniforms.uZenith.value.setHex(config.zenithColor);
    uniforms.uUpper.value.setHex(config.upperColor);
    uniforms.uHorizon.value.setHex(config.horizonColor);
    uniforms.uWarmth.value.setHex(config.warmthColor);
    uniforms.uMoon.value.setHex(config.moonColor);
    uniforms.uStar.value.setHex(config.starColor);
    uniforms.uMoonSize.value = config.moonSize;
    uniforms.uMoonGlow.value = config.moonGlow;
    uniforms.uHorizonGlow.value = config.horizonGlow;
    uniforms.uStarDensity.value = config.starDensity;
    uniforms.uStarIntensity.value = config.starIntensity;
    uniforms.uExposure.value = config.exposure;
    uniforms.uRotationY.value = THREE.MathUtils.degToRad(config.rotationY);
  }
  uniforms.uHorizonMist.value.setHex(horizon.color);
  uniforms.uHorizonMistOpacity.value = horizon.enabled ? horizon.opacity : 0;
  uniforms.uHorizonHeight.value = horizon.height;
  uniforms.uHorizonSoftness.value = horizon.softness;

  const directionConfig = config ?? normalizeSkyConfig();
  const azimuth = THREE.MathUtils.degToRad(directionConfig.moonAzimuth);
  const elevation = THREE.MathUtils.degToRad(directionConfig.moonElevation);
  uniforms.uMoonDirection.value.set(
    Math.cos(elevation) * Math.cos(azimuth),
    Math.sin(elevation),
    Math.cos(elevation) * Math.sin(azimuth),
  ).normalize();
}

function makeSky(
  config?: Partial<SceneSkyConfig>,
  horizon?: Partial<SceneHorizonConfig>,
): CinematicSkyMesh {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uZenith: { value: new THREE.Color() },
      uUpper: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uWarmth: { value: new THREE.Color() },
      uMoon: { value: new THREE.Color() },
      uStar: { value: new THREE.Color() },
      uMoonDirection: { value: new THREE.Vector3() },
      uMoonSize: { value: 1 },
      uMoonGlow: { value: 1 },
      uHorizonGlow: { value: 1 },
      uStarDensity: { value: 1 },
      uStarIntensity: { value: 1 },
      uExposure: { value: 1 },
      uRotationY: { value: 0 },
      uTime: { value: 0 },
      uHorizonMist: { value: new THREE.Color() },
      uHorizonMistOpacity: { value: 0.72 },
      uHorizonHeight: { value: 0 },
      uHorizonSoftness: { value: 0.28 },
    },
    vertexShader: SKY_VERTEX,
    fragmentShader: SKY_FRAGMENT,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
    toneMapped: false,
  });
  applySkyConfig(material, config ?? DEFAULT_CINEMATIC_SKY, horizon);

  const sky = new THREE.Mesh(new THREE.SphereGeometry(SKY_RADIUS, 64, 32), material);
  sky.name = 'rastaak-cinematic-sky';
  sky.frustumCulled = false;
  sky.renderOrder = -1000;
  sky.layers.set(0);
  return sky;
}

export function ensureCinematicSky(
  scene: THREE.Scene,
  enabled = true,
  config?: Partial<SceneSkyConfig>,
  horizon?: Partial<SceneHorizonConfig>,
): CinematicSkyMesh {
  const existing = skies.get(scene);
  if (existing) {
    existing.visible = enabled;
    applySkyConfig(existing.material, config, horizon);
    return existing;
  }
  const sky = makeSky(config, horizon);
  sky.visible = enabled;
  scene.add(sky);
  skies.set(scene, sky);
  return sky;
}

export function setCinematicSkyEnabled(scene: THREE.Scene, enabled: boolean) {
  const sky = skies.get(scene) ?? ensureCinematicSky(scene, enabled);
  sky.visible = enabled;
}

export function setCinematicSkyConfig(
  scene: THREE.Scene,
  config: Partial<SceneSkyConfig>,
  horizon?: Partial<SceneHorizonConfig>,
) {
  const sky = skies.get(scene) ?? ensureCinematicSky(scene, true, config, horizon);
  applySkyConfig(sky.material, config, horizon);
}

export function setCinematicHorizonConfig(scene: THREE.Scene, horizon: Partial<SceneHorizonConfig>) {
  const sky = skies.get(scene) ?? ensureCinematicSky(scene, true, undefined, horizon);
  applySkyConfig(sky.material, undefined, horizon);
}

export function tickCinematicSky(scene: THREE.Scene, elapsed: number) {
  const sky = skies.get(scene);
  if (!sky) return;
  sky.material.uniforms.uTime.value = elapsed;
}

export function disposeCinematicSky(scene: THREE.Scene) {
  const sky = skies.get(scene);
  if (!sky) return;
  scene.remove(sky);
  sky.geometry.dispose();
  sky.material.dispose();
  skies.delete(scene);
}
