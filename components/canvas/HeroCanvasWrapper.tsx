'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const HeroCanvas3D = dynamic(
  () => import('./HeroCanvas3D').then((mod) => mod.HeroCanvas3D),
  { ssr: false }
);

export const HeroCanvasWrapper: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('rastaak-load-progress', { detail: { progress: 8 } }));
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <HeroCanvas3D />;
};
