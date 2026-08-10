import React from 'react';
import { tokens } from '@/tokens/design-tokens';

interface LogoProps {
  variant?: 'dark' | 'light';
  className?: string;
  fontSize?: string;
  color?: string;
  style?: React.CSSProperties;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'dark',
  className = '',
  fontSize = 'text-2xl sm:text-3xl',
  color,
  style = {},
}) => {
  // Directly connected to design tokens (tokens.colors.textLight / tokens.colors.textDark)
  const textColor = color || (variant === 'light' ? tokens.colors.textLight : tokens.colors.textDark);

  return (
    <span
      className={`inline-block font-extrabold select-none transition-colors duration-200 ${fontSize} ${className}`}
      style={{
        fontFamily: tokens.fonts.kalameh,
        fontWeight: 800,
        color: textColor,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        ...style,
      }}
    >
      رستاک
    </span>
  );
};
