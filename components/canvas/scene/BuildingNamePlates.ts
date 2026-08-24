import * as THREE from 'three';
import { BUILDING_NAMES, BUILDING_NAMES_EVENT, type BuildingNamePlate } from './buildingNamesConfig';

const CITY_CENTER_X = 13.36;
const CITY_CENTER_Z = -0.7;
const FONT_PX = 96;
const PLATE_BACK = 0x16171c;

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();
const _toward = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _offset = new THREE.Vector3();

function normalizeName(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[._/-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function findByName(root: THREE.Object3D, name: string): THREE.Object3D | null {
  const exact = root.getObjectByName(name);
  if (exact) return exact;
  const wanted = normalizeName(name);
  if (!wanted) return null;
  let found: THREE.Object3D | null = null;
  root.traverse((child) => {
    if (found || !child.name) return;
    if (normalizeName(child.name) === wanted) found = child;
  });
  return found;
}

function hexCss(value: number): string {
  return '#' + (value >>> 0).toString(16).padStart(6, '0');
}

function paintText(text: string, color: number): { texture: THREE.CanvasTexture; aspect: number } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.width = 8;
    canvas.height = 8;
    return { texture: new THREE.CanvasTexture(canvas), aspect: 1 };
  }
  const font = '700 ' + FONT_PX + 'px Kalameh, sans-serif';
  ctx.font = font;
  const measured = Math.max(32, ctx.measureText(text || ' ').width);
  const padX = Math.round(FONT_PX * 0.55);
  const padY = Math.round(FONT_PX * 0.42);
  canvas.width = Math.ceil(measured + padX * 2);
  canvas.height = Math.ceil(FONT_PX * 1.15 + padY * 2);
  ctx.fillStyle = hexCss(PLATE_BACK);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  ctx.fillStyle = hexCss(color);
  ctx.fillText(text || ' ', canvas.width / 2, canvas.height / 2 + FONT_PX * 0.04);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return { texture, aspect: canvas.width / Math.max(1, canvas.height) };
}

function headerPose(object: THREE.Object3D): { position: THREE.Vector3; quaternion: THREE.Quaternion } {
  _box.setFromObject(object);
  _box.getSize(_size);
  _box.getCenter(_center);
  _toward.set(CITY_CENTER_X - _center.x, 0, CITY_CENTER_Z - _center.z);
  if (_toward.lengthSq() < 0.0001) _toward.set(0, 0, 1);
  _toward.normalize();
  const faces: Array<{ nx: number; nz: number; width: number }> = [
    { nx: 1, nz: 0, width: _size.z },
    { nx: -1, nz: 0, width: _size.z },
    { nx: 0, nz: 1, width: _size.x },
    { nx: 0, nz: -1, width: _size.x },
  ];
  let best = faces[0];
  let bestScore = -Infinity;
  for (const face of faces) {
    const facing = face.nx * _toward.x + face.nz * _toward.z;
    const score = face.width * Math.max(0, facing);
    if (score > bestScore) {
      bestScore = score;
      best = face;
    }
  }
  _normal.set(best.nx, 0, best.nz);
  _center.x += best.nx * (_size.x * 0.5);
  _center.z += best.nz * (_size.z * 0.5);
  _center.y = _box.max.y - Math.max(0.08, Math.min(0.16, _size.y * 0.12));
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), _normal);
  return { position: _center.clone(), quaternion };
}

interface PlateActor {
  config: BuildingNamePlate;
  group: THREE.Group;
  mesh: THREE.Mesh;
  texture: THREE.CanvasTexture | null;
}

export class BuildingNamePlateSet {
  private root = new THREE.Group();
  private world: THREE.Object3D | null = null;
  private scene: THREE.Scene | null = null;
  private actors: PlateActor[] = [];
  private fontReady = false;

  constructor() {
    this.root.name = 'rastaak-building-names';
    if (typeof document !== 'undefined' && document.fonts) {
      void document.fonts.load('700 ' + FONT_PX + 'px Kalameh').then(() => {
        this.fontReady = true;
        if (this.world) this.rebuild();
      });
    } else {
      this.fontReady = true;
    }
    if (typeof window !== 'undefined') {
      window.addEventListener(BUILDING_NAMES_EVENT, this.onConfig);
    }
  }

  attach(world: THREE.Object3D, scene: THREE.Scene) {
    this.detach();
    this.world = world;
    this.scene = scene;
    scene.add(this.root);
    this.rebuild();
  }

  rebuild() {
    this.clearActors();
    if (!this.world || !this.scene) return;
    this.world.updateMatrixWorld(true);
    for (const config of BUILDING_NAMES) {
      const object = findByName(this.world, config.building);
      if (!object) continue;
      const actor = this.makePlate(config, object);
      this.root.add(actor.group);
      this.actors.push(actor);
    }
  }

  dispose() {
    if (typeof window !== 'undefined') {
      window.removeEventListener(BUILDING_NAMES_EVENT, this.onConfig);
    }
    this.detach();
  }

  private onConfig = () => {
    this.rebuild();
  };

  private detach() {
    this.clearActors();
    if (this.scene && this.root.parent === this.scene) this.scene.remove(this.root);
    this.world = null;
    this.scene = null;
  }

  private clearActors() {
    for (const actor of this.actors) {
      actor.texture?.dispose();
      actor.mesh.geometry.dispose();
      const mats = Array.isArray(actor.mesh.material) ? actor.mesh.material : [actor.mesh.material];
      mats.forEach((mat) => mat.dispose());
      actor.group.removeFromParent();
    }
    this.actors = [];
  }

  private makePlate(config: BuildingNamePlate, object: THREE.Object3D): PlateActor {
    const painted = paintText(config.text, config.color);
    const height = Math.max(0.06, config.size);
    const width = height * painted.aspect;
    const depth = Math.max(0.008, config.extrude);
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const side = new THREE.MeshStandardMaterial({
      color: PLATE_BACK,
      roughness: 0.55,
      metalness: 0.04,
    });
    const front = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: painted.texture,
      transparent: true,
      roughness: 0.42,
      metalness: 0.02,
    });
    const mesh = new THREE.Mesh(geometry, [side, side.clone(), side.clone(), side.clone(), front, side.clone()]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const group = new THREE.Group();
    group.name = 'name-plate-' + config.id;
    group.add(mesh);
    const pose = headerPose(object);
    group.position.copy(pose.position);
    group.quaternion.copy(pose.quaternion);
    _offset.set(config.position[0], config.position[1], config.position[2] + depth * 0.5 + 0.03);
    _offset.applyQuaternion(group.quaternion);
    group.position.add(_offset);
    return { config, group, mesh, texture: painted.texture };
  }
}

export function notifyBuildingNamesChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(BUILDING_NAMES_EVENT));
}
