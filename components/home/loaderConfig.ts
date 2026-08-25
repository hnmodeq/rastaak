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
  logoSize: 46,
  rowGap: 16,
  copyGap: 11,
  stackGap: 8,
  titleSize: 24,
  titleWeight: 800,
  titleColor: 0xffffff,
  titleTracking: -0.3,
  subtitleSize: 12,
  subtitleWeight: 400,
  subtitleColor: 0xb4b8c0,
  subtitleTracking: -0.7,
  barWidth: 308,
  barHeight: 2,
  barColor: 0x57cdff,
  trackColor: 0xffffff,
  trackOpacity: 0.37,
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
