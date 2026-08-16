'use client';

import { useEffect } from 'react';

/**
 * HeroSceneBoot
 *
 * Runs *before* the legacy Astro bundle boots on the homepage and does two
 * things, both scoped to `/` only:
 *
 * 1. Suppresses the legacy WebGL scene.
 *    The legacy home renderer's `onEnter` ends with:
 *        if (!document.querySelector("canvas")) { la({debug}) }
 *    `la()` is the entry point of the old nuclear-facility scene. By placing
 *    a canvas in the DOM first, that guard fails and the old scene never
 *    boots — while the rest of the bundle (Taxi router, mobile nav, apply
 *    modal, file uploads, footer observer, header toggle) keeps running
 *    untouched. This is why we do NOT disable ClientScripts.
 *
 * 2. Releases the loader + scroll lock, and KEEPS them released.
 *    The legacy loader only hides when the old renderer reports back
 *    ("renderedReady" / "loadEnd"). With that renderer suppressed those
 *    events never fire, so the bundle keeps #loader (a full-screen opaque
 *    overlay at z-index 100000) on screen, forces a one-time reload, and
 *    leaves the page scroll-locked. Page scroll is what drives our camera,
 *    so that must be neutralized.
 *
 * WHY THIS IS EVENT-DRIVEN AND NOT A ONE-SHOT TIMER
 * -------------------------------------------------
 * The first version revealed once on a 1400ms timer. That only works when
 * the legacy bundle has already booted by then — true on localhost, false
 * over a slow connection or a proxied preview, where `/_astro/*` can take
 * seconds. In that case the bundle boots *after* our reveal, re-shows the
 * loader, and the page is stuck behind a white overlay forever.
 *
 * So instead of guessing when the bundle boots, we observe it: a
 * MutationObserver re-applies the reveal any time something puts the loader
 * back or re-adds `lenis-stopped`. The scroll-lock interception is likewise
 * released when we actually see Lenis appear (`html.lenis`), not on a clock.
 */
export const HeroSceneBoot: React.FC = () => {
  useEffect(() => {
    if (window.location.pathname !== '/') return;

    const html = document.documentElement;
    const style = document.body.style;
    const proto = Object.getPrototypeOf(style) as CSSStyleDeclaration;
    const nativeDescriptor = Object.getOwnPropertyDescriptor(proto, 'overflow');

    // Don't let the loader's absolute-deadline path reload the page.
    try {
      sessionStorage.setItem('vectr-loader-reload-once', '1');
    } catch {
      /* sessionStorage unavailable — non-fatal */
    }

    // ── Scroll-lock interception ───────────────────────────────────────────
    // `onEnter` calls lockScroll() -> body.style.overflow = "hidden" + Lenis
    // .stop(). `onEnterCompleted` creates Lenis and only stops it when it
    // observes body.style.overflow === "hidden". Make that read return ""
    // (and swallow the write) so Lenis is never stopped.
    let intercepting = true;
    Object.defineProperty(style, 'overflow', {
      configurable: true,
      get: () => (intercepting ? '' : nativeDescriptor?.get?.call(style) ?? ''),
      set: (value: string) => {
        // Swallow the loader's lock; allow explicit unlocks through.
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

    // ── Reveal ─────────────────────────────────────────────────────────────
    // Mirrors the bundle's own Se() helper so markup/animation state matches.
    let hideTimer = 0;
    const reveal = () => {
      const loader = document.getElementById('loader');
      if (loader && loader.style.display !== 'none') {
        loader.classList.add('hide');
        window.clearTimeout(hideTimer);
        hideTimer = window.setTimeout(() => {
          loader.style.display = 'none';
        }, 700);
      }

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

    // First pass: as soon as React mounts, and again shortly after in case
    // the loader markup streams in late.
    reveal();
    const initialTimer = window.setTimeout(reveal, 400);

    // ── Keep it revealed ───────────────────────────────────────────────────
    // Re-apply whenever the legacy bundle puts the loader back or re-locks
    // scrolling. This is the part that survives a slow bundle.
    let settleTimer = 0;
    const observer = new MutationObserver(() => {
      const loader = document.getElementById('loader');
      const loaderBack =
        !!loader &&
        loader.style.display !== 'none' &&
        !loader.classList.contains('hide');

      if (loaderBack || html.classList.contains('lenis-stopped')) reveal();

      // `html.lenis` appearing means onEnterCompleted has run and Lenis
      // exists — the legacy boot is done, so the lock interception has
      // served its purpose and normal behaviour can resume.
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

    // Safety net: never intercept forever, even if Lenis never appears.
    const maxTimer = window.setTimeout(() => {
      reveal();
      stopIntercepting();
    }, 20000);

    // The loader can also be re-shown on bfcache restore / tab refocus.
    const onPageShow = () => reveal();
    window.addEventListener('pageshow', onPageShow);

    return () => {
      observer.disconnect();
      window.clearTimeout(initialTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(settleTimer);
      window.clearTimeout(maxTimer);
      window.removeEventListener('pageshow', onPageShow);
      stopIntercepting();
    };
  }, []);

  // Rendered server-side so a <canvas> exists in the very first paint,
  // before any script runs. This guarantees the legacy `onEnter` guard
  // `if (!document.querySelector("canvas"))` fails and the old
  // nuclear-facility scene never boots, without racing the async
  // three.js import that mounts the real canvas.
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
