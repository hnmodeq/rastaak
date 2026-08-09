'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface MissionItem {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
}

const items: MissionItem[] = [
  {
    id: 'speed',
    title: 'Zero Latency Mobilization',
    subtitle: 'Hours, not weeks.',
    desc: 'Critical path outages cost hundreds of thousands of dollars per hour of downtime. We replaced manual resume collection with intelligent automated dispatch pipelines to bring certified craft workers on site instantly.',
  },
  {
    id: 'quality',
    title: 'Nuclear-Grade Vetting',
    subtitle: 'Zero gate turnarounds on Day 1.',
    desc: 'Unescorted nuclear site badges, background checks, drug testing, and safety certifications are verified through automated API workflows before dispatch, guaranteeing that 100% of workers pass security checks immediately.',
  },
  {
    id: 'craft',
    title: 'Worker-First Operational Model',
    subtitle: 'Rewarding elite trade expertise.',
    desc: 'We strip away middleman commissions and administrative delays, delivering higher earnings directly to proven craft contractors while keeping rates transparent and competitive for operators.',
  },
];

export const MissionAccordion: React.FC = () => {
  const [activeId, setActiveId] = useState<string>('speed');

  return (
    <div className="space-y-6">
      {items.map((item) => {
        const isOpen = activeId === item.id;

        return (
          <div
            key={item.id}
            className="p-6 sm:p-8 rounded-3xl bg-surface-light border border-edge-light shadow-md transition-all"
          >
            <button
              type="button"
              onClick={() => setActiveId(isOpen ? '' : item.id)}
              className="w-full flex items-center justify-between text-left"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                  {item.subtitle}
                </span>
                <h3 className="text-2xl font-bold text-content-dark mt-1">
                  {item.title}
                </h3>
              </div>
              <span
                className={`ml-4 flex-shrink-0 transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              >
                <Image
                  src="/icons/chevron-down.svg"
                  alt=""
                  width={20}
                  height={20}
                />
              </span>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="overflow-hidden"
                >
                  <p className="mt-4 text-base sm:text-lg text-content-muted leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
