/**
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
  resolve?: number;
  land?: [number, number, number];
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
}

export function resolveAt(client: { appear: number; arrive: number; resolve?: number }): number {
  const value = client.resolve;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.min(1, Math.max(client.appear, value));
  }
  return client.arrive;
}

export const STORY_FRAME_EVENT = 'rastaak-story-frame';

export const STORY_CONFIG: StoryConfig = {
  hub: "Rastaak Building",
  logo: "Logo",
  colors: {
    need: 0x6f0000,
    needWindow: 0x000000,
    packet: 0x010492,
    packetBounce: 0x10006c,
    packetCore: 0x010492,
    packetInner: 0xffffff,
    packetOuter: 0xffffff,
    packetSpark: 0x000000,
    resolved: 0x13004a,
    resolvedWindow: 0xffffff,
    hubPulse: 0x13004a,
    hubPulseWindow: 0xffffff,
    chipNeed: 0xfb0000,
    chipResolved: 0x229afd
  },
  clients: [
    {
      id: "hyper",
      building: "Hyper Market Building",
      need: "۲ ترابایت فضای ذخیره",
      appear: 0.14,
      dispatch: 0.2,
      arrive: 0.3,
      resolve: 0.3,
      land: [0, 0, 0]
    },
    {
      id: "b7",
      building: "Building 7",
      need: "سرور ۲۴ سینی",
      appear: 0.4,
      dispatch: 0.46,
      arrive: 0.56,
      resolve: 0.56,
      land: [0, 0, 0]
    },
    {
      id: "b30",
      building: "Building 30",
      need: "شبکه ۱۰ گیگابیت",
      appear: 0.58,
      dispatch: 0.64,
      arrive: 0.72,
      resolve: 0.72,
      land: [0, 0, 0]
    },
    {
      id: "b34",
      building: "Building 34",
      need: "SSD سازمانی",
      appear: 0.72,
      dispatch: 0.78,
      arrive: 0.86,
      resolve: 0.86,
      land: [0, 0, 0]
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
  chipText: 0xf5f5f2
};

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
}
