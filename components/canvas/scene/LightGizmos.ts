import * as THREE from 'three';
import { tokens } from '@/tokens/design-tokens';

export type LightHandle = 'source' | 'aim';

export interface LightGizmoHit {
  id: string;
  handle: LightHandle;
}

type TransformControlsLike = {
  attach: (object: THREE.Object3D) => void;
  detach: () => void;
  dispose: () => void;
  setMode: (mode: string) => void;
  setSize: (size: number) => void;
  setSpace?: (space: string) => void;
  getHelper?: () => THREE.Object3D;
  addEventListener: (type: string, listener: (event: { value?: boolean }) => void) => void;
  removeEventListener: (type: string, listener: (event: { value?: boolean }) => void) => void;
};

const LAMP = tokens.experimentalScene.gizmoLamp;
const AIM = tokens.experimentalScene.gizmoAim;
const OFF = tokens.experimentalScene.gizmoOff;

const isAreaLight = (light: THREE.Light): light is THREE.RectAreaLight =>
  (light as THREE.RectAreaLight).isRectAreaLight || light.type === 'RectAreaLight';

const isPointLight = (light: THREE.Light): light is THREE.PointLight =>
  (light as THREE.PointLight).isPointLight || light.type === 'PointLight';

function overlayLine(color: number, dashed = false): THREE.LineBasicMaterial | THREE.LineDashedMaterial {
  const shared = {
    color,
    depthTest: false,
    fog: false,
    toneMapped: false,
    transparent: true,
    opacity: 0.95,
  };
  return dashed
    ? new THREE.LineDashedMaterial({ ...shared, dashSize: 0.4, gapSize: 0.22 })
    : new THREE.LineBasicMaterial(shared);
}

function overlayMesh(color: number, opacity: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthTest: false,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
}

function circlePoints(radius: number, axis: 'xz' | 'xy' | 'zy', segments = 72): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const reach = Math.max(0, radius);
  for (let i = 0; i <= segments; i += 1) {
    const a = (i / segments) * Math.PI * 2;
    const c = Math.cos(a) * reach;
    const s = Math.sin(a) * reach;
    if (axis === 'xz') pts.push(new THREE.Vector3(c, 0, s));
    else if (axis === 'xy') pts.push(new THREE.Vector3(c, s, 0));
    else pts.push(new THREE.Vector3(0, s, c));
  }
  return pts;
}

function setLinePoints(line: THREE.Line, points: THREE.Vector3[]) {
  const attr = line.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
  if (!attr || attr.count !== points.length) {
    line.geometry.dispose();
    line.geometry = new THREE.BufferGeometry().setFromPoints(points);
  } else {
    for (let i = 0; i < points.length; i += 1) {
      attr.setXYZ(i, points[i].x, points[i].y, points[i].z);
    }
    attr.needsUpdate = true;
    line.geometry.computeBoundingSphere();
  }
  line.computeLineDistances();
}

function readAim(light: THREE.Light): THREE.Vector3 {
  const stored = light.userData.lookTarget as [number, number, number] | undefined;
  if (stored && stored.length >= 3) {
    return new THREE.Vector3(stored[0], stored[1], stored[2]);
  }
  const targeted = light as THREE.DirectionalLight | THREE.SpotLight;
  if (targeted.target?.position) return targeted.target.position.clone();
  return new THREE.Vector3(light.position.x, 0, light.position.z);
}

function writeAim(light: THREE.Light, aim: THREE.Vector3) {
  const next: [number, number, number] = [aim.x, aim.y, aim.z];
  light.userData.lookTarget = next;
  if (isAreaLight(light)) {
    light.lookAt(aim.x, aim.y, aim.z);
  }
  const targeted = light as THREE.DirectionalLight | THREE.SpotLight;
  if (targeted.target?.position) {
    targeted.target.position.copy(aim);
    targeted.target.updateMatrixWorld(true);
  }
}

function markPick(object: THREE.Object3D, id: string, handle: LightHandle) {
  object.userData.studioLightId = id;
  object.userData.studioHandle = handle;
  object.userData.studioPick = true;
  object.traverse((child) => {
    child.userData.studioLightId = id;
    child.userData.studioHandle = handle;
    child.userData.studioPick = true;
  });
}

