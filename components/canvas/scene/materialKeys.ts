import * as THREE from 'three';
import type { BuildingMaterialOverride, MaterialsConfig } from './sceneTypes';
import { STORY_CONFIG } from './storyConfig';

export type MaterialRole = 'facade' | 'window';

export type TrackedMaterial = {
  key: string;
  buildingId: string;
  displayName: string;
  role: MaterialRole;
  slot: number;
  mat: THREE.MeshStandardMaterial;
  mats: THREE.MeshStandardMaterial[];
  params: { color: string; roughness: number; metalness: number };
};

const GENERIC_NODE = /^(scene|node|root|armature)$/i;
const WINDOW_NAME = /window|glass|inset|pane|casement/i;
const FEATURED_NAME = /building|market|rastaak|logo/i;
const SITE_NAME = /^(earth|grounds|ground|plane)(\.\d+)?$/i;

export function slugName(name: string): string {
  const slugged = name.trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_-]/g, '_');
  return slugged || 'Unnamed';
}

export function materialKey(buildingName: string, role: MaterialRole): string {
  return `${slugName(buildingName)}__${role}`;
}

export function isSiteMesh(name: string): boolean {
  return SITE_NAME.test(name.trim());
}

export function getMeshMaterials(mesh: THREE.Mesh): THREE.Material[] {
  return Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
}

export function resolveBuildingName(object: THREE.Object3D): string {
  let current: THREE.Object3D | null = object;
  let fallback = '';

  while (current) {
    const name = (current.name || '').trim();
    if (name && !GENERIC_NODE.test(name)) {
      if (FEATURED_NAME.test(name)) return name;
      if (!fallback) fallback = name;
    }
    current = current.parent;
  }

  return fallback || 'Unnamed';
}

function meshSiblings(mesh: THREE.Mesh): THREE.Mesh[] {
  const parent = mesh.parent;
  if (!parent) return [mesh];
  return parent.children.filter((child): child is THREE.Mesh =>
    Boolean((child as THREE.Mesh & { isMesh?: boolean }).isMesh),
  );
}

export function classifyRole(mesh: THREE.Mesh, slot: number, materialCount: number): MaterialRole {
  const haystack = `${mesh.name} ${mesh.parent?.name || ''}`;
  if (WINDOW_NAME.test(haystack)) return 'window';
  if (materialCount > 1) return slot === 0 ? 'facade' : 'window';

  const siblings = meshSiblings(mesh);
  if (siblings.length > 1) {
    return siblings.indexOf(mesh) <= 0 ? 'facade' : 'window';
  }

  return 'facade';
}

export function forEachStudioMaterial(
  root: THREE.Object3D,
  callback: (entry: {
    mesh: THREE.Mesh;
    mat: THREE.MeshStandardMaterial;
    slot: number;
    buildingName: string;
    role: MaterialRole;
    key: string;
  }) => void,
): void {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!(mesh as THREE.Mesh & { isMesh?: boolean }).isMesh || !mesh.material) return;

    const mats = getMeshMaterials(mesh);
    const buildingName = resolveBuildingName(mesh);

    mats.forEach((mat, slot) => {
      const std = mat as THREE.MeshStandardMaterial;
      if (!std?.color) return;
      const role = classifyRole(mesh, slot, mats.length);
      callback({
        mesh,
        mat: std,
        slot,
        buildingName,
        role,
        key: materialKey(buildingName, role),
      });
    });
  });
}

function applyOverride(mat: THREE.MeshStandardMaterial, ov: BuildingMaterialOverride | undefined) {
  if (!ov) return;
  if (ov.color !== undefined) mat.color.set(ov.color);
  if (ov.roughness !== undefined && 'roughness' in mat) mat.roughness = ov.roughness;
  if (ov.metalness !== undefined && 'metalness' in mat) mat.metalness = ov.metalness;
}

function lookupOverride(
  overrides: Record<string, BuildingMaterialOverride> | undefined,
  buildingName: string,
  role: MaterialRole,
  slot: number,
): BuildingMaterialOverride | undefined {
  if (!overrides) return undefined;
  const slugged = slugName(buildingName);
  return (
    overrides[materialKey(buildingName, role)] ||
    overrides[`${slugged}__mat_${slot}`] ||
    overrides[`${slugged}_mat_${slot}`] ||
    overrides[`${buildingName}_mat_${slot}`] ||
    overrides[`${buildingName.replace(/\s+/g, '_')}_mat_${slot}`]
  );
}

