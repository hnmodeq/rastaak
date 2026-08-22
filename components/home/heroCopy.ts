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
  titleLine1: "از آنچه برایتان مهم است،",
  titleLine2: "محافظت کنید.",
  titleColor: 0xffffff,
  subtitleLine1: "یک خرابی کافی است تا سال‌ها اطلاعات در چند دقیقه از بین برود.",
  subtitleLine2: "",
  subtitleColor: 0xffffff,
  scrollHint: "اسکرول کنید",
  scrollHintColor: 0xf5f5f2
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

