import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import type { LightConfig, StudioSavePayload } from '@/components/canvas/scene/sceneTypes';

export const runtime = 'nodejs';

const LIGHT_TYPES = new Set(['directional', 'point', 'spot', 'ambient', 'hemisphere', 'rectarea']);

function asFinite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asHexNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value >>> 0;
  }
  if (typeof value === 'string') {
    const clean = value.trim().replace(/^#/, '').replace(/^0x/i, '');
    if (/^[0-9a-fA-F]{1,8}$/.test(clean)) {
      return Number.parseInt(clean, 16) >>> 0;
    }
  }
  return fallback >>> 0;
}

function hexLit(value: number): string {
  return '0x' + (value >>> 0).toString(16).padStart(6, '0');
}

function asVec3(value: unknown, fallback: [number, number, number]): [number, number, number] {
  if (!Array.isArray(value) || value.length < 3) return fallback;
  return [asFinite(value[0], fallback[0]), asFinite(value[1], fallback[1]), asFinite(value[2], fallback[2])];
}

function sanitizeId(value: unknown, fallback: string): string {
  const raw = typeof value === 'string' ? value : fallback;
  const cleaned = raw.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80);
  return cleaned || fallback;
}

function sanitizeText(value: unknown, fallback: string, max = 240): string {
  if (typeof value !== 'string') return fallback;
  return value.replace(/\u0000/g, '').slice(0, max);
}

function sanitizeSide(value: unknown): 'front' | 'back' | 'left' | 'right' {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (raw === 'back' || raw === 'left' || raw === 'right' || raw === 'front') return raw;
  return 'front';
}

function sanitizeOverrideKey(value: string): string | null {
  const trimmed = value.trim().slice(0, 160);
  if (/^[A-Za-z0-9_-]+$/.test(trimmed)) return trimmed;
  const slugged = trimmed.replace(/\s+/g, '_').replace(/[^A-Za-z0-9_-]/g, '_');
  return slugged || null;
}

