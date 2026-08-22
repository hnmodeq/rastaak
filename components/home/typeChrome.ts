/**
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

export const TYPE_CHROME: TypeChromeConfig = {
  siteName: "هونامیک ارتباط رستاک",
  siteNameColor: 0x555555,
  studioCorner: "top-left",
  heroTitle: {
    size: 119,
    weight: 700,
    shadowColor: 0x000000,
    shadowOpacity: 0.39,
    shadowBlur: 9,
    shadowX: 7.5,
    shadowY: 6.5
  },
  heroSubtitle: {
    size: 22,
    weight: 400,
    shadowColor: 0x000000,
    shadowOpacity: 0.64,
    shadowBlur: 4,
    shadowX: 2,
    shadowY: 3.5
  },
  scrollHint: {
    size: 14,
    weight: 400,
    shadowColor: 0x000000,
    shadowOpacity: 0.09,
    shadowBlur: 0,
    shadowX: 0,
    shadowY: 0
  },
  flowTitle: {
    size: 24,
    weight: 500,
    shadowColor: 0x000000,
    shadowOpacity: 0,
    shadowBlur: 8.5,
    shadowX: 1.5,
    shadowY: 2
  },
  flowNumber: {
    size: 14,
    weight: 500,
    shadowColor: 0x000000,
    shadowOpacity: 0,
    shadowBlur: 0,
    shadowX: 0,
    shadowY: 0
  },
  flowDescription: {
    size: 18,
    weight: 400,
    shadowColor: 0x000000,
    shadowOpacity: 1,
    shadowBlur: 2.5,
    shadowX: 1.5,
    shadowY: 0.5
  },
  chipText: {
    size: 8,
    weight: 600,
    shadowColor: 0x000000,
    shadowOpacity: 0,
    shadowBlur: 0,
    shadowX: 0,
    shadowY: 0
  },
  siteNameType: {
    size: 46,
    weight: 800,
    shadowColor: 0x272727,
    shadowOpacity: 0,
    shadowBlur: 1.5,
    shadowX: 3,
    shadowY: 1.5
  }
};

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
