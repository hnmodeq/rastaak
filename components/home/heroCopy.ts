/**
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

export const HERO_COPY: HeroCopyConfig = {
  titleLine1: "تنها یک بار اتفاق میافتد.",
  titleLine2: "",
  titleColor: 0xe1e1e1,
  titlePaddingTop: 92,
  subtitleLine1: "تنها یک خطا  کافی است، تا سال‌ها اطلاعات در یک ثانیه از بین برود.",
  subtitleLine2: "",
  subtitleColor: 0x959595,
  subtitlePaddingTop: 9,
  stackGap: 34,
  scrollHint: "پیمایش کنید",
  scrollHintColor: 0xe1e1e1
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

