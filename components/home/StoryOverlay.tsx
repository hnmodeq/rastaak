'use client';

import { useEffect, useRef } from 'react';
import { STORY_CONFIG, STORY_FRAME_EVENT, applyStoryTheme, type StoryFrame } from '@/components/canvas/scene/storyConfig';

export function StoryOverlay() {
  const rootRef = useRef<HTMLDivElement>(null);
  const outroCoverRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    applyStoryTheme();

    const apply = (frame: StoryFrame) => {
      root.dataset.visible = 'true';
      const cover = outroCoverRef.current;
      if (cover) {
        const progress = Math.max(0, Math.min(1, frame.outroCover ?? 0));
        cover.dataset.on = progress > 0.001 ? 'true' : 'false';
        cover.style.transform = `translate3d(0, ${(1 - progress) * 100}%, 0)`;
      }

      const chipById = new Map(frame.chips.map((chip) => [chip.id, chip]));
      for (const [id, el] of Object.entries(chipRefs.current)) {
        if (!el) continue;
        const chip = chipById.get(id);
        if (!chip?.visible) {
          el.dataset.on = 'false';
          continue;
        }
        el.dataset.on = 'true';
        el.dataset.state = chip.state;
        el.style.opacity = String(chip.opacity);
        el.style.transform = `translate3d(${chip.x}px, ${chip.y}px, 0) translate(-50%, -120%)`;
        const label = el.querySelector('.story-chip__text');
        if (label && label.textContent !== chip.text) label.textContent = chip.text;
      }
    };

    const onFrame = (event: Event) => {
      apply((event as CustomEvent<StoryFrame>).detail);
    };

    window.addEventListener(STORY_FRAME_EVENT, onFrame);
    return () => window.removeEventListener(STORY_FRAME_EVENT, onFrame);
  }, []);

  return (
    <div ref={rootRef} className="story-overlay" data-visible="true" aria-hidden="true">
      <div ref={outroCoverRef} className="story-outro-cover" data-on="false" />
      {STORY_CONFIG.clients.map((client) => (
        <div
          key={client.id}
          className="story-chip"
          data-on="false"
          data-state="need"
          ref={(node) => {
            chipRefs.current[client.id] = node;
          }}
          dir="rtl"
        >
          <span className="story-chip__mark" aria-hidden="true">
            <svg className="story-chip__check" viewBox="0 0 16 16">
              <path
                d="M3.2 8.4 6.3 11.4 12.8 4.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="story-chip__text">{client.need}</span>
        </div>
      ))}
    </div>
  );
}
