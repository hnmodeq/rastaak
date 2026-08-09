import React from 'react';
import Image from 'next/image';

interface LogoProps {
  color?: string;
  className?: string;
  variant?: 'dark' | 'light';
}

export const Logo: React.FC<LogoProps> = ({ className = 'h-7 w-auto', variant = 'dark' }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="/rastaak-symbol.png"
        alt="Rastaak"
        width={32}
        height={32}
        className="h-7 w-7 object-contain"
        priority
      />
      <span
        className={`font-bold text-xl tracking-wider uppercase ${
          variant === 'light' ? 'text-white' : 'text-[#050419]'
        }`}
        style={{ letterSpacing: '0.08em' }}
      >
        RASTAAK
      </span>
    </div>
  );
};
