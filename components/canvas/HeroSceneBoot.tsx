'use client';

import { useEffect } from 'react';

/**
 * Suppress the legacy WebGL scene on `/` without fighting the original
 * homepage title / section animations.
 */
export const HeroSceneBoot: React.FC = () => {
  useEffect(() => {
    if (window.location.pathname !== '/') return;

    const html = document.documentElement;
    const style = document.body.style;
    const proto = Object.getPrototypeOf(style) as CSSStyleDeclaration;
    const nativeDescriptor = Object.getOwnPropertyDescriptor(proto, 'overflow');

    try {
      sessionStorage.setItem('vectr-loader-reload-once', '1');
    } catch {
      /* sessionStorage unavailable */
    }

    let intercepting = true;
    Object.defineProperty(style, 'overflow', {
      configurable: true,
      get: () => (intercepting ? '' : nativeDescriptor?.get?.call(style) ?? ''),
      set: (value: string) => {
        if (intercepting && value === 'hidden') return;
        nativeDescriptor?.set?.call(style, value);
      },
    });

    const stopIntercepting = () => {
      if (!intercepting) return;
      intercepting = false;
      delete (style as unknown as Record<string, unknown>).overflow;
      style.overflow = '';
      html.classList.remove('lenis-stopped');
    };

    let revealedHeroCopy = false;
    const revealOnce = () => {
      const root =
        document.querySelector('main[data-taxi] [data-taxi-view]') ?? document;

      // Do not strip hero title/subtitle poses — HeroScrollMotion owns those.
      if (!revealedHeroCopy) {
        revealedHeroCopy = true;
        root.querySelectorAll<HTMLElement>('.hero .hsbtn-in').forEach((el) => {
          el.style.removeProperty('opacity');
          el.style.removeProperty('transform');
        });
      }

      root
        .querySelectorAll(
          '.sub-hero, .sub-hero-image, .request-crew, .apply-section, .hero, ' +
            '.privacy-layout, .sub-section, .accordion-drawer, ' +
            '.stat-carousel-section, .industries-title, .industry-section',
        )
        .forEach((el) => el.classList.add('show'));

      document.querySelector('header')?.classList.add('show');
      html.classList.remove('lenis-stopped');
    };

    revealOnce();
    const initialTimer = window.setTimeout(revealOnce, 400);
    const unlockTimer = window.setTimeout(stopIntercepting, 1600);

    const observer = new MutationObserver(() => {
      if (html.classList.contains('lenis-stopped')) {
        html.classList.remove('lenis-stopped');
        style.overflow = '';
      }
    });
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });

    return () => {
      observer.disconnect();
      window.clearTimeout(initialTimer);
      window.clearTimeout(unlockTimer);
      stopIntercepting();
    };
  }, []);

  return (
    <canvas
      data-hero-sentinel="true"
      width={1}
      height={1}
      aria-hidden="true"
      style={{ display: 'none' }}
    />
  );
};
