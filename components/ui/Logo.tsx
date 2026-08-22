import React from 'react';
import { tokens } from '@/tokens/design-tokens';
import { TYPE_CHROME } from '@/components/home/typeChrome';

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
  fontSize = '',
  color,
  style = {},
}) => {
  const textColor = color || (variant === 'light' ? tokens.colors.textLight : tokens.colors.textDark);

  return (
    <span
      className={`site-name inline-block select-none ${fontSize} ${className}`.trim()}
      style={{
        fontFamily: "'Kalameh', sans-serif",
        letterSpacing: '-0.02em',
        lineHeight: 1,
        color: textColor,
        ...style,
      }}
    >
      {TYPE_CHROME.siteName}
    </span>
  );
};
