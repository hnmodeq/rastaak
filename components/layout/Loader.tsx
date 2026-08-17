'use client';

import React, { useEffect, useState } from 'react';
import { tokens } from '@/tokens/design-tokens';

export const Loader: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let animId: number;
    let targetProgress = 0;

    const handleProgress = (e: Event) => {
      const customEvent = e as CustomEvent<{ progress: number }>;
      if (typeof customEvent.detail?.progress === 'number') {
        targetProgress = Math.min(100, Math.max(targetProgress, customEvent.detail.progress));
      }
    };

    window.addEventListener('rastaak-load-progress', handleProgress);

    const tick = () => {
      setProgress((prev) => {
        if (prev < targetProgress) {
          const step = Math.max(1, Math.ceil((targetProgress - prev) * 0.12));
          const next = Math.min(100, prev + step);
          if (next >= 100) {
            setTimeout(() => setIsDone(true), 500);
          }
          return next;
        }
        return prev;
      });
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    const timer1 = setTimeout(() => { targetProgress = Math.max(targetProgress, 40); }, 300);
    const timer2 = setTimeout(() => { targetProgress = Math.max(targetProgress, 85); }, 800);
    const timer3 = setTimeout(() => { targetProgress = 100; }, 1400);

    return () => {
      window.removeEventListener('rastaak-load-progress', handleProgress);
      cancelAnimationFrame(animId);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div
      id="loader"
      className={`fixed inset-0 z-[100000] flex flex-col items-center justify-center transition-opacity duration-800 pointer-events-none ${
        isDone ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        backgroundColor: tokens.colors.bgHero,
        display: isDone ? 'none' : 'flex',
      }}
    >
      <div className="flex flex-col items-center justify-center text-center px-6">
        {/* Brand Sub-header */}
        <div
          className="text-xs font-mono tracking-[0.35em] uppercase mb-2"
          style={{ color: tokens.colors.textSubtle }}
        >
          RASTAAK 3D ENGINE
        </div>

        {/* Big percentage counter */}
        <div
          className="text-7xl sm:text-9xl font-extrabold tracking-tighter font-mono my-3"
          style={{ color: tokens.colors.textLight }}
        >
          {progress}
          <span
            className="text-4xl sm:text-6xl font-light ml-1"
            style={{ color: tokens.colors.primaryLight }}
          >
            %
          </span>
        </div>

        {/* Farsi subtitle */}
        <div
          className="text-sm font-medium tracking-wide mt-2"
          style={{ color: tokens.colors.textSemiOpaque }}
          dir="rtl"
        >
          در حال بارگذاری صحنه ۳ بعدی راستاک...
        </div>

        {/* Minimal Glowing Progress Bar */}
        <div
          className="w-48 sm:w-64 h-1.5 rounded-full mt-6 overflow-hidden relative border"
          style={{
            backgroundColor: tokens.colors.bgDark,
            borderColor: tokens.colors.borderDarkSubtle,
          }}
        >
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: tokens.colors.primaryLight,
            }}
          />
        </div>
      </div>
    </div>
  );
};
