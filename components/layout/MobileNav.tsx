'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../ui/Logo';
import { PillButton } from '../ui/PillButton';
import { useNavigation } from './NavigationContext';
import { tokens } from '@/tokens/design-tokens';

export const MobileNav: React.FC = () => {
  const { isMobileMenuOpen, setIsMobileMenuOpen, openApplyModal } = useNavigation();

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleApplyClick = () => {
    setIsMobileMenuOpen(false);
    openApplyModal();
  };

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-surface-dark/40 backdrop-blur-sm z-40 md:hidden"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-surface-light z-50 p-6 flex flex-col justify-between md:hidden shadow-2xl"
          >
            {/* Header */}
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-edge-light">
                <Link href="/" onClick={handleLinkClick}>
                  <Logo variant="dark" fontSize="text-2xl" />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="p-2 text-content-dark"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16" fill="none">
                    <rect y="14.1421" width="20" height="2" transform="rotate(-45 0 14.1421)" fill={tokens.colors.textDark} />
                    <rect x="1.41406" y="0.000610352" width="20" height="2" transform="rotate(45 1.41406 0.000610352)" fill={tokens.colors.textDark} />
                  </svg>
                </button>
              </div>

              {/* Links */}
              <ul className="mt-8 space-y-6 text-xl font-medium text-content-dark">
                <li>
                  <Link href="/industries" onClick={handleLinkClick} className="block hover:text-brand-primary transition-colors">
                    Our Industries
                  </Link>
                </li>
                <li>
                  <Link href="/our-mission" onClick={handleLinkClick} className="block hover:text-brand-primary transition-colors">
                    Our Mission
                  </Link>
                </li>
              </ul>
            </div>

            {/* CTAs */}
            <div className="space-y-3 pt-6 border-t border-edge-light">
              <PillButton
                variant="glass"
                onClick={handleApplyClick}
                className="w-full text-center"
              >
                Apply
              </PillButton>
              <PillButton
                variant="dark"
                href="/request-crew"
                onClick={handleLinkClick}
                className="w-full text-center"
              >
                Request Crews
              </PillButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
