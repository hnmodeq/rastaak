import * as THREE from 'three';
import { tokens } from '@/tokens/design-tokens';
import type { CameraStop } from './sceneTypes';

export type CameraHandle = 'source' | 'aim';

export interface CameraGizmoHit {
  handle: CameraHandle;
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

function markPick(object: THREE.Object3D, handle: CameraHandle) {
  object.userData.studioCameraHandle = handle;
  object.userData.studioCameraPick = true;
  object.traverse((child) => {
    child.userData.studioCameraHandle = handle;
    child.userData.studioCameraPick = true;
  });
}

export class CameraGizmoSet {
  readonly root = new THREE.Group();
  readonly sourceDummy = new THREE.Object3D();
  readonly aimDummy = new THREE.Object3D();
  private readonly pickables: THREE.Object3D[] = [];

  private readonly wireMat: THREE.LineBasicMaterial;
  private readonly aimMat: THREE.LineBasicMaterial;
  private readonly dashMat: THREE.LineDashedMaterial;
  private readonly sourceMat: THREE.MeshBasicMaterial;
  private readonly aimFillMat: THREE.MeshBasicMaterial;
  private readonly bodyMat: THREE.MeshBasicMaterial;
  private readonly lampColor = new THREE.Color(LAMP);
  private readonly aimColor = new THREE.Color(AIM);

  private readonly body: THREE.Mesh;
  private readonly lens: THREE.Mesh;
  private readonly sourceHandle: THREE.Mesh;
  private readonly aimHandle: THREE.Mesh;
  private readonly arrow: THREE.Mesh;
  private readonly sourceGround: THREE.Mesh;
  private readonly aimGround: THREE.Mesh;
  private readonly nearRect: THREE.Line;
  private readonly farRect: THREE.Line;
  private readonly sides: THREE.Line;
  private readonly aimLine: THREE.Line;
  private readonly sourceDrop: THREE.Line;
  private readonly aimDrop: THREE.Line;

  private controls: TransformControlsLike | null = null;
  private controlHelper: THREE.Object3D | null = null;
  private grab = false;
  private dragging = false;
  private selected: CameraHandle = 'source';
  private boundStop: CameraStop | null = null;
  private readonly orientation = new THREE.Quaternion();
  private readonly lookMatrix = new THREE.Matrix4();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly origin = new THREE.Vector3();
  private readonly aim = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly camUp = new THREE.Vector3();

  private readonly onDragging = (event: { value?: boolean }) => {
    this.dragging = Boolean(event.value);
    this.onOrbitLock?.(this.dragging);
  };

  private readonly onTransform = () => {
    if (!this.boundStop) return;
    if (this.selected === 'source') {
      this.boundStop.camera[0] = this.sourceDummy.position.x;
      this.boundStop.camera[1] = this.sourceDummy.position.y;
      this.boundStop.camera[2] = this.sourceDummy.position.z;
    } else {
      this.boundStop.target[0] = this.aimDummy.position.x;
      this.boundStop.target[1] = this.aimDummy.position.y;
      this.boundStop.target[2] = this.aimDummy.position.z;
    }
    this.onEdited?.();
  };