class LightGizmo {
  readonly group = new THREE.Group();
  readonly sourceDummy = new THREE.Object3D();
  readonly aimDummy = new THREE.Object3D();
  readonly pickables: THREE.Object3D[] = [];

  private readonly wireMat: THREE.LineBasicMaterial;
  private readonly aimMat: THREE.LineBasicMaterial;
  private readonly dashMat: THREE.LineDashedMaterial;
  private readonly fillMat: THREE.MeshBasicMaterial;
  private readonly sourceMat: THREE.MeshBasicMaterial;
  private readonly aimFillMat: THREE.MeshBasicMaterial;
  private readonly off = new THREE.Color(OFF);
  private readonly lampColor = new THREE.Color(LAMP);
  private readonly aimColor = new THREE.Color(AIM);

  private readonly corners: THREE.Line;
  private readonly cross: THREE.Line;
  private readonly rays: THREE.Line;
  private readonly aimLine: THREE.Line;
  private readonly dropLine: THREE.Line;
  private readonly fill: THREE.Mesh;
  private readonly sourceHandle: THREE.Mesh;
  private readonly aimHandle: THREE.Mesh;
  private readonly arrow: THREE.Mesh;
  private readonly ground: THREE.Mesh;
  private readonly rangeXZ: THREE.Line;
  private readonly rangeXY: THREE.Line;
  private readonly rangeZY: THREE.Line;
  private readonly groundRing: THREE.Line;
  private readonly rangeStem: THREE.Line;
  private readonly groundTick: THREE.Line;
  private lastWidth = -1;
  private lastHeight = -1;