function emit(value: unknown, indent: number): string {
  const pad = '  '.repeat(indent);
  const inner = '  '.repeat(indent + 1);

  if (typeof value === 'string' && /^0x[0-9a-f]{6}$/.test(value)) {
    return value;
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return JSON.stringify(value);
  if (value === null || value === undefined) return 'undefined';

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const primitive = value.every((item) => typeof item !== 'object' || item === null);
    if (primitive) {
      return `[${value.map((item) => emit(item, indent)).join(', ')}]`;
    }
    return `[\n${value.map((item) => `${inner}${emit(item, indent + 1)}`).join(',\n')}\n${pad}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, item]) => item !== undefined,
    );
    if (entries.length === 0) return '{}';
    return `{\n${entries
      .map(([key, item]) => {
        const safeKey = /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? key : JSON.stringify(key);
        return `${inner}${safeKey}: ${emit(item, indent + 1)}`;
      })
      .join(',\n')}\n${pad}}`;
  }

  return 'undefined';
}

function sanitizeLight(raw: unknown, index: number): LightConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const type = typeof item.type === 'string' ? item.type.toLowerCase().replace('light', '') : '';
  if (!LIGHT_TYPES.has(type)) return null;

  const light: LightConfig = {
    id: sanitizeId(item.id, `light_${index + 1}`),
    type: type as LightConfig['type'],
    color: asHexNumber(item.color, 0xffffff),
    intensity: asFinite(item.intensity, 1),
  };

  if (item.groundColor !== undefined) light.groundColor = asHexNumber(item.groundColor, 0x101114);
  if (item.position !== undefined) light.position = asVec3(item.position, [0, 0, 0]);
  if (item.target !== undefined) light.target = asVec3(item.target, [0, 0, 0]);
  if (item.distance !== undefined) light.distance = asFinite(item.distance, 0);
  if (item.decay !== undefined) light.decay = asFinite(item.decay, 2);
  if (item.radius !== undefined) light.radius = asFinite(item.radius, 1);
  if (item.width !== undefined) light.width = asFinite(item.width, 6);
  if (item.height !== undefined) light.height = asFinite(item.height, 6);
  if (item.angle !== undefined) light.angle = asFinite(item.angle, 45);
  if (item.penumbra !== undefined) light.penumbra = asFinite(item.penumbra, 0.5);
  if (item.castShadow !== undefined) light.castShadow = Boolean(item.castShadow);
  if (item.enabled !== undefined) light.enabled = Boolean(item.enabled);
  if (item.shadowMapSize !== undefined) light.shadowMapSize = asFinite(item.shadowMapSize, 2048);
  if (item.shadowBias !== undefined) light.shadowBias = asFinite(item.shadowBias, 0);
  if (item.shadowNormalBias !== undefined) {
    light.shadowNormalBias = Math.min(0.2, Math.max(0, asFinite(item.shadowNormalBias, 0.04)));
  }
  if (item.shadowNear !== undefined) light.shadowNear = Math.min(8, Math.max(0.05, asFinite(item.shadowNear, 0.5)));
  if (item.shadowFar !== undefined) light.shadowFar = Math.min(250, Math.max(8, asFinite(item.shadowFar, 80)));
  if (item.shadowIntensity !== undefined) {
    light.shadowIntensity = Math.min(2, Math.max(0, asFinite(item.shadowIntensity, 1)));
  }

  return light;
}

function withHexColors<T extends Record<string, unknown>>(value: T, keys: string[]): T {
  const next = { ...value };
  for (const key of keys) {
    if (next[key] !== undefined) {
      (next as Record<string, unknown>)[key] = hexLit(asHexNumber(next[key], 0xffffff));
    }
  }
  return next;
}

export async function POST(req: Request) {
  const { isAdminRequest } = await import('@/lib/adminAuth');
  if (process.env.NODE_ENV !== 'development' && !isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const body = (await req.json()) as Partial<StudioSavePayload>;
    const rootDir = process.cwd();

    if (Array.isArray(body.lights)) {
      const lights = body.lights
        .map((light, index) => sanitizeLight(light, index))
        .filter((light): light is LightConfig => Boolean(light))
        .map((light) =>
          withHexColors(light as unknown as Record<string, unknown>, ['color', 'groundColor']),
        );

      const lightingPath = path.join(rootDir, 'components', 'canvas', 'scene', 'lightingConfig.ts');
      const lightingCode = `/**
 * RASTAAK 3D LIGHTING CONTROLLER CONFIG
 * Saved automatically from 3D Studio
 */

import type { LightConfig } from './sceneTypes';

export type { LightConfig };

export const LIGHTS_CONFIG: LightConfig[] = ${emit(lights, 0)};
`;
      fs.writeFileSync(lightingPath, lightingCode, 'utf8');
    }

    const cameraStops = Array.isArray(body.cameraStops)
      ? body.cameraStops.map((stop, index) => ({
          id: sanitizeId(stop?.id, `stop_${index + 1}`),
          progress: Math.min(1, Math.max(0, asFinite(stop?.progress, index / Math.max(1, body.cameraStops!.length - 1)))),
          camera: asVec3(stop?.camera, [0, 10, 10]),
          target: asVec3(stop?.target, [0, 0, 0]),
          fov: asFinite(stop?.fov, 45),
        }))
      : null;

    if (cameraStops || body.environment || body.materials || body.renderer || body.scroll) {
      const overrides: Record<string, Record<string, unknown>> = {};
      const rawOverrides = body.materials?.overrides;
      if (rawOverrides && typeof rawOverrides === 'object') {
        for (const [rawKey, rawValue] of Object.entries(rawOverrides)) {
          const key = sanitizeOverrideKey(rawKey);
          if (!key || !rawValue || typeof rawValue !== 'object') continue;
          const item = rawValue as Record<string, unknown>;
          const entry: Record<string, unknown> = {};
          if (item.color !== undefined) entry.color = hexLit(asHexNumber(item.color, 0x8c8c8c));
          if (item.roughness !== undefined) entry.roughness = asFinite(item.roughness, 0.6);
          if (item.metalness !== undefined) entry.metalness = asFinite(item.metalness, 0);
          overrides[key] = entry;
        }
      }

      const materials = {
        buildingColor: hexLit(asHexNumber(body.materials?.buildingColor ?? body.materials?.globalFacadeColor, 0xa3a3a3)),
        windowColor: hexLit(asHexNumber(body.materials?.windowColor ?? body.materials?.globalWindowColor, 0xffffff)),
        rastaakColor: hexLit(asHexNumber(body.materials?.rastaakColor, 0x09006a)),
        logoColor: hexLit(asHexNumber(body.materials?.logoColor, 0xffffff)),
        groundColor: hexLit(asHexNumber(body.materials?.groundColor, 0xffffff)),
        plateColor: hexLit(asHexNumber(body.materials?.plateColor, 0x7f7f7f)),
        borderColor: hexLit(asHexNumber(body.materials?.borderColor, 0x888888)),
        treeTrunkColor: hexLit(asHexNumber(body.materials?.treeTrunkColor, 0x6b4f2a)),
        treeLeafColor: hexLit(asHexNumber(body.materials?.treeLeafColor, 0x3d6b3a)),
        globalFacadeColor: hexLit(asHexNumber(body.materials?.buildingColor ?? body.materials?.globalFacadeColor, 0xa3a3a3)),
        globalWindowColor: hexLit(asHexNumber(body.materials?.windowColor ?? body.materials?.globalWindowColor, 0xffffff)),
        ...(body.materials?.roughness !== undefined
          ? { roughness: Math.min(1, Math.max(0, asFinite(body.materials.roughness, 0.72))) }
          : {}),
        ...(body.materials?.metalness !== undefined
          ? { metalness: Math.min(1, Math.max(0, asFinite(body.materials.metalness, 0.04))) }
          : {}),
        ...(body.materials?.envMapIntensity !== undefined
          ? { envMapIntensity: Math.min(5, Math.max(0, asFinite(body.materials.envMapIntensity, 1))) }
          : {}),
        ...(body.materials?.groundRoughness !== undefined
          ? { groundRoughness: Math.min(1, Math.max(0, asFinite(body.materials.groundRoughness, 0.72))) }
          : {}),
        ...(body.materials?.groundMetalness !== undefined
          ? { groundMetalness: Math.min(1, Math.max(0, asFinite(body.materials.groundMetalness, 0.04))) }
          : {}),
        ...(body.materials?.groundEnvMapIntensity !== undefined
          ? {
              groundEnvMapIntensity: Math.min(
                5,
                Math.max(0, asFinite(body.materials.groundEnvMapIntensity, 1)),
              ),
            }
          : {}),
        overrides: {},
      };

      const environment = {
        backgroundColor: hexLit(asHexNumber(body.environment?.backgroundColor, 0x1c1d22)),
        fogColor: hexLit(asHexNumber(body.environment?.fogColor ?? body.environment?.backgroundColor, 0x1c1d22)),
        fogStart: asFinite(body.environment?.fogStart, 15),
        fogEnd: asFinite(body.environment?.fogEnd, 110),
        fogEnabled: body.environment?.fogEnabled !== false,
        shadowColor: hexLit(asHexNumber(body.environment?.shadowColor, 0x000000)),
        shadowOpacity: Math.min(1, Math.max(0, asFinite(body.environment?.shadowOpacity, 1))),
      };

      const renderer = {
        toneMappingExposure: asFinite(body.renderer?.toneMappingExposure, 1.15),
        shadowMapType:
          body.renderer?.shadowMapType === 'basic' || body.renderer?.shadowMapType === 'pcf'
            ? body.renderer.shadowMapType
            : 'pcfsoft',
      };

      const scroll = {
        headerScrollMultiplier: asFinite(body.scroll?.headerScrollMultiplier, 2.5),
        cameraDamping: asFinite(body.scroll?.cameraDamping, 3.71),
        idleFloatAmount: asFinite(body.scroll?.idleFloatAmount, 0.2),
        idleFloatSpeed: asFinite(body.scroll?.idleFloatSpeed, 0.4),
      };

      const camera = {
        defaultFov: asFinite(body.camera?.defaultFov, 45),
        near: asFinite(body.camera?.near, 0.1),
        far: asFinite(body.camera?.far, 1000),
      };

      const stops = cameraStops ?? [];

      const sceneConfigPath = path.join(rootDir, 'components', 'canvas', 'scene', 'sceneConfig.ts');
      const sceneConfigCode = `/**
 * RASTAAK 3D SCENE CONTROLLER CONFIG
 * Saved automatically from 3D Studio
 */

import { LIGHTS_CONFIG } from './lightingConfig';
import type { CameraStop, MaterialsConfig, SceneConfig } from './sceneTypes';

export type { CameraStop, MaterialsConfig, LightConfig, SceneConfig } from './sceneTypes';
export { LIGHTS_CONFIG } from './lightingConfig';

export const SCENE_CONFIG: SceneConfig = {
  stops: ${emit(stops, 1)} as CameraStop[],

  scroll: ${emit(scroll, 1)},

  camera: ${emit(camera, 1)},

  lights: LIGHTS_CONFIG,

  environment: ${emit(environment, 1)},

  renderer: ${emit(renderer, 1)},

  materials: ${emit(materials, 1)} as MaterialsConfig,
};
`;
      fs.writeFileSync(sceneConfigPath, sceneConfigCode, 'utf8');
    }

    if (body.story) {
      const rawStory = body.story;
      const rawClients = Array.isArray(rawStory.clients) ? rawStory.clients : [];
      const rawCaptions = Array.isArray(rawStory.captions) ? rawStory.captions : [];
      const story = {
        hub: sanitizeText(rawStory.hub, 'Rastaak Building', 80),
        logo: sanitizeText(rawStory.logo, 'Logo', 80),
        colors: {
          need: hexLit(asHexNumber(rawStory.colors?.need, 0xe0a01a)),
          needWindow: hexLit(asHexNumber(rawStory.colors?.needWindow, 0x8a5a08)),
          packet: hexLit(asHexNumber(rawStory.colors?.packet, 0x57cdff)),
          packetBounce: hexLit(asHexNumber(rawStory.colors?.packetBounce, 0x57cdff)),
          packetCore: hexLit(asHexNumber(rawStory.colors?.packetCore ?? rawStory.colors?.packet, 0x57cdff)),
          packetInner: hexLit(asHexNumber(rawStory.colors?.packetInner ?? rawStory.colors?.packet, 0x57cdff)),
          packetOuter: hexLit(asHexNumber(rawStory.colors?.packetOuter ?? rawStory.colors?.packet, 0x57cdff)),
          packetSpark: hexLit(asHexNumber(rawStory.colors?.packetSpark ?? rawStory.colors?.packet, 0x57cdff)),
          resolved: hexLit(asHexNumber(rawStory.colors?.resolved, 0x0e94fb)),
          resolvedWindow: hexLit(asHexNumber(rawStory.colors?.resolvedWindow, 0x57cdff)),
          hubPulse: hexLit(asHexNumber(rawStory.colors?.hubPulse, 0x57cdff)),
          hubPulseWindow: hexLit(asHexNumber(rawStory.colors?.hubPulseWindow, 0x9ae6ff)),
          chipNeed: hexLit(asHexNumber(rawStory.colors?.chipNeed, 0xe0a01a)),
          chipResolved: hexLit(asHexNumber(rawStory.colors?.chipResolved, 0x0e94fb)),
        },
        clients: rawClients.map((client, index) => ({
          id: sanitizeId(client?.id, `client_${index + 1}`),
          building: sanitizeText(client?.building, `Building ${index + 1}`, 80),
          need: sanitizeText(client?.need, '', 160),
          needAfter: sanitizeText(client?.needAfter, '', 160) || undefined,
          appear: asFinite(client?.appear, 0.1),
          dispatch: asFinite(client?.dispatch, 0.16),
          arrive: asFinite(client?.arrive, 0.24),
          resolve: asFinite(
            client?.resolve,
            asFinite(client?.arrive, 0.24),
          ),
          needEnd:
            client?.needEnd === undefined || client?.needEnd === null
              ? undefined
              : asFinite(client.needEnd, asFinite(client?.arrive, 0.24)),
          land: asVec3(client?.land, [0, 0, 0]),
          launch: asVec3(client?.launch, [0, 0, 0]),
          needOffset: asVec3(client?.needOffset, [0, 0, 0]),
        })),
        captions: rawCaptions.map((caption, index) => ({
          id: sanitizeId(caption?.id, `caption_${index + 1}`),
          text: sanitizeText(caption?.text, '', 160),
          range: [
            asFinite(Array.isArray(caption?.range) ? caption.range[0] : 0, 0),
            asFinite(Array.isArray(caption?.range) ? caption.range[1] : 1, 1),
          ],
        })),
        chipHoldAfterArrive: asFinite(rawStory.chipHoldAfterArrive, 0.14),
        captionFadeIn: asFinite(rawStory.captionFadeIn, 0.06),
        packetIntensity: asFinite(rawStory.packetIntensity, 260),
        packetDistance: asFinite(rawStory.packetDistance, 9),
        packetGlow: asFinite(rawStory.packetGlow, 1),
        packetGlowSize: asFinite(rawStory.packetGlowSize, 0.22),
        packetCoreSize: asFinite(rawStory.packetCoreSize, 0.07),
        packetTrail: asFinite(rawStory.packetTrail, 0.7),
        burstDelay: Math.min(0.2, Math.max(0, asFinite(rawStory.burstDelay, 0.045))),
        burstSpan: Math.min(0.2, Math.max(0.012, asFinite(rawStory.burstSpan, 0.06))),
        burstLight: Math.min(8, Math.max(0, asFinite(rawStory.burstLight, 3.2))),
        burstLightRadius: Math.min(40, Math.max(0.5, asFinite(rawStory.burstLightRadius, 10))),
        burstSize: Math.min(3, Math.max(0.1, asFinite(rawStory.burstSize, 1))),
        burstExposure: Math.min(3, Math.max(0, asFinite(rawStory.burstExposure, 1))),
        burstSparks: Math.min(2, Math.max(0, asFinite(rawStory.burstSparks, 1))),
        chipBorder: hexLit(asHexNumber(rawStory.chipBorder, 0xe0a01a)),
        chipBorderOpacity: asFinite(rawStory.chipBorderOpacity, 0.55),
        chipBackground: hexLit(asHexNumber(rawStory.chipBackground, 0x14151a)),
        chipBackgroundOpacity: asFinite(rawStory.chipBackgroundOpacity, 0.72),
        chipText: hexLit(asHexNumber(rawStory.chipText, 0xf5f5f2)),
        chipMaxWidth: Math.min(960, Math.max(240, asFinite(rawStory.chipMaxWidth, 680))),
      };

      const storyPath = path.join(rootDir, 'components', 'canvas', 'scene', 'storyConfig.ts');
      const storyCode = `/**
 * Homepage 3D story — source of truth.
 * Saved automatically from 3D Studio.
 */

export type StoryBuildingState = 'idle' | 'need' | 'resolved';

export interface StoryClientConfig {
  id: string;
  building: string;
  need: string;
  needAfter?: string;
  appear: number;
  dispatch: number;
  arrive: number;
  resolve?: number;
  needEnd?: number;
  land?: [number, number, number];
  launch?: [number, number, number];
  needOffset?: [number, number, number];
}

export interface StoryCaptionConfig {
  id: string;
  text: string;
  range: [number, number];
}

export interface StoryColors {
  need: number;
  needWindow: number;
  packet: number;
  packetBounce: number;
  packetCore: number;
  packetInner: number;
  packetOuter: number;
  packetSpark: number;
  resolved: number;
  resolvedWindow: number;
  hubPulse: number;
  hubPulseWindow: number;
  chipNeed: number;
  chipResolved: number;
}

export interface StoryConfig {
  hub: string;
  logo: string;
  colors: StoryColors;
  clients: StoryClientConfig[];
  captions: StoryCaptionConfig[];
  chipHoldAfterArrive: number;
  captionFadeIn: number;
  packetIntensity: number;
  packetDistance: number;
  packetGlow: number;
  packetGlowSize: number;
  packetCoreSize: number;
  packetTrail: number;
  burstDelay?: number;
  burstSpan?: number;
  burstLight?: number;
  burstLightRadius?: number;
  burstSize?: number;
  burstExposure?: number;
  burstSparks?: number;
  chipBorder: number;
  chipBorderOpacity: number;
  chipBackground: number;
  chipBackgroundOpacity: number;
  chipText: number;
  chipMaxWidth?: number;
}

export function resolveAt(client: { appear: number; arrive: number; resolve?: number }): number {
  const value = client.resolve;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.min(1, Math.max(client.appear, value));
  }
  return client.arrive;
}

export const STORY_FRAME_EVENT = 'rastaak-story-frame';

export const STORY_CONFIG: StoryConfig = ${emit(story, 0)};

export function needEndAt(client: { appear: number; arrive: number; needEnd?: number }): number {
  if (typeof client.needEnd === 'number' && Number.isFinite(client.needEnd)) {
    return Math.min(1, Math.max(client.appear, client.needEnd));
  }
  return Math.min(1, Math.max(client.appear, client.arrive + Math.max(0, STORY_CONFIG.chipHoldAfterArrive || 0)));
}

export function needTitleAt(
  client: { need: string; needAfter?: string; arrive: number },
  t: number,
  burstDelay?: number,
): string {
  const delay = Math.max(0, burstDelay ?? STORY_CONFIG.burstDelay ?? 0.045);
  const after = client.needAfter;
  if (typeof after === 'string' && after.trim() && t >= client.arrive + delay) {
    return after;
  }
  return client.need;
}

export interface StoryChipFrame {
  id: string;
  text: string;
  x: number;
  y: number;
  state: Exclude<StoryBuildingState, 'idle'>;
  visible: boolean;
  opacity: number;
}

export interface StoryCaptionFrame {
  id: string;
  text: string;
  index: number;
  total: number;
}

export interface StoryFrame {
  t: number;
  chips: StoryChipFrame[];
  captions: StoryCaptionConfig[];
  activeCaptionId: string | null;
  visible: boolean;
}

function hexCss(value: number): string {
  return '#' + (value >>> 0).toString(16).padStart(6, '0');
}

function hexToRgba(value: number, alpha: number): string {
  const hex = value >>> 0;
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;
  const a = Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : 1));
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
}

