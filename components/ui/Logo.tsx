import React from 'react';
import { TYPE_CHROME } from '@/components/home/typeChrome';

interface LogoProps {
  variant?: 'dark' | 'light';
  className?: string;
  fontSize?: string;
  color?: string;
  style?: React.CSSProperties;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  fontSize = '',
  style = {},
}) => {
  return (
    <span
      className={`site-name inline-block select-none ${fontSize} ${className}`.trim()}
      style={{
        fontFamily: "'Kalameh', sans-serif",
        letterSpacing: '-0.02em',
        lineHeight: 1,
        ...style,
      }}
    >
      {TYPE_CHROME.siteName}
    </span>
  );
};
