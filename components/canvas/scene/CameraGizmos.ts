import * as THREE from 'three';
import { tokens } from '@/tokens/design-tokens';
import type { CameraStop } from './sceneTypes';
import { sampleSceneJourney } from './journeyMath';

export type CameraHandle = 'source' | 'aim';

export interface CameraGizmoHit {
  handle: CameraHandle;
}

export type CameraPose = {
  camera: [number, number, number];
  target: [number, number, number];
  fov?: number;
};

export type CameraPathMode = 'full' | 'segment';

export type CameraDisplayFlags = {
  camGizmo: boolean;
  targetGizmo: boolean;
  camPath: boolean;
  targetPath: boolean;
  pathMode: CameraPathMode;
};

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

function hexCss(value: number): string {
  return '#' + (value >>> 0).toString(16).padStart(6, '0');
}

function makeNumberSprite(text: string, color: number): THREE.Sprite {
  const size = 64;
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  const ctx = canvas?.getContext('2d') ?? null;
  if (!canvas || !ctx) {
    return new THREE.Sprite(
      new THREE.SpriteMaterial({
        color,
        depthTest: false,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    );
  }
  canvas.width = size;
  canvas.height = size;
  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.fillStyle = hexCss(color);
  ctx.fill();
  ctx.fillStyle = color === LAMP ? '#1a1404' : '#1a0a06';
  ctx.font = '700 34px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2 + 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      transparent: true,
    }),
  );
  sprite.scale.setScalar(0.46);
  sprite.renderOrder = 1102;
  sprite.userData.labelTexture = texture;
  return sprite;
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

function segmentIndex(stops: CameraStop[], t: number): number {
  if (stops.length < 2) return 0;
  let idx = 0;
  while (idx < stops.length - 1 && stops[idx + 1].progress <= t) idx += 1;
  return Math.min(idx, stops.length - 2);
}

