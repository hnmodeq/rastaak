import * as THREE from 'three';
import {
  STORY_CONFIG,
  type StoryBuildingState,
  type StoryChipFrame,
  type StoryClientConfig,
  type StoryFrame,
} from './storyConfig';
import { classifyRole, getMeshMaterials } from './materialKeys';

interface TrackedSlot {
  mat: THREE.MeshStandardMaterial;
  baseColor: THREE.Color;
  baseEmissive: THREE.Color;
  baseEmissiveIntensity: number;
  role: 'facade' | 'window';
}

interface ClientActor {
  config: StoryClientConfig;
  object: THREE.Object3D;
  roof: THREE.Vector3;
  slots: TrackedSlot[];
  blend: number;
  packet: PacketRig;
}

interface PacketRig {
  group: THREE.Group;
  core: THREE.Mesh;
  light: THREE.PointLight;
  trail: THREE.Line;
  trailPositions: Float32Array;
  curve: THREE.QuadraticBezierCurve3;
}

interface HubActor {
  object: THREE.Object3D;
  origin: THREE.Vector3;
  slots: TrackedSlot[];
}

const TRAIL_POINTS = 18;
const CHIP_ROOF_PAD = 0.38;
const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _projected = new THREE.Vector3();
const _needColor = new THREE.Color(STORY_CONFIG.colors.need);
const _resolvedColor = new THREE.Color(STORY_CONFIG.colors.resolved);
const _packetColor = new THREE.Color(STORY_CONFIG.colors.packet);
const _hubPulse = new THREE.Color(STORY_CONFIG.colors.hubPulse);
const _workColor = new THREE.Color();
const _workEmissive = new THREE.Color();

function normalizeName(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[._/-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function collectNamedObjects(root: THREE.Object3D): THREE.Object3D[] {
  const nodes: THREE.Object3D[] = [];
  root.traverse((child) => {
    if (child.name) nodes.push(child);
  });
  return nodes;
}

function findByName(root: THREE.Object3D, name: string): THREE.Object3D | null {
  const exact = root.getObjectByName(name);
  if (exact) return exact;

  const wanted = normalizeName(name);
  if (!wanted) return null;

  const nodes = collectNamedObjects(root);
  const exactNorm = nodes.find((node) => normalizeName(node.name) === wanted);
  if (exactNorm) return exactNorm;

  const compactWanted = wanted.replace(/\s+/g, '');
  const compact = nodes.find((node) => normalizeName(node.name).replace(/\s+/g, '') === compactWanted);
  if (compact) return compact;

  const loose = nodes.filter((node) => {
    const current = normalizeName(node.name);
    return current.includes(wanted) || wanted.includes(current);
  });
  if (loose.length === 1) return loose[0];

  return null;
}

function logAvailableBuildings(root: THREE.Object3D) {
  const names = collectNamedObjects(root)
    .map((node) => node.name)
    .filter((name, index, all) => all.indexOf(name) === index)
    .sort((a, b) => a.localeCompare(b));
  console.warn('[story] named objects in GLB:', names);
}

function collectSlots(object: THREE.Object3D): TrackedSlot[] {
  const slots: TrackedSlot[] = [];
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!(mesh as THREE.Mesh & { isMesh?: boolean }).isMesh || !mesh.material) return;
    const mats = getMeshMaterials(mesh);
    mats.forEach((mat, index) => {
      const std = mat as THREE.MeshStandardMaterial;
      if (!std?.color) return;
      slots.push({
        mat: std,
        baseColor: std.color.clone(),
        baseEmissive: std.emissive ? std.emissive.clone() : new THREE.Color(0x000000),
        baseEmissiveIntensity: std.emissiveIntensity ?? 1,
        role: classifyRole(mesh, index, mats.length),
      });
    });
  });
  return slots;
}

function roofPoint(object: THREE.Object3D, target: THREE.Vector3) {
  _box.setFromObject(object);
  _box.getSize(_size);
  const pad = Math.max(CHIP_ROOF_PAD, _size.y * 0.12);
  target.set(
    (_box.min.x + _box.max.x) * 0.5,
    _box.max.y + pad,
    (_box.min.z + _box.max.z) * 0.5,
  );
}

