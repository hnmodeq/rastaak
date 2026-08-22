'use client';

import { useEffect } from 'react';

/**
 * Original homepage hero motion: the title and subtitle rotate / fade out
 * over the first ~40% of the viewport as the user starts scrolling.
 */
export function HeroScrollMotion() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('.hero');
    const title = hero?.querySelector<HTMLElement>('.hero__title');
    const subtitle = hero?.querySelector<HTMLElement>('.hero__subtitle');
    if (!hero || !title || !subtitle) return;

    let frame = 0;
    let armed = false;

    const apply = () => {
      frame = 0;
      if (!armed || !hero.classList.contains('show')) return;

      title.style.transition = 'none';
      subtitle.style.transition = 'none';

      const limit = window.innerHeight * 0.4;
      const t = Math.max(0, Math.min(1, window.scrollY / Math.max(limit, 1)));
      const ease = t * t * (3 - 2 * t);

      const setPose = (el: HTMLElement, y: number) => {
        el.style.opacity = String(1 - ease);
        el.style.transform =
          `perspective(1000px) translateX(${-50 * ease}%) ` +
          `translate3d(${222.2 * ease}px, ${y * ease}px, 0) ` +
          `rotateY(${-60 * ease}deg) rotateX(${-35 * ease}deg)`;
      };

      setPose(title, -88);
      setPose(subtitle, -200);
      hero.classList.toggle(
        'hide',
        window.matchMedia('(max-width: 820px)').matches ? window.scrollY > 0 : t > 0.15,
      );
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(apply);
    };

    const armTimer = window.setTimeout(() => {
      armed = true;
      apply();
    }, 900);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', apply);

    return () => {
      window.clearTimeout(armTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', apply);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
