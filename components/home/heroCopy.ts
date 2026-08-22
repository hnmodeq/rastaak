/**
 * Homepage hero copy — source of truth for title, subtitle, and scroll hint.
 * Saved automatically from 3D Studio.
 */

export interface HeroCopyConfig {
  titleLine1: string;
  titleLine2: string;
  titleColor: number;
  subtitleLine1: string;
  subtitleLine2: string;
  subtitleColor: number;
  scrollHint: string;
  scrollHintColor: number;
}

export const HERO_COPY: HeroCopyConfig = {
  titleLine1: 'The New Standard',
  titleLine2: 'in Staffing',
  titleColor: 0xf5f5f2,
  subtitleLine1: 'AI driven speed. Expert curation.',
  subtitleLine2:
    'We mobilize verified crews to protect your schedule and your bottom line in high-consequence environments.',
  subtitleColor: 0xe8e8e4,
  scrollHint: 'scroll to discover our process',
  scrollHintColor: 0xf5f5f2,
};

function hexCss(value: number): string {
  return '#' + (value >>> 0).toString(16).padStart(6, '0');
}

export function applyHeroCopy() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--hero-title-color', hexCss(HERO_COPY.titleColor));
  root.style.setProperty('--hero-subtitle-color', hexCss(HERO_COPY.subtitleColor));
  root.style.setProperty('--hero-scroll-color', hexCss(HERO_COPY.scrollHintColor));

  const title = document.querySelector<HTMLElement>('.hero__title');
  if (title) {
    const lines = [HERO_COPY.titleLine1, HERO_COPY.titleLine2].filter((line) => line.trim().length > 0);
    title.innerHTML = lines.map((line) => `<span>${escapeHtml(line)}</span>`).join('');
  }

  const subtitle = document.querySelector<HTMLElement>('.hero__subtitle');
  if (subtitle) {
    const first = HERO_COPY.subtitleLine1.trim();
    const second = HERO_COPY.subtitleLine2.trim();
    subtitle.innerHTML =
      (first ? `<span>${escapeHtml(first)}${second ? '<br class="sp" />' : ''}</span>` : '') +
      (second ? `<span>${escapeHtml(second)}</span>` : '');
  }

  const hint = document.querySelector<HTMLElement>('.hsbtn-in');
  if (hint) hint.textContent = ` ${HERO_COPY.scrollHint} `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
