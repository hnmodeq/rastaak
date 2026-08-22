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

    const killTweens = (el: HTMLElement) => {
      const gsap = (window as unknown as { gsap?: { killTweensOf?: (target: Element) => void } }).gsap;
      gsap?.killTweensOf?.(el);
    };

    let frame = 0;
    let takeover = false;
    let armTimer = 0;

    const apply = () => {
      frame = 0;

      const limit = window.innerHeight * 0.4;
      const t = Math.max(0, Math.min(1, window.scrollY / Math.max(limit, 1)));
      const ease = t * t * (3 - 2 * t);
      const shown = hero.classList.contains('show');

      hero.classList.toggle(
        'hide',
        window.matchMedia('(max-width: 820px)').matches ? window.scrollY > 0 : t > 0.15,
      );

      if (!takeover) return;

      killTweens(title);
      killTweens(subtitle);

      const setPose = (el: HTMLElement, y: number) => {
        el.style.transition = 'none';
        if (!shown) {
          el.style.opacity = '0';
          return;
        }
        el.style.opacity = String(1 - ease);
        el.style.transform =
          `perspective(1000px) translate3d(${222.2 * ease}px, ${y * ease}px, 0) ` +
          `rotateY(${-60 * ease}deg) rotateX(${-35 * ease}deg)`;
      };

      setPose(title, -88);
      setPose(subtitle, -200);
    };

    const armTakeover = () => {
      if (takeover) return;
      takeover = true;
      hero.classList.add('hero--motion');
      apply();
    };

    const onScroll = () => {
      if (window.scrollY > 2) armTakeover();
      if (!frame) frame = window.requestAnimationFrame(apply);
    };

    const scheduleArm = () => {
      if (!hero.classList.contains('show') || armTimer) return;
      armTimer = window.setTimeout(armTakeover, 1600);
    };

    apply();
    scheduleArm();
    const showWatcher = new MutationObserver(() => {
      scheduleArm();
      apply();
    });
    showWatcher.observe(hero, { attributes: true, attributeFilter: ['class'] });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', apply);

    return () => {
      showWatcher.disconnect();
      window.clearTimeout(armTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', apply);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
