import type { Object3D } from 'three';
import type { SceneVisibilityConfig } from './sceneTypes';

export const BUILDING_VISIBILITY_EVENT = 'rastaak-building-visibility-changed';

/**
 * The scene GLB exposes buildings as top-level nodes such as "Building 7",
 * "Hyper Market Building", and "Rastaak Building". Trees, ground, and the
 * logo intentionally do not match this rule.
 */
export function isBuildingNodeName(name: string): boolean {
  const value = name.trim();
  return /^building(?:\s+\d+)?$/i.test(value) || /\bbuilding$/i.test(value);
}

export function collectBuildingNodes(root: Object3D): Object3D[] {
  const byName = new Map<string, Object3D>();
  root.traverse((child) => {
    const name = child.name?.trim();
    if (!name || !isBuildingNodeName(name) || byName.has(name)) return;
    byName.set(name, child);
  });

  return [...byName.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }),
  );
}

export function isBuildingVisible(name: string, visibility?: SceneVisibilityConfig): boolean {
  return visibility?.buildings?.[name] !== false;
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