  constructor(
    readonly id: string,
    readonly light: THREE.Light,
  ) {
    this.group.name = `gizmo:${id}`;
    this.group.renderOrder = 1000;

    this.wireMat = overlayLine(LAMP) as THREE.LineBasicMaterial;
    this.aimMat = overlayLine(AIM) as THREE.LineBasicMaterial;
    this.dashMat = overlayLine(AIM, true) as THREE.LineDashedMaterial;
    this.fillMat = overlayMesh(LAMP, 0.2);
    this.sourceMat = overlayMesh(LAMP, 0.85);
    this.aimFillMat = overlayMesh(AIM, 0.9);

    this.corners = new THREE.LineLoop(new THREE.BufferGeometry(), this.wireMat);
    this.cross = new THREE.LineSegments(new THREE.BufferGeometry(), this.wireMat);
    this.rays = new THREE.LineSegments(new THREE.BufferGeometry(), this.aimMat);
    this.aimLine = new THREE.Line(new THREE.BufferGeometry(), this.dashMat);
    this.dropLine = new THREE.Line(new THREE.BufferGeometry(), overlayLine(LAMP, true));

    this.fill = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.fillMat);
    this.sourceHandle = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), this.sourceMat);
    this.aimHandle = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), this.aimFillMat);
    this.arrow = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 10), this.aimFillMat);
    this.ground = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.42, 28), overlayMesh(LAMP, 0.7));
    this.ground.rotation.x = -Math.PI / 2;
    this.rangeXZ = new THREE.Line(new THREE.BufferGeometry(), this.wireMat);
    this.rangeXY = new THREE.Line(new THREE.BufferGeometry(), this.wireMat);
    this.rangeZY = new THREE.Line(new THREE.BufferGeometry(), this.wireMat);
    this.groundRing = new THREE.Line(new THREE.BufferGeometry(), this.aimMat);
    this.rangeStem = new THREE.Line(new THREE.BufferGeometry(), this.dashMat);
    this.groundTick = new THREE.Line(new THREE.BufferGeometry(), this.aimMat);

    markPick(this.fill, id, 'source');
    markPick(this.sourceHandle, id, 'source');
    markPick(this.aimHandle, id, 'aim');
    markPick(this.ground, id, 'source');

    this.pickables.push(this.fill, this.sourceHandle, this.aimHandle, this.ground);

    this.sourceDummy.name = `${id}:source`;
    this.aimDummy.name = `${id}:aim`;

    this.group.add(
      this.corners,
      this.cross,
      this.rays,
      this.aimLine,
      this.dropLine,
      this.fill,
      this.sourceHandle,
      this.aimHandle,
      this.arrow,
      this.ground,
      this.rangeXZ,
      this.rangeXY,
      this.rangeZY,
      this.groundRing,
      this.rangeStem,
      this.groundTick,
      this.sourceDummy,
      this.aimDummy,
    );

    const area = isAreaLight(light);
    this.fill.visible = area;
    this.corners.visible = area;
    this.cross.visible = area;
    this.rays.visible = area;
    this.arrow.visible = area;
    this.aimHandle.visible = area;
    this.aimLine.visible = area;
    this.sourceHandle.visible = !area;
    this.rangeXZ.visible = false;
    this.rangeXY.visible = false;
    this.rangeZY.visible = false;
    this.groundRing.visible = false;
    this.rangeStem.visible = false;
    this.groundTick.visible = false;
  }

  setSelected(handle: LightHandle | null) {
    this.sourceHandle.scale.setScalar(handle === 'source' ? 1.35 : 1);
    this.aimHandle.scale.setScalar(handle === 'aim' ? 1.35 : 1);
  }

  sync(dragging: boolean, selectedHandle: LightHandle | null) {
    const light = this.light;
    light.updateMatrixWorld(true);
    const origin = light.position;
    const aim = readAim(light);
    const on = light.visible !== false;
    const wire = on ? this.lampColor : this.off;
    const aimCol = on ? this.aimColor : this.off;

    this.wireMat.color.copy(wire);
    this.aimMat.color.copy(aimCol);
    this.dashMat.color.copy(aimCol);
    (this.dropLine.material as THREE.LineDashedMaterial).color.copy(wire);
    this.sourceMat.color.copy(wire);
    this.aimFillMat.color.copy(aimCol);
    this.fillMat.color.copy(on ? light.color : this.off);
    this.fillMat.opacity = on ? 0.22 : 0.08;
    (this.ground.material as THREE.MeshBasicMaterial).color.copy(wire);

    if (!dragging) {
      this.sourceDummy.position.copy(origin);
      this.aimDummy.position.copy(aim);
    }

    this.sourceHandle.position.copy(origin);
    this.aimHandle.position.copy(aim);
    this.ground.position.set(origin.x, 0.03, origin.z);

    if (isAreaLight(light)) {
      const width = Math.max(0.1, light.width);
      const height = Math.max(0.1, light.height);
      if (width !== this.lastWidth || height !== this.lastHeight) {
        this.fill.geometry.dispose();
        this.fill.geometry = new THREE.PlaneGeometry(width, height);
        this.lastWidth = width;
        this.lastHeight = height;
      }

      const orientation = new THREE.Quaternion();
      if (light.quaternion) {
        orientation.copy(light.quaternion);
      } else {
        const matrix = new THREE.Matrix4();
        const up = new THREE.Vector3(0, 1, 0);
        const toward = aim.clone();
        if (toward.distanceToSquared(origin) < 1e-6) toward.y -= 1;
        matrix.lookAt(origin, toward, up);
        orientation.setFromRotationMatrix(matrix);
      }

      this.fill.position.copy(origin);
      this.fill.quaternion.copy(orientation);

      const hw = width * 0.5;
      const hh = height * 0.5;
      const local = [
        new THREE.Vector3(-hw, -hh, 0),
        new THREE.Vector3(hw, -hh, 0),
        new THREE.Vector3(hw, hh, 0),
        new THREE.Vector3(-hw, hh, 0),
      ];
      const world = local.map((point) => point.applyQuaternion(orientation).add(origin));
      setLinePoints(this.corners, [...world, world[0]]);
      setLinePoints(this.cross, [world[0], world[2], world[1], world[3]]);

      const normal = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation);
      if (normal.lengthSq() < 1e-8) normal.set(0, -1, 0);
      normal.normalize();
      const dist = Math.max(0.2, origin.distanceTo(aim));
      const rayLen = THREE.MathUtils.clamp(dist * 0.28, 1.6, 9);
      const rayPts: THREE.Vector3[] = [];
      for (const corner of world) {
        rayPts.push(corner, corner.clone().addScaledVector(normal, rayLen));
      }
      setLinePoints(this.rays, rayPts);

      const arrowPos = origin.clone().addScaledVector(normal, rayLen);
      this.arrow.position.copy(arrowPos);
      this.arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    }

    if (isPointLight(light)) {
      const reach = light.distance > 0 ? light.distance : 0;
      this.sourceHandle.scale.setScalar((selectedHandle === 'source' ? 1.35 : 1) * (reach > 80 ? 1.15 : 1));
      const showRange = reach > 0.0001;
      this.rangeXZ.visible = showRange;
      this.rangeXY.visible = showRange;
      this.rangeZY.visible = showRange;
      this.rangeStem.visible = showRange;
      if (showRange) {
        const offset = (axis: 'xz' | 'xy' | 'zy') =>
          circlePoints(reach, axis).map((point) => point.add(origin));
        setLinePoints(this.rangeXZ, offset('xz'));
        setLinePoints(this.rangeXY, offset('xy'));
        setLinePoints(this.rangeZY, offset('zy'));
        setLinePoints(this.rangeStem, [
          new THREE.Vector3(origin.x, origin.y - reach, origin.z),
          new THREE.Vector3(origin.x, origin.y + reach, origin.z),
        ]);
        const groundReachSq = reach * reach - origin.y * origin.y;
        if (groundReachSq > 1e-6) {
          const groundR = Math.sqrt(groundReachSq);
          setLinePoints(
            this.groundRing,
            circlePoints(groundR, 'xz').map((point) =>
              point.add(new THREE.Vector3(origin.x, 0.03, origin.z)),
            ),
          );
          this.groundRing.visible = true;
        } else {
          this.groundRing.visible = false;
        }
        const crossesGround = origin.y - reach <= 0 && origin.y + reach >= 0;
        this.groundTick.visible = crossesGround;
        if (crossesGround) {
          const tick = Math.max(0.35, Math.min(1.6, reach * 0.08));
          setLinePoints(this.groundTick, [
            new THREE.Vector3(origin.x - tick, 0.03, origin.z),
            new THREE.Vector3(origin.x + tick, 0.03, origin.z),
          ]);
        }
      } else {
        this.groundRing.visible = false;
        this.groundTick.visible = false;
      }
    } else {
      this.rangeXZ.visible = false;
      this.rangeXY.visible = false;
      this.rangeZY.visible = false;
      this.groundRing.visible = false;
      this.rangeStem.visible = false;
      this.groundTick.visible = false;
    }

    setLinePoints(this.aimLine, [origin.clone(), aim.clone()]);
    setLinePoints(this.dropLine, [origin.clone(), new THREE.Vector3(origin.x, 0, origin.z)]);
    this.dropLine.visible = Math.abs(origin.y) > 0.2;
  }

  dispose() {
    this.group.traverse((child) => {
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose?.();
      const material = (mesh as THREE.Mesh).material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material?.dispose?.();
    });
  }
}