export function applyStoryTheme(root: HTMLElement | null = typeof document === 'undefined' ? null : document.documentElement) {
  if (!root) return;
  const colors = STORY_CONFIG.colors;
  root.style.setProperty('--story-chip-need', hexCss(colors.chipNeed ?? colors.need));
  root.style.setProperty('--story-chip-resolved', hexCss(colors.chipResolved ?? colors.resolved));
  root.style.setProperty('--story-chip-text', hexCss(STORY_CONFIG.chipText ?? 0xf5f5f2));
  root.style.setProperty(
    '--story-chip-border',
    hexToRgba(STORY_CONFIG.chipBorder ?? 0xe0a01a, STORY_CONFIG.chipBorderOpacity ?? 0.55),
  );
  root.style.setProperty(
    '--story-chip-bg',
    hexToRgba(STORY_CONFIG.chipBackground ?? 0x14151a, STORY_CONFIG.chipBackgroundOpacity ?? 0.72),
  );
  const chipWidth = Math.min(960, Math.max(240, STORY_CONFIG.chipMaxWidth ?? 680));
  root.style.setProperty('--story-chip-max-width', chipWidth + 'px');
}
`;
      fs.writeFileSync(storyPath, storyCode, 'utf8');
    }

    if (body.heroCopy) {
      const rawHero = body.heroCopy;
      const heroCopy = {
        titleLine1: sanitizeText(rawHero.titleLine1, 'The New Standard', 160),
        titleLine2: sanitizeText(rawHero.titleLine2, 'in Staffing', 160),
        titleColor: hexLit(asHexNumber(rawHero.titleColor, 0xf5f5f2)),
        titlePaddingTop: Math.min(480, Math.max(-200, asFinite(rawHero.titlePaddingTop, 0))),
        subtitleLine1: sanitizeText(rawHero.subtitleLine1, 'AI driven speed. Expert curation.', 240),
        subtitleLine2: sanitizeText(
          rawHero.subtitleLine2,
          'We mobilize verified crews to protect your schedule and your bottom line in high-consequence environments.',
          400,
        ),
        subtitleColor: hexLit(asHexNumber(rawHero.subtitleColor, 0xe8e8e4)),
        subtitlePaddingTop: Math.min(400, Math.max(-200, asFinite(rawHero.subtitlePaddingTop, 0))),
        stackGap: Math.min(160, Math.max(0, asFinite(rawHero.stackGap, 48))),
        scrollHint: sanitizeText(rawHero.scrollHint, 'scroll to discover our process', 160),
        scrollHintColor: hexLit(asHexNumber(rawHero.scrollHintColor, 0xf5f5f2)),
      };

      const heroPath = path.join(rootDir, 'components', 'home', 'heroCopy.ts');
      const heroCode = `/**
 * Homepage hero copy — source of truth for title, subtitle, and scroll hint.
 * Saved automatically from 3D Studio.
 */

