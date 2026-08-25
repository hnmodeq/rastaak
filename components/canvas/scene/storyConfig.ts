/**
 * Homepage 3D story — source of truth.
 * Saved automatically from 3D Studio.
 */

export type StoryBuildingState = 'idle' | 'need' | 'resolved';

export interface StoryClientConfig {
  id: string;
  /** Stable GLB object name used for lookup. */
  building: string;
  /** Human-facing name shown in Studio and the timeline. */
  label?: string;
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

/** The solved state begins when the shooting clip reaches the building. */
export function resolveAt(client: { appear: number; arrive: number }): number {
  return Math.min(1, Math.max(client.appear, client.arrive));
}

export function storyBuildingLabel(client: { building: string; label?: string }): string {
  return client.label?.trim() || client.building;
}

export const STORY_FRAME_EVENT = 'rastaak-story-frame';

export const STORY_CONFIG: StoryConfig = {
  hub: "Rastaak Building",
  logo: "Logo",
  colors: {
    need: 0x000000,
    needWindow: 0x4b1212,
    packet: 0x010492,
    packetBounce: 0x10006c,
    packetCore: 0x010492,
    packetInner: 0xffffff,
    packetOuter: 0xffffff,
    packetSpark: 0x000000,
    resolved: 0x000124,
    resolvedWindow: 0x6e6e6e,
    hubPulse: 0x000124,
    hubPulseWindow: 0x6e6e6e,
    chipNeed: 0xfb0000,
    chipResolved: 0x229afd
  },
  clients: [
    {
      id: "hyper",
      building: "Hyper Market Building",
      label: "Hyper Market",
      need: "به 200 ترابایت فضای ذخیره‌سازی امن نیاز داریم!",
      needAfter: "انجام شد.",
      appear: 0.831748,
      dispatch: 0.899524,
      arrive: 0.953032,
      resolve: 0.402908,
      needEnd: 1,
      land: [0, 0, 0],
      launch: [0, 0, 0],
      needOffset: [0.35, -0.25, 0.2]
    },
    {
      id: "b7",
      building: "Building 7",
      label: "Government Organization",
      need: "به یه زیرساخت با سرعت 200 ترابیت در ثانیه نیاز داریم!",
      needAfter: "انجام شد.",
      appear: 0.041745,
      dispatch: 0.086965,
      arrive: 0.156956,
      resolve: 0.56,
      needEnd: 0.25,
      land: [0, 0, 0],
      launch: [0, 0, 0],
      needOffset: [0.05, -0.35, 0]
    },
    {
      id: "b30",
      building: "Building 30",
      label: "Bank",
      need: "به یک بایگانی داده تا 3 هزار زتابایت نیاز داریم!",
      needAfter: "انجام شد.",
      appear: 0.393579,
      dispatch: 0.440547,
      arrive: 0.499405,
      resolve: 0.72,
      needEnd: 0.552319,
      land: [0, 0, 0],
      launch: [0, 0, 0],
      needOffset: [0, 0, 0]
    },
    {
      id: "b34",
      building: "Building 34",
      label: "Company",
      need: "به زیرساخت ابری داخلی با پایین‌ترین ضریب خطر نیاز داریم!",
      needAfter: "انجام شد.",
      appear: 0.565422,
      dispatch: 0.625422,
      arrive: 0.693817,
      resolve: 0.86,
      needEnd: 0.767539,
      land: [0, 0, 0],
      launch: [0, 0, 0],
      needOffset: [0, 0, 0]
    }
  ],
  captions: [
    {
      id: "city",
      text: "زیرساخت شهر",
      range: [0, 0.12]
    },
    {
      id: "request",
      text: "درخواست ثبت شد",
      range: [0.12, 0.32]
    },
    {
      id: "answer",
      text: "رستاک پاسخ می‌دهد",
      range: [0.32, 0.48]
    },
    {
      id: "network",
      text: "یک مرکز، چند سایت",
      range: [0.48, 0.78]
    },
    {
      id: "done",
      text: "زیرساخت، نصب شد",
      range: [0.78, 1.01]
    }
  ],
  chipHoldAfterArrive: 0.14,
  captionFadeIn: 0.06,
  packetIntensity: 235,
  packetDistance: 1,
  packetGlow: 2,
  packetGlowSize: 0.04,
  packetCoreSize: 0.095,
  packetTrail: 1,
  burstDelay: 0,
  burstSpan: 0.035,
  burstLight: 0.45,
  burstLightRadius: 2.8,
  burstSize: 0.4,
  burstExposure: 0.65,
  burstSparks: 0.7,
  chipBorder: 0x0424ff,
  chipBorderOpacity: 0,
  chipBackground: 0x14151a,
  chipBackgroundOpacity: 0,
  chipText: 0xf5f5f2,
  chipMaxWidth: 680
};

export function needEndAt(client: { appear: number; arrive: number; needEnd?: number }): number {
  if (typeof client.needEnd === 'number' && Number.isFinite(client.needEnd)) {
    return Math.min(1, Math.max(client.appear, client.needEnd));
  }
  return Math.min(1, Math.max(client.appear, client.arrive + Math.max(0, STORY_CONFIG.chipHoldAfterArrive || 0)));
}

export function needTitleAt(
  client: { need: string; needAfter?: string; arrive: number },
  t: number,
): string {
  const after = client.needAfter;
  if (typeof after === 'string' && after.trim() && t >= client.arrive) {
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
