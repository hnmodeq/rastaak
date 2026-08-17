'use client';

import React, { useEffect, useState } from 'react';
import { tokens } from '@/tokens/design-tokens';

interface StoryBeat {
  step: string;
  title: string;
  description: string;
  range: [number, number];
}

const FARSI_BEATS: StoryBeat[] = [
  {
    step: '۰۱',
    title: 'دریافت درخواست و پایش داده‌ها',
    description: 'ارسال حجم بالای داده‌ها و درخواست‌های ذخیره‌سازی از سوی بانک‌ها، سازمان‌ها و صنایع بزرگ به مرکز راستاک.',
    range: [0.0, 0.22],
  },
  {
    step: '۰۲',
    title: 'تحلیل و معماری زیرساخت',
    description: 'ارزیابی هوشمند چالش‌های داده و طراحی اختصاصی زیرساخت ذخیره‌سازی، پردازش و امنیت اطلاعات.',
    range: [0.22, 0.48],
  },
  {
    step: '۰۳',
    title: 'استقرار تجهیزات و نیروی متخصص',
    description: 'تخصیص سریع تجهیزات ذخیره‌سازی، پیکربندی نرم‌افزاری و اعزام تیم‌های عملیاتی و کارشناسان مجرب.',
    range: [0.48, 0.72],
  },
  {
    step: '۰۴',
    title: 'حفاظت ۲۴/۷ و لایه امنیتی',
    description: 'ایجاد چتر حمایتی راستاک، پشتیبان‌گیری مداوم و تضمین پایداری و امنیت داده‌های حیاتی سازمان‌ها.',
    range: [0.72, 0.90],
  },
  {
    step: '۰۵',
    title: 'راستاک | زیرساخت امن داده‌ها',
    description: 'برای آشنایی بیشتر با خدمات، تجهیزات و راهکارهای راستاک به اسکرول ادامه دهید.',
    range: [0.90, 1.0],
  },
];

export const FarsiScrollyOverlay: React.FC = () => {
  const [scrollT, setScrollT] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      setScrollT(progress);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeBeat =
    FARSI_BEATS.find((b) => scrollT >= b.range[0] && scrollT <= b.range[1]) ||
    FARSI_BEATS[0];

  return (
    <div
      dir="rtl"
      className="fixed bottom-6 left-6 md:bottom-12 md:left-12 z-20 pointer-events-none max-w-xs sm:max-w-md w-[calc(100vw-3rem)]"
    >
      <div
        className="backdrop-blur-md p-5 md:p-6 rounded-2xl shadow-2xl transition-all duration-500 transform translate-y-0 border"
        style={{
          backgroundColor: tokens.colors.overlayBrandStrong,
          borderColor: tokens.colors.borderDarkSubtle,
          color: tokens.colors.textLight,
        }}
      >
        <div
          className="flex items-center justify-between mb-3 pb-2 border-b"
          style={{ borderColor: tokens.colors.borderDarkSubtle }}
        >
          <span
            className="text-xs font-mono tracking-widest font-semibold"
            style={{ color: tokens.colors.primaryLight }}
          >
            مرحله {activeBeat.step} / ۰۵
          </span>
          <span
            className="inline-block w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: tokens.colors.primaryLight }}
          />
        </div>

        <h3
          className="text-lg md:text-xl font-bold mb-2 leading-snug"
          style={{ color: tokens.colors.textLight }}
        >
          {activeBeat.title}
        </h3>

        <p
          className="text-xs md:text-sm leading-relaxed font-normal"
          style={{ color: tokens.colors.textSemiOpaque }}
        >
          {activeBeat.description}
        </p>

        {/* Progress Bar indicator */}
        <div
          className="w-full h-1.5 rounded-full mt-4 overflow-hidden"
          style={{ backgroundColor: tokens.colors.bgDark }}
        >
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${Math.min(100, Math.max(0, scrollT * 100))}%`,
              backgroundColor: tokens.colors.primaryLight,
            }}
          />
        </div>
      </div>
    </div>
  );
};