export interface HeroCopyConfig {
  titleLine1: string;
  titleLine2: string;
  titleColor: number;
  titlePaddingTop?: number;
  subtitleLine1: string;
  subtitleLine2: string;
  subtitleColor: number;
  subtitlePaddingTop?: number;
  stackGap?: number;
  scrollHint: string;
  scrollHintColor: number;
}

export const HERO_COPY: HeroCopyConfig = ${emit(heroCopy, 0)};

function hexCss(value: number): string {
  return '#' + (value >>> 0).toString(16).padStart(6, '0');
}

export function applyHeroCopy() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--hero-title-color', hexCss(HERO_COPY.titleColor));
  root.style.setProperty('--hero-subtitle-color', hexCss(HERO_COPY.subtitleColor));
  root.style.setProperty('--hero-scroll-color', hexCss(HERO_COPY.scrollHintColor));
  root.style.setProperty('--hero-title-padding-top', (HERO_COPY.titlePaddingTop ?? 0) + 'px');
  root.style.setProperty('--hero-subtitle-padding-top', (HERO_COPY.subtitlePaddingTop ?? 0) + 'px');
  root.style.setProperty('--hero-stack-gap', Math.max(0, HERO_COPY.stackGap ?? 48) + 'px');

  const title = document.querySelector<HTMLElement>('.hero__title');
  if (title) {
    const spans = title.querySelectorAll('span');
    if (spans[0]) spans[0].textContent = HERO_COPY.titleLine1;
    if (spans[1]) spans[1].textContent = HERO_COPY.titleLine2;
  }

  const subtitle = document.querySelector<HTMLElement>('.hero__subtitle');
  if (subtitle) {
    const first = subtitle.querySelector<HTMLElement>('[data-hero-sub="1"]');
    const second = subtitle.querySelector<HTMLElement>('[data-hero-sub="2"]');
    if (first) first.textContent = HERO_COPY.subtitleLine1;
    if (second) second.textContent = HERO_COPY.subtitleLine2;
  }

  const hint = document.querySelector<HTMLElement>('.hsbtn-in');
  if (hint) hint.textContent = ' ' + HERO_COPY.scrollHint + ' ';
}

