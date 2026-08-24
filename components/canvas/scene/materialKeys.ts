import * as THREE from 'three';
import type { MaterialsConfig } from './sceneTypes';

export type MaterialRole = 'facade' | 'window';

export type MaterialCategory =
  | 'building'
  | 'window'
  | 'rastaak'
  | 'logo'
  | 'ground'
  | 'plate'
  | 'border'
  | 'treeTrunk'
  | 'treeLeaf'
  | 'ignore';

export type CategoryPalette = {
  buildingColor?: number;
  windowColor?: number;
  rastaakColor?: number;
  logoColor?: number;
  groundColor?: number;
  plateColor?: number;
  borderColor?: number;
  treeTrunkColor?: number;
  treeLeafColor?: number;
};

export type SurfaceParams = {
  roughness?: number;
  metalness?: number;
  envMapIntensity?: number;
};

export const GROUND_SURFACE_CATEGORIES: ReadonlyArray<Exclude<MaterialCategory, 'ignore'>> = [
  'ground',
  'plate',
  'border',
];

export const OBJECT_SURFACE_CATEGORIES: ReadonlyArray<Exclude<MaterialCategory, 'ignore'>> = [
  'building',
  'window',
  'rastaak',
  'logo',
  'treeTrunk',
  'treeLeaf',
];

function isGroundSurfaceCategory(category: Exclude<MaterialCategory, 'ignore'>): boolean {
  return (GROUND_SURFACE_CATEGORIES as readonly string[]).includes(category);
}

function surfaceForCategory(
  category: Exclude<MaterialCategory, 'ignore'>,
  config: MaterialsConfig,
): SurfaceParams {
  if (isGroundSurfaceCategory(category)) {
    return {
      roughness: config.groundRoughness ?? config.roughness,
      metalness: config.groundMetalness ?? config.metalness,
      envMapIntensity: config.groundEnvMapIntensity ?? config.envMapIntensity,
    };
  }
  return {
    roughness: config.roughness,
    metalness: config.metalness,
    envMapIntensity: config.envMapIntensity,
  };
}

const GENERIC_NODE = /^(scene|node|root|armature)$/i;
const WINDOW_NAME = /window|glass|inset|pane|casement/i;
const FEATURED_NAME = /building|market|rastaak|logo/i;
const BUILDING_NODE = /building|market/i;
const TREE_NODE = /^cube([._]?\d+)?$/i;
const TREE_TRUNK_MAT = /material\.014/;
const TREE_LEAF_MAT = /material\.012/;
const WINDOW_MAT = /material\.002/;
const PLATE_NODE = /^(grounds|ground|plane)(\.\d+)?$/i;
const SITE_NAME = /^(earth|grounds|ground|plane)(\.\d+)?$/i;

export function slugName(name: string): string {
  const slugged = name.trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_-]/g, '_');
  return slugged || 'Unnamed';
}

export function isSiteMesh(name: string): boolean {
  return SITE_NAME.test(name.trim());
}

function isPlateObject(object: THREE.Object3D): boolean {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (PLATE_NODE.test((current.name || '').trim())) return true;
    current = current.parent;
  }
  return false;
}

const _plateSize = new THREE.Vector3();

function isFlatPlateMesh(mesh: THREE.Mesh): boolean {
  const geom = mesh.geometry;
  if (!geom) return false;
  if (!geom.boundingBox) geom.computeBoundingBox();
  const box = geom.boundingBox;
  if (!box) return false;
  box.getSize(_plateSize);
  const minXZ = Math.min(_plateSize.x, _plateSize.z);
  const maxXZ = Math.max(_plateSize.x, _plateSize.z);
  return _plateSize.y <= 0.05 && minXZ > 0.4 && maxXZ > 1;
}

