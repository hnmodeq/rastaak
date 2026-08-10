'use client';

import React, { useState } from 'react';
import { ChevronDown } from '../ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: 'How fast can crews be mobilized?',
    answer:
      'We move at the speed of your schedule. Our platform maintains a deep network of verified industrial craft, eliminating the weeks wasted in traditional hiring cycles. One call activates our mobilization engine to source and deploy precision-matched crews in hours, not days, ensuring your most critical paths remain fully manned.',
  },
  {
    question: 'How do you handle compliance & background checks?',
    answer:
      "We use a Zero-Fail Compliance model. Before a worker is even cleared for dispatch, our system automates the verification of background checks, drug testing (FFD), and site-specific certifications including nuclear grade requirements. We block access to the gate for anyone who isn't 100% cleared, ensuring your badging office has zero headaches on Day 1.",
  },
  {
    question: 'What is the coverage during outages?',
    answer:
      'We provide 24/7 active coordination to match the 24/7 nature of an outage. Our coverage spans the full range of outage craft: from general laborers and painters to specialized repairs and schedulers. More importantly, we manage the "last mile" of arrival, monitoring deployments in real-time to ensure your night and day shifts remain fully manned, even when field conditions shift.',
  },
  {
    question: 'How does Rastaak differ from traditional staffing vendors?',
    answer:
      "Traditional vendors are reactive; Rastaak is an operational engine. While legacy agencies rely on manual resumes and 'available' warm bodies, we use intelligent workflows and expert curation to deliver field-validated precision. We don't just find people who are looking for work; we deploy proven crews that are engineered for the high-tempo grind of a critical path environment.",
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section className="relative px-6 md:px-12 py-32 bg-surface-light z-10">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16">
        {/* Left Title */}
        <div className="lg:w-1/3">
          <h2 className="text-4xl sm:text-5xl font-medium tracking-tight text-content-dark leading-tight">
            How we work and how we deliver industrial-grade staffing.
          </h2>
        </div>

        {/* Right Accordion */}
        <div className="lg:w-2/3 divide-y divide-edge-light border-y border-edge-light">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;

            return (
              <div key={faq.question} className="py-6 sm:py-8">
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between text-left group"
                  aria-expanded={isOpen}
                >
                  <span className="text-xl sm:text-2xl font-bold text-content-dark group-hover:text-brand-primary transition-colors">
                    {faq.question}
                  </span>
                  <span
                    className={`ml-4 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  >
                    <ChevronDown width={20} height={20} />
                  </span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="mt-4 text-base sm:text-lg text-content-muted leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