`;
      fs.writeFileSync(heroPath, heroCode, 'utf8');
    }

    if (Array.isArray(body.flowSteps) || body.flowChrome) {
      const steps = Array.isArray(body.flowSteps)
        ? body.flowSteps.map((step, index) => ({
            num: sanitizeText(step?.num, String(index + 1).padStart(2, '0'), 8),
            title: sanitizeText(step?.title, '', 160),
            subtitle: sanitizeText(step?.subtitle, '', 240),
            caption: sanitizeText(step?.caption, '', 600),
            progressRange: [
              asFinite(Array.isArray(step?.progressRange) ? step.progressRange[0] : 0, 0),
              asFinite(Array.isArray(step?.progressRange) ? step.progressRange[1] : 1, 1),
            ],
          }))
        : null;

      const rawChrome = body.flowChrome;
      const chrome = {
        align: rawChrome?.align === 'right' ? 'right' : 'left',
        dir: rawChrome?.dir === 'rtl' ? 'rtl' : 'ltr',
        titleColor: hexLit(asHexNumber(rawChrome?.titleColor, 0xf5f5f2)),
        titleBg: hexLit(asHexNumber(rawChrome?.titleBg, 0x0c0d12)),
        titleBgOpacity: Math.min(1, Math.max(0, asFinite(rawChrome?.titleBgOpacity, 0))),
        numberColor: hexLit(asHexNumber(rawChrome?.numberColor, 0xf5f5f2)),
        numberActiveColor: hexLit(asHexNumber(rawChrome?.numberActiveColor, 0x1a1b22)),
        numberBg: hexLit(asHexNumber(rawChrome?.numberBg, 0xffffff)),
        descriptionColor: hexLit(asHexNumber(rawChrome?.descriptionColor, 0xe8e8e4)),
        descriptionBg: hexLit(asHexNumber(rawChrome?.descriptionBg, 0x0c0d12)),
        descriptionBgOpacity: Math.min(1, Math.max(0, asFinite(rawChrome?.descriptionBgOpacity, 0))),
        trackColor: hexLit(asHexNumber(rawChrome?.trackColor, 0xffffff)),
        trackFillColor: hexLit(asHexNumber(rawChrome?.trackFillColor, 0x1a1b22)),
      };

      const existingFlowPath = path.join(rootDir, 'components', 'home', 'flowConfig.ts');
      let existingStepsEmit = '';
      if (!steps) {
        const current = fs.readFileSync(existingFlowPath, 'utf8');
        const match = current.match(/export const FLOW_CONFIG: FlowStepConfig\[\] = (\[[\s\S]*?\n\];)/);
        existingStepsEmit = match ? match[1].replace(/;$/, '') : '[]';
      }

      const flowPath = existingFlowPath;
      const flowCode = `/**
 * RASTAAK FLOW STEPS CONTROLLER CONFIG
 * Saved automatically from 3D Studio
 */

export interface FlowStepConfig {
  num: string;
  title: string;
  subtitle: string;
  caption: string;
  progressRange: [number, number];
}

export interface FlowChromeConfig {
  align: 'left' | 'right';
  dir: 'ltr' | 'rtl';
  titleColor: number;
  titleBg?: number;
  titleBgOpacity?: number;
  numberColor: number;
  numberActiveColor: number;
  numberBg: number;
  descriptionColor: number;
  descriptionBg?: number;
  descriptionBgOpacity?: number;
  trackColor: number;
  trackFillColor: number;
}

export const FLOW_CONFIG: FlowStepConfig[] = ${steps ? emit(steps, 0) : existingStepsEmit};

export const FLOW_CHROME: FlowChromeConfig = ${emit(chrome, 0)};

function hexCss(value: number): string {
  return '#' + (value >>> 0).toString(16).padStart(6, '0');
}

function hexToRgba(value: number, alpha: number): string {
  const hex = value >>> 0;
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;
  const a = Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : 1));
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
}

export function applyFlowChrome() {
  if (typeof document === 'undefined') return;
  const flow = document.querySelector<HTMLElement>('.flow');
  if (!flow) return;
  flow.dataset.align = FLOW_CHROME.align;
  flow.dataset.dir = FLOW_CHROME.dir;
  flow.removeAttribute('dir');
  flow.style.setProperty('--flow-title', hexCss(FLOW_CHROME.titleColor));
  flow.style.setProperty('--flow-number', hexCss(FLOW_CHROME.numberColor));
  flow.style.setProperty('--flow-number-active', hexCss(FLOW_CHROME.numberActiveColor));
  flow.style.setProperty('--flow-number-bg', hexCss(FLOW_CHROME.numberBg));
  flow.style.setProperty('--flow-description', hexCss(FLOW_CHROME.descriptionColor));
  flow.style.setProperty('--flow-track', hexCss(FLOW_CHROME.trackColor));
  flow.style.setProperty('--flow-track-fill', hexCss(FLOW_CHROME.trackFillColor));
  const titleBgA = FLOW_CHROME.titleBgOpacity ?? 0;
  const descBgA = FLOW_CHROME.descriptionBgOpacity ?? 0;
  flow.style.setProperty('--flow-title-bg', hexToRgba(FLOW_CHROME.titleBg ?? 0x0c0d12, titleBgA));
  flow.style.setProperty('--flow-description-bg', hexToRgba(FLOW_CHROME.descriptionBg ?? 0x0c0d12, descBgA));
  flow.style.setProperty('--flow-title-pad', titleBgA > 0.01 ? '6px 12px' : '0px');
  flow.style.setProperty('--flow-description-pad', descBgA > 0.01 ? '8px 12px' : '0px');
}