export function isTreeNodeName(name: string): boolean {
  return TREE_NODE.test((name || '').trim());
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

function sourceMatName(mat: THREE.Material): string {
  const tagged = (mat.userData?.gltfName as string | undefined) || '';
  return `${tagged} ${mat.name || ''}`.toLowerCase();
}

export function classifyCategory(
  mesh: THREE.Mesh,
  slot: number,
  materialCount: number,
  mat: THREE.Material,
): MaterialCategory {
  const node = resolveBuildingName(mesh);
  const nodeL = node.toLowerCase();
  const meshL = (mesh.name || '').toLowerCase();
  const matName = sourceMatName(mat);
  const windowSlot = classifyRole(mesh, slot, materialCount) === 'window';

  if (matName.includes('ground edge')) return 'border';

  // Grounds uses "Ground Inside". The park (Plane.003) reuses Material.012,
  // the same slot trees use for leaves — keep that fill on plates, not trees.
  const taggedNode = String(mat.userData?.nodeName || '').toLowerCase();
  const onPlate =
    isPlateObject(mesh) ||
    PLATE_NODE.test(nodeL) ||
    PLATE_NODE.test(meshL) ||
    PLATE_NODE.test(taggedNode);
  if (matName.includes('ground inside') || (onPlate && !matName.includes('ground edge'))) {
    return 'plate';
  }
  if (TREE_LEAF_MAT.test(matName)) {
    const namedTree =
      isTreeNodeName(node) || isTreeNodeName(mesh.name || '') || isTreeNodeName(mesh.parent?.name || '');
    if (onPlate || isFlatPlateMesh(mesh) || !namedTree) return 'plate';
  }

  if (nodeL.includes('logo') || meshL.includes('logo')) return 'logo';
  if (nodeL === 'earth' || meshL === 'earth') return 'ground';

  if (nodeL.includes('rastaak')) {
    return windowSlot ? 'window' : 'rastaak';
  }

  if (BUILDING_NODE.test(nodeL)) {
    return windowSlot ? 'window' : 'building';
  }

  // This GLB's trees share Material.014 (trunk) + Material.012 (leaf).
  // Some Cube.* nodes are extra buildings (Material.001/002) — do not treat those as trees.
  if (TREE_TRUNK_MAT.test(matName)) return 'treeTrunk';
  if (TREE_LEAF_MAT.test(matName)) return 'treeLeaf';

  if (TREE_NODE.test(node) || TREE_NODE.test(mesh.name || '')) {
    if (WINDOW_MAT.test(matName) || windowSlot) return 'window';
    return 'building';
  }

  return 'ignore';
}

export function resolvePalette(config: MaterialsConfig | undefined): CategoryPalette {
  const overrides = config?.overrides || {};
  return {
    buildingColor: config?.buildingColor ?? config?.globalFacadeColor,
    windowColor: config?.windowColor ?? config?.globalWindowColor,
    rastaakColor: config?.rastaakColor ?? overrides.Rastaak_Building__facade?.color,
    logoColor: config?.logoColor,
    groundColor: config?.groundColor ?? overrides.Earth__facade?.color,
    plateColor: config?.plateColor,
    borderColor: config?.borderColor,
    treeTrunkColor: config?.treeTrunkColor,
    treeLeafColor: config?.treeLeafColor,
  };
}

export function collectCategoryGroups(root: THREE.Object3D): Record<Exclude<MaterialCategory, 'ignore'>, THREE.MeshStandardMaterial[]> {
  const groups: Record<Exclude<MaterialCategory, 'ignore'>, THREE.MeshStandardMaterial[]> = {
    building: [],
    window: [],
    rastaak: [],
    logo: [],
    ground: [],
    plate: [],
    border: [],
    treeTrunk: [],
    treeLeaf: [],
  };

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!(mesh as THREE.Mesh & { isMesh?: boolean }).isMesh || !mesh.material) return;
    const mats = getMeshMaterials(mesh);
    mats.forEach((mat, slot) => {
      const std = mat as THREE.MeshStandardMaterial;
      if (!std?.color) return;
      const category = classifyCategory(mesh, slot, mats.length, std);
      if (category === 'ignore') return;
      groups[category].push(std);
    });
  });

  return groups;
}

function colorForCategory(category: Exclude<MaterialCategory, 'ignore'>, palette: CategoryPalette): number | undefined {
  switch (category) {
    case 'building':
      return palette.buildingColor;
    case 'window':
      return palette.windowColor;
    case 'rastaak':
      return palette.rastaakColor;
    case 'logo':
      return palette.logoColor;
    case 'ground':
      return palette.groundColor;
    case 'plate':
      return palette.plateColor;
    case 'border':
      return palette.borderColor;
    case 'treeTrunk':
      return palette.treeTrunkColor;
    case 'treeLeaf':
      return palette.treeLeafColor;
  }
}