function restoreSlots(slots: TrackedSlot[]) {
  for (const slot of slots) {
    slot.mat.color.copy(slot.baseColor);
    if (slot.mat.emissive) slot.mat.emissive.copy(slot.baseEmissive);
    slot.mat.emissiveIntensity = slot.baseEmissiveIntensity;
    slot.mat.needsUpdate = true;
  }
}

function recaptureSlots(slots: TrackedSlot[]) {
  for (const slot of slots) {
    slot.baseColor.copy(slot.mat.color);
    if (slot.mat.emissive) slot.baseEmissive.copy(slot.mat.emissive);
    slot.baseEmissiveIntensity = slot.mat.emissiveIntensity ?? 1;
  }
}

function syncStoryColors() {
  _needColor.set(STORY_CONFIG.colors.need);
  _resolvedColor.set(STORY_CONFIG.colors.resolved);
  _packetColor.set(STORY_CONFIG.colors.packet);
  _hubPulse.set(STORY_CONFIG.colors.hubPulse);
}

function applyBuildingLook(slots: TrackedSlot[], blend: number) {
  // 0 idle, 1 need, 2 resolved
  const needK = blend <= 1 ? blend : Math.max(0, 2 - blend);
  const resolvedK = blend <= 1 ? 0 : blend - 1;

  for (const slot of slots) {
    _workColor.copy(slot.baseColor);
    if (needK > 0) _workColor.lerp(_needColor, slot.role === 'window' ? needK * 0.45 : needK * 0.62);
    if (resolvedK > 0) {
      _workColor.lerp(
        slot.role === 'window' ? _packetColor : _resolvedColor,
        slot.role === 'window' ? resolvedK * 0.85 : resolvedK * 0.72,
      );
    }
    slot.mat.color.copy(_workColor);

    _workEmissive.copy(slot.baseEmissive);
    if (needK > 0) _workEmissive.lerp(_needColor, needK);
    if (resolvedK > 0) _workEmissive.lerp(_packetColor, resolvedK);
    if (slot.mat.emissive) slot.mat.emissive.copy(_workEmissive);

    const extra =
      slot.role === 'window'
        ? needK * 0.55 + resolvedK * 0.9
        : needK * 0.28 + resolvedK * 0.22;
    slot.mat.emissiveIntensity = slot.baseEmissiveIntensity + extra;
    slot.mat.needsUpdate = true;
  }
}

function createPacketRig(): PacketRig {
  const group = new THREE.Group();
  group.visible = false;

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 16, 16),
    new THREE.MeshBasicMaterial({
      color: _packetColor,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    }),
  );
  group.add(core);

  const light = new THREE.PointLight(_packetColor, 0, 3.6, 2);
  light.castShadow = false;
  group.add(light);

  const trailPositions = new Float32Array(TRAIL_POINTS * 3);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
  trailGeo.setDrawRange(0, 0);
  const trail = new THREE.Line(
    trailGeo,
    new THREE.LineBasicMaterial({
      color: _packetColor,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    }),
  );
  group.add(trail);

  return {
    group,
    core,
    light,
    trail,
    trailPositions,
    curve: new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    ),
  };
}

function updatePacketCurve(packet: PacketRig, from: THREE.Vector3, to: THREE.Vector3) {
  packet.curve.v0.copy(from);
  packet.curve.v2.copy(to);
  packet.curve.v1.copy(from).lerp(to, 0.48);
  const span = from.distanceTo(to);
  packet.curve.v1.y += Math.max(1.7, span * 0.38);
}

export class StoryRuntime {
  private scene: THREE.Scene | null = null;
  private hub: HubActor | null = null;
  private clients: ClientActor[] = [];
  private packetRoot = new THREE.Group();
  private enabled = true;
  private lastT = 0;
  private frame: StoryFrame = {
    t: 0,
    chips: [],
    captions: STORY_CONFIG.captions,
    activeCaptionId: null,
    visible: false,
  };

