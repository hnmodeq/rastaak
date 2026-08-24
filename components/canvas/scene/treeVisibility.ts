import type { Object3D, Mesh } from 'three';
import { classifyCategory, getMeshMaterials, isTreeNodeName } from './materialKeys';
import type { SceneVisibilityConfig } from './sceneTypes';

const SMALL_TREE_XZ = 0.22;

function isMesh(object: Object3D): object is Mesh {
  return Boolean((object as Mesh & { isMesh?: boolean }).isMesh);
}

function objectHasTreeMaterial(object: Object3D): boolean {
  let found = false;
  object.traverse((child) => {
    if (found || !isMesh(child) || !child.material) return;
    const mats = getMeshMaterials(child);
    mats.forEach((mat, slot) => {
      if (found) return;
      const category = classifyCategory(child, slot, mats.length, mat);
      if (category === 'treeTrunk' || category === 'treeLeaf') found = true;
    });
  });
  return found;
}

export function classifyTreeGroup(object: Object3D): 'big' | 'small' | null {
  if (!isTreeNodeName(object.name || '') || !objectHasTreeMaterial(object)) return null;
  const span = Math.max(Math.abs(object.scale.x), Math.abs(object.scale.z));
  return span < SMALL_TREE_XZ ? 'small' : 'big';
}

export function applyTreeVisibility(root: Object3D, visibility?: SceneVisibilityConfig) {
  const showBig = visibility?.showBigTrees !== false;
  const showSmall = visibility?.showSmallTrees !== false;
  root.traverse((child) => {
    const group = classifyTreeGroup(child);
    if (!group) return;
    child.visible = group === 'big' ? showBig : showSmall;
  });
}
