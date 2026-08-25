import * as THREE from 'three';
import {
  STORY_CONFIG,
  insaneShootingConfig,
  needEndAt,
  needTitleAt,
  resolveAt,
  type InsaneShootingConfig,
  type StoryBuildingState,
  type StoryChipFrame,
  type StoryClientConfig,
  type StoryFrame,
} from './storyConfig';
import { classifyRole, getMeshMaterials, resolvePalette } from './materialKeys';
import { collectBuildingNodes } from './buildingVisibility';
import { SCENE_CONFIG } from './sceneConfig';
import { markStoryBloom } from './lookConfig';

interface TrackedSlot {
  mat: THREE.MeshStandardMaterial;
  baseColor: THREE.Color;
  baseEmissive: THREE.Color;
  baseEmissiveIntensity: number;
  baseMetalness: number;
  baseMap: THREE.Texture | null;
  baseVertexColors: boolean;
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

/** A non-client building swept into the single "Insane shooting" finale beat. */
interface OutroActor {
  id: string;
  object: THREE.Object3D;
  roof: THREE.Vector3;
  slots: TrackedSlot[];
  blend: number;
  packet: PacketRig;
  index: number;
}

interface PacketRig {
  group: THREE.Group;
  core: THREE.Sprite;
  glowInner: THREE.Sprite;
  glowOuter: THREE.Sprite;
  sparks: THREE.Points;
  burstCore: THREE.Sprite;
  burstRing: THREE.Sprite;
  burstSparks: THREE.Points;
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
const BURST_SPARKS = 18;
const FADE_IN_T = 0.028;
const CHIP_ROOF_PAD = 0.38;
const HUB_LAUNCH_OUT = 0.48;
const CITY_CENTER_X = 13.36;
const CITY_CENTER_Z = -0.7;
const PACKET_MARK_URL = '/img/rastaak-packet-mark.png';

let packetMarkTexture: THREE.Texture | null = null;
let packetMarkLoad: Promise<THREE.Texture> | null = null;

function loadPacketMarkTexture(): Promise<THREE.Texture> {
  if (packetMarkTexture) return Promise.resolve(packetMarkTexture);
  if (!packetMarkLoad) {
    packetMarkLoad = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('packet mark needs a browser'));
        return;
      }
      new THREE.TextureLoader().load(
        PACKET_MARK_URL,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = 8;
          texture.needsUpdate = true;
          packetMarkTexture = texture;
          resolve(texture);
        },
        undefined,
        (error) => {
          console.warn('[story] failed to load packet mark', error);
          reject(error);
        },
      );
    });
  }
  return packetMarkLoad;
}

function bindPacketMark(sprite: THREE.Sprite, texture: THREE.Texture) {
  const mat = sprite.material as THREE.SpriteMaterial;
  if (mat.map !== texture) {
    mat.map = texture;
    mat.needsUpdate = true;
  }
  sprite.visible = true;
}

function packetMarkMaterial(opacity: number, additive: boolean): THREE.SpriteMaterial {
  return new THREE.SpriteMaterial({
    map: packetMarkTexture,
    color: 0xffffff,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    toneMapped: false,
  });
}

let burstDiscTexture: THREE.Texture | null = null;

function getBurstDisc(): THREE.Texture | null {
  if (burstDiscTexture) return burstDiscTexture;
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const gradient = ctx.createRadialGradient(64, 64, 3, 64, 64, 62);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.28, 'rgba(255,255,255,0.62)');
  gradient.addColorStop(0.62, 'rgba(255,255,255,0.16)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  burstDiscTexture = new THREE.CanvasTexture(canvas);
  burstDiscTexture.needsUpdate = true;
  return burstDiscTexture;
}

