/**
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

export const LOADER_CONFIG: LoaderScreenConfig = {
  title: "هونامیک ارتباط رستاک",
  subtitle: "ارائه دهنده تجهیزات ذخیره‌سازی داده",
  dir: "rtl",
  logoSide: "right",
  showLogo: true,
  showTitle: true,
  showSubtitle: true,
  showBar: true,
  logoSize: 80,
  rowGap: 0,
  copyGap: 6,
  stackGap: 8,
  titleSize: 28,
  titleWeight: 800,
  titleColor: 0xffffff,
  titleTracking: -0.3,
  subtitleSize: 17,
  subtitleWeight: 400,
  subtitleColor: 0xb4b8c0,
  subtitleTracking: 0,
  barWidth: 268,
  barHeight: 2,
  barColor: 0x57cdff,
  trackColor: 0xffffff,
  trackOpacity: 0.38,
  bgColor: 0x1c1d22
};

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

export function applyLoaderChrome(root: HTMLElement | null = typeof document === 'undefined' ? null : document.getElementById('loader')) {
  if (typeof document === 'undefined') return;
  const loader = root ?? document.getElementById('loader');
  const host = loader ?? document.documentElement;
  if (!host) return;
  const cfg = LOADER_CONFIG;
  host.style.setProperty('--loader-bg', hexCss(cfg.bgColor));
  host.style.setProperty('--loader-logo-size', cfg.logoSize + 'px');
  host.style.setProperty('--loader-row-gap', cfg.rowGap + 'px');
  host.style.setProperty('--loader-copy-gap', cfg.copyGap + 'px');
  host.style.setProperty('--loader-stack-gap', cfg.stackGap + 'px');
  host.style.setProperty('--loader-title-size', cfg.titleSize + 'px');
  host.style.setProperty('--loader-title-weight', String(cfg.titleWeight));
  host.style.setProperty('--loader-title-color', hexCss(cfg.titleColor));
  host.style.setProperty('--loader-title-tracking', cfg.titleTracking + 'px');
  host.style.setProperty('--loader-subtitle-size', cfg.subtitleSize + 'px');
  host.style.setProperty('--loader-subtitle-weight', String(cfg.subtitleWeight));
  host.style.setProperty('--loader-subtitle-color', hexCss(cfg.subtitleColor));
  host.style.setProperty('--loader-subtitle-tracking', cfg.subtitleTracking + 'px');
  host.style.setProperty('--loader-bar-width', cfg.barWidth + 'px');
  host.style.setProperty('--loader-bar-height', cfg.barHeight + 'px');
  host.style.setProperty('--loader-bar-color', hexCss(cfg.barColor));
  host.style.setProperty('--loader-track-color', hexToRgba(cfg.trackColor, cfg.trackOpacity));
  if (!loader) return;
  loader.setAttribute('dir', cfg.dir === 'ltr' ? 'ltr' : 'rtl');
  const row = loader.querySelector<HTMLElement>('.loader__row');
  if (row) row.dataset.logoSide = cfg.logoSide === 'right' ? 'right' : 'left';

  const title = loader.querySelector<HTMLElement>('.loader__title');
  if (title && title.textContent !== cfg.title) title.textContent = cfg.title;
  const subtitle = loader.querySelector<HTMLElement>('.loader__subtitle');
  if (subtitle && subtitle.textContent !== cfg.subtitle) subtitle.textContent = cfg.subtitle;
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
