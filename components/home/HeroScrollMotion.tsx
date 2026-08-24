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

    const enterPose =
      'perspective(1000px) translate3d(-72px, 32px, 0) rotateY(24deg) rotateX(14deg)';
    const restPose = poseOf(0, 0);
    const easeCss = 'cubic-bezier(0.16, 1, 0.3, 1)';

    const setHard = (el: HTMLElement, opacity: string, transform: string) => {
      kill(el);
      el.style.setProperty('transition', 'none', 'important');
      el.style.setProperty('opacity', opacity, 'important');
      el.style.setProperty('transform', transform, 'important');
    };

    let introDone = false;
    let introTimer = 0;

    const startIntro = () => {
      if (introDone || introTimer) return;
      setHard(title, '0', enterPose);
      setHard(subtitle, '0', enterPose);
      void title.offsetWidth;
      void subtitle.offsetWidth;
      title.style.setProperty(
        'transition',
        `opacity 1.15s ${easeCss}, transform 1.15s ${easeCss}`,
        'important',
      );
      subtitle.style.setProperty(
        'transition',
        `opacity 1.25s ${easeCss} 0.28s, transform 1.25s ${easeCss} 0.28s`,
        'important',
      );
      title.style.setProperty('opacity', '1', 'important');
      title.style.setProperty('transform', restPose, 'important');
      subtitle.style.setProperty('opacity', '1', 'important');
      subtitle.style.setProperty('transform', restPose, 'important');
      introTimer = window.setTimeout(() => {
        introDone = true;
        introTimer = 0;
        apply();
      }, 1680);
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
        if (introTimer) {
          window.clearTimeout(introTimer);
          introTimer = 0;
        }
        introDone = false;
        setHard(title, '0', enterPose);
        setHard(subtitle, '0', enterPose);
        return;
      }
      if (t > 0.04) {
        if (introTimer) {
          window.clearTimeout(introTimer);
          introTimer = 0;
        }
        introDone = true;
      }
      if (!introDone) {
        startIntro();
        return;
      }
      setHard(title, String(1 - ease), poseOf(ease, -88));
      setHard(subtitle, String(1 - ease), poseOf(ease, -200));
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
      if (introTimer) window.clearTimeout(introTimer);
    };
  }, []);

  return null;
}
