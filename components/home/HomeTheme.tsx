'use client';

import { useEffect } from 'react';
import { applyStoryTheme } from '@/components/canvas/scene/storyConfig';
import { applyHeroCopy } from './heroCopy';
import { applyFlowChrome } from './flowConfig';

export function HomeTheme() {
  useEffect(() => {
    applyStoryTheme();
    applyHeroCopy();
    applyFlowChrome();
  }, []);
  return null;
}