export function syncFlowDom() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll<HTMLElement>('.flow__step').forEach((el, index) => {
    const step = FLOW_CONFIG[index];
    if (!step) return;
    const title = el.querySelector('.flow__title');
    const description = el.querySelector('.flow__description');
    const number = el.querySelector('.flow__number span');
    if (number) number.textContent = step.num;
    if (title) title.textContent = step.title;
    if (description) {
      const kicker = description.querySelector<HTMLElement>('.flow__description-kicker');
      const copy = description.querySelector<HTMLElement>('.flow__description-copy');
      const br = description.querySelector<HTMLElement>('.flow__description-break');
      if (kicker) kicker.textContent = step.subtitle;
      if (copy) copy.textContent = step.caption;
      if (br) br.hidden = !step.subtitle;
    }
  });
  applyFlowChrome();
}
`;
      fs.writeFileSync(flowPath, flowCode, 'utf8');
    }

    if (body.typeChrome) {
      const raw = body.typeChrome;
      const corners = new Set(['top-right', 'top-left', 'bottom-left', 'bottom-right']);
      const face = (item: unknown, size: number, weight: number) => {
        const value = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
        const nextWeight = asFinite(value.weight, weight);
        const snapped = Math.min(900, Math.max(100, Math.round(nextWeight / 100) * 100));
        return {
          size: Math.min(160, Math.max(8, asFinite(value.size, size))),
          weight: snapped,
          lineHeight: Math.min(2.4, Math.max(0.7, asFinite(value.lineHeight, 1.15))),
          letterSpacing: Math.min(12, Math.max(-12, asFinite(value.letterSpacing, 0))),
          shadowColor: hexLit(asHexNumber(value.shadowColor, 0x000000)),
          shadowOpacity: Math.min(1, Math.max(0, asFinite(value.shadowOpacity, 0))),
          shadowBlur: Math.min(40, Math.max(0, asFinite(value.shadowBlur, 0))),
          shadowX: Math.min(20, Math.max(-20, asFinite(value.shadowX, 0))),
          shadowY: Math.min(20, Math.max(-20, asFinite(value.shadowY, 0))),
        };
      };
      const typeChrome = {
        siteName: sanitizeText(raw.siteName, 'رستاک', 40),
        siteNameColor: hexLit(asHexNumber(raw.siteNameColor, 0x1a1b22)),
        siteNameLayoutColor: hexLit(asHexNumber(raw.siteNameLayoutColor, 0x1a1b22)),
        siteNamePaddingTop: Math.min(400, Math.max(-200, asFinite(raw.siteNamePaddingTop, 0))),
        showSiteLogo: raw.showSiteLogo !== false,
        siteLogoSize: Math.min(160, Math.max(8, asFinite(raw.siteLogoSize, 36))),
        siteLogoGap: Math.min(120, Math.max(0, asFinite(raw.siteLogoGap, 10))),
        siteLogoOffsetX: Math.min(120, Math.max(-120, asFinite(raw.siteLogoOffsetX, 0))),
        siteLogoOffsetY: Math.min(120, Math.max(-120, asFinite(raw.siteLogoOffsetY, 0))),
        siteLogoSide: raw.siteLogoSide === 'right' ? 'right' : 'left',
        studioCorner: corners.has(String(raw.studioCorner)) ? raw.studioCorner : 'bottom-right',
        heroTitle: face(raw.heroTitle, 96, 500),
        heroSubtitle: face(raw.heroSubtitle, 24, 400),
        scrollHint: face(raw.scrollHint, 14, 400),
        flowTitle: face(raw.flowTitle, 24, 500),
        flowNumber: face(raw.flowNumber, 14, 500),
        flowDescription: face(raw.flowDescription, 18, 400),
        chipText: face(raw.chipText, 13, 600),
        siteNameType: face(raw.siteNameType, 50, 800),
      };
      const typePath = path.join(rootDir, 'components', 'home', 'typeChrome.ts');
      const typeCode = `/**
 * Homepage type, brand name, and Studio chrome.
 * Saved automatically from 3D Studio.
 */

export type StudioCorner = 'top-right' | 'top-left' | 'bottom-left' | 'bottom-right';

export interface TypeFace {
  size: number;
  weight: number;
  lineHeight?: number;
  letterSpacing?: number;
  shadowColor: number;
  shadowOpacity: number;
  shadowBlur: number;
  shadowX: number;
  shadowY: number;
}

export interface TypeChromeConfig {
  siteName: string;
  siteNameColor: number;
  siteNameLayoutColor: number;
  siteNamePaddingTop?: number;
  showSiteLogo?: boolean;
  siteLogoSize?: number;
  siteLogoGap?: number;
  siteLogoOffsetX?: number;
  siteLogoOffsetY?: number;
  siteLogoSide?: 'left' | 'right';
  studioCorner: StudioCorner;
  heroTitle: TypeFace;
  heroSubtitle: TypeFace;
  scrollHint: TypeFace;
  flowTitle: TypeFace;
  flowNumber: TypeFace;
  flowDescription: TypeFace;
  chipText: TypeFace;
  siteNameType: TypeFace;
}

export const TYPE_WEIGHTS = {
  Thin: 100,
  ExtraLight: 200,
  Light: 300,
  Regular: 400,
  Medium: 500,
  SemiBold: 600,
  Bold: 700,
  ExtraBold: 800,
  Black: 900,
} as const;

export const TYPE_CHROME: TypeChromeConfig = ${emit(typeChrome, 0)};

function hexCss(value: number): string {
  return '#' + (value >>> 0).toString(16).padStart(6, '0');
}

export function shadowCss(faceValue: TypeFace): string {
  const a = Math.max(0, Math.min(1, faceValue.shadowOpacity));
  if (a <= 0 && faceValue.shadowBlur <= 0 && faceValue.shadowX === 0 && faceValue.shadowY === 0) {
    return 'none';
  }
  const hex = faceValue.shadowColor >>> 0;
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;
  return faceValue.shadowX + 'px ' + faceValue.shadowY + 'px ' + faceValue.shadowBlur + 'px rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
}

function applyFace(prefix: string, faceValue: TypeFace, root: HTMLElement) {
  root.style.setProperty('--' + prefix + '-size', faceValue.size + 'px');
  root.style.setProperty('--' + prefix + '-weight', String(faceValue.weight));
  root.style.setProperty('--' + prefix + '-leading', String(faceValue.lineHeight ?? 1.15));
  root.style.setProperty('--' + prefix + '-tracking', (faceValue.letterSpacing ?? 0) + 'px');
  root.style.setProperty('--' + prefix + '-shadow', shadowCss(faceValue));
}

export function applyStudioChrome() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const corner = TYPE_CHROME.studioCorner;
  const top = corner.startsWith('top');
  const left = corner.endsWith('left');
  root.style.setProperty('--studio-btn-top', top ? '24px' : 'auto');
  root.style.setProperty('--studio-btn-bottom', top ? 'auto' : '24px');
  root.style.setProperty('--studio-btn-left', left ? '24px' : 'auto');
  root.style.setProperty('--studio-btn-right', left ? 'auto' : '24px');
  root.style.setProperty('--studio-gui-top', top ? '90px' : 'auto');
  root.style.setProperty('--studio-gui-bottom', top ? 'auto' : '88px');
  root.style.setProperty('--studio-gui-left', left ? '24px' : 'auto');
  root.style.setProperty('--studio-gui-right', left ? 'auto' : '24px');
  const btn = document.getElementById('rastaak-studio-btn');
  if (btn) {
    btn.style.top = top ? '24px' : 'auto';
    btn.style.bottom = top ? 'auto' : '24px';
    btn.style.left = left ? '24px' : 'auto';
    btn.style.right = left ? 'auto' : '24px';
  }
}

