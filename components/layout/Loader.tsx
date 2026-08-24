'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { tokens } from '@/tokens/design-tokens';
import { TYPE_CHROME } from '@/components/home/typeChrome';

const HOME_SAFETY_MS = 28000;
const INNER_PAGE_MS = 420;
const MIN_SHOW_MS = 640;
const FADE_MS = 520;

export const Loader: React.FC = () => {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const home = pathname === '/';
    const skip =
      Boolean(pathname?.startsWith('/admin')) || Boolean(pathname?.startsWith('/token-studio'));

    if (skip) {
      html.classList.remove('rastaak-loading');
      setIsDone(true);
      setIsFading(false);
      return;
    }

    if (!home && isDone) return;

    let target = home ? 4 : 30;
    let displayed = 0;
    let ready = !home;
    let dismissed = false;
    let raf = 0;
    const startedAt = performance.now();

    html.classList.add('rastaak-loading');
    html.removeAttribute('data-scene-ready');
    setIsDone(false);
    setIsFading(false);
    setProgress(0);

    const markReady = () => {
      ready = true;
      target = 100;
    };

    const handleProgress = (event: Event) => {
      const value = (event as CustomEvent<{ progress?: number }>).detail?.progress;
      if (typeof value !== 'number' || !Number.isFinite(value)) return;
      target = Math.max(target, Math.min(ready ? 100 : 94, value));
      if (value >= 100) markReady();
    };

    window.addEventListener('rastaak-load-progress', handleProgress);
    window.addEventListener('rastaak-scene-ready', markReady);

    const creep = window.setInterval(() => {
      if (ready) return;
      target = Math.min(home ? 62 : 90, target + (home ? 0.7 : 10));
    }, 140);

    const safety = window.setTimeout(markReady, home ? HOME_SAFETY_MS : INNER_PAGE_MS);

    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      setProgress(100);
      setIsFading(true);
      window.setTimeout(() => {
        html.classList.remove('rastaak-loading');
        html.dataset.sceneReady = 'true';
        document.body.style.overflow = '';
        window.dispatchEvent(new CustomEvent('rastaak-loader-done'));
        setIsDone(true);
      }, FADE_MS);
    };

    const tick = () => {
      displayed =
        displayed < target ? Math.min(100, displayed + Math.max(0.45, (target - displayed) * 0.13)) : displayed;
      setProgress(Math.round(displayed));
      if (ready && displayed >= 99.2 && performance.now() - startedAt >= MIN_SHOW_MS) {
        dismiss();
        return;
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('rastaak-load-progress', handleProgress);
      window.removeEventListener('rastaak-scene-ready', markReady);
      window.clearInterval(creep);
      window.clearTimeout(safety);
      window.cancelAnimationFrame(raf);
    };
    // isDone is read only to keep inner-page visits from flashing the loader again
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (isDone) return null;

  return (
    <div
      id="loader"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        backgroundColor: tokens.colors.bgHero,
        opacity: isFading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 22,
          padding: '0 24px',
          maxWidth: 520,
          textAlign: 'center',
        }}
      >
        <img
          className="loader__mark"
          src="/icons/icon-192x192.png"
          alt=""
          width={88}
          height={88}
          decoding="async"
        />
        <div
          className="loader__title"
          dir="rtl"
          style={{
            fontFamily: "'Kalameh', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(22px, 5vw, 34px)',
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            color: tokens.colors.textLight,
          }}
        >
          {TYPE_CHROME.siteName}
        </div>
        <div
          style={{
            width: 'min(220px, 62vw)',
            height: 3,
            borderRadius: 999,
            overflow: 'hidden',
            backgroundColor: tokens.colors.overlayGlass15,
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              borderRadius: 999,
              backgroundColor: tokens.colors.primaryLight,
              transition: 'width 160ms linear',
            }}
          />
        </div>
      </div>
    </div>
  );
};
