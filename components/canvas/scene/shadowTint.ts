import * as THREE from 'three';
import { SCENE_CONFIG } from './sceneConfig';

const shadowUniforms = {
  uShadowColor: { value: new THREE.Color(0x000000) },
  uShadowOpacity: { value: 1 },
};

export function applySceneShadows(lights?: Iterable<THREE.Light>) {
  const color = SCENE_CONFIG.environment.shadowColor ?? 0x000000;
  const opacity = Math.max(0, Math.min(1, SCENE_CONFIG.environment.shadowOpacity ?? 1));
  shadowUniforms.uShadowColor.value.setHex(color);
  shadowUniforms.uShadowOpacity.value = opacity;

  if (!lights) return;
  for (const light of lights) {
    const shadow = (light as THREE.Light & { shadow?: THREE.LightShadow }).shadow;
    if (shadow && 'intensity' in shadow) {
      (shadow as THREE.LightShadow & { intensity: number }).intensity = opacity;
    }
  }
}

export function tintMaterialShadows(material: THREE.Material) {
  const mat = material as THREE.MeshStandardMaterial & {
    isMeshStandardMaterial?: boolean;
    isMeshPhysicalMaterial?: boolean;
    userData: { shadowTinted?: boolean };
  };
  if (!mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial) return;
  if (mat.userData.shadowTinted) return;
  mat.userData.shadowTinted = true;

  const previous = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    previous?.call(mat, shader, renderer);
    shader.uniforms.uShadowColor = shadowUniforms.uShadowColor;
    shader.uniforms.uShadowOpacity = shadowUniforms.uShadowOpacity;
    shader.fragmentShader = shader.fragmentShader.replace(
      'void main() {',
      'uniform vec3 uShadowColor;\nuniform float uShadowOpacity;\nvoid main() {',
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `
#ifdef USE_SHADOWMAP
  {
    float shadowMask = getShadowMask();
    float shade = (1.0 - shadowMask) * uShadowOpacity;
    outgoingLight = mix(outgoingLight, outgoingLight * uShadowColor, shade);
  }
#endif
#include <opaque_fragment>
`,
    );
  };
  mat.customProgramCacheKey = () => 'rastaak-shadow-tint';
  mat.needsUpdate = true;
}

export function tintWorldShadows(root: THREE.Object3D) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!(mesh as THREE.Mesh & { isMesh?: boolean }).isMesh || !mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((mat) => tintMaterialShadows(mat));
  });
}
