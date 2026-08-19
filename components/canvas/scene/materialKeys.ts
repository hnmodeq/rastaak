import * as THREE from 'three';
import type { BuildingMaterialOverride, MaterialsConfig } from './sceneTypes';

const GENERIC_NAME = /^(cube|plane|mesh|object|scene|group|node)/i;

export function isValidNamedObject(name: string | undefined | null): boolean {
  if (!name) return false;
  return !GENERIC_NAME.test(name.trim());
}

export function materialSlotKey(displayName: string, slot: number): string {
  return `${displayName}_mat_${slot}`;
}

/** Copy a usable parent name onto generic Blender mesh names, once, before keying. */
export function prepareMeshNames(root: THREE.Object3D): void {
  root.traverse((child) => {
    const parent = child.parent;
    if (!parent || !isValidNamedObject(parent.name)) return;
    if (!child.name || !isValidNamedObject(child.name)) {
      child.name = parent.name;
    }
  });
}

export function getMeshMaterials(mesh: THREE.Mesh): THREE.Material[] {
  return Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
}

function applyOverride(mat: THREE.MeshStandardMaterial, ov: BuildingMaterialOverride | undefined) {
  if (!ov) return;
  if (ov.color !== undefined) mat.color.set(ov.color);
  if (ov.roughness !== undefined && 'roughness' in mat) mat.roughness = ov.roughness;
  if (ov.metalness !== undefined && 'metalness' in mat) mat.metalness = ov.metalness;
}

/**
 * Codes → scene.
 * Globals first, then per-slot overrides so a refresh restores the last Apply.
 */
export function applyMaterialsConfig(root: THREE.Object3D, config: MaterialsConfig | undefined): void {
  if (!config) return;

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!(mesh as THREE.Mesh & { isMesh?: boolean }).isMesh || !mesh.material) return;
    if (!isValidNamedObject(mesh.name)) return;

    getMeshMaterials(mesh).forEach((mat, index) => {
      const std = mat as THREE.MeshStandardMaterial;
      if (!std?.color) return;

      if (index === 0) {
        if (config.globalFacadeColor !== undefined) std.color.set(config.globalFacadeColor);
        if (config.globalFacadeRoughness !== undefined && 'roughness' in std) {
          std.roughness = config.globalFacadeRoughness;
        }
        if (config.globalFacadeMetalness !== undefined && 'metalness' in std) {
          std.metalness = config.globalFacadeMetalness;
        }
      } else if (index === 1) {
        if (config.globalWindowColor !== undefined) std.color.set(config.globalWindowColor);
        if (config.globalWindowRoughness !== undefined && 'roughness' in std) {
          std.roughness = config.globalWindowRoughness;
        }
        if (config.globalWindowMetalness !== undefined && 'metalness' in std) {
          std.metalness = config.globalWindowMetalness;
        }
      }

      applyOverride(std, config.overrides?.[materialSlotKey(mesh.name, index)]);
      std.needsUpdate = true;
    });
  });
}

/**
 * Scene → codes.
 * Every named slot is stored under a stable `objectName_mat_slot` key so
 * refresh cannot swap colors between buildings.
 */
export function collectMaterialsConfig(
  root: THREE.Object3D,
  globals: Omit<MaterialsConfig, 'overrides'>,
): MaterialsConfig {
  const overrides: Record<string, BuildingMaterialOverride> = {};

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!(mesh as THREE.Mesh & { isMesh?: boolean }).isMesh || !mesh.material) return;
    if (!isValidNamedObject(mesh.name)) return;

    getMeshMaterials(mesh).forEach((mat, index) => {
      const std = mat as THREE.MeshStandardMaterial;
      if (!std?.color) return;
      overrides[materialSlotKey(mesh.name, index)] = {
        color: std.color.getHex(),
        roughness: typeof std.roughness === 'number' ? std.roughness : undefined,
        metalness: typeof std.metalness === 'number' ? std.metalness : undefined,
      };
    });
  });

  return {
    ...globals,
    overrides,
  };
}

export type TrackedMaterial = {
  key: string;
  displayName: string;
  slot: number;
  mat: THREE.MeshStandardMaterial;
  params: { color: string; roughness: number; metalness: number };
};

export function collectTrackedMaterials(root: THREE.Object3D): TrackedMaterial[] {
  const entries: TrackedMaterial[] = [];
  const seen = new Set<string>();

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!(mesh as THREE.Mesh & { isMesh?: boolean }).isMesh || !mesh.material) return;
    if (!isValidNamedObject(mesh.name)) return;

    getMeshMaterials(mesh).forEach((mat, index) => {
      const std = mat as THREE.MeshStandardMaterial;
      if (!std?.color) return;
      const key = materialSlotKey(mesh.name, index);
      if (seen.has(key)) return;
      seen.add(key);
      entries.push({
        key,
        displayName: mesh.name,
        slot: index,
        mat: std,
        params: {
          color: '#' + std.color.getHexString(),
          roughness: std.roughness ?? 0.6,
          metalness: std.metalness ?? 0,
        },
      });
    });
  });

  return entries;
}