function burstSpriteMaterial(opacity: number): THREE.SpriteMaterial {
  return new THREE.SpriteMaterial({
    map: getBurstDisc(),
    color: 0xffffff,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

function smooth01(value: number): number {
  const x = Math.max(0, Math.min(1, value));
  return x * x * (3 - 2 * x);
}

function burstSettings() {
  return {
    delay: Math.max(0, STORY_CONFIG.burstDelay ?? 0.045),
    span: Math.max(0.012, STORY_CONFIG.burstSpan ?? 0.06),
    light: Math.max(0, STORY_CONFIG.burstLight ?? 3.2),
    radius: Math.max(0.5, STORY_CONFIG.burstLightRadius ?? 10),
    size: Math.max(0.1, STORY_CONFIG.burstSize ?? 1),
    exposure: Math.max(0, STORY_CONFIG.burstExposure ?? 1),
    sparks: Math.max(0, STORY_CONFIG.burstSparks ?? 1),
  };
}

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _projected = new THREE.Vector3();
const _landing = new THREE.Vector3();
const _launch = new THREE.Vector3();
const _needColor = new THREE.Color(STORY_CONFIG.colors.need);
const _needWindow = new THREE.Color(STORY_CONFIG.colors.needWindow ?? STORY_CONFIG.colors.need);
const _resolvedColor = new THREE.Color(STORY_CONFIG.colors.resolved);
const _resolvedWindow = new THREE.Color(STORY_CONFIG.colors.resolvedWindow ?? STORY_CONFIG.colors.resolved);
const _packetColor = new THREE.Color(STORY_CONFIG.colors.packet);
const _packetBounce = new THREE.Color(STORY_CONFIG.colors.packetBounce ?? STORY_CONFIG.colors.packet);
const _packetCore = new THREE.Color(STORY_CONFIG.colors.packetCore ?? STORY_CONFIG.colors.packet);
const _packetInner = new THREE.Color(STORY_CONFIG.colors.packetInner ?? STORY_CONFIG.colors.packet);
const _packetOuter = new THREE.Color(STORY_CONFIG.colors.packetOuter ?? STORY_CONFIG.colors.packet);
const _packetSpark = new THREE.Color(STORY_CONFIG.colors.packetSpark ?? STORY_CONFIG.colors.packet);
const _hubPulse = new THREE.Color(STORY_CONFIG.colors.hubPulse);
const _hubWindow = new THREE.Color(STORY_CONFIG.colors.hubPulseWindow ?? STORY_CONFIG.colors.hubPulse);

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
        baseMetalness: typeof std.metalness === 'number' ? std.metalness : 0,
        baseMap: std.map ?? null,
        baseVertexColors: Boolean(std.vertexColors),
        role: classifyRole(mesh, index, mats.length),
      });
    });
  });
  return slots;
}

function applyLanding(client: ClientActor, target: THREE.Vector3) {
  target.copy(client.roof);
  const land = client.config.land;
  if (!land || land.length < 3) return;
  target.x += land[0];
  target.y += land[1];
  target.z += land[2];
}

