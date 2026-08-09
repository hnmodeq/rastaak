'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PillButton } from '../ui/PillButton';

export const StandardsSection: React.FC = () => {
  return (
    <section className="relative px-6 md:px-12 py-32 bg-surface-light z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Visual Graphic / Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-full lg:w-1/2 rounded-3xl overflow-hidden shadow-2xl border border-edge-light"
        >
          <Image
            src="/_astro/apply-door.CA6YLUcA_1bcsRC.png"
            alt="Workers in safety vests coordinating at industrial site"
            width={800}
            height={400}
            className="w-full h-auto object-cover"
          />
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-full lg:w-1/2 space-y-6"
        >
          <h2 className="text-4xl sm:text-6xl font-medium tracking-tight text-content-dark leading-tight">
            Nuclear-grade standards across every site.
          </h2>
          <p className="text-lg sm:text-xl text-content-muted leading-relaxed">
            Modeled on nuclear-grade environments, our process enforces badge compliance, protected timelines and zero-error tolerance.
          </p>
          <div className="pt-4">
            <PillButton variant="dark" href="/industries">
              Explore our industries
            </PillButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
