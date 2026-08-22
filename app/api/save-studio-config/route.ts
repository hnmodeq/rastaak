import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import type { LightConfig, StudioSavePayload } from '@/components/canvas/scene/sceneTypes';

export const runtime = 'nodejs';

const LIGHT_TYPES = new Set(['directional', 'point', 'spot', 'ambient', 'hemisphere']);

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
  if (item.angle !== undefined) light.angle = asFinite(item.angle, 45);
  if (item.penumbra !== undefined) light.penumbra = asFinite(item.penumbra, 0.5);
  if (item.castShadow !== undefined) light.castShadow = Boolean(item.castShadow);
  if (item.shadowMapSize !== undefined) light.shadowMapSize = asFinite(item.shadowMapSize, 2048);
  if (item.shadowBias !== undefined) light.shadowBias = asFinite(item.shadowBias, -0.0001);

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
  if (process.env.NODE_ENV !== 'development') {
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
        globalFacadeColor: hexLit(asHexNumber(body.materials?.globalFacadeColor, 0x8c8c8c)),
        globalWindowColor: hexLit(asHexNumber(body.materials?.globalWindowColor, 0x222222)),
        globalFacadeRoughness: asFinite(body.materials?.globalFacadeRoughness, 0.6),
        globalFacadeMetalness: asFinite(body.materials?.globalFacadeMetalness, 0.12),
        globalWindowRoughness: asFinite(body.materials?.globalWindowRoughness, 0.6),
        globalWindowMetalness: asFinite(body.materials?.globalWindowMetalness, 0.12),
        overrides,
      };

      const environment = {
        backgroundColor: hexLit(asHexNumber(body.environment?.backgroundColor, 0x1c1d22)),
        fogStart: asFinite(body.environment?.fogStart, 15),
        fogEnd: asFinite(body.environment?.fogEnd, 110),
      };

      const renderer = {
        toneMappingExposure: asFinite(body.renderer?.toneMappingExposure, 1.15),
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
          packet: hexLit(asHexNumber(rawStory.colors?.packet, 0x57cdff)),
          resolved: hexLit(asHexNumber(rawStory.colors?.resolved, 0x0e94fb)),
          hubPulse: hexLit(asHexNumber(rawStory.colors?.hubPulse, 0x57cdff)),
          chipNeed: hexLit(asHexNumber(rawStory.colors?.chipNeed, 0xe0a01a)),
          chipResolved: hexLit(asHexNumber(rawStory.colors?.chipResolved, 0x0e94fb)),
        },
        clients: rawClients.map((client, index) => ({
          id: sanitizeId(client?.id, `client_${index + 1}`),
          building: sanitizeText(client?.building, `Building ${index + 1}`, 80),
          need: sanitizeText(client?.need, '', 160),
          appear: asFinite(client?.appear, 0.1),
          dispatch: asFinite(client?.dispatch, 0.16),
          arrive: asFinite(client?.arrive, 0.24),
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
  appear: number;
  dispatch: number;
  arrive: number;
}

export interface StoryCaptionConfig {
  id: string;
  text: string;
  range: [number, number];
}

export interface StoryColors {
  need: number;
  packet: number;
  resolved: number;
  hubPulse: number;
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
}

export const STORY_FRAME_EVENT = 'rastaak-story-frame';

export const STORY_CONFIG: StoryConfig = ${emit(story, 0)};

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

export function applyStoryTheme(root: HTMLElement | null = typeof document === 'undefined' ? null : document.documentElement) {
  if (!root) return;
  const colors = STORY_CONFIG.colors;
  root.style.setProperty('--story-chip-need', hexCss(colors.chipNeed ?? colors.need));
  root.style.setProperty('--story-chip-resolved', hexCss(colors.chipResolved ?? colors.resolved));
}
`;
      fs.writeFileSync(storyPath, storyCode, 'utf8');
    }

    if (Array.isArray(body.flowSteps)) {
      const steps = body.flowSteps.map((step, index) => ({
        num: sanitizeText(step?.num, String(index + 1).padStart(2, '0'), 8),
        title: sanitizeText(step?.title, '', 160),
        subtitle: sanitizeText(step?.subtitle, '', 240),
        caption: sanitizeText(step?.caption, '', 600),
        progressRange: [
          asFinite(Array.isArray(step?.progressRange) ? step.progressRange[0] : 0, 0),
          asFinite(Array.isArray(step?.progressRange) ? step.progressRange[1] : 1, 1),
        ],
      }));

      const flowPath = path.join(rootDir, 'components', 'home', 'flowConfig.ts');
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

export const FLOW_CONFIG: FlowStepConfig[] = ${emit(steps, 0)};
`;
      fs.writeFileSync(flowPath, flowCode, 'utf8');
    }

    return NextResponse.json({
      success: true,
      message: 'Config saved to sceneConfig.ts, lightingConfig.ts, storyConfig.ts, and flowConfig.ts',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save config';
    console.error('Failed to save studio config:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
