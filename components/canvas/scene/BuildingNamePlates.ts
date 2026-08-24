import * as THREE from 'three';
import {
  BUILDING_NAMES,
  BUILDING_NAMES_EVENT,
  type BuildingNamePlate,
  type BuildingNameSide,
} from './buildingNamesConfig';

const CITY_CENTER_X = 13.36;
const CITY_CENTER_Z = -0.7;
const FONT_PX = 140;
const TRACE_THRESHOLD = 96;
const MIN_LOOP_AREA = 10;

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();
const _toward = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _offset = new THREE.Vector3();

type Pt = { x: number; y: number };

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

function plazaFront(sizeX: number, sizeZ: number, towardX: number, towardZ: number): { nx: number; nz: number } {
  const faces: Array<{ nx: number; nz: number; width: number }> = [
    { nx: 1, nz: 0, width: sizeZ },
    { nx: -1, nz: 0, width: sizeZ },
    { nx: 0, nz: 1, width: sizeX },
    { nx: 0, nz: -1, width: sizeX },
  ];
  let best = faces[0];
  let bestScore = -Infinity;
  for (const face of faces) {
    const facing = face.nx * towardX + face.nz * towardZ;
    const score = face.width * Math.max(0, facing);
    if (score > bestScore) {
      bestScore = score;
      best = face;
    }
  }
  return best;
}

function normalForSide(frontNx: number, frontNz: number, side?: BuildingNameSide): { nx: number; nz: number } {
  if (side === 'back') return { nx: -frontNx, nz: -frontNz };
  if (side === 'right') return { nx: frontNz, nz: -frontNx };
  if (side === 'left') return { nx: -frontNz, nz: frontNx };
  return { nx: frontNx, nz: frontNz };
}

function headerPose(
  object: THREE.Object3D,
  side?: BuildingNameSide,
): { position: THREE.Vector3; quaternion: THREE.Quaternion } {
  _box.setFromObject(object);
  _box.getSize(_size);
  _box.getCenter(_center);
  _toward.set(CITY_CENTER_X - _center.x, 0, CITY_CENTER_Z - _center.z);
  if (_toward.lengthSq() < 0.0001) _toward.set(0, 0, 1);
  _toward.normalize();
  const front = plazaFront(_size.x, _size.z, _toward.x, _toward.z);
  const chosen = normalForSide(front.nx, front.nz, side);
  _normal.set(chosen.nx, 0, chosen.nz);
  _center.x += chosen.nx * (_size.x * 0.5);
  _center.z += chosen.nz * (_size.z * 0.5);
  _center.y = _box.max.y - Math.max(0.08, Math.min(0.16, _size.y * 0.12));
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), _normal);
  return { position: _center.clone(), quaternion };
}

function paintMask(text: string): { data: Uint8ClampedArray; width: number; height: number } | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const font = '700 ' + FONT_PX + 'px Kalameh, sans-serif';
  ctx.font = font;
  const measured = Math.max(24, ctx.measureText(text || ' ').width);
  const padX = Math.round(FONT_PX * 0.35);
  const padY = Math.round(FONT_PX * 0.32);
  canvas.width = Math.min(1800, Math.ceil(measured + padX * 2));
  canvas.height = Math.ceil(FONT_PX * 1.2 + padY * 2);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  ctx.fillStyle = 'white';
  ctx.fillText(text || ' ', canvas.width / 2, canvas.height / 2 + FONT_PX * 0.04);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { data: image.data, width: canvas.width, height: canvas.height };
}

function keyOf(x: number, y: number): string {
  return x.toFixed(1) + ':' + y.toFixed(1);
}

function parseKey(key: string): Pt {
  const parts = key.split(':');
  return { x: Number(parts[0]), y: Number(parts[1]) };
}

function addSeg(edges: Map<string, string[]>, ax: number, ay: number, bx: number, by: number) {
  const a = keyOf(ax, ay);
  const b = keyOf(bx, by);
  const listA = edges.get(a);
  if (listA) listA.push(b);
  else edges.set(a, [b]);
  const listB = edges.get(b);
  if (listB) listB.push(a);
  else edges.set(b, [a]);
}

function alphaAt(data: Uint8ClampedArray, width: number, height: number, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= width || y >= height) return 0;
  return data[(y * width + x) * 4 + 3] >= TRACE_THRESHOLD ? 1 : 0;
}