  constructor(
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.Camera,
    private readonly renderer: THREE.WebGLRenderer,
    private readonly onEdited?: () => void,
    private readonly onOrbitLock?: (locked: boolean) => void,
  ) {
    this.root.name = 'studio-camera-gizmos';
    this.root.visible = false;
    this.root.renderOrder = 1001;

    this.wireMat = overlayLine(LAMP) as THREE.LineBasicMaterial;
    this.aimMat = overlayLine(AIM) as THREE.LineBasicMaterial;
    this.dashMat = overlayLine(AIM, true) as THREE.LineDashedMaterial;
    this.sourceMat = overlayMesh(LAMP, 0.88);
    this.aimFillMat = overlayMesh(AIM, 0.9);
    this.bodyMat = overlayMesh(LAMP, 0.22);

    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.28), this.bodyMat);
    this.lens = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.16, 12), this.sourceMat);
    this.lens.rotation.x = Math.PI / 2;
    this.sourceHandle = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), this.sourceMat);
    this.aimHandle = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), this.aimFillMat);
    this.arrow = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.46, 10), this.aimFillMat);
    this.sourceGround = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.4, 28), overlayMesh(LAMP, 0.7));
    this.aimGround = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.34, 28), overlayMesh(AIM, 0.7));
    this.sourceGround.rotation.x = -Math.PI / 2;
    this.aimGround.rotation.x = -Math.PI / 2;

    this.nearRect = new THREE.LineLoop(new THREE.BufferGeometry(), this.wireMat);
    this.farRect = new THREE.LineLoop(new THREE.BufferGeometry(), this.wireMat);
    this.sides = new THREE.LineSegments(new THREE.BufferGeometry(), this.wireMat);
    this.aimLine = new THREE.Line(new THREE.BufferGeometry(), this.dashMat);
    this.sourceDrop = new THREE.Line(new THREE.BufferGeometry(), overlayLine(LAMP, true));
    this.aimDrop = new THREE.Line(new THREE.BufferGeometry(), overlayLine(AIM, true));

    markPick(this.body, 'source');
    markPick(this.lens, 'source');
    markPick(this.sourceHandle, 'source');
    markPick(this.sourceGround, 'source');
    markPick(this.aimHandle, 'aim');
    markPick(this.aimGround, 'aim');
    this.pickables.push(this.body, this.lens, this.sourceHandle, this.sourceGround, this.aimHandle, this.aimGround);

    this.sourceDummy.name = 'camera:source';
    this.aimDummy.name = 'camera:aim';

    this.root.add(
      this.nearRect,
      this.farRect,
      this.sides,
      this.aimLine,
      this.sourceDrop,
      this.aimDrop,
      this.body,
      this.lens,
      this.sourceHandle,
      this.aimHandle,
      this.arrow,
      this.sourceGround,
      this.aimGround,
      this.sourceDummy,
      this.aimDummy,
    );
    this.scene.add(this.root);
  }

  bindStop(stop: CameraStop | null) {
    this.boundStop = stop;
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
      this.select(this.selected);
    });
  }

  pick(raycaster: THREE.Raycaster): CameraGizmoHit | null {
    const hits = raycaster.intersectObjects(this.pickables, true);
    const hit = hits.find((item) => item.object.userData.studioCameraPick);
    if (!hit) return null;
    return { handle: hit.object.userData.studioCameraHandle as CameraHandle };
  }

  select(handle: CameraHandle) {
    this.selected = handle;
    this.sourceHandle.scale.setScalar(handle === 'source' ? 1.35 : 1);
    this.aimHandle.scale.setScalar(handle === 'aim' ? 1.35 : 1);
    if (!this.grab || !this.controls) return;
    this.controls.attach(handle === 'aim' ? this.aimDummy : this.sourceDummy);
  }

  sync(stop: CameraStop | null, aspect: number) {
    if (!stop) return;
    this.boundStop = stop;
    this.origin.set(stop.camera[0], stop.camera[1], stop.camera[2]);
    this.aim.set(stop.target[0], stop.target[1], stop.target[2]);

    this.wireMat.color.copy(this.lampColor);
    this.aimMat.color.copy(this.aimColor);
    this.dashMat.color.copy(this.aimColor);
    (this.sourceDrop.material as THREE.LineDashedMaterial).color.copy(this.lampColor);
    (this.aimDrop.material as THREE.LineDashedMaterial).color.copy(this.aimColor);
    this.sourceMat.color.copy(this.lampColor);
    this.aimFillMat.color.copy(this.aimColor);
    this.bodyMat.color.copy(this.lampColor);
    (this.sourceGround.material as THREE.MeshBasicMaterial).color.copy(this.lampColor);
    (this.aimGround.material as THREE.MeshBasicMaterial).color.copy(this.aimColor);

    if (!this.dragging) {
      this.sourceDummy.position.copy(this.origin);
      this.aimDummy.position.copy(this.aim);
    } else if (this.selected === 'source') {
      this.origin.copy(this.sourceDummy.position);
    } else {
      this.aim.copy(this.aimDummy.position);
    }

    this.forward.copy(this.aim).sub(this.origin);
    if (this.forward.lengthSq() < 1e-6) this.forward.set(0, 0, -1);
    this.forward.normalize();
    this.lookMatrix.lookAt(this.origin, this.aim, this.up);
    this.orientation.setFromRotationMatrix(this.lookMatrix);

    this.body.position.copy(this.origin);
    this.body.quaternion.copy(this.orientation);
    this.lens.position.copy(this.origin).addScaledVector(this.forward, 0.22);
    this.lens.quaternion.copy(this.orientation);
    this.sourceHandle.position.copy(this.origin);
    this.aimHandle.position.copy(this.aim);
    this.sourceGround.position.set(this.origin.x, 0.03, this.origin.z);
    this.aimGround.position.set(this.aim.x, 0.03, this.aim.z);

    const fov = THREE.MathUtils.degToRad(stop.fov ?? 45);
    const safeAspect = Math.max(0.2, aspect || 1.6);
    const dist = this.origin.distanceTo(this.aim);
    const near = 0.55;
    const far = THREE.MathUtils.clamp(dist * 0.28, 1.5, 7);
    const nh = Math.tan(fov * 0.5) * near;
    const nw = nh * safeAspect;
    const fh = Math.tan(fov * 0.5) * far;
    const fw = fh * safeAspect;

    this.right.setFromMatrixColumn(this.lookMatrix, 0).normalize();
    this.camUp.setFromMatrixColumn(this.lookMatrix, 1).normalize();

    const corner = (depth: number, x: number, y: number) =>
      this.origin
        .clone()
        .addScaledVector(this.forward, depth)
        .addScaledVector(this.right, x)
        .addScaledVector(this.camUp, y);

    const nearPts = [corner(near, -nw, -nh), corner(near, nw, -nh), corner(near, nw, nh), corner(near, -nw, nh)];
    const farPts = [corner(far, -fw, -fh), corner(far, fw, -fh), corner(far, fw, fh), corner(far, -fw, fh)];
    setLinePoints(this.nearRect, [...nearPts, nearPts[0]]);
    setLinePoints(this.farRect, [...farPts, farPts[0]]);
    setLinePoints(this.sides, [
      this.origin.clone(),
      farPts[0],
      this.origin.clone(),
      farPts[1],
      this.origin.clone(),
      farPts[2],
      this.origin.clone(),
      farPts[3],
    ]);

    const arrowPos = this.origin.clone().addScaledVector(this.forward, far);
    this.arrow.position.copy(arrowPos);
    this.arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.forward);

    setLinePoints(this.aimLine, [this.origin.clone(), this.aim.clone()]);
    setLinePoints(this.sourceDrop, [this.origin.clone(), new THREE.Vector3(this.origin.x, 0, this.origin.z)]);
    setLinePoints(this.aimDrop, [this.aim.clone(), new THREE.Vector3(this.aim.x, 0, this.aim.z)]);
    this.sourceDrop.visible = Math.abs(this.origin.y) > 0.2;
    this.aimDrop.visible = Math.abs(this.aim.y) > 0.2;
    this.sourceHandle.scale.setScalar(this.selected === 'source' ? 1.35 : 1);
    this.aimHandle.scale.setScalar(this.selected === 'aim' ? 1.35 : 1);
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
    this.root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose?.();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material?.dispose?.();
    });
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
      console.warn('[studio] TransformControls unavailable; camera gizmos stay visual-only.', error);
    }
  }

  private detach() {
    this.controls?.detach();
    this.dragging = false;
    this.onOrbitLock?.(false);
  }
}
