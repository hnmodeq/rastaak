'use client';

import { useEffect, useRef } from 'react';
import { STORY_CONFIG, STORY_FRAME_EVENT, type StoryFrame } from '@/components/canvas/scene/storyConfig';

const PERSIAN_STEP = ['۰۱', '۰۲', '۰۳', '۰۴', '۰۵'];

export function StoryOverlay() {
  const rootRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const captionRefs = useRef<Record<string, HTMLLIElement | null>>({});

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const apply = (frame: StoryFrame) => {
      root.dataset.visible = frame.visible ? 'true' : 'false';

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
      }

      for (const caption of frame.captions) {
        const el = captionRefs.current[caption.id];
        if (!el) continue;
        el.dataset.active = caption.id === frame.activeCaptionId ? 'true' : 'false';
      }
    };

    const onFrame = (event: Event) => {
      apply((event as CustomEvent<StoryFrame>).detail);
    };

    window.addEventListener(STORY_FRAME_EVENT, onFrame);
    return () => window.removeEventListener(STORY_FRAME_EVENT, onFrame);
  }, []);

  return (
    <div ref={rootRef} className="story-overlay" data-visible="false" aria-hidden="true">
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
            <svg className="story-chip__check" viewBox="0 0 16 16" width="12" height="12">
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

      <ol className="story-captions" dir="rtl">
        {STORY_CONFIG.captions.map((caption, index) => (
          <li
            key={caption.id}
            className="story-caption"
            data-active="false"
            ref={(node) => {
              captionRefs.current[caption.id] = node;
            }}
          >
            <span className="story-caption__num">{PERSIAN_STEP[index] ?? String(index + 1).padStart(2, '0')}</span>
            <span className="story-caption__text">{caption.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
