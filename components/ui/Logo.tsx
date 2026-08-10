import React from 'react';

interface LogoProps {
  variant?: 'dark' | 'light';
  className?: string;
  fontSize?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'dark',
  className = '',
  fontSize = 'text-2xl sm:text-3xl',
}) => {
  return (
    <span
      className={`inline-block font-extrabold select-none transition-colors duration-200 font-kalameh ${fontSize} ${
        variant === 'light' ? 'text-[#FCFCFC]' : 'text-[#050419]'
      } ${className}`}
      style={{
        fontWeight: 800,
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}
    >
      رستاک
    </span>
  );
};