export class LightGizmoSet {
  readonly root = new THREE.Group();
  private readonly entries = new Map<string, LightGizmo>();
  private controls: TransformControlsLike | null = null;
  private controlHelper: THREE.Object3D | null = null;
  private grab = false;
  private dragging = false;
  private selected: { id: string; handle: LightHandle } | null = null;
  private readonly onDragging = (event: { value?: boolean }) => {
    this.dragging = Boolean(event.value);
    this.onOrbitLock?.(this.dragging);
  };
  private readonly onTransform = () => {
    if (!this.selected) return;
    const entry = this.entries.get(this.selected.id);
    if (!entry) return;
    if (this.selected.handle === 'source') {
      entry.light.position.copy(entry.sourceDummy.position);
      entry.light.updateMatrix();
      entry.light.updateMatrixWorld(true);
      if (isAreaLight(entry.light)) {
        const aim = readAim(entry.light);
        entry.light.lookAt(aim.x, aim.y, aim.z);
      }
    } else {
      writeAim(entry.light, entry.aimDummy.position);
    }
    this.onEdited?.(this.selected.id);
  };

  constructor(
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.Camera,
    private readonly renderer: THREE.WebGLRenderer,
    lightsMap: Map<string, THREE.Light>,
    private readonly onEdited?: (id: string) => void,
    private readonly onOrbitLock?: (locked: boolean) => void,
  ) {
    this.root.name = 'studio-light-gizmos';
    this.root.visible = false;
    this.scene.add(this.root);
    for (const [id, light] of lightsMap.entries()) {
      const entry = new LightGizmo(id, light);
      this.entries.set(id, entry);
      this.root.add(entry.group);
    }
  }