/** Codes → scene. Only the matching category is painted. */
export function applyMaterialsConfig(root: THREE.Object3D, config: MaterialsConfig | undefined): void {
  if (!config) return;
  const palette = resolvePalette(config);

  if (palette.plateColor === undefined) {
    root.traverse((child) => {
      if (palette.plateColor !== undefined) return;
      const mesh = child as THREE.Mesh;
      if (!(mesh as THREE.Mesh & { isMesh?: boolean }).isMesh || !mesh.material) return;
      const mats = getMeshMaterials(mesh);
      mats.forEach((mat, slot) => {
        if (palette.plateColor !== undefined) return;
        const std = mat as THREE.MeshStandardMaterial;
        if (!std?.color) return;
        if (classifyCategory(mesh, slot, mats.length, std) !== 'plate') return;
        if (sourceMatName(std).includes('ground inside')) {
          palette.plateColor = std.color.getHex();
        }
      });
    });
  }

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!(mesh as THREE.Mesh & { isMesh?: boolean }).isMesh || !mesh.material) return;
    const mats = getMeshMaterials(mesh);
    mats.forEach((mat, slot) => {
      const std = mat as THREE.MeshStandardMaterial;
      if (!std?.color) return;
      const category = classifyCategory(mesh, slot, mats.length, std);
      if (category === 'ignore') return;
      const color = colorForCategory(category, palette);
      if (color !== undefined) {
        std.color.set(color);
        std.vertexColors = false;
      }
      applySurfaceToMaterial(std, surfaceForCategory(category, config));
      std.needsUpdate = true;
    });
  });
}

function applySurfaceToMaterial(mat: THREE.MeshStandardMaterial, surface: SurfaceParams) {
  if (surface.roughness !== undefined && 'roughness' in mat) mat.roughness = surface.roughness;
  if (surface.metalness !== undefined && 'metalness' in mat) mat.metalness = surface.metalness;
  if (surface.envMapIntensity !== undefined && 'envMapIntensity' in mat) {
    mat.envMapIntensity = surface.envMapIntensity;
  }
}

export function applyCategorySurface(
  mats: THREE.MeshStandardMaterial[],
  surface: SurfaceParams,
): void {
  mats.forEach((mat) => {
    applySurfaceToMaterial(mat, surface);
    mat.needsUpdate = true;
  });
}

export function applyCategoryColor(
  mats: THREE.MeshStandardMaterial[],
  color: string | number,
): void {
  const next = new THREE.Color(color);
  mats.forEach((mat) => {
    mat.color.copy(next);
    mat.vertexColors = false;
    mat.needsUpdate = true;
  });
}

/** Scene palette → codes. Does not write per-mesh overrides. */
export function collectMaterialsConfig(
  palette: CategoryPalette,
  objectSurface?: SurfaceParams,
  groundSurface?: SurfaceParams,
): MaterialsConfig {
  return {
    buildingColor: palette.buildingColor,
    windowColor: palette.windowColor,
    rastaakColor: palette.rastaakColor,
    logoColor: palette.logoColor,
    groundColor: palette.groundColor,
    plateColor: palette.plateColor,
    borderColor: palette.borderColor,
    treeTrunkColor: palette.treeTrunkColor,
    treeLeafColor: palette.treeLeafColor,
    globalFacadeColor: palette.buildingColor,
    globalWindowColor: palette.windowColor,
    ...(objectSurface?.roughness !== undefined ? { roughness: objectSurface.roughness } : {}),
    ...(objectSurface?.metalness !== undefined ? { metalness: objectSurface.metalness } : {}),
    ...(objectSurface?.envMapIntensity !== undefined
      ? { envMapIntensity: objectSurface.envMapIntensity }
      : {}),
    ...(groundSurface?.roughness !== undefined ? { groundRoughness: groundSurface.roughness } : {}),
    ...(groundSurface?.metalness !== undefined ? { groundMetalness: groundSurface.metalness } : {}),
    ...(groundSurface?.envMapIntensity !== undefined
      ? { groundEnvMapIntensity: groundSurface.envMapIntensity }
      : {}),
    overrides: {},
  };
}

export function sampleCategoryColor(mats: THREE.MeshStandardMaterial[]): number | undefined {
  if (!mats.length) return undefined;
  return mats[0].color.getHex();
}
