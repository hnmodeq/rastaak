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
    <span className={`site-brand ${className}`.trim()} style={style}>
      <img
        className="site-mark"
        src="/icons/icon-192x192.png"
        alt=""
        width={TYPE_CHROME.siteLogoSize ?? 36}
        height={TYPE_CHROME.siteLogoSize ?? 36}
        decoding="async"
      />
      <span
        className={`site-name inline-block select-none ${fontSize}`.trim()}
        style={{ fontFamily: "'Kalameh', sans-serif" }}
      >
        {TYPE_CHROME.siteName}
      </span>
    </span>
  );
};