/** Codes → scene. Globals first, then per-building facade/window overrides. */
export function applyMaterialsConfig(root: THREE.Object3D, config: MaterialsConfig | undefined): void {
  if (!config) return;

  forEachStudioMaterial(root, ({ mat, buildingName, role, slot }) => {
    if (role === 'window') {
      if (config.globalWindowColor !== undefined) mat.color.set(config.globalWindowColor);
      if (config.globalWindowRoughness !== undefined && 'roughness' in mat) {
        mat.roughness = config.globalWindowRoughness;
      }
      if (config.globalWindowMetalness !== undefined && 'metalness' in mat) {
        mat.metalness = config.globalWindowMetalness;
      }
    } else {
      if (config.globalFacadeColor !== undefined) mat.color.set(config.globalFacadeColor);
      if (config.globalFacadeRoughness !== undefined && 'roughness' in mat) {
        mat.roughness = config.globalFacadeRoughness;
      }
      if (config.globalFacadeMetalness !== undefined && 'metalness' in mat) {
        mat.metalness = config.globalFacadeMetalness;
      }
    }

    applyOverride(mat, lookupOverride(config.overrides, buildingName, role, slot));
    mat.needsUpdate = true;
  });
}

/** Scene → codes. One record per building facade and one per building windows. */
export function collectMaterialsConfig(
  root: THREE.Object3D,
  globals: Omit<MaterialsConfig, 'overrides'>,
): MaterialsConfig {
  const overrides: Record<string, BuildingMaterialOverride> = {};
  const clientSlugs = new Set(STORY_CONFIG.clients.map((client) => slugName(client.building)));
  const storyPaint = new Set(
    [
      STORY_CONFIG.colors.need,
      STORY_CONFIG.colors.needWindow,
      STORY_CONFIG.colors.resolved,
      STORY_CONFIG.colors.resolvedWindow,
    ].map((value) => value >>> 0),
  );

  forEachStudioMaterial(root, ({ mat, key, role, buildingName }) => {
    if (clientSlugs.has(slugName(buildingName)) && storyPaint.has(mat.color.getHex() >>> 0)) {
      return;
    }
    const globalColor = role === 'window' ? globals.globalWindowColor : globals.globalFacadeColor;
    const globalRoughness = role === 'window' ? globals.globalWindowRoughness : globals.globalFacadeRoughness;
    const globalMetalness = role === 'window' ? globals.globalWindowMetalness : globals.globalFacadeMetalness;
    const color = mat.color.getHex();
    const roughness = typeof mat.roughness === 'number' ? mat.roughness : undefined;
    const metalness = typeof mat.metalness === 'number' ? mat.metalness : undefined;
    const colorDiffers = globalColor === undefined || color !== (globalColor >>> 0);
    const roughnessDiffers =
      roughness !== undefined &&
      (globalRoughness === undefined || Math.abs(roughness - globalRoughness) > 0.001);
    const metalnessDiffers =
      metalness !== undefined &&
      (globalMetalness === undefined || Math.abs(metalness - globalMetalness) > 0.001);
    if (!colorDiffers && !roughnessDiffers && !metalnessDiffers) return;

    overrides[key] = { color, roughness, metalness };
  });

  return {
    ...globals,
    overrides,
  };
}

export function collectTrackedMaterials(root: THREE.Object3D): TrackedMaterial[] {
  const grouped = new Map<string, TrackedMaterial>();

  forEachStudioMaterial(root, ({ mat, key, buildingName, role, slot }) => {
    const existing = grouped.get(key);
    if (existing) {
      existing.mats.push(mat);
      existing.mat = mat;
      existing.params.color = '#' + mat.color.getHexString();
      existing.params.roughness = mat.roughness ?? existing.params.roughness;
      existing.params.metalness = mat.metalness ?? existing.params.metalness;
      return;
    }

    grouped.set(key, {
      key,
      buildingId: slugName(buildingName),
      displayName: buildingName,
      role,
      slot,
      mat,
      mats: [mat],
      params: {
        color: '#' + mat.color.getHexString(),
        roughness: mat.roughness ?? 0.6,
        metalness: mat.metalness ?? 0,
      },
    });
  });

  return Array.from(grouped.values()).sort((a, b) => {
    const aFeatured = FEATURED_NAME.test(a.displayName) ? 0 : 1;
    const bFeatured = FEATURED_NAME.test(b.displayName) ? 0 : 1;
    if (aFeatured !== bFeatured) return aFeatured - bFeatured;
    if (a.displayName !== b.displayName) return a.displayName.localeCompare(b.displayName);
    return a.role.localeCompare(b.role);
  });
}

export function countMaterialOverrides(config: MaterialsConfig | undefined): number {
  return config?.overrides ? Object.keys(config.overrides).length : 0;
}
