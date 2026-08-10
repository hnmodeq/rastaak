'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Step {
  num: string;
  title: string;
  subtitle: string;
  desc: string;
}

const steps: Step[] = [
  {
    num: '01',
    title: 'Activation, simplified',
    subtitle: 'One call triggers mobilization.',
    desc: 'Your requirements: craft, count, and start date route directly to our verified crews. No hand-offs. No escalations. Just boots on the ground in minutes.',
  },
  {
    num: '02',
    title: 'Cleared to count',
    subtitle: 'Our team handles all screening and verification before dispatch.',
    desc: 'Compliance, background, certifications, and fitness-for-duty — we enforce a zero-fail model to guarantee every worker clears the gate on Day 1.',
  },
  {
    num: '03',
    title: 'Proven field match',
    subtitle: "We don't just provide available workers. We deploy proven crews.",
    desc: 'By filtering for past performance, role fit, and reliability, we deliver teams engineered for endurance — ensuring your project stays fully manned from first break to completion.',
  },
  {
    num: '04',
    title: 'Seamless arrival',
    subtitle: 'We manage the "last mile" of mobilization.',
    desc: 'Every crew arrives site-ready with finalized reporting details. With real-time arrival monitoring and active coordination, we ensure your shift starts on time, even when field conditions shift.',
  },
];

export const FlowSteps: React.FC = () => {
  return (
    <section className="relative px-6 md:px-12 py-24 z-10">
      <div className="max-w-6xl mx-auto space-y-32">
        {steps.map((s, idx) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col md:flex-row md:items-start justify-between gap-8 p-8 md:p-12 rounded-3xl bg-surface-light/80 backdrop-blur-xl border border-edge-inverse-strong shadow-glass"
          >
            {/* Step Number & Title */}
            <div className="md:w-1/3">
              <span className="text-4xl sm:text-5xl font-mono font-bold text-brand-primary">
                {s.num}
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-content-dark mt-2">
                {s.title}
              </h3>
            </div>

            {/* Description */}
            <div className="md:w-1/2 space-y-3">
              <p className="text-lg font-semibold text-content-dark">
                {s.subtitle}
              </p>
              <p className="text-base text-content-muted leading-relaxed">
                {s.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