function applyLaunch(client: ClientActor, hubOrigin: THREE.Vector3, target: THREE.Vector3) {
  target.copy(hubOrigin);
  const launch = client.config.launch;
  if (!launch || launch.length < 3) return;
  target.x += launch[0];
  target.y += launch[1];
  target.z += launch[2];
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

/** Start on the Rastaak facade (logo), just outside the wall so the sprite does not sit inside the mesh. */
function hubLaunchPoint(hub: THREE.Object3D, logo: THREE.Object3D | null, target: THREE.Vector3) {
  _box.setFromObject(hub);
  _box.getSize(_size);
  const cx = (_box.min.x + _box.max.x) * 0.5;
  const cz = (_box.min.z + _box.max.z) * 0.5;

  if (logo) {
    logo.getWorldPosition(target);
  } else {
    target.set(cx, _box.min.y + _size.y * 0.78, cz);
  }

  let dirX = target.x - cx;
  let dirZ = target.z - cz;
  if (Math.hypot(dirX, dirZ) < 0.05) {
    dirX = CITY_CENTER_X - cx;
    dirZ = CITY_CENTER_Z - cz;
  }
  const len = Math.hypot(dirX, dirZ) || 1;
  const facade = Math.max(_size.x, _size.z) * 0.5;
  const dist = Math.max(len, facade) + HUB_LAUNCH_OUT;
  target.x = cx + (dirX / len) * dist;
  target.z = cz + (dirZ / len) * dist;
  target.y = Math.min(_box.max.y - 0.12, Math.max(_box.min.y + _size.y * 0.4, target.y + 0.16));
}

function restoreSlots(slots: TrackedSlot[]) {
  for (const slot of slots) {
    slot.mat.color.copy(slot.baseColor);
    if (slot.mat.emissive) slot.mat.emissive.copy(slot.baseEmissive);
    slot.mat.emissiveIntensity = slot.baseEmissiveIntensity;
    if ('metalness' in slot.mat) slot.mat.metalness = slot.baseMetalness;
    if (slot.mat.map !== slot.baseMap) slot.mat.map = slot.baseMap;
    slot.mat.vertexColors = slot.baseVertexColors;
    slot.mat.needsUpdate = true;
  }
}

function recaptureSlots(slots: TrackedSlot[]) {
  for (const slot of slots) {
    slot.baseColor.copy(slot.mat.color);
    if (slot.mat.emissive) slot.baseEmissive.copy(slot.mat.emissive);
    slot.baseEmissiveIntensity = slot.mat.emissiveIntensity ?? 1;
    slot.baseMetalness = typeof slot.mat.metalness === 'number' ? slot.mat.metalness : 0;
    slot.baseMap = slot.mat.map ?? null;
    slot.baseVertexColors = Boolean(slot.mat.vertexColors);
  }
}

function paintSlot(slot: TrackedSlot, target: THREE.Color | null, amount: number) {
  const k = Math.max(0, Math.min(1, amount));
  if (!target || k <= 0) {
    restoreSlots([slot]);
    return;
  }

  if (k >= 0.995) {
    slot.mat.color.copy(target);
  } else {
    slot.mat.color.copy(slot.baseColor).lerp(target, k);
  }

  // Drop texture / vertex color / metal so the Studio swatch IS the building.
  if (slot.mat.map) slot.mat.map = null;
  slot.mat.vertexColors = false;
  if ('metalness' in slot.mat) slot.mat.metalness = 0;
  if (slot.mat.emissive) slot.mat.emissive.setHex(0x000000);
  slot.mat.emissiveIntensity = 0;
  slot.mat.needsUpdate = true;
}

function syncStoryColors() {
  const colors = STORY_CONFIG.colors;
  _needColor.set(colors.need);
  _needWindow.set(colors.needWindow ?? colors.need);
  _resolvedColor.set(colors.resolved);
  _resolvedWindow.set(colors.resolvedWindow ?? colors.resolved);
  _packetColor.set(colors.packet);
  _packetBounce.set(colors.packetBounce ?? colors.packet);
  _packetCore.set(colors.packetCore ?? colors.packet);
  _packetInner.set(colors.packetInner ?? colors.packet);
  _packetOuter.set(colors.packetOuter ?? colors.packet);
  _packetSpark.set(colors.packetSpark ?? colors.packet);
  _hubPulse.set(colors.hubPulse);
  _hubWindow.set(colors.hubPulseWindow ?? colors.hubPulse);
}

function applyBuildingLook(slots: TrackedSlot[], blend: number) {
  // 0 idle, 1 need, 2 resolved — replace the mesh color itself.
  const needK = blend <= 1 ? blend : Math.max(0, 2 - blend);
  const resolvedK = blend <= 1 ? 0 : blend - 1;
  const amount = resolvedK > 0 ? resolvedK : needK;

  for (const slot of slots) {
    const target =
      amount <= 0
        ? null
        : resolvedK > 0
          ? slot.role === 'window'
            ? _resolvedWindow
            : _resolvedColor
          : slot.role === 'window'
            ? _needWindow
            : _needColor;
    paintSlot(slot, target, amount);
  }
}

function createPacketRig(): PacketRig {
  const group = new THREE.Group();
  group.visible = false;

  const core = new THREE.Sprite(packetMarkMaterial(1, false));
  core.scale.setScalar(0.4);
  core.renderOrder = 3;
  core.visible = Boolean(packetMarkTexture);
  group.add(core);

  const glowInner = new THREE.Sprite(packetMarkMaterial(0.45, true));
  const glowOuter = new THREE.Sprite(packetMarkMaterial(0.18, true));
  glowInner.renderOrder = 1;
  glowOuter.renderOrder = 2;
  glowInner.visible = Boolean(packetMarkTexture);
  glowOuter.visible = Boolean(packetMarkTexture);
  group.add(glowInner, glowOuter);

  const sparkGeo = new THREE.BufferGeometry();
  const sparkCount = 10;
  const sparkPos = new Float32Array(sparkCount * 3);
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const sparks = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({
      color: _packetColor,
      size: 0.045,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    }),
  );
  group.add(sparks);

  const light = new THREE.PointLight(_packetBounce, 0, 3.6, 2);
  light.castShadow = false;
  group.add(light);

  const burstCore = new THREE.Sprite(burstSpriteMaterial(0));
  const burstRing = new THREE.Sprite(burstSpriteMaterial(0));
  burstCore.renderOrder = 4;
  burstRing.renderOrder = 3;
  burstCore.visible = false;
  burstRing.visible = false;
  group.add(burstCore, burstRing);

  const burstSparkGeo = new THREE.BufferGeometry();
  burstSparkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(BURST_SPARKS * 3), 3));
  const burstSparks = new THREE.Points(
    burstSparkGeo,
    new THREE.PointsMaterial({
      color: _packetSpark,
      size: 0.08,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    }),
  );
  burstSparks.visible = false;
  group.add(burstSparks);

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
      blending: THREE.AdditiveBlending,
    }),
  );
  group.add(trail);

  markStoryBloom(core);
  markStoryBloom(glowInner);
  markStoryBloom(glowOuter);
  markStoryBloom(sparks);
  markStoryBloom(burstCore);
  markStoryBloom(burstRing);
  markStoryBloom(burstSparks);
  markStoryBloom(trail);

  return {
    group,
    core,
    glowInner,
    glowOuter,
    sparks,
    burstCore,
    burstRing,
    burstSparks,
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
  packet.curve.v1.copy(from).lerp(to, 0.42);
  const span = from.distanceTo(to);
  packet.curve.v1.y += Math.max(2.6, span * 0.46);
}

