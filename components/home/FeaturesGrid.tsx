'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FeatureIcon } from '../ui/Icons';

interface Feature {
  icon: 'rapid' | 'selection' | 'verified' | 'outcomes';
  title: string;
  desc: string;
}

const features: Feature[] = [
  {
    icon: 'rapid',
    title: 'Rapid Activation',
    desc: 'We believe speed is a skill. Our platform uses machine learning to turn staffing into instant logistics, deploying a precisely matched workforce the moment demand strikes.',
  },
  {
    icon: 'selection',
    title: 'Rigorous Selection',
    desc: 'Geography is a core metric. Our engine uses AI to find and contact qualified talent within defined radii, securing top local contractors first, filtered for cost and skill.',
  },
  {
    icon: 'verified',
    title: '100% Verified Before Arrival',
    desc: 'We use a Zero-Trust verification model with secure API integrations to run automated background checks and drug testing, blocking dispatch access until fully cleared.',
  },
  {
    icon: 'outcomes',
    title: 'Controlled Outcomes',
    desc: "We guarantee controlled outcomes by managing staffing's biggest variables—cost and compliance—prioritizing local mobilization and automating safety for every dispatch.",
  },
];

export const FeaturesGrid: React.FC = () => {
  return (
    <section className="relative px-6 md:px-12 py-32 bg-surface-dark text-content-light z-10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mb-20"
        >
          <h2 className="text-4xl sm:text-6xl font-medium tracking-tight leading-tight">
            Designed for today&apos;s operations, beyond legacy staffing workflows.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="p-8 sm:p-10 rounded-3xl bg-surface-card-dark border border-edge-dark flex flex-col justify-between hover:border-brand-primary/60 transition-colors group"
            >
              <div className="w-14 h-14 mb-8 flex items-center justify-center rounded-2xl bg-surface-dark-elevated p-3 border border-edge-dark group-hover:border-brand-primary transition-colors">
                <FeatureIcon name={feature.icon} label={feature.title} className="w-full h-auto" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-content-light mb-3">{feature.title}</h3>
                <p className="text-content-subtle leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
