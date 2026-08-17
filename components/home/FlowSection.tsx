'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FLOW_CONFIG } from './flowConfig';

export const FlowSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [trackFillScales, setTrackFillScales] = useState<number[]>([0, 0, 0, 0]);

  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const totalScrollableDistance = section.offsetHeight - viewportHeight;

      if (totalScrollableDistance <= 0) return;

      const currentScrollTop = viewportHeight * 0.4 - rect.top;
      const progressT = Math.min(1.0, Math.max(0, currentScrollTop / totalScrollableDistance));

      let activeIdx = 0;
      const newScales = FLOW_CONFIG.map((step, idx) => {
        const [start, end] = step.progressRange;
        if (progressT >= start && progressT <= end) {
          activeIdx = idx;
        } else if (progressT > end) {
          activeIdx = Math.max(activeIdx, idx);
        }

        const rangeLength = end - start;
        if (progressT >= end) return 1;
        if (progressT <= start) return 0;
        return rangeLength > 0 ? (progressT - start) / rangeLength : 0;
      });

      setActiveStepIndex(activeIdx);
      setTrackFillScales(newScales);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const handleStepClick = (idx: number) => {
    const section = sectionRef.current;
    if (!section) return;

    const viewportHeight = window.innerHeight;
    const totalScrollableDistance = section.offsetHeight - viewportHeight;
    const targetProgress = FLOW_CONFIG[idx].progressRange[0];
    const sectionTop = window.scrollY + section.getBoundingClientRect().top;
    const targetScrollY =
      sectionTop - viewportHeight * 0.4 + targetProgress * totalScrollableDistance;

    window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="flow">
      <div className="flow__wrapper">
        <div className="flow__steps">
          {FLOW_CONFIG.map((step, idx) => {
            const isActive = idx === activeStepIndex;
            const fillScale = trackFillScales[idx] ?? 0;

            return (
              <div
                key={step.num}
                className={`flow__step ${isActive ? 'flow__step--active' : ''}`}
                data-step={step.num}
              >
                <div
                  className="flow__header"
                  onClick={() => handleStepClick(idx)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="flow__number">
                    <span>{step.num}</span>
                  </div>
                  <h3 className="flow__title">{step.title}</h3>
                </div>

                <div className="flow__body">
                  <div className="flow__body-inner">
                    <div className="flow__track">
                      <div className="flow__track-bar">
                        <div
                          className="flow__track-fill"
                          style={{
                            transform: `scaleY(${fillScale})`,
                            transformOrigin: 'top center',
                          }}
                        />
                      </div>
                    </div>

                    <div className="flow__description">
                      {step.subtitle && (
                        <p className="font-semibold mb-2">{step.subtitle}</p>
                      )}
                      <p>{step.caption}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
