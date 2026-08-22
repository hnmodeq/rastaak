'use client';

import { useEffect } from 'react';

/**
 * Homepage hero motion. Owns title/subtitle pose so the legacy GSAP
 * timeline cannot jump them with xPercent: -50.
 */
export function HeroScrollMotion() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('.hero');
    const title = hero?.querySelector<HTMLElement>('.hero__title');
    const subtitle = hero?.querySelector<HTMLElement>('.hero__subtitle');
    if (!hero || !title || !subtitle) return;

    hero.classList.add('hero--motion');

    const kill = (el: HTMLElement) => {
      const gsap = (window as unknown as { gsap?: { killTweensOf?: (target: Element) => void } }).gsap;
      gsap?.killTweensOf?.(el);
    };

    const poseOf = (ease: number, y: number) =>
      `perspective(1000px) translate3d(${222.2 * ease}px, ${y * ease}px, 0) rotateY(${-60 * ease}deg) rotateX(${-35 * ease}deg)`;

    const set = (el: HTMLElement, opacity: string, transform: string) => {
      kill(el);
      if (el.style.transition !== 'none') el.style.setProperty('transition', 'none', 'important');
      if (el.style.opacity !== opacity) el.style.setProperty('opacity', opacity, 'important');
      if (el.style.transform !== transform) el.style.setProperty('transform', transform, 'important');
    };

    const apply = () => {
      const limit = Math.max(window.innerHeight * 0.4, 1);
      const t = Math.max(0, Math.min(1, window.scrollY / limit));
      const ease = t * t * (3 - 2 * t);
      const shown = hero.classList.contains('show');
      hero.classList.toggle(
        'hide',
        window.matchMedia('(max-width: 820px)').matches ? window.scrollY > 0 : t > 0.15,
      );
      if (!shown) {
        set(title, '0', poseOf(0, -88));
        set(subtitle, '0', poseOf(0, -200));
        return;
      }
      set(title, String(1 - ease), poseOf(ease, -88));
      set(subtitle, String(1 - ease), poseOf(ease, -200));
    };

    let frame = 0;
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(() => {
        frame = 0;
        apply();
      });
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', apply);
    const watcher = new MutationObserver(apply);
    watcher.observe(hero, { attributes: true, attributeFilter: ['class'] });

    return () => {
      watcher.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', apply);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
