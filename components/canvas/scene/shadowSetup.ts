import * as THREE from 'three';

export type ShadowFilter = 'basic' | 'pcf' | 'pcfsoft';

export interface ShadowApplyConfig {
  shadowMapSize?: number;
  shadowBias?: number;
  shadowNormalBias?: number;
  shadowNear?: number;
  shadowFar?: number;
  shadowIntensity?: number;
  radius?: number;
  distance?: number;
}

export function resolveShadowFilter(value?: string): ShadowFilter {
  if (value === 'basic' || value === 'pcf' || value === 'pcfsoft') return value;
  return 'pcfsoft';
}

export function filterFromRenderer(renderer: THREE.WebGLRenderer): ShadowFilter {
  if (renderer.shadowMap.type === THREE.BasicShadowMap) return 'basic';
  if (renderer.shadowMap.type === THREE.PCFShadowMap) return 'pcf';
  return 'pcfsoft';
}

export function applyRendererShadowFilter(renderer: THREE.WebGLRenderer, filter?: string) {
  const next = resolveShadowFilter(filter);
  const type =
    next === 'basic'
      ? THREE.BasicShadowMap
      : next === 'pcf'
        ? THREE.PCFShadowMap
        : THREE.PCFSoftShadowMap;
  if (renderer.shadowMap.type !== type) {
    renderer.shadowMap.type = type;
    renderer.shadowMap.needsUpdate = true;
  }
}

export function applyLightShadow(light: THREE.Light, cfg: ShadowApplyConfig = {}) {
  const shadow = (light as THREE.Light & { shadow?: THREE.LightShadow }).shadow;
  if (!shadow) return;

  const size = Math.max(256, Math.round(cfg.shadowMapSize ?? shadow.mapSize.width ?? 1024));
  if (shadow.mapSize.width !== size || shadow.mapSize.height !== size) {
    shadow.mapSize.width = size;
    shadow.mapSize.height = size;
    if (shadow.map) {
      shadow.map.dispose();
      (shadow as THREE.LightShadow & { map: THREE.WebGLRenderTarget | null }).map = null;
    }
  }

  const bias = typeof cfg.shadowBias === 'number' && Number.isFinite(cfg.shadowBias) ? cfg.shadowBias : shadow.bias;
  shadow.bias = bias;
  const explicitNormal =
    typeof cfg.shadowNormalBias === 'number' && Number.isFinite(cfg.shadowNormalBias)
      ? cfg.shadowNormalBias
      : undefined;
  // Bias 0 with no normal offset produces acne on large roofs. Lift samples along the normal.
  shadow.normalBias = explicitNormal ?? (Math.abs(bias) < 1e-8 ? 0.04 : shadow.normalBias || 0);

  if (typeof cfg.radius === 'number' && Number.isFinite(cfg.radius)) {
    shadow.radius = cfg.radius;
  }
  if (typeof cfg.shadowIntensity === 'number' && Number.isFinite(cfg.shadowIntensity) && 'intensity' in shadow) {
    (shadow as THREE.LightShadow & { intensity: number }).intensity = Math.max(0, cfg.shadowIntensity);
  }

  const cam = shadow.camera as (THREE.PerspectiveCamera | THREE.OrthographicCamera) | undefined;
  if (cam) {
    const fallbackFar = cfg.distance && cfg.distance > 0 ? Math.max(cfg.distance, 8) : 80;
    const near = Math.max(0.05, cfg.shadowNear ?? (cam.near > 0 ? cam.near : 0.5));
    const far = Math.max(near + 1, cfg.shadowFar ?? fallbackFar);
    if (Math.abs(cam.near - near) > 0.0001 || Math.abs(cam.far - far) > 0.0001) {
      cam.near = near;
      cam.far = far;
      cam.updateProjectionMatrix();
    }
  }

  shadow.needsUpdate = true;
}
