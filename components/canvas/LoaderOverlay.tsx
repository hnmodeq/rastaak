'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const LoaderOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
          style={{ backgroundColor: '#D0E1EB' }}
        >
          <div className="relative flex items-center justify-center w-32 h-32">
            {/* Spinning Cube Logo */}
            <motion.svg
              width="96"
              height="96"
              viewBox="0 0 96 96"
              fill="none"
              className="loader__logo"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            >
              <g id="block_full" fill="#0F32DC">
                <path d="M39.9963 96.0002H55.9926V80.0039H39.9963V96.0002Z" />
                <path d="M76.2787 87.59L64.9673 76.2787L76.2787 64.9673L87.59 76.2787L76.2787 87.59Z" />
                <path d="M80.0039 55.9926V39.9963H96.0001V55.9926H80.0039Z" />
                <path d="M76.2899 8.39893L87.6013 19.7103L76.2899 31.0217L64.9785 19.7103L76.2899 8.39893Z" />
                <path d="M40.0076 0H56.0038V15.9962H40.0076V0Z" />
                <path d="M19.7216 87.59L31.033 76.2787L19.7216 64.9673L8.41019 76.2787L19.7216 87.59Z" />
                <path d="M15.9963 55.9926V39.9963H9.91821e-05V55.9926H15.9963Z" />
                <path d="M19.7103 8.39893L8.39896 19.7103L19.7103 31.0217L31.0217 19.7103L19.7103 8.39893Z" />
              </g>
              <path
                d="M53.6557 53.6557C56.7827 50.5287 56.7827 45.4713 53.6557 42.3443V42.3556L19.7103 8.41016L13.7046 14.4158L8.39887 19.7215L28.6736 40.0188H0V56.015H28.6849L19.7103 64.9784L8.39887 76.2897L19.7103 87.6011L53.6557 53.6557Z"
                fill="#0F32DC"
              />
            </motion.svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