export function applyTypeChrome() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  applyFace('hero-title', TYPE_CHROME.heroTitle, root);
  applyFace('hero-subtitle', TYPE_CHROME.heroSubtitle, root);
  applyFace('hero-scroll', TYPE_CHROME.scrollHint, root);
  applyFace('flow-title', TYPE_CHROME.flowTitle, root);
  applyFace('flow-number', TYPE_CHROME.flowNumber, root);
  applyFace('flow-description', TYPE_CHROME.flowDescription, root);
  applyFace('chip-text', TYPE_CHROME.chipText, root);
  applyFace('site-name', TYPE_CHROME.siteNameType, root);
  root.style.setProperty('--site-name-padding-top', (TYPE_CHROME.siteNamePaddingTop ?? 0) + 'px');
  root.style.setProperty('--site-logo-size', Math.max(8, TYPE_CHROME.siteLogoSize ?? 36) + 'px');
  root.style.setProperty('--site-logo-gap', Math.max(0, TYPE_CHROME.siteLogoGap ?? 10) + 'px');
  root.style.setProperty('--site-logo-x', (TYPE_CHROME.siteLogoOffsetX ?? 0) + 'px');
  root.style.setProperty('--site-logo-y', (TYPE_CHROME.siteLogoOffsetY ?? 0) + 'px');
  root.style.setProperty('--site-logo-display', TYPE_CHROME.showSiteLogo === false ? 'none' : 'block');
  root.dataset.siteLogoSide = TYPE_CHROME.siteLogoSide === 'right' ? 'right' : 'left';
  const sceneColor = hexCss(TYPE_CHROME.siteNameColor);
  const layoutColor = hexCss(TYPE_CHROME.siteNameLayoutColor ?? 0x1a1b22);
  root.style.setProperty('--site-name-color', sceneColor);
  root.style.setProperty('--site-name-scene-color', sceneColor);
  root.style.setProperty('--site-name-layout-color', layoutColor);
  document.querySelectorAll<HTMLElement>('.site-name').forEach((el) => {
    if (el.textContent !== TYPE_CHROME.siteName) el.textContent = TYPE_CHROME.siteName;
    el.style.removeProperty('color');
  });
  applyStudioChrome();
}
`;
      fs.writeFileSync(typePath, typeCode, 'utf8');
    }

    if (Array.isArray(body.buildingNames)) {
      const names = body.buildingNames.map((item, index) => ({
        id: sanitizeId(item?.id, `name_${index + 1}`),
        building: sanitizeText(item?.building, `Building ${index + 1}`, 80),
        text: sanitizeText(item?.text, '', 80),
        size: Math.min(2, Math.max(0.02, asFinite(item?.size, 0.28))),
        color: hexLit(asHexNumber(item?.color, 0xf5f5f2)),
        side: sanitizeSide(item?.side),
        position: asVec3(item?.position, [0, 0, 0]),
        rotation: asVec3(item?.rotation, [0, 0, 0]).map((value) =>
          Math.min(180, Math.max(-180, value)),
        ) as [number, number, number],
        extrude: Math.min(0.4, Math.max(0.002, asFinite(item?.extrude, 0.06))),
      }));
      const namesPath = path.join(rootDir, 'components', 'canvas', 'scene', 'buildingNamesConfig.ts');
      const namesCode = `/**
 * 3D building name plaques — source of truth.
 * Saved automatically from 3D Studio.
 */

export const BUILDING_NAMES_EVENT = 'rastaak-building-names-changed';

export const BUILDING_NAME_SIDES = ['front', 'back', 'left', 'right'] as const;

export type BuildingNameSide = (typeof BUILDING_NAME_SIDES)[number];

export interface BuildingNamePlate {
  id: string;
  building: string;
  text: string;
  size: number;
  color: number;
  side: BuildingNameSide;
  position: [number, number, number];
  rotation: [number, number, number];
  extrude: number;
}

export const BUILDING_NAMES: BuildingNamePlate[] = ${emit(names, 0)};
`;
      fs.writeFileSync(namesPath, namesCode, 'utf8');
    }

    if (body.studioOverlay) {
      const raw = body.studioOverlay;
      const overlay = {
        showCamGizmo: raw.showCamGizmo !== false,
        showTargetGizmo: raw.showTargetGizmo !== false,
        showCamPath: raw.showCamPath !== false,
        showTargetPath: raw.showTargetPath !== false,
        showLightGizmos: raw.showLightGizmos !== false,
      };
      const overlayPath = path.join(rootDir, 'components', 'canvas', 'scene', 'studioOverlay.ts');
      const overlayCode = `/**
 * 3D Studio overlay visibility — source of truth.
 * Saved automatically from 3D Studio.
 */

export interface StudioOverlayConfig {
  showCamGizmo: boolean;
  showTargetGizmo: boolean;
  showCamPath: boolean;
  showTargetPath: boolean;
  showLightGizmos: boolean;
}

export const STUDIO_OVERLAY: StudioOverlayConfig = ${emit(overlay, 0)};
`;
      fs.writeFileSync(overlayPath, overlayCode, 'utf8');
    }

    if (body.loader) {
      const raw = body.loader;
      const snappedWeight = (value: unknown, fallback: number) => {
        const next = asFinite(value, fallback);
        return Math.min(900, Math.max(100, Math.round(next / 100) * 100));
      };
      const loader = {
        title: sanitizeText(raw.title, 'هونامیک ارتباط رستاک', 80),
        subtitle: sanitizeText(raw.subtitle, 'ارائه دهنده تجهیزات ذخیره‌سازی داده', 200),
        dir: raw.dir === 'ltr' ? 'ltr' : 'rtl',
        logoSide: raw.logoSide === 'right' ? 'right' : 'left',
        showLogo: raw.showLogo !== false,
        showTitle: raw.showTitle !== false,
        showSubtitle: raw.showSubtitle !== false,
        showBar: raw.showBar !== false,
        logoSize: Math.min(160, Math.max(24, asFinite(raw.logoSize, 72))),
        rowGap: Math.min(48, Math.max(0, asFinite(raw.rowGap, 14))),
        copyGap: Math.min(24, Math.max(0, asFinite(raw.copyGap, 6))),
        stackGap: Math.min(48, Math.max(4, asFinite(raw.stackGap, 22))),
        titleSize: Math.min(72, Math.max(10, asFinite(raw.titleSize, 28))),
        titleWeight: snappedWeight(raw.titleWeight, 800),
        titleColor: hexLit(asHexNumber(raw.titleColor, 0xffffff)),
        titleTracking: Math.min(8, Math.max(-8, asFinite(raw.titleTracking, -0.4))),
        subtitleSize: Math.min(40, Math.max(8, asFinite(raw.subtitleSize, 14))),
        subtitleWeight: snappedWeight(raw.subtitleWeight, 400),
        subtitleColor: hexLit(asHexNumber(raw.subtitleColor, 0xb4b8c0)),
        subtitleTracking: Math.min(8, Math.max(-4, asFinite(raw.subtitleTracking, 0))),
        barWidth: Math.min(480, Math.max(80, asFinite(raw.barWidth, 240))),
        barHeight: Math.min(12, Math.max(1, asFinite(raw.barHeight, 3))),
        barColor: hexLit(asHexNumber(raw.barColor, 0x57cdff)),
        trackColor: hexLit(asHexNumber(raw.trackColor, 0xffffff)),
        trackOpacity: Math.min(1, Math.max(0, asFinite(raw.trackOpacity, 0.15))),
        bgColor: hexLit(asHexNumber(raw.bgColor, 0x1c1d22)),
      };
      const loaderPath = path.join(rootDir, 'components', 'home', 'loaderConfig.ts');
      const loaderCode = `/**
 * Homepage loading screen — source of truth.
 * Saved automatically from 3D Studio.
 */

export const LOADER_CHANGED_EVENT = 'rastaak-loader-changed';
export const LOADER_PREVIEW_EVENT = 'rastaak-loader-preview';