  attach(world: THREE.Object3D, scene: THREE.Scene) {
    this.dispose();
    this.scene = scene;
    world.updateMatrixWorld(true);

    const searchRoot = world.parent ?? world;
    const hubObj = findByName(world, STORY_CONFIG.hub) ?? findByName(searchRoot, STORY_CONFIG.hub);
    const logoObj = findByName(world, STORY_CONFIG.logo) ?? findByName(searchRoot, STORY_CONFIG.logo);
    if (!hubObj) {
      console.warn(`[story] missing hub "${STORY_CONFIG.hub}"`);
      logAvailableBuildings(world);
    }
    if (hubObj) {
      const origin = new THREE.Vector3();
      if (logoObj) {
        logoObj.getWorldPosition(origin);
        origin.y += 0.16;
      } else {
        roofPoint(hubObj, origin);
      }
      this.hub = {
        object: hubObj,
        origin,
        slots: collectSlots(hubObj),
      };
    }

    this.packetRoot.name = 'rastaak-story-packets';
    scene.add(this.packetRoot);

    let loggedNames = Boolean(hubObj);
    for (const config of STORY_CONFIG.clients) {
      const object = findByName(world, config.building) ?? findByName(searchRoot, config.building);
      if (!object) {
        console.warn(`[story] missing building "${config.building}"`);
        if (!loggedNames) {
          logAvailableBuildings(world);
          loggedNames = true;
        }
        continue;
      }
      const roof = new THREE.Vector3();
      roofPoint(object, roof);
      const packet = createPacketRig();
      this.packetRoot.add(packet.group);
      if (this.hub) updatePacketCurve(packet, this.hub.origin, roof);

      this.clients.push({
        config,
        object,
        roof,
        slots: collectSlots(object),
        blend: 0,
        packet,
      });
    }
  }

  setEnabled(enabled: boolean) {
    if (this.enabled === enabled) return;
    if (enabled) {
      this.captureBase();
    } else {
      this.restoreBase();
      this.hidePackets();
    }
    this.enabled = enabled;
  }

  restoreBase() {
    if (this.hub) restoreSlots(this.hub.slots);
    for (const client of this.clients) restoreSlots(client.slots);
  }

  captureBase() {
    if (this.hub) recaptureSlots(this.hub.slots);
    for (const client of this.clients) recaptureSlots(client.slots);
  }

  update(input: {
    t: number;
    camera: THREE.Camera;
    width: number;
    height: number;
    delta: number;
    elapsed: number;
    reducedMotion: boolean;
    compact: boolean;
  }): StoryFrame {
    const t = Math.max(0, Math.min(1, input.t));
    const jumped = Math.abs(t - this.lastT) > 0.04;
    this.lastT = t;
    syncStoryColors();

    const chips: StoryChipFrame[] = [];
    let dispatchFlash = 0;

    for (const client of this.clients) {
      let state: StoryBuildingState = 'idle';
      if (t >= client.config.arrive) state = 'resolved';
      else if (t >= client.config.appear) state = 'need';

      const targetBlend = state === 'idle' ? 0 : state === 'need' ? 1 : 2;
      if (input.reducedMotion || !this.enabled || jumped) {
        client.blend = targetBlend;
      } else {
        const k = 1 - Math.exp(-input.delta * 14);
        client.blend += (targetBlend - client.blend) * k;
      }

      if (this.enabled) applyBuildingLook(client.slots, client.blend);

      const holdEnd = client.config.arrive + STORY_CONFIG.chipHoldAfterArrive;
      const chipOn = t >= client.config.appear && t < holdEnd;
      const traveling = t >= client.config.dispatch && t < client.config.arrive;
      const showPacket = this.enabled && !input.reducedMotion && !input.compact && traveling;

      this.updatePacket(client, t, showPacket);

      if (traveling) {
        const span = Math.max(0.0001, client.config.arrive - client.config.dispatch);
        const u = (t - client.config.dispatch) / span;
        if (u < 0.18) dispatchFlash = Math.max(dispatchFlash, 1 - u / 0.18);
      }

      const opacity = !chipOn
        ? 0
        : t < client.config.appear + 0.03
          ? (t - client.config.appear) / 0.03
          : t > holdEnd - 0.05
            ? Math.max(0, (holdEnd - t) / 0.05)
            : 1;

      _projected.copy(client.roof).project(input.camera);
      const onScreen =
        _projected.z > -1 &&
        _projected.z < 1 &&
        Math.abs(_projected.x) < 1.15 &&
        Math.abs(_projected.y) < 1.15;
      const compactHide =
        input.compact && !(state === 'need' || traveling || (state === 'resolved' && t < client.config.arrive + 0.08));

      chips.push({
        id: client.config.id,
        text: client.config.need,
        x: (_projected.x * 0.5 + 0.5) * input.width,
        y: (-_projected.y * 0.5 + 0.5) * input.height,
        state: state === 'idle' ? 'need' : state,
        visible: this.enabled && chipOn && onScreen && !compactHide && opacity > 0.04,
        opacity: Math.max(0, Math.min(1, opacity)),
      });
    }

    if (this.enabled && this.hub) {
      this.applyHubPulse(input.elapsed, dispatchFlash, input.reducedMotion);
    }

    const active = STORY_CONFIG.captions.find((caption) => t >= caption.range[0] && t < caption.range[1]);
    this.frame = {
      t,
      chips,
      captions: STORY_CONFIG.captions,
      activeCaptionId: active?.id ?? STORY_CONFIG.captions[STORY_CONFIG.captions.length - 1]?.id ?? null,
      visible: this.enabled && t >= STORY_CONFIG.captionFadeIn && t < 0.985,
    };
    return this.frame;
  }

