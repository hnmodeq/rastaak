'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-between px-6 md:px-12 pt-32 pb-16 z-10">
      <div className="max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-7xl md:text-8xl font-medium tracking-tight text-content-dark leading-[1.05]"
        >
          <span>The New Standard </span>
          <br className="hidden sm:inline" />
          <span>in Staffing</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 text-xl sm:text-2xl text-content-dark/80 max-w-2xl font-normal leading-relaxed"
        >
          <span className="font-semibold text-content-dark">AI driven speed. Expert curation.</span>
          <br />
          We mobilize verified crews to protect your schedule and your bottom line in high-consequence environments.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="flex items-center space-x-3 text-xs font-semibold uppercase tracking-widest text-content-muted mt-12"
      >
        <span className="w-8 h-px bg-content-muted" />
        <span>scroll to discover our process</span>
      </motion.div>
    </section>
  );
};