export interface LoaderScreenConfig {
  title: string;
  subtitle: string;
  dir: 'rtl' | 'ltr';
  logoSide: 'left' | 'right';
  showLogo: boolean;
  showTitle: boolean;
  showSubtitle: boolean;
  showBar: boolean;
  logoSize: number;
  rowGap: number;
  copyGap: number;
  stackGap: number;
  titleSize: number;
  titleWeight: number;
  titleColor: number;
  titleTracking: number;
  subtitleSize: number;
  subtitleWeight: number;
  subtitleColor: number;
  subtitleTracking: number;
  barWidth: number;
  barHeight: number;
  barColor: number;
  trackColor: number;
  trackOpacity: number;
  bgColor: number;
}

export const LOADER_CONFIG: LoaderScreenConfig = ${emit(loader, 0)};

export function hexCss(value: number): string {
  return '#' + (value >>> 0).toString(16).padStart(6, '0');
}

export function hexToRgba(value: number, alpha: number): string {
  const hex = value >>> 0;
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;
  const a = Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : 1));
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
}

export function loaderChromeVars(cfg: LoaderScreenConfig = LOADER_CONFIG): Record<string, string> {
  return {
    '--loader-bg': hexCss(cfg.bgColor),
    '--loader-logo-size': cfg.logoSize + 'px',
    '--loader-row-gap': cfg.rowGap + 'px',
    '--loader-copy-gap': cfg.copyGap + 'px',
    '--loader-stack-gap': cfg.stackGap + 'px',
    '--loader-title-size': cfg.titleSize + 'px',
    '--loader-title-weight': String(cfg.titleWeight),
    '--loader-title-color': hexCss(cfg.titleColor),
    '--loader-title-tracking': cfg.titleTracking + 'px',
    '--loader-subtitle-size': cfg.subtitleSize + 'px',
    '--loader-subtitle-weight': String(cfg.subtitleWeight),
    '--loader-subtitle-color': hexCss(cfg.subtitleColor),
    '--loader-subtitle-tracking': cfg.subtitleTracking + 'px',
    '--loader-bar-width': cfg.barWidth + 'px',
    '--loader-bar-height': cfg.barHeight + 'px',
    '--loader-bar-color': hexCss(cfg.barColor),
    '--loader-track-color': hexToRgba(cfg.trackColor, cfg.trackOpacity),
  };
}

export function loaderChromeCssText(cfg: LoaderScreenConfig = LOADER_CONFIG): string {
  const body = Object.entries(loaderChromeVars(cfg))
    .map(([key, value]) => key + ':' + value)
    .join(';');
  return ':root,#loader{' + body + '}';
}

export function applyLoaderChrome(root: HTMLElement | null = typeof document === 'undefined' ? null : document.getElementById('loader')) {
  if (typeof document === 'undefined') return;
  const loader = root ?? document.getElementById('loader');
  const host = loader ?? document.documentElement;
  if (!host) return;
  const cfg = LOADER_CONFIG;
  const vars = loaderChromeVars(cfg);
  for (const [key, value] of Object.entries(vars)) {
    host.style.setProperty(key, value);
  }
  const boot = document.getElementById('rastaak-loader-boot');
  if (boot) boot.textContent = loaderChromeCssText(cfg);
  if (!loader) return;
  loader.setAttribute('dir', cfg.dir === 'ltr' ? 'ltr' : 'rtl');
  const row = loader.querySelector<HTMLElement>('.loader__row');
  if (row) row.dataset.logoSide = cfg.logoSide === 'right' ? 'right' : 'left';

  const title = loader.querySelector<HTMLElement>('.loader__title');
  if (title) {
    if (title.textContent !== cfg.title) title.textContent = cfg.title;
    title.style.fontSize = cfg.titleSize + 'px';
    title.style.fontWeight = String(cfg.titleWeight);
    title.style.letterSpacing = cfg.titleTracking + 'px';
    title.style.color = hexCss(cfg.titleColor);
  }
  const subtitle = loader.querySelector<HTMLElement>('.loader__subtitle');
  if (subtitle) {
    if (subtitle.textContent !== cfg.subtitle) subtitle.textContent = cfg.subtitle;
    subtitle.style.fontSize = cfg.subtitleSize + 'px';
    subtitle.style.fontWeight = String(cfg.subtitleWeight);
    subtitle.style.letterSpacing = cfg.subtitleTracking + 'px';
    subtitle.style.color = hexCss(cfg.subtitleColor);
  }
}

export function notifyLoaderChanged() {
  applyLoaderChrome();
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LOADER_CHANGED_EVENT));
}

export function previewLoader(open: boolean) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LOADER_PREVIEW_EVENT, { detail: { open } }));
}
`;
      fs.writeFileSync(loaderPath, loaderCode, 'utf8');
    }

    if (body.look) {
      const rawLook = body.look;
      const look = {
        envEnabled: rawLook.envEnabled !== false,
        envIntensity: Math.min(3, Math.max(0, asFinite(rawLook.envIntensity, 0.85))),
        grain: Math.min(0.55, Math.max(0, asFinite(rawLook.grain, 0))),
        grainSize: Math.min(3, Math.max(0.4, asFinite(rawLook.grainSize, 1.15))),
        vignette: Math.min(0.9, Math.max(0, asFinite(rawLook.vignette, 0))),
        vignetteStart: Math.min(0.75, Math.max(0.12, asFinite(rawLook.vignetteStart, 0.42))),
        vignetteSoft: Math.min(0.85, Math.max(0.15, asFinite(rawLook.vignetteSoft, 0.55))),
        bloom: Math.min(2, Math.max(0, asFinite(rawLook.bloom, 0.4))),
        bloomRadius: Math.min(1.4, Math.max(0.15, asFinite(rawLook.bloomRadius, 0.55))),
        gradeShadows: Math.min(0.55, Math.max(0, asFinite(rawLook.gradeShadows, 0))),
        gradeMids: Math.min(0.5, Math.max(-0.4, asFinite(rawLook.gradeMids, 0))),
        gradeHighlights: Math.min(0.45, Math.max(0, asFinite(rawLook.gradeHighlights, 0))),
      };
      const lookPath = path.join(rootDir, 'components', 'canvas', 'scene', 'lookConfig.ts');
      const existing = fs.readFileSync(lookPath, 'utf8');
      const next = existing.replace(
        /export const LOOK_CONFIG: LookConfig = \{[\s\S]*?\};/,
        `export const LOOK_CONFIG: LookConfig = ${emit(look, 0)};`,
      );
      fs.writeFileSync(lookPath, next, 'utf8');
    }

    return NextResponse.json({
      success: true,
      message:
        'Config saved to sceneConfig.ts, lightingConfig.ts, storyConfig.ts, flowConfig.ts, heroCopy.ts, typeChrome.ts, lookConfig.ts, buildingNamesConfig.ts, studioOverlay.ts, and loaderConfig.ts',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save config';
    console.error('Failed to save studio config:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