export class StoryRuntime {
  private scene: THREE.Scene | null = null;
  private hub: HubActor | null = null;
  private clients: ClientActor[] = [];
  private outroActors: OutroActor[] = [];
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
      hubLaunchPoint(hubObj, logoObj, origin);
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
      const actor: ClientActor = {
        config,
        object,
        roof,
        slots: collectSlots(object),
        blend: 0,
        packet,
      };
      applyLanding(actor, _landing);
      if (this.hub) updatePacketCurve(packet, this.hub.origin, _landing);
      this.clients.push(actor);
    }

    // The finale deliberately targets every remaining building, while the four
    // authored clients above keep their own normal request / shooting beats.
    const claimed = new Set([
      normalizeName(STORY_CONFIG.hub),
      ...STORY_CONFIG.clients.map((client) => normalizeName(client.building)),
    ]);
    for (const object of collectBuildingNodes(world)) {
      if (claimed.has(normalizeName(object.name))) continue;
      const roof = new THREE.Vector3();
      roofPoint(object, roof);
      const packet = createPacketRig();
      // Dozens of logo flights are exciting; dozens of point lights are not.
      packet.light.visible = false;
      packet.light.intensity = 0;
      this.packetRoot.add(packet.group);
      this.outroActors.push({
        id: object.name,
        object,
        roof,
        slots: collectSlots(object),
        blend: 0,
        packet,
        index: this.outroActors.length,
      });
    }

    void loadPacketMarkTexture()
      .then((texture) => {
        for (const actor of [...this.clients, ...this.outroActors]) {
          bindPacketMark(actor.packet.core, texture);
          bindPacketMark(actor.packet.glowInner, texture);
          bindPacketMark(actor.packet.glowOuter, texture);
        }
      })
      .catch(() => {});
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
    for (const actor of this.outroActors) restoreSlots(actor.slots);
  }

  captureBase() {
    if (this.hub) recaptureSlots(this.hub.slots);
    for (const client of this.clients) recaptureSlots(client.slots);
    for (const actor of this.outroActors) recaptureSlots(actor.slots);
  }

  rebindIdlePalette() {
    const palette = resolvePalette(SCENE_CONFIG.materials);
    for (const actor of [...this.clients, ...this.outroActors]) {
      for (const slot of actor.slots) {
        const hex = slot.role === 'window' ? palette.windowColor : palette.buildingColor;
        if (hex !== undefined) slot.baseColor.set(hex);
      }
    }
    if (this.hub) {
      for (const slot of this.hub.slots) {
        const hex = slot.role === 'window' ? palette.windowColor : palette.rastaakColor;
        if (hex !== undefined) slot.baseColor.set(hex);
      }
    }
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
      if (t >= resolveAt(client.config)) state = 'resolved';
      else if (t >= client.config.appear) state = 'need';

      const targetBlend = state === 'idle' ? 0 : state === 'need' ? 1 : 2;
      if (input.reducedMotion || !this.enabled || jumped) {
        client.blend = targetBlend;
      } else {
        const k = 1 - Math.exp(-input.delta * 14);
        client.blend += (targetBlend - client.blend) * k;
      }

      if (this.enabled) applyBuildingLook(client.slots, client.blend);

      const holdEnd = needEndAt(client.config);
      const chipOn = t >= client.config.appear && t < holdEnd;
      const traveling = t >= client.config.dispatch && t < client.config.arrive;
      const burst = burstSettings();
      const burstEnd = client.config.arrive + burst.delay + burst.span;
      const impacting = t >= client.config.arrive && t < client.config.arrive + burst.delay;
      const bursting = t >= client.config.arrive + burst.delay && t < burstEnd;
      const buildingVisible = client.object.visible;
      const showPacket =
        buildingVisible && this.enabled && !input.reducedMotion && !input.compact && (traveling || impacting || bursting);

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

      applyLanding(client, _landing);
      const needPos = client.config.needOffset;
      if (needPos && needPos.length >= 3) {
        _landing.x += needPos[0];
        _landing.y += needPos[1];
        _landing.z += needPos[2];
      }
      _projected.copy(_landing).project(input.camera);
      const onScreen =
        _projected.z > -1 &&
        _projected.z < 1 &&
        Math.abs(_projected.x) < 1.15 &&
        Math.abs(_projected.y) < 1.15;
      const compactHide =
        input.compact && !(state === 'need' || traveling || (state === 'resolved' && t < client.config.arrive + 0.08));

      chips.push({
        id: client.config.id,
        text: needTitleAt(client.config, t),
        x: (_projected.x * 0.5 + 0.5) * input.width,
        y: (-_projected.y * 0.5 + 0.5) * input.height,
        state: state === 'idle' ? 'need' : state,
        visible: buildingVisible && this.enabled && chipOn && onScreen && !compactHide && opacity > 0.04,
        opacity: Math.max(0, Math.min(1, opacity)),
      });
    }

    const insane = insaneShootingConfig();
    this.updateInsaneShooting(t, insane, input.reducedMotion, input.compact);

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

  private updateInsaneShooting(
    t: number,
    config: InsaneShootingConfig,
    reducedMotion: boolean,
    compact: boolean,
  ) {
    if (!this.outroActors.length) return;

    if (!this.enabled || !config.enabled) {
      for (const actor of this.outroActors) {
        if (actor.blend !== 0) {
          applyBuildingLook(actor.slots, 0);
          actor.blend = 0;
        }
        this.hidePacket(actor.packet);
      }
      return;
    }

    const span = Math.max(0.01, config.end - config.start);
    const requestSpan = Math.max(0.002, span * 0.12);
    const flightSpan = Math.max(0.006, span * 0.27);
    const staggerSpan = Math.max(0, span - requestSpan - flightSpan);
    const lastIndex = Math.max(1, this.outroActors.length - 1);

    for (const actor of this.outroActors) {
      const requestAt = config.start + (staggerSpan * actor.index) / lastIndex;
      const dispatchAt = Math.min(config.end, requestAt + requestSpan);
      const arriveAt = Math.min(config.end, dispatchAt + flightSpan);
      const requestState = config.requestColor === 'after' ? 2 : 1;
      const shootingState = config.shootingColor === 'before' ? 1 : 2;
      // The second colour begins exactly when the logo launches and persists
      // after arrival, so blue can sweep across the city while logos fly.
      const state = t < requestAt ? 0 : t < dispatchAt ? requestState : shootingState;

      if (!actor.object.visible) {
        this.hidePacket(actor.packet);
        continue;
      }

      // The two colour stages are selected in the Shooting logo panel.
      // No overlay title is created for these outro-only actors.
      // Before the finale starts, leave idle materials untouched for performance.
      if (state > 0 || actor.blend !== state) {
        applyBuildingLook(actor.slots, state);
        actor.blend = state;
      }
      const showPacket = !reducedMotion && !compact && t >= dispatchAt && t < arriveAt;
      this.updateOutroPacket(actor, dispatchAt, arriveAt, t, showPacket, config.launch);
    }
  }

  private hidePacket(packet: PacketRig) {
    packet.group.visible = false;
    packet.light.intensity = 0;
    packet.light.visible = false;
    packet.trail.geometry.setDrawRange(0, 0);
    packet.burstCore.visible = false;
    packet.burstRing.visible = false;
    packet.burstSparks.visible = false;
  }

  /** Lightweight logo flight for the many targets in the finale — no extra point lights or bursts. */
  private updateOutroPacket(
    actor: OutroActor,
    dispatch: number,
    arrive: number,
    t: number,
    show: boolean,
    launchOffset: readonly [number, number, number] | undefined,
  ) {
    const packet = actor.packet;
    if (!show || !this.hub) {
      this.hidePacket(packet);
      return;
    }

    const span = Math.max(0.0001, arrive - dispatch);
    const u = Math.max(0, Math.min(1, (t - dispatch) / span));
    _landing.copy(actor.roof);
    _launch.copy(this.hub.origin);
    _launch.x += launchOffset?.[0] ?? 0;
    _launch.y += launchOffset?.[1] ?? 0;
    _launch.z += launchOffset?.[2] ?? 0;
    // A subtle spread prevents every logo from occupying the identical pixel.
    const angle = actor.index * 2.399963229728653;
    _launch.x += Math.cos(angle) * 0.12;
    _launch.y += ((actor.index % 3) - 1) * 0.045;
    _launch.z += Math.sin(angle) * 0.12;
    updatePacketCurve(packet, _launch, _landing);
    packet.curve.getPoint(u, packet.group.position);
    packet.group.visible = true;
    packet.light.visible = false;
    packet.light.intensity = 0;

    const fadeSpan = Math.max(0.002, Math.min(FADE_IN_T, span * 0.35));
    const fadeIn = smooth01((t - dispatch) / fadeSpan);
    const pulse = 0.65 + Math.sin(u * Math.PI) * 0.35;
    const flicker = 0.75 + Math.sin((actor.index + u) * 42) * 0.25;
    const glow = Math.max(0, STORY_CONFIG.packetGlow ?? 1);
    const glowSize = Math.max(0.02, STORY_CONFIG.packetGlowSize ?? 0.22);
    const coreSize = Math.max(0.02, STORY_CONFIG.packetCoreSize ?? 0.07);
    const trailAmt = Math.max(0, Math.min(1, STORY_CONFIG.packetTrail ?? 0.7));

    const logoSize = coreSize * 2.4 * (0.35 + 0.65 * fadeIn);
    packet.core.scale.set(logoSize, logoSize, 1);
    const coreMat = packet.core.material as THREE.SpriteMaterial;
    coreMat.color.setHex(0xffffff);
    coreMat.opacity = 0.96 * pulse * fadeIn;

    const innerMat = packet.glowInner.material as THREE.SpriteMaterial;
    const outerMat = packet.glowOuter.material as THREE.SpriteMaterial;
    innerMat.color.copy(_packetInner);
    outerMat.color.copy(_packetOuter);
    packet.glowInner.scale.set(logoSize * (1.08 + glow * 0.06) + glowSize, logoSize * (1.08 + glow * 0.06) + glowSize, 1);
    packet.glowOuter.scale.set(logoSize * (1.22 + glow * 0.16) + glowSize * 2.4, logoSize * (1.22 + glow * 0.16) + glowSize * 2.4, 1);
    innerMat.opacity = 0.5 * glow * pulse * fadeIn;
    outerMat.opacity = 0.22 * glow * pulse * fadeIn;
    const hasMark = Boolean(coreMat.map);
    packet.core.visible = hasMark && fadeIn > 0.02;
    packet.glowInner.visible = hasMark && glow > 0.01 && fadeIn > 0.02;
    packet.glowOuter.visible = hasMark && glow > 0.01 && fadeIn > 0.02;

    const sparkMat = packet.sparks.material as THREE.PointsMaterial;
    sparkMat.color.copy(_packetSpark);
    sparkMat.opacity = Math.min(1, glow * 0.85 * flicker * fadeIn);
    sparkMat.size = coreSize * 0.7;
    packet.sparks.visible = glow > 0.05 && fadeIn > 0.02;
    const sparkPos = packet.sparks.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < sparkPos.count; i++) {
      const a = i * 2.399 + u * 18 + actor.index;
      const r = glowSize * (0.35 + (i % 4) * 0.18) * flicker;
      sparkPos.setXYZ(i, Math.cos(a) * r, Math.sin(a * 1.7) * r * 0.7, Math.sin(a) * r);
    }
    sparkPos.needsUpdate = true;

    const trailMat = packet.trail.material as THREE.LineBasicMaterial;
    trailMat.color.copy(_packetColor);
    trailMat.opacity = trailAmt * (0.45 + pulse * 0.55) * fadeIn;
    packet.trail.visible = trailAmt > 0.02 && fadeIn > 0.02;
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
    packet.burstCore.visible = false;
    packet.burstRing.visible = false;
    packet.burstSparks.visible = false;
  }

  private updatePacket(client: ClientActor, t: number, show: boolean) {
    const packet = client.packet;
    if (!show) {
      this.hidePacket(packet);
      return;
    }
    packet.light.visible = true;

    const span = Math.max(0.0001, client.config.arrive - client.config.dispatch);
    const u = Math.max(0, Math.min(1, (t - client.config.dispatch) / span));
    const burst = burstSettings();
    const blastStart = client.config.arrive + burst.delay;
    const onTarget = t >= client.config.arrive;
    const bursting = t >= blastStart;
    const burstK = bursting ? Math.max(0, Math.min(1, (t - blastStart) / burst.span)) : 0;
    applyLanding(client, _landing);
    if (this.hub) {
      applyLaunch(client, this.hub.origin, _launch);
      updatePacketCurve(packet, _launch, _landing);
    }
    if (onTarget) packet.group.position.copy(_landing);
    else packet.curve.getPoint(u, packet.group.position);
    packet.group.visible = true;

    const fadeIn = onTarget ? 1 : smooth01((t - client.config.dispatch) / FADE_IN_T);
    const logoOut = bursting ? Math.max(0, 1 - burstK / 0.28) : 1;
    const logoFade = fadeIn * logoOut;
    const pulse = 0.65 + Math.sin(u * Math.PI) * 0.35;
    const flicker = 0.75 + Math.sin(u * 42) * 0.25;
    const glow = Math.max(0, STORY_CONFIG.packetGlow ?? 1);
    const glowSize = Math.max(0.02, STORY_CONFIG.packetGlowSize ?? 0.22);
    const coreSize = Math.max(0.02, STORY_CONFIG.packetCoreSize ?? 0.07);
    const trailAmt = Math.max(0, Math.min(1, STORY_CONFIG.packetTrail ?? 0.7));

    packet.light.color.copy(_packetBounce);
    const bounce = Math.max(0, STORY_CONFIG.packetIntensity ?? 260);
    const burstPop = bursting ? smooth01(burstK / 0.2) : 0;
    const burstDecay = bursting ? (burstK < 0.18 ? 1 : Math.pow(1 - (burstK - 0.18) / 0.82, 1.55)) : 0;
    packet.light.intensity = bursting
      ? bounce * burst.light * burstDecay * burst.exposure
      : (bounce + Math.sin(u * Math.PI) * bounce * 0.7) * fadeIn;
    packet.light.distance = bursting
      ? burst.radius
      : Math.max(0.5, STORY_CONFIG.packetDistance ?? 9);
    packet.light.decay = 2;

    const appearScale = 0.35 + 0.65 * fadeIn;
    const logoSize = coreSize * 2.4 * appearScale;
    packet.core.scale.set(logoSize, logoSize, 1);
    const coreMat = packet.core.material as THREE.SpriteMaterial;
    coreMat.color.setHex(0xffffff);
    coreMat.opacity = 0.96 * pulse * logoFade;

    const innerMat = packet.glowInner.material as THREE.SpriteMaterial;
    const outerMat = packet.glowOuter.material as THREE.SpriteMaterial;
    innerMat.color.copy(_packetInner);
    outerMat.color.copy(_packetOuter);
    const innerSize = logoSize * (1.08 + glow * 0.06) + glowSize * appearScale;
    const outerSize = logoSize * (1.22 + glow * 0.16) + glowSize * 2.4 * appearScale;
    packet.glowInner.scale.set(innerSize, innerSize, 1);
    packet.glowOuter.scale.set(outerSize, outerSize, 1);
    innerMat.opacity = 0.5 * glow * pulse * logoFade;
    outerMat.opacity = 0.22 * glow * pulse * logoFade;
    const hasMark = Boolean(coreMat.map);
    packet.core.visible = hasMark && logoFade > 0.02;
    packet.glowInner.visible = hasMark && glow > 0.01 && logoFade > 0.02;
    packet.glowOuter.visible = hasMark && glow > 0.01 && logoFade > 0.02;

    const sparkMat = packet.sparks.material as THREE.PointsMaterial;
    sparkMat.color.copy(_packetSpark);
    sparkMat.opacity = Math.min(1, glow * 0.85 * flicker * logoFade);
    sparkMat.size = coreSize * 0.7;
    packet.sparks.visible = glow > 0.05 && logoFade > 0.02;
    const sparkPos = packet.sparks.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < sparkPos.count; i++) {
      const a = i * 2.399 + u * 18;
      const r = glowSize * (0.35 + (i % 4) * 0.18) * flicker;
      sparkPos.setXYZ(i, Math.cos(a) * r, Math.sin(a * 1.7) * r * 0.7, Math.sin(a) * r);
    }
    sparkPos.needsUpdate = true;

    const trailMat = packet.trail.material as THREE.LineBasicMaterial;
    trailMat.color.copy(_packetColor);
    trailMat.opacity = trailAmt * (0.45 + pulse * 0.55) * fadeIn * (bursting ? 0 : 1);
    packet.trail.visible = trailAmt > 0.02 && !bursting && fadeIn > 0.02;

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
    packet.trail.geometry.setDrawRange(0, bursting ? 0 : TRAIL_POINTS);

    const burstCoreMat = packet.burstCore.material as THREE.SpriteMaterial;
    const burstRingMat = packet.burstRing.material as THREE.SpriteMaterial;
    if (bursting && burstDecay > 0.02) {
      const disc = getBurstDisc();
      if (disc && burstCoreMat.map !== disc) {
        burstCoreMat.map = disc;
        burstRingMat.map = disc;
        burstCoreMat.needsUpdate = true;
        burstRingMat.needsUpdate = true;
      }
      const blast = (0.35 + burstPop * 2.8) * (glowSize + coreSize * 5.2) * burst.size;
      packet.burstCore.scale.setScalar(blast);
      packet.burstRing.scale.setScalar(blast * (1.35 + burstPop * 1.9));
      burstCoreMat.color.copy(_packetInner);
      burstRingMat.color.copy(_packetOuter);
      burstCoreMat.opacity = Math.min(1, 0.95 * burstDecay * burst.exposure);
      burstRingMat.opacity = Math.min(1, 0.42 * burstDecay * burst.exposure);
      packet.burstCore.visible = true;
      packet.burstRing.visible = true;

      const burstSparkMat = packet.burstSparks.material as THREE.PointsMaterial;
      burstSparkMat.color.copy(_packetSpark);
      burstSparkMat.opacity = Math.min(1, 0.95 * burstDecay * burst.sparks);
      burstSparkMat.size = 0.06 + burstPop * 0.12;
      packet.burstSparks.visible = burst.sparks > 0.02;
      const burstPos = packet.burstSparks.geometry.getAttribute('position') as THREE.BufferAttribute;
      const reach = (0.2 + burstPop * 1.85) * (0.35 + glowSize * 4) * burst.size;
      for (let i = 0; i < burstPos.count; i++) {
        const a = i * 2.399;
        const lift = ((i % 5) - 2) * 0.12;
        burstPos.setXYZ(i, Math.cos(a) * reach, Math.sin(a * 1.35) * reach * 0.55 + lift * burstPop, Math.sin(a) * reach);
      }
      burstPos.needsUpdate = true;
    } else {
      packet.burstCore.visible = false;
      packet.burstRing.visible = false;
      packet.burstSparks.visible = false;
      burstCoreMat.opacity = 0;
      burstRingMat.opacity = 0;
    }
  }

  private applyHubPulse(elapsed: number, flash: number, reducedMotion: boolean) {
    if (!this.hub) return;
    const pulse = reducedMotion ? 0.9 : 0.88 + Math.sin(elapsed * 1.6) * 0.08;
    const amount = Math.max(0, Math.min(1, pulse + flash * 0.12));
    for (const slot of this.hub.slots) {
      paintSlot(slot, slot.role === 'window' ? _hubWindow : _hubPulse, amount);
    }
  }

  private hidePackets() {
    for (const actor of [...this.clients, ...this.outroActors]) {
      this.hidePacket(actor.packet);
    }
  }

  dispose() {
    this.restoreBase();
    if (this.scene && this.packetRoot.parent === this.scene) {
      this.scene.remove(this.packetRoot);
    }
    for (const actor of [...this.clients, ...this.outroActors]) {
      const packet = actor.packet;
      (packet.core.material as THREE.Material).dispose();
      (packet.glowInner.material as THREE.Material).dispose();
      (packet.glowOuter.material as THREE.Material).dispose();
      packet.sparks.geometry.dispose();
      (packet.sparks.material as THREE.Material).dispose();
      (packet.burstCore.material as THREE.Material).dispose();
      (packet.burstRing.material as THREE.Material).dispose();
      packet.burstSparks.geometry.dispose();
      (packet.burstSparks.material as THREE.Material).dispose();
      packet.trail.geometry.dispose();
      (packet.trail.material as THREE.Material).dispose();
      packet.light.dispose();
    }
    this.clients = [];
    this.outroActors = [];
    this.hub = null;
    this.scene = null;
    this.packetRoot = new THREE.Group();
  }
}

