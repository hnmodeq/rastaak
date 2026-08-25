'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  LOADER_CHANGED_EVENT,
  LOADER_CONFIG,
  LOADER_PREVIEW_EVENT,
  applyLoaderChrome,
  hexCss,
  hexToRgba,
  loaderChromeVars,
} from '@/components/home/loaderConfig';

const HOME_SAFETY_MS = 28000;
const INNER_PAGE_MS = 420;
const MIN_SHOW_MS = 640;
const FADE_MS = 520;

export const Loader: React.FC = () => {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [rev, setRev] = useState(0);
  const previewRef = useRef(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    applyLoaderChrome(rootRef.current);
  }, [rev, isDone, previewing]);

  useEffect(() => {
    const onChanged = () => setRev((value) => value + 1);
    const onPreview = (event: Event) => {
      const open = (event as CustomEvent<{ open?: boolean }>).detail?.open !== false;
      previewRef.current = open;
      setPreviewing(open);
      if (open) {
        setIsDone(false);
        setIsFading(false);
        setProgress((prev) => (prev > 8 ? prev : 64));
      } else if (document.documentElement.dataset.sceneReady === 'true') {
        setIsFading(true);
        window.setTimeout(() => {
          if (!previewRef.current) setIsDone(true);
        }, FADE_MS);
      }
    };
    window.addEventListener(LOADER_CHANGED_EVENT, onChanged);
    window.addEventListener(LOADER_PREVIEW_EVENT, onPreview);
    return () => {
      window.removeEventListener(LOADER_CHANGED_EVENT, onChanged);
      window.removeEventListener(LOADER_PREVIEW_EVENT, onPreview);
    };
  }, []);

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
      if (dismissed || previewRef.current) return;
      dismissed = true;
      setProgress(100);
      setIsFading(true);
      window.setTimeout(() => {
        if (previewRef.current) return;
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

  if (isDone && !previewing) return null;

  const cfg = LOADER_CONFIG;
  const chrome = loaderChromeVars(cfg);

  return (
    <div
      id="loader"
      ref={rootRef}
      role="status"
      aria-live="polite"
      aria-busy={!previewing}
      aria-label="Loading"
      dir={cfg.dir === 'ltr' ? 'ltr' : 'rtl'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: previewing ? 'none' : 'auto',
        backgroundColor: hexCss(cfg.bgColor),
        opacity: isFading && !previewing ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        ...chrome,
      } as React.CSSProperties}
    >
      <div className="loader__cluster">
        <div className="loader__row" data-logo-side={cfg.logoSide === 'right' ? 'right' : 'left'}>
          {cfg.showLogo ? (
            <img
              className="loader__mark"
              src="/icons/loader-mark.png"
              alt=""
              height={cfg.logoSize}
              decoding="async"
            />
          ) : null}
          <div className="loader__copy">
            {cfg.showTitle ? (
              <div
                className="loader__title"
                style={{
                  fontSize: cfg.titleSize + 'px',
                  fontWeight: cfg.titleWeight,
                  letterSpacing: cfg.titleTracking + 'px',
                  color: hexCss(cfg.titleColor),
                }}
              >
                {cfg.title}
              </div>
            ) : null}
            {cfg.showSubtitle ? (
              <div
                className="loader__subtitle"
                style={{
                  fontSize: cfg.subtitleSize + 'px',
                  fontWeight: cfg.subtitleWeight,
                  letterSpacing: cfg.subtitleTracking + 'px',
                  color: hexCss(cfg.subtitleColor),
                }}
              >
                {cfg.subtitle}
              </div>
            ) : null}
          </div>
        </div>
        {cfg.showBar ? (
          <div
            className="loader__bar"
            style={{
              backgroundColor: hexToRgba(cfg.trackColor, cfg.trackOpacity),
            }}
          >
            <div
              className="loader__bar-fill"
              style={{
                width: `${progress}%`,
                backgroundColor: hexCss(cfg.barColor),
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};
