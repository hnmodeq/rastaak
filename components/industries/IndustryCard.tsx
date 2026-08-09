'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export interface IndustryItem {
  id: string;
  title: string;
  desc: string;
  image: string;
  roles: string[];
}

export const IndustryCard: React.FC<{ industry: IndustryItem; index: number }> = ({ industry, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      className="sticky-stack__item p-8 sm:p-12 rounded-3xl bg-surface-light border border-edge-light shadow-2xl flex flex-col lg:flex-row gap-8 lg:gap-12 items-center justify-between"
    >
      {/* Text Info */}
      <div className="w-full lg:w-1/2 space-y-6">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-primary">
          0{index + 1} / Industry Focus
        </span>
        <h3 className="text-3xl sm:text-4xl font-bold text-content-dark tracking-tight">
          {industry.title}
        </h3>
        <p className="text-base sm:text-lg text-content-muted leading-relaxed">
          {industry.desc}
        </p>

        {/* Roles Badges */}
        <div className="flex flex-wrap gap-2 pt-2">
          {industry.roles.map((r) => (
            <span
              key={r}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-surface-muted text-content-dark border border-edge-light"
            >
              {r}
            </span>
          ))}
        </div>
      </div>

      {/* Image Showcase */}
      <div className="w-full lg:w-1/2 rounded-2xl overflow-hidden shadow-lg border border-edge-light">
        <Image
          src={industry.image}
          alt={industry.title}
          width={800}
          height={500}
          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>
    </motion.div>
  );
};