  setVisible(visible: boolean) {
    this.root.visible = visible;
    if (!visible) this.detach();
  }

  setGrabEnabled(enabled: boolean) {
    this.grab = enabled;
    if (!enabled) {
      this.detach();
      return;
    }
    void this.ensureControls().then(() => {
      if (!this.grab) return;
      if (!this.selected) {
        const firstArea = [...this.entries.values()].find((entry) => isAreaLight(entry.light));
        const fallback = firstArea ?? [...this.entries.values()][0];
        if (fallback) this.select(fallback.id, 'source');
      } else {
        this.select(this.selected.id, this.selected.handle);
      }
    });
  }

  pick(raycaster: THREE.Raycaster): LightGizmoHit | null {
    const targets: THREE.Object3D[] = [];
    for (const entry of this.entries.values()) targets.push(...entry.pickables);
    const hits = raycaster.intersectObjects(targets, true);
    const hit = hits.find((item) => item.object.userData.studioPick);
    if (!hit) return null;
    return {
      id: String(hit.object.userData.studioLightId),
      handle: hit.object.userData.studioHandle as LightHandle,
    };
  }

  select(id: string, handle: LightHandle) {
    const entry = this.entries.get(id);
    if (!entry) return;
    if (handle === 'aim' && !isAreaLight(entry.light)) handle = 'source';
    this.selected = { id, handle };
    for (const item of this.entries.values()) {
      item.setSelected(item.id === id ? handle : null);
    }
    if (!this.grab || !this.controls) return;
    this.controls.attach(handle === 'aim' ? entry.aimDummy : entry.sourceDummy);
  }

  syncAll() {
    for (const entry of this.entries.values()) {
      const handle = this.selected?.id === entry.id ? this.selected.handle : null;
      entry.sync(this.dragging && this.selected?.id === entry.id, handle);
    }
  }

  dispose() {
    this.detach();
    if (this.controls) {
      this.controls.removeEventListener('dragging-changed', this.onDragging);
      this.controls.removeEventListener('objectChange', this.onTransform);
      this.controls.dispose();
      this.controls = null;
    }
    if (this.controlHelper) {
      this.scene.remove(this.controlHelper);
      this.controlHelper = null;
    }
    for (const entry of this.entries.values()) entry.dispose();
    this.entries.clear();
    this.scene.remove(this.root);
  }

  private async ensureControls() {
    if (this.controls) return;
    try {
      // @ts-ignore
      const mod = await import('three/examples/jsm/controls/TransformControls.js');
      const TransformControls = mod.TransformControls;
      const controls = new TransformControls(this.camera, this.renderer.domElement) as TransformControlsLike;
      controls.setMode('translate');
      controls.setSize(0.85);
      controls.setSpace?.('world');
      controls.addEventListener('dragging-changed', this.onDragging);
      controls.addEventListener('objectChange', this.onTransform);
      const helper =
        typeof controls.getHelper === 'function'
          ? controls.getHelper()
          : (controls as unknown as THREE.Object3D);
      this.scene.add(helper);
      this.controls = controls;
      this.controlHelper = helper;
    } catch (error) {
      console.warn('[studio] TransformControls unavailable; lamp gizmos stay visual-only.', error);
    }
  }

  private detach() {
    this.controls?.detach();
    this.dragging = false;
    this.onOrbitLock?.(false);
  }
}