function segmentRange(stops: CameraStop[], idx: number) {
  const from = Math.max(0, Math.min(idx, stops.length - 1));
  const to = Math.min(stops.length - 1, from + 1);
  return {
    from,
    to,
    start: stops[from]?.progress ?? 0,
    end: stops[to]?.progress ?? 1,
  };
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
  private readonly pathMat: THREE.LineBasicMaterial;
  private readonly targetPathMat: THREE.LineDashedMaterial;
  private readonly sourceMat: THREE.MeshBasicMaterial;
  private readonly aimFillMat: THREE.MeshBasicMaterial;
  private readonly bodyMat: THREE.MeshBasicMaterial;
  private readonly lampColor = new THREE.Color(LAMP);
  private readonly aimColor = new THREE.Color(AIM);

  private readonly body: THREE.Mesh;
  private readonly lens: THREE.Mesh;
  private readonly sourceHandle: THREE.Mesh;
  private readonly aimHandle: THREE.Mesh;
  private readonly aimLocator: THREE.Mesh;
  private readonly arrow: THREE.Mesh;
  private readonly sourceGround: THREE.Mesh;
  private readonly aimGround: THREE.Mesh;
  private readonly nearRect: THREE.Line;
  private readonly farRect: THREE.Line;
  private readonly sides: THREE.Line;
  private readonly aimLine: THREE.Line;
  private readonly sourceDrop: THREE.Line;
  private readonly aimDrop: THREE.Line;
  private readonly camPath: THREE.Line;
  private readonly targetPath: THREE.Line;
  private readonly stopMarks = new THREE.Group();

  private sourceControls: TransformControlsLike | null = null;
  private aimControls: TransformControlsLike | null = null;
  private sourceHelper: THREE.Object3D | null = null;
  private aimHelper: THREE.Object3D | null = null;
  private grab = false;
  private dragging = false;
  private selected: CameraHandle = 'source';
  private boundStop: CameraStop | null = null;
  private pathKey = '';
  private showCamGizmo = true;
  private showTargetGizmo = true;
  private showCamPath = true;
  private showTargetPath = true;
  private pathMode: CameraPathMode = 'full';
  private pathT = 0;
  private hasCamPath = false;
  private hasTargetPath = false;
  private readonly orientation = new THREE.Quaternion();
  private readonly lookMatrix = new THREE.Matrix4();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly origin = new THREE.Vector3();
  private readonly aim = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly camUp = new THREE.Vector3();
  private readonly journeySample = {
    camera: [0, 0, 0] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    fov: 45,
  };

  private readonly onDragging = (event: { value?: boolean }) => {
    this.dragging = Boolean(event.value);
    this.onOrbitLock?.(this.dragging);
  };

  private readonly onSourceTransform = () => {
    if (!this.boundStop) return;
    this.boundStop.camera[0] = this.sourceDummy.position.x;
    this.boundStop.camera[1] = this.sourceDummy.position.y;
    this.boundStop.camera[2] = this.sourceDummy.position.z;
    this.onEdited?.();
  };

  private readonly onAimTransform = () => {
    if (!this.boundStop) return;
    this.boundStop.target[0] = this.aimDummy.position.x;
    this.boundStop.target[1] = this.aimDummy.position.y;
    this.boundStop.target[2] = this.aimDummy.position.z;
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
    this.pathMat = overlayLine(LAMP) as THREE.LineBasicMaterial;
    this.pathMat.opacity = 0.7;
    this.targetPathMat = overlayLine(AIM, true) as THREE.LineDashedMaterial;
    this.targetPathMat.opacity = 0.7;
    this.sourceMat = overlayMesh(LAMP, 0.88);
    this.aimFillMat = overlayMesh(AIM, 0.92);
    this.bodyMat = overlayMesh(LAMP, 0.22);

    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.28), this.bodyMat);
    this.lens = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.16, 12), this.sourceMat);
    this.lens.rotation.x = Math.PI / 2;
    this.sourceHandle = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), this.sourceMat);
    this.aimHandle = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), this.aimFillMat);
    this.aimLocator = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.72, 36), overlayMesh(AIM, 0.85));
    this.aimLocator.rotation.x = -Math.PI / 2;
    this.arrow = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.46, 10), this.aimFillMat);
    this.sourceGround = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.4, 28), overlayMesh(LAMP, 0.7));
    this.aimGround = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.46, 28), overlayMesh(AIM, 0.8));
    this.sourceGround.rotation.x = -Math.PI / 2;
    this.aimGround.rotation.x = -Math.PI / 2;

    this.nearRect = new THREE.LineLoop(new THREE.BufferGeometry(), this.wireMat);
    this.farRect = new THREE.LineLoop(new THREE.BufferGeometry(), this.wireMat);
    this.sides = new THREE.LineSegments(new THREE.BufferGeometry(), this.wireMat);
    this.aimLine = new THREE.Line(new THREE.BufferGeometry(), this.dashMat);
    this.sourceDrop = new THREE.Line(new THREE.BufferGeometry(), overlayLine(LAMP, true));
    this.aimDrop = new THREE.Line(new THREE.BufferGeometry(), overlayLine(AIM, true));
    this.camPath = new THREE.Line(new THREE.BufferGeometry(), this.pathMat);
    this.targetPath = new THREE.Line(new THREE.BufferGeometry(), this.targetPathMat);
    this.stopMarks.name = 'camera-stop-marks';

    markPick(this.body, 'source');
    markPick(this.lens, 'source');
    markPick(this.sourceHandle, 'source');
    markPick(this.sourceGround, 'source');
    markPick(this.aimHandle, 'aim');
    markPick(this.aimLocator, 'aim');
    markPick(this.aimGround, 'aim');
    this.pickables.push(
      this.body,
      this.lens,
      this.sourceHandle,
      this.sourceGround,
      this.aimHandle,
      this.aimLocator,
      this.aimGround,
    );

    this.sourceDummy.name = 'camera:source';
    this.aimDummy.name = 'camera:aim';
    this.aimLocator.visible = false;

    this.root.add(
      this.camPath,
      this.targetPath,
      this.stopMarks,
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
      this.aimLocator,
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

  setDisplay(flags: Partial<CameraDisplayFlags>) {
    if (flags.camGizmo !== undefined) this.showCamGizmo = flags.camGizmo;
    if (flags.targetGizmo !== undefined) this.showTargetGizmo = flags.targetGizmo;
    if (flags.camPath !== undefined) this.showCamPath = flags.camPath;
    if (flags.targetPath !== undefined) this.showTargetPath = flags.targetPath;
    if (flags.pathMode !== undefined && flags.pathMode !== this.pathMode) {
      this.pathMode = flags.pathMode;
      this.pathKey = '';
    }
    this.applyPartVisibility();
  }

  setGrabEnabled(enabled: boolean) {
    this.grab = enabled;
    if (!enabled) {
      this.detach();
      this.applyPartVisibility();
      return;
    }
    void this.ensureControls().then(() => {
      if (!this.grab) return;
      this.applyPartVisibility();
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
    this.aimHandle.scale.setScalar(handle === 'aim' ? 1.45 : 1.15);
    if (!this.grab) return;
    if (handle === 'aim') this.aimControls?.attach(this.aimDummy);
    else this.sourceControls?.attach(this.sourceDummy);
  }

  syncPath(stops: CameraStop[], t = 0) {
    this.pathT = Math.max(0, Math.min(1, t));
    const segment = segmentIndex(stops, this.pathT);
    const key = [
      this.pathMode,
      this.pathMode === 'segment' ? segment : 'all',
      stops
        .map((stop) => `${stop.progress}:${stop.camera.join(',')}:${stop.target.join(',')}:${stop.fov ?? 0}`)
        .join('|'),
    ].join('#');
    if (key === this.pathKey) {
      this.applyPartVisibility();
      return;
    }
    this.pathKey = key;

    const range =
      this.pathMode === 'segment' && stops.length > 1
        ? segmentRange(stops, segment)
        : { start: 0, end: 1, from: 0, to: Math.max(0, stops.length - 1) };

    const camPts: THREE.Vector3[] = [];
    const aimPts: THREE.Vector3[] = [];
    const span = Math.max(0, range.end - range.start);
    const steps = this.pathMode === 'segment' ? 24 : Math.max(24, stops.length * 16);
    if (span <= 1e-6) {
      sampleSceneJourney(range.start, this.journeySample);
      const cam = new THREE.Vector3(
        this.journeySample.camera[0],
        this.journeySample.camera[1],
        this.journeySample.camera[2],
      );
      const aim = new THREE.Vector3(
        this.journeySample.target[0],
        this.journeySample.target[1],
        this.journeySample.target[2],
      );
      camPts.push(cam, cam.clone());
      aimPts.push(aim, aim.clone());
    } else {
      for (let i = 0; i <= steps; i += 1) {
        sampleSceneJourney(range.start + (span * i) / steps, this.journeySample);
        camPts.push(
          new THREE.Vector3(this.journeySample.camera[0], this.journeySample.camera[1], this.journeySample.camera[2]),
        );
        aimPts.push(
          new THREE.Vector3(this.journeySample.target[0], this.journeySample.target[1], this.journeySample.target[2]),
        );
      }
    }
    setLinePoints(this.camPath, camPts.length ? camPts : [new THREE.Vector3()]);
    setLinePoints(this.targetPath, aimPts.length ? aimPts : [new THREE.Vector3()]);
    this.hasCamPath = camPts.length > 1;
    this.hasTargetPath = aimPts.length > 1;

    while (this.stopMarks.children.length) {
      const child = this.stopMarks.children[0];
      this.stopMarks.remove(child);
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose?.();
      const texture = child.userData.labelTexture as THREE.Texture | undefined;
      texture?.dispose?.();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material?.dispose?.();
    }
    const markStops =
      this.pathMode === 'segment' && stops.length
        ? [stops[range.from], stops[range.to]].filter((item, index, all) => item && all.indexOf(item) === index)
        : stops;
    for (const stop of markStops) {
      const index = Math.max(0, stops.indexOf(stop));
      const label = String(index + 1);
      const camMark = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), overlayMesh(LAMP, 0.9));
      camMark.position.set(stop.camera[0], stop.camera[1], stop.camera[2]);
      camMark.userData.kind = 'cam';
      const camLabel = makeNumberSprite(label, LAMP);
      camLabel.position.set(stop.camera[0], stop.camera[1] + 0.38, stop.camera[2]);
      camLabel.userData.kind = 'cam';
      const aimMark = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), overlayMesh(AIM, 0.9));
      aimMark.position.set(stop.target[0], stop.target[1], stop.target[2]);
      aimMark.userData.kind = 'aim';
      const aimLabel = makeNumberSprite(label, AIM);
      aimLabel.position.set(stop.target[0], stop.target[1] + 0.38, stop.target[2]);
      aimLabel.userData.kind = 'aim';
      this.stopMarks.add(camMark, camLabel, aimMark, aimLabel);
    }
    this.applyPartVisibility();
  }

  syncPose(pose: CameraPose, aspect: number) {
    this.origin.set(pose.camera[0], pose.camera[1], pose.camera[2]);
    this.aim.set(pose.target[0], pose.target[1], pose.target[2]);
    this.applyPose(pose.fov ?? 45, aspect, false);
  }

  sync(stop: CameraStop | null, aspect: number) {
    if (!stop) return;
    this.boundStop = stop;
    this.origin.set(stop.camera[0], stop.camera[1], stop.camera[2]);
    this.aim.set(stop.target[0], stop.target[1], stop.target[2]);
    this.applyPose(stop.fov ?? 45, aspect, true);
  }

  private applyPose(fovDeg: number, aspect: number, writeDummies: boolean) {
    this.wireMat.color.copy(this.lampColor);
    this.aimMat.color.copy(this.aimColor);
    this.dashMat.color.copy(this.aimColor);
    this.pathMat.color.copy(this.lampColor);
    this.targetPathMat.color.copy(this.aimColor);
    (this.sourceDrop.material as THREE.LineDashedMaterial).color.copy(this.lampColor);
    (this.aimDrop.material as THREE.LineDashedMaterial).color.copy(this.aimColor);
    this.sourceMat.color.copy(this.lampColor);
    this.aimFillMat.color.copy(this.aimColor);
    this.bodyMat.color.copy(this.lampColor);
    (this.sourceGround.material as THREE.MeshBasicMaterial).color.copy(this.lampColor);
    (this.aimGround.material as THREE.MeshBasicMaterial).color.copy(this.aimColor);
    (this.aimLocator.material as THREE.MeshBasicMaterial).color.copy(this.aimColor);

    if (this.dragging) {
      if (this.selected === 'source') this.origin.copy(this.sourceDummy.position);
      else this.aim.copy(this.aimDummy.position);
    } else if (writeDummies) {
      this.sourceDummy.position.copy(this.origin);
      this.aimDummy.position.copy(this.aim);
    } else {
      this.sourceDummy.position.copy(this.origin);
      this.aimDummy.position.copy(this.aim);
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
    this.aimLocator.position.set(this.aim.x, this.aim.y + 0.02, this.aim.z);
    this.sourceGround.position.set(this.origin.x, 0.03, this.origin.z);
    this.aimGround.position.set(this.aim.x, 0.03, this.aim.z);

    const fov = THREE.MathUtils.degToRad(fovDeg);
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
    const grabBoost = this.grab ? 1.2 : 1;
    this.sourceHandle.scale.setScalar((this.selected === 'source' ? 1.35 : 1) * grabBoost);
    this.aimHandle.scale.setScalar((this.selected === 'aim' ? 1.55 : 1.2) * grabBoost);
    this.applyPartVisibility();
  }

  private applyPartVisibility() {
    const cam = this.showCamGizmo;
    const tgt = this.showTargetGizmo;
    this.body.visible = cam;
    this.lens.visible = cam;
    this.sourceHandle.visible = cam;
    this.sourceGround.visible = cam;
    this.nearRect.visible = cam;
    this.farRect.visible = cam;
    this.sides.visible = cam;
    this.arrow.visible = cam;
    this.sourceDrop.visible = cam && Math.abs(this.origin.y) > 0.2;
    this.aimHandle.visible = tgt;
    this.aimGround.visible = tgt;
    this.aimLocator.visible = tgt && this.grab;
    this.aimDrop.visible = tgt && Math.abs(this.aim.y) > 0.2;
    this.aimLine.visible = cam || tgt;
    this.camPath.visible = this.showCamPath && this.hasCamPath;
    this.targetPath.visible = this.showTargetPath && this.hasTargetPath;
    for (const child of this.stopMarks.children) {
      child.visible = child.userData.kind === 'aim' ? this.showTargetPath : this.showCamPath;
    }
    if (!this.grab) return;
    if (cam) this.sourceControls?.attach(this.sourceDummy);
    else this.sourceControls?.detach();
    if (tgt) this.aimControls?.attach(this.aimDummy);
    else this.aimControls?.detach();
  }

  dispose() {
    this.detach();
    this.disposeControls();
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
    if (this.sourceControls && this.aimControls) {
      this.sourceControls.attach(this.sourceDummy);
      this.aimControls.attach(this.aimDummy);
      return;
    }
    try {
      // @ts-ignore
      const mod = await import('three/examples/jsm/controls/TransformControls.js');
      const TransformControls = mod.TransformControls;
      if (!this.sourceControls) {
        const source = new TransformControls(this.camera, this.renderer.domElement) as TransformControlsLike;
        source.setMode('translate');
        source.setSize(0.8);
        source.setSpace?.('world');
        source.addEventListener('dragging-changed', this.onDragging);
        source.addEventListener('objectChange', this.onSourceTransform);
        const sourceHelper =
          typeof source.getHelper === 'function' ? source.getHelper() : (source as unknown as THREE.Object3D);
        this.scene.add(sourceHelper);
        this.sourceControls = source;
        this.sourceHelper = sourceHelper;
      }
      if (!this.aimControls) {
        const aim = new TransformControls(this.camera, this.renderer.domElement) as TransformControlsLike;
        aim.setMode('translate');
        aim.setSize(0.9);
        aim.setSpace?.('world');
        aim.addEventListener('dragging-changed', this.onDragging);
        aim.addEventListener('objectChange', this.onAimTransform);
        const aimHelper = typeof aim.getHelper === 'function' ? aim.getHelper() : (aim as unknown as THREE.Object3D);
        this.scene.add(aimHelper);
        this.aimControls = aim;
        this.aimHelper = aimHelper;
      }
      this.sourceControls.attach(this.sourceDummy);
      this.aimControls.attach(this.aimDummy);
    } catch (error) {
      console.warn('[studio] TransformControls unavailable; camera gizmos stay visual-only.', error);
    }
  }

  private detach() {
    this.sourceControls?.detach();
    this.aimControls?.detach();
    this.dragging = false;
    this.onOrbitLock?.(false);
  }

  private disposeControls() {
    if (this.sourceControls) {
      this.sourceControls.removeEventListener('dragging-changed', this.onDragging);
      this.sourceControls.removeEventListener('objectChange', this.onSourceTransform);
      this.sourceControls.dispose();
      this.sourceControls = null;
    }
    if (this.aimControls) {
      this.aimControls.removeEventListener('dragging-changed', this.onDragging);
      this.aimControls.removeEventListener('objectChange', this.onAimTransform);
      this.aimControls.dispose();
      this.aimControls = null;
    }
    if (this.sourceHelper) {
      this.scene.remove(this.sourceHelper);
      this.sourceHelper = null;
    }
    if (this.aimHelper) {
      this.scene.remove(this.aimHelper);
      this.aimHelper = null;
    }
  }
}
