import type { Object3D } from 'three';
import type { SceneVisibilityConfig } from './sceneTypes';

export const BUILDING_VISIBILITY_EVENT = 'rastaak-building-visibility-changed';

/**
 * Named building nodes in the current production GLB. This fallback lets the
 * Studio show its controls immediately, even if its UI boots before the GLB
 * loader has completed. When available, live scene discovery merges in any
 * additional compatible building names too.
 */
export const KNOWN_BUILDING_NAMES = [
  'Rastaak Building',
  'Hyper Market Building',
  'Building 1',
  'Building 2',
  'Building 3',
  'Building 4',
  'Building 5',
  'Building 6',
  'Building 7',
  'Building 8',
  'Building 9',
  'Building 10',
  'Building 11',
  'Building 12',
  'Building 14',
  'Building 16',
  'Building 17',
  'Building 18',
  'Building 19',
  'Building 20',
  'Building 22',
  'Building 23',
  'Building 24',
  'Building 25',
  'Building 26',
  'Building 27',
  'Building 28',
  'Building 29',
  'Building 30',
  'Building 32',
  'Building 33',
  'Building 34',
  'Building 35',
  'Building 36',
] as const;

/**
 * The scene GLB exposes buildings as top-level nodes such as "Building 7",
 * "Hyper Market Building", and "Rastaak Building". Trees, ground, and the
 * logo intentionally do not match this rule.
 */
/**
 * GLTFLoader normalizes Blender node names such as "Building 7" into
 * "Building_7". Use one readable, stable name everywhere in the Studio UI
 * and visibility map, while still matching the actual loaded Object3D.
 */
export function displayBuildingName(name: string): string {
  return name
    .normalize('NFKC')
    .trim()
    .replace(/[._/-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function buildingKey(name: string): string {
  return displayBuildingName(name).toLowerCase();
}

export function isBuildingNodeName(name: string): boolean {
  const value = displayBuildingName(name);
  return /^building(?:\s+\d+)?$/i.test(value) || /\bbuilding$/i.test(value);
}

export function collectBuildingNodes(root: Object3D): Object3D[] {
  const byName = new Map<string, Object3D>();
  root.traverse((child) => {
    const name = child.name?.trim();
    if (!name || !isBuildingNodeName(name)) return;
    const key = buildingKey(name);
    if (!byName.has(key)) byName.set(key, child);
  });

  return [...byName.values()].sort((a, b) =>
    displayBuildingName(a.name).localeCompare(displayBuildingName(b.name), undefined, {
      numeric: true,
      sensitivity: 'base',
    }),
  );
}

export function buildingVisibilityNames(root?: Object3D | null): string[] {
  const names = new Set<string>(KNOWN_BUILDING_NAMES);
  if (root) {
    for (const building of collectBuildingNodes(root)) names.add(displayBuildingName(building.name));
  }
  return [...names].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

export function isBuildingVisible(name: string, visibility?: SceneVisibilityConfig): boolean {
  const buildings = visibility?.buildings;
  if (!buildings) return true;
  if (buildings[name] === false) return false;
  const key = buildingKey(name);
  return !Object.entries(buildings).some(([savedName, visible]) => buildingKey(savedName) === key && visible === false);
}

/** Apply the persisted per-building visibility map to the loaded GLB. */
export function applyBuildingVisibility(root: Object3D, visibility?: SceneVisibilityConfig): void {
  for (const building of collectBuildingNodes(root)) {
    building.visible = isBuildingVisible(building.name, visibility);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BUILDING_VISIBILITY_EVENT));
  }
}
