'use client';

import { useEffect } from 'react';
import { applyStoryTheme } from '@/components/canvas/scene/storyConfig';
import { HERO_COPY, applyHeroCopy } from './heroCopy';
import { FLOW_CHROME, FLOW_CONFIG, applyFlowChrome, syncFlowDom } from './flowConfig';
import { TYPE_CHROME, applyTypeChrome } from './typeChrome';
import { SITE_CONTENT, applySiteContent, mergeSiteContent, notifySiteContentChanged } from './siteContent';
import { subscribeLive } from '@/components/live/liveChannel';

export function HomeTheme() {
  useEffect(() => {
    document.documentElement.dataset.chrome = document.documentElement.dataset.chrome || 'scene';
    applyStoryTheme();
    applyHeroCopy();
    applyFlowChrome();
    applyTypeChrome();
    applySiteContent();

    return subscribeLive((patch) => {
      if (patch.siteContent) {
        const next = mergeSiteContent(patch.siteContent);
        Object.assign(SITE_CONTENT.sections, next.sections);
        Object.assign(SITE_CONTENT.features, next.features);
        SITE_CONTENT.features.items = next.features.items;
        Object.assign(SITE_CONTENT.standards, next.standards);
        Object.assign(SITE_CONTENT.faq, next.faq);
        SITE_CONTENT.faq.items = next.faq.items;
        Object.assign(SITE_CONTENT.cta, next.cta);
        Object.assign(SITE_CONTENT.header, next.header);
        Object.assign(SITE_CONTENT.layout, next.layout);
        Object.assign(SITE_CONTENT.links, next.links);
        Object.assign(SITE_CONTENT.footer, next.footer);
        applySiteContent(SITE_CONTENT);
        notifySiteContentChanged();
      }
      if (patch.typeChrome && typeof patch.typeChrome === 'object') {
        Object.assign(TYPE_CHROME, patch.typeChrome);
        applyTypeChrome();
      }
      if (patch.heroCopy && typeof patch.heroCopy === 'object') {
        Object.assign(HERO_COPY, patch.heroCopy);
        applyHeroCopy();
      }
      if (Array.isArray(patch.flowSteps)) {
        patch.flowSteps.forEach((step, index) => {
          if (FLOW_CONFIG[index] && step && typeof step === 'object') Object.assign(FLOW_CONFIG[index], step);
        });
        syncFlowDom();
        // Notify the scroll controller without emitting another live patch.
        window.dispatchEvent(new CustomEvent('rastaak-flow-timing-changed'));
      }
      if (patch.flowChrome && typeof patch.flowChrome === 'object') {
        Object.assign(FLOW_CHROME, patch.flowChrome);
        applyFlowChrome();
      }
    });
  }, []);
  return null;
}
