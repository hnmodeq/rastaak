'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

/** The legacy Astro bundle drives homepage scroll, FAQ, flow, and page transitions. */
export const ClientScripts: React.FC = () => {
  const pathname = usePathname();
  const isTokenStudio = pathname?.startsWith('/token-studio') ?? false;

  useEffect(() => {
    document.documentElement.classList.remove('preload');

    if (isTokenStudio) {
      document.body.style.overflow = '';
      document.getElementById('loader')?.setAttribute('hidden', '');
    }
  }, [isTokenStudio]);

  if (isTokenStudio) return null;

  return (
    <Script
      src="/_astro/CommonScripts.astro_astro_type_script_index_0_lang.CZTi642d.js"
      type="module"
      strategy="afterInteractive"
    />
  );
};