  private updatePacket(client: ClientActor, t: number, show: boolean) {
    const packet = client.packet;
    if (!show) {
      packet.group.visible = false;
      packet.light.intensity = 0;
      packet.trail.geometry.setDrawRange(0, 0);
      return;
    }

    const span = Math.max(0.0001, client.config.arrive - client.config.dispatch);
    const u = Math.max(0, Math.min(1, (t - client.config.dispatch) / span));
    packet.curve.getPoint(u, packet.group.position);
    packet.group.visible = true;
    packet.light.intensity = 28 + Math.sin(u * Math.PI) * 18;
    (packet.core.material as THREE.MeshBasicMaterial).opacity = 0.75 + Math.sin(u * Math.PI) * 0.25;

    const from = Math.max(0, u - 0.2);
    for (let i = 0; i < TRAIL_POINTS; i++) {
      const tu = from + ((u - from) * i) / Math.max(1, TRAIL_POINTS - 1);
      packet.curve.getPoint(tu, _projected);
      packet.trailPositions[i * 3] = _projected.x - packet.group.position.x;
      packet.trailPositions[i * 3 + 1] = _projected.y - packet.group.position.y;
      packet.trailPositions[i * 3 + 2] = _projected.z - packet.group.position.z;
    }
    const attr = packet.trail.geometry.getAttribute('position') as THREE.BufferAttribute;
    attr.needsUpdate = true;
    packet.trail.geometry.setDrawRange(0, TRAIL_POINTS);
  }

  private applyHubPulse(elapsed: number, flash: number, reducedMotion: boolean) {
    if (!this.hub) return;
    const pulse = reducedMotion ? 0.08 : 0.1 + Math.sin(elapsed * 1.6) * 0.06;
    const boost = flash * 0.7;
    for (const slot of this.hub.slots) {
      slot.mat.color.copy(slot.baseColor);
      if (slot.mat.emissive) {
        slot.mat.emissive.copy(slot.baseEmissive).lerp(_hubPulse, pulse + boost);
      }
      slot.mat.emissiveIntensity =
        slot.baseEmissiveIntensity + (slot.role === 'window' ? pulse * 1.4 + boost : pulse * 0.35 + boost * 0.4);
      slot.mat.needsUpdate = true;
    }
  }

  private hidePackets() {
    for (const client of this.clients) {
      client.packet.group.visible = false;
      client.packet.light.intensity = 0;
    }
  }

  dispose() {
    this.restoreBase();
    if (this.scene && this.packetRoot.parent === this.scene) {
      this.scene.remove(this.packetRoot);
    }
    for (const client of this.clients) {
      client.packet.core.geometry.dispose();
      (client.packet.core.material as THREE.Material).dispose();
      client.packet.trail.geometry.dispose();
      (client.packet.trail.material as THREE.Material).dispose();
      client.packet.light.dispose();
    }
    this.clients = [];
    this.hub = null;
    this.scene = null;
    this.packetRoot = new THREE.Group();
  }
}

export function readStoryScrollProgress(fallbackMultiplier: number): number {
  if (typeof document === 'undefined' || typeof window === 'undefined') return 0;
  const flow = document.querySelector('.flow') as HTMLElement | null;
  if (flow) {
    const end = flow.offsetTop + flow.offsetHeight - window.innerHeight;
    if (end > 1) return Math.max(0, Math.min(1, window.scrollY / end));
  }
  const span = Math.max(1, window.innerHeight * fallbackMultiplier);
  return Math.max(0, Math.min(1, window.scrollY / span));
}
