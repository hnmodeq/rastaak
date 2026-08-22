'use client';

import { useEffect } from 'react';

/**
 * Homepage hero motion: title and subtitle rotate / fade out on the first
 * scroll. Owns transform/opacity exclusively so CommonScripts cannot jump them.
 */
export function HeroScrollMotion() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('.hero');
    const title = hero?.querySelector<HTMLElement>('.hero__title');
    const subtitle = hero?.querySelector<HTMLElement>('.hero__subtitle');
    if (!hero || !title || !subtitle) return;

    hero.classList.add('hero--motion');

    const killTweens = (el: HTMLElement) => {
      const gsap = (window as unknown as { gsap?: { killTweensOf?: (target: Element) => void } }).gsap;
      gsap?.killTweensOf?.(el);
    };

    const poseOf = (ease: number, y: number) =>
      `perspective(1000px) translate3d(${222.2 * ease}px, ${y * ease}px, 0) ` +
      `rotateY(${-60 * ease}deg) rotateX(${-35 * ease}deg)`;

    const paint = (el: HTMLElement, opacity: string, transform: string) => {
      killTweens(el);
      el.style.setProperty('transition', 'none', 'important');
      el.style.setProperty('opacity', opacity, 'important');
      el.style.setProperty('transform', transform, 'important');
    };

    const apply = () => {
      const limit = window.innerHeight * 0.4;
      const t = Math.max(0, Math.min(1, window.scrollY / Math.max(limit, 1)));
      const ease = t * t * (3 - 2 * t);
      const shown = hero.classList.contains('show');

      hero.classList.toggle(
        'hide',
        window.matchMedia('(max-width: 820px)').matches ? window.scrollY > 0 : t > 0.15,
      );

      if (!shown) {
        paint(title, '0', poseOf(0, -88));
        paint(subtitle, '0', poseOf(0, -200));
        return;
      }

      paint(title, String(1 - ease), poseOf(ease, -88));
      paint(subtitle, String(1 - ease), poseOf(ease, -200));
    };

    let frame = 0;
    let alive = true;

    const tick = () => {
      frame = 0;
      apply();
      if (alive && window.scrollY < window.innerHeight) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    const kick = () => {
      if (!frame) frame = window.requestAnimationFrame(tick);
    };

    apply();
    kick();

    const showWatcher = new MutationObserver(kick);
    showWatcher.observe(hero, { attributes: true, attributeFilter: ['class'] });

    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);

    return () => {
      alive = false;
      showWatcher.disconnect();
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', kick);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