function extractLoops(data: Uint8ClampedArray, width: number, height: number): Pt[][] {
  const edges = new Map<string, string[]>();
  for (let y = -1; y < height; y++) {
    for (let x = -1; x < width; x++) {
      const tl = alphaAt(data, width, height, x, y);
      const tr = alphaAt(data, width, height, x + 1, y);
      const br = alphaAt(data, width, height, x + 1, y + 1);
      const bl = alphaAt(data, width, height, x, y + 1);
      const code = (tl << 3) | (tr << 2) | (br << 1) | bl;
      if (code === 0 || code === 15) continue;
      const topX = x + 0.5;
      const topY = y;
      const rightX = x + 1;
      const rightY = y + 0.5;
      const bottomX = x + 0.5;
      const bottomY = y + 1;
      const leftX = x;
      const leftY = y + 0.5;
      switch (code) {
        case 1:
        case 14:
          addSeg(edges, leftX, leftY, bottomX, bottomY);
          break;
        case 2:
        case 13:
          addSeg(edges, rightX, rightY, bottomX, bottomY);
          break;
        case 3:
        case 12:
          addSeg(edges, leftX, leftY, rightX, rightY);
          break;
        case 4:
        case 11:
          addSeg(edges, topX, topY, rightX, rightY);
          break;
        case 5:
          addSeg(edges, leftX, leftY, topX, topY);
          addSeg(edges, rightX, rightY, bottomX, bottomY);
          break;
        case 6:
        case 9:
          addSeg(edges, topX, topY, bottomX, bottomY);
          break;
        case 7:
        case 8:
          addSeg(edges, leftX, leftY, topX, topY);
          break;
        case 10:
          addSeg(edges, leftX, leftY, bottomX, bottomY);
          addSeg(edges, topX, topY, rightX, rightY);
          break;
        default:
          break;
      }
    }
  }

  const used = new Set<string>();
  const loops: Pt[][] = [];
  const edgeId = (a: string, b: string) => (a < b ? a + '|' + b : b + '|' + a);

  for (const start of edges.keys()) {
    const startNeighbors = edges.get(start);
    if (!startNeighbors || startNeighbors.length === 0) continue;
    const firstEdge = edgeId(start, startNeighbors[0]);
    if (used.has(firstEdge)) continue;
    const loop: string[] = [start];
    let prev = start;
    let curr = startNeighbors[0];
    used.add(firstEdge);
    let guard = 0;
    while (curr !== start && guard++ < 20000) {
      loop.push(curr);
      const nexts = edges.get(curr) || [];
      let next = '';
      for (const candidate of nexts) {
        if (candidate === prev) continue;
        const id = edgeId(curr, candidate);
        if (used.has(id)) continue;
        next = candidate;
        used.add(id);
        break;
      }
      if (!next) break;
      prev = curr;
      curr = next;
    }
    if (loop.length >= 4) loops.push(loop.map(parseKey));
  }
  return loops;
}

