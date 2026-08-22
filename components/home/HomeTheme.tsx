'use client';

import { useEffect } from 'react';
import { applyStoryTheme } from '@/components/canvas/scene/storyConfig';
import { applyHeroCopy } from './heroCopy';
import { applyFlowChrome } from './flowConfig';
import { applyTypeChrome } from './typeChrome';

export function HomeTheme() {
  useEffect(() => {
    applyStoryTheme();
    applyHeroCopy();
    applyFlowChrome();
    applyTypeChrome();
  }, []);
  return null;
}