export const JOURNEY_SCROLL_LENGTH_EVENT = 'rastaak-journey-scroll-length-changed';

const MIN_JOURNEY_SCROLL_LENGTH = 0.5;
const MAX_JOURNEY_SCROLL_LENGTH = 6;

function normalizedJourneyScrollLength(value = SCENE_CONFIG.scroll.journeyScrollLength): number {
  const finite = Number.isFinite(value) ? Number(value) : 1;
  return Math.min(MAX_JOURNEY_SCROLL_LENGTH, Math.max(MIN_JOURNEY_SCROLL_LENGTH, finite));
}

/**
 * Apply the authored scroll distance to the sticky flow section. The mobile
 * layout already uses a 1.25x base height, so preserve that baseline and layer
 * the editor's multiplier on top of it.
 */
export function applyJourneyScrollLength(): number {
  const multiplier = normalizedJourneyScrollLength();
  SCENE_CONFIG.scroll.journeyScrollLength = multiplier;
  if (typeof document === 'undefined' || typeof window === 'undefined') return multiplier;

  const flow = document.querySelector<HTMLElement>('.flow');
  if (!flow) return multiplier;
  const baseMultiplier = window.matchMedia('(max-width: 820px)').matches ? 1.25 : 1;
  flow.style.setProperty('--flow-height-multiplier', String(baseMultiplier * multiplier));
  return multiplier;
}

/** Set the amount of physical scroll required to complete the camera journey. */
export function setJourneyScrollLength(value: number): number {
  SCENE_CONFIG.scroll.journeyScrollLength = normalizedJourneyScrollLength(value);
  const multiplier = applyJourneyScrollLength();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(JOURNEY_SCROLL_LENGTH_EVENT));
  }
  return multiplier;
}

export function readStoryScrollProgress(fallbackMultiplier: number): number {
  if (typeof document === 'undefined' || typeof window === 'undefined') return 0;
  const flow = document.querySelector('.flow') as HTMLElement | null;
  if (flow) {
    const end = flow.offsetTop + flow.offsetHeight - window.innerHeight;
    if (end > 1) return Math.max(0, Math.min(1, window.scrollY / end));
  }
  const span = Math.max(1, window.innerHeight * fallbackMultiplier * normalizedJourneyScrollLength());
  return Math.max(0, Math.min(1, window.scrollY / span));
}
