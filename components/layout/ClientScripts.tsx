'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export const ClientScripts: React.FC = () => {
  useEffect(() => {
    // Remove preload class
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('preload');
      });
    });
  }, []);

  return (
    <Script
      src="/_astro/CommonScripts.astro_astro_type_script_index_0_lang.CZTi642d.js"
      type="module"
      strategy="afterInteractive"
    />
  );
};
