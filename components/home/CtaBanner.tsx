'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PillButton } from '../ui/PillButton';

interface CtaBannerProps {
  title?: React.ReactNode;
  buttonText?: string;
  buttonHref?: string;
}

export const CtaBanner: React.FC<CtaBannerProps> = ({
  title = (
    <>
      Staff your outage with fast response,
      <br />
      and crews you can rely on.
    </>
  ),
  buttonText = 'Request Crews',
  buttonHref = '/request-crew',
}) => {
  return (
    <section className="relative px-6 md:px-12 py-32 bg-surface-dark text-content-light text-center z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <h2 className="text-4xl sm:text-6xl font-medium tracking-tight leading-tight">
          {title}
        </h2>
        <div className="flex justify-center">
          <PillButton variant="light" href={buttonHref}>
            {buttonText}
          </PillButton>
        </div>
      </motion.div>
    </section>
  );
};
