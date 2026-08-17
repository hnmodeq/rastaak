'use client';

import { useEffect } from 'react';

/**
 * HeroSceneBoot
 *
 * Runs *before* the legacy Astro bundle boots on the homepage and suppresses
 * the legacy WebGL scene while keeping page scroll and route navigation unlocked.
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

    const reveal = () => {
      const root =
        document.querySelector('main[data-taxi] [data-taxi-view]') ?? document;

      root
        .querySelectorAll<HTMLElement>(
          '.hero .hero__title, .hero .hero__subtitle, .hero .hsbtn-in'
        )
        .forEach((el) => {
          el.style.removeProperty('opacity');
          el.style.removeProperty('transform');
        });

      root
        .querySelectorAll(
          '.sub-hero, .sub-hero-image, .request-crew, .apply-section, .hero, ' +
            '.privacy-layout, .sub-section, .accordion-drawer, ' +
            '.stat-carousel-section, .industries-title, .industry-section'
        )
        .forEach((el) => el.classList.add('show'));

      document.querySelector('header')?.classList.add('show');
      html.classList.remove('lenis-stopped');
    };

    reveal();
    const initialTimer = window.setTimeout(reveal, 400);

    let settleTimer = 0;
    const observer = new MutationObserver(() => {
      if (html.classList.contains('lenis-stopped')) reveal();

      if (html.classList.contains('lenis') && !settleTimer) {
        settleTimer = window.setTimeout(() => {
          reveal();
          stopIntercepting();
        }, 1200);
      }
    });

    observer.observe(html, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    const maxTimer = window.setTimeout(() => {
      reveal();
      stopIntercepting();
    }, 20000);

    const onPageShow = () => reveal();
    window.addEventListener('pageshow', onPageShow);

    return () => {
      observer.disconnect();
      window.clearTimeout(initialTimer);
      window.clearTimeout(settleTimer);
      window.clearTimeout(maxTimer);
      window.removeEventListener('pageshow', onPageShow);
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
