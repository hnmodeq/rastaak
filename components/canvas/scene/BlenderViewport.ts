import * as THREE from 'three';

/**
 * Blender-style viewport navigation.
 * MMB / Alt+LMB = orbit
 * Shift+MMB / Shift+Alt+LMB = pan
 * Wheel / Ctrl+MMB / Ctrl+Alt+LMB = zoom
 */
export class BlenderViewport {
  enabled = false;
  readonly target = new THREE.Vector3();
  private dragging: 'orbit' | 'pan' | 'zoom' | null = null;
  private lastX = 0;
  private lastY = 0;
  private pointerId: number | null = null;
  private readonly spherical = new THREE.Spherical();
  private readonly offset = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly up = new THREE.Vector3();
  private readonly view = new THREE.Vector3();

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly isUiEvent: (target: EventTarget | null) => boolean,
  ) {
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    window.addEventListener('pointerdown', this.onPointerDown, true);
    window.addEventListener('pointermove', this.onPointerMove, true);
    window.addEventListener('pointerup', this.onPointerUp, true);
    window.addEventListener('pointercancel', this.onPointerUp, true);
    window.addEventListener('wheel', this.onWheel, { capture: true, passive: false });
    window.addEventListener('contextmenu', this.onContextMenu, true);
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.dragging = null;
    document.documentElement.dataset.viewport = on ? 'true' : 'false';
    document.body.style.overflow = on ? 'hidden' : '';
  }

  dispose() {
    this.setEnabled(false);
    window.removeEventListener('pointerdown', this.onPointerDown, true);
    window.removeEventListener('pointermove', this.onPointerMove, true);
    window.removeEventListener('pointerup', this.onPointerUp, true);
    window.removeEventListener('pointercancel', this.onPointerUp, true);
    window.removeEventListener('wheel', this.onWheel, true);
    window.removeEventListener('contextmenu', this.onContextMenu, true);
  }

  private onContextMenu(event: Event) {
    if (!this.enabled || this.isUiEvent(event.target)) return;
    event.preventDefault();
  }

  private modeFromEvent(event: PointerEvent): 'orbit' | 'pan' | 'zoom' | null {
    const alt = event.altKey;
    const shift = event.shiftKey;
    const ctrl = event.ctrlKey || event.metaKey;
    if (event.button === 1) {
      if (ctrl) return 'zoom';
      if (shift) return 'pan';
      return 'orbit';
    }
    if (event.button === 0 && alt) {
      if (ctrl) return 'zoom';
      if (shift) return 'pan';
      return 'orbit';
    }
    if (event.button === 2 && this.enabled) {
      return shift ? 'zoom' : 'pan';
    }
    return null;
  }

  private onPointerDown(event: PointerEvent) {
    if (!this.enabled || this.isUiEvent(event.target)) return;
    const mode = this.modeFromEvent(event);
    if (!mode) return;
    event.preventDefault();
    event.stopPropagation();
    this.dragging = mode;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.pointerId = event.pointerId;
    try {
      (event.target as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
    } catch {
      /* ignore */
    }
  }

  private onPointerMove(event: PointerEvent) {
    if (!this.enabled || !this.dragging) return;
    if (this.pointerId !== null && event.pointerId !== this.pointerId) return;
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    if (this.dragging === 'orbit') this.orbit(dx, dy);
    else if (this.dragging === 'pan') this.pan(dx, dy);
    else this.dolly(dy);
  }

  private onPointerUp(event: PointerEvent) {
    if (this.pointerId !== null && event.pointerId !== this.pointerId) return;
    this.dragging = null;
    this.pointerId = null;
  }

  private onWheel(event: WheelEvent) {
    if (!this.enabled || this.isUiEvent(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    this.dolly(event.deltaY);
  }

  private orbit(dx: number, dy: number) {
    this.offset.copy(this.camera.position).sub(this.target);
    this.spherical.setFromVector3(this.offset);
    this.spherical.theta -= dx * 0.005;
    this.spherical.phi = THREE.MathUtils.clamp(this.spherical.phi - dy * 0.005, 0.04, Math.PI - 0.04);
    this.offset.setFromSpherical(this.spherical);
    this.camera.position.copy(this.target).add(this.offset);
    this.camera.lookAt(this.target);
  }

  private pan(dx: number, dy: number) {
    this.camera.updateMatrixWorld();
    this.view.copy(this.target).sub(this.camera.position);
    const distance = this.view.length();
    const factor = distance * Math.tan(THREE.MathUtils.degToRad(this.camera.fov * 0.5)) * 0.0028;
    this.right.setFromMatrixColumn(this.camera.matrixWorld, 0).normalize();
    this.up.setFromMatrixColumn(this.camera.matrixWorld, 1).normalize();
    const move = this.right.multiplyScalar(-dx * factor).add(this.up.multiplyScalar(dy * factor));
    this.camera.position.add(move);
    this.target.add(move);
    this.camera.lookAt(this.target);
  }

  private dolly(delta: number) {
    this.offset.copy(this.camera.position).sub(this.target);
    const distance = this.offset.length();
    const next = THREE.MathUtils.clamp(distance * Math.exp(delta * 0.0016), 0.6, 180);
    this.offset.setLength(next);
    this.camera.position.copy(this.target).add(this.offset);
    this.camera.lookAt(this.target);
  }
}