function distToSeg(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  if (len < 1e-8) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function rdp(points: Pt[], start: number, end: number, eps: number, keep: boolean[]) {
  let maxDist = 0;
  let index = start;
  const a = points[start];
  const b = points[end];
  for (let i = start + 1; i < end; i++) {
    const d = distToSeg(points[i], a, b);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist > eps) {
    rdp(points, start, index, eps, keep);
    rdp(points, index, end, eps, keep);
  } else {
    keep[start] = true;
    keep[end] = true;
  }
}

function simplifyLoop(loop: Pt[], eps: number): Pt[] {
  if (loop.length < 6) return loop;
  const keep = new Array(loop.length).fill(false);
  rdp(loop, 0, loop.length - 1, eps, keep);
  keep[0] = true;
  keep[loop.length - 1] = true;
  const next = loop.filter((_, i) => keep[i]);
  return next.length >= 3 ? next : loop;
}

function pointInLoop(x: number, y: number, loop: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
    const xi = loop[i].x;
    const yi = loop[i].y;
    const xj = loop[j].x;
    const yj = loop[j].y;
    const hit = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

function toVec2(loop: Pt[], height: number): THREE.Vector2[] {
  return loop.map((p) => new THREE.Vector2(p.x, height - p.y));
}

function ensureWinding(points: THREE.Vector2[], clockwise: boolean) {
  if (THREE.ShapeUtils.isClockWise(points) !== clockwise) points.reverse();
}

function nestingDepth(parents: number[], index: number): number {
  let depth = 0;
  let current = parents[index];
  const seen = new Set<number>();
  while (current >= 0 && !seen.has(current)) {
    seen.add(current);
    depth += 1;
    current = parents[current];
  }
  return depth;
}

function maskToShapes(text: string): THREE.Shape[] {
  const mask = paintMask(text);
  if (!mask) return [];
  const loops = extractLoops(mask.data, mask.width, mask.height)
    .map((loop) => simplifyLoop(loop, 1.15))
    .map((loop) => toVec2(loop, mask.height))
    .filter((loop) => Math.abs(THREE.ShapeUtils.area(loop)) >= MIN_LOOP_AREA);
  if (!loops.length) return [];

  const items = loops.map((points) => ({
    points,
    area: Math.abs(THREE.ShapeUtils.area(points)),
  }));
  items.sort((a, b) => b.area - a.area);
  const parents = items.map(() => -1);
  for (let i = 1; i < items.length; i++) {
    const sample = items[i].points[0];
    for (let j = i - 1; j >= 0; j--) {
      if (pointInLoop(sample.x, sample.y, items[j].points)) {
        parents[i] = j;
        break;
      }
    }
  }

  const shapes: THREE.Shape[] = [];
  const hosts: Array<THREE.Shape | null> = items.map(() => null);
  for (let i = 0; i < items.length; i++) {
    if (nestingDepth(parents, i) % 2 === 1) {
      const parent = parents[i];
      const host = parent >= 0 ? hosts[parent] : null;
      if (!host) continue;
      ensureWinding(items[i].points, true);
      host.holes.push(new THREE.Path(items[i].points));
      continue;
    }
    ensureWinding(items[i].points, false);
    const shape = new THREE.Shape(items[i].points);
    hosts[i] = shape;
    shapes.push(shape);
  }
  return shapes;
}

function buildTextGeometry(text: string, height: number, depth: number): THREE.BufferGeometry {
  const shapes = maskToShapes(text);
  if (!shapes.length) return new THREE.BoxGeometry(Math.max(0.04, height * 0.4), height, depth);
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: 1,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 1.4,
    bevelSize: 0.9,
    bevelOffset: 0,
    bevelSegments: 1,
    curveSegments: 1,
  });
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return geometry;
  const sizeX = Math.max(1e-4, box.max.x - box.min.x);
  const sizeY = Math.max(1e-4, box.max.y - box.min.y);
  const sizeZ = Math.max(1e-4, box.max.z - box.min.z);
  const scale = height / sizeY;
  geometry.translate(-(box.min.x + box.max.x) * 0.5, -(box.min.y + box.max.y) * 0.5, -box.min.z);
  geometry.scale(scale, scale, depth / sizeZ);
  return geometry;
}

interface PlateActor {
  config: BuildingNamePlate;
  group: THREE.Group;
  mesh: THREE.Mesh;
}

export class BuildingNamePlateSet {
  private root = new THREE.Group();
  private world: THREE.Object3D | null = null;
  private scene: THREE.Scene | null = null;
  private actors: PlateActor[] = [];

  constructor() {
    this.root.name = 'rastaak-building-names';
    if (typeof document !== 'undefined' && document.fonts) {
      void document.fonts.load('700 ' + FONT_PX + 'px Kalameh').then(() => {
        if (this.world) this.rebuild();
      });
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
      actor.mesh.geometry.dispose();
      const mats = Array.isArray(actor.mesh.material) ? actor.mesh.material : [actor.mesh.material];
      mats.forEach((mat) => mat.dispose());
      actor.group.removeFromParent();
    }
    this.actors = [];
  }

  private makePlate(config: BuildingNamePlate, object: THREE.Object3D): PlateActor {
    const height = Math.max(0.06, config.size);
    const depth = Math.max(0.008, config.extrude);
    const geometry = buildTextGeometry(config.text, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.38,
      metalness: 0.08,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const group = new THREE.Group();
    group.name = 'name-plate-' + config.id;
    group.add(mesh);
    const pose = headerPose(object, config.side);
    group.position.copy(pose.position);
    group.quaternion.copy(pose.quaternion);
    _offset.set(config.position[0], config.position[1], config.position[2] + 0.03);
    _offset.applyQuaternion(group.quaternion);
    group.position.add(_offset);
    return { config, group, mesh };
  }
}

export function notifyBuildingNamesChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(BUILDING_NAMES_EVENT));
}
