/**
 * Homepage 3D story — source of truth.
 * Camera stops live in sceneConfig.ts and are framed in 3D Studio.
 * Timings are progress 0..1 across the transparent hero + flow runway.
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

export const STORY_CONFIG: StoryConfig = {
  hub: 'Rastaak Building',
  logo: 'Logo',
  colors: {
    need: 0xe0a01a,
    packet: 0x57cdff,
    resolved: 0x0e94fb,
    hubPulse: 0x57cdff,
    chipNeed: 0xe0a01a,
    chipResolved: 0x0e94fb,
  },
  clients: [
    {
      id: 'hyper',
      building: 'Hyper Market Building',
      need: '۲ ترابایت فضای ذخیره',
      appear: 0.14,
      dispatch: 0.2,
      arrive: 0.3,
    },
    {
      id: 'b7',
      building: 'Building 7',
      need: 'سرور ۲۴ سینی',
      appear: 0.4,
      dispatch: 0.46,
      arrive: 0.56,
    },
    {
      id: 'b30',
      building: 'Building 30',
      need: 'شبکه ۱۰ گیگابیت',
      appear: 0.58,
      dispatch: 0.64,
      arrive: 0.72,
    },
    {
      id: 'b34',
      building: 'Building 34',
      need: 'SSD سازمانی',
      appear: 0.72,
      dispatch: 0.78,
      arrive: 0.86,
    },
  ],
  captions: [
    { id: 'city', text: 'زیرساخت شهر', range: [0.0, 0.12] },
    { id: 'request', text: 'درخواست ثبت شد', range: [0.12, 0.32] },
    { id: 'answer', text: 'رستاک پاسخ می‌دهد', range: [0.32, 0.48] },
    { id: 'network', text: 'یک مرکز، چند سایت', range: [0.48, 0.78] },
    { id: 'done', text: 'زیرساخت، نصب شد', range: [0.78, 1.01] },
  ],
  chipHoldAfterArrive: 0.14,
  captionFadeIn: 0.06,
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

/** Pushes story colors into CSS variables used by chips / ticks. */
export function applyStoryTheme(root: HTMLElement | null = typeof document === 'undefined' ? null : document.documentElement) {
  if (!root) return;
  const colors = STORY_CONFIG.colors;
  root.style.setProperty('--story-chip-need', hexCss(colors.chipNeed ?? colors.need));
  root.style.setProperty('--story-chip-resolved', hexCss(colors.chipResolved ?? colors.resolved));
}
