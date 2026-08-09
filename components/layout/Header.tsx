'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '../ui/Logo';
import { PillButton } from '../ui/PillButton';
import { useNavigation } from './NavigationContext';

export const Header: React.FC = () => {
  const { toggleMobileMenu, isMobileMenuOpen, openApplyModal } = useNavigation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-12 md:py-6 transition-all duration-300">
      {/* Left Navigation Links */}
      <nav className="hidden md:flex items-center space-x-8 text-sm font-medium tracking-tight text-content-dark">
        <Link href="/industries" className="hover:text-brand-primary transition-colors">
          Our Industries
        </Link>
        <Link href="/our-mission" className="hover:text-brand-primary transition-colors">
          Our Mission
        </Link>
      </nav>

      {/* Center Logo */}
      <div className="flex items-center">
        <Link href="/" aria-label="Vectr Home" className="flex items-center">
          <Logo color="#050419" className="h-4 w-auto" />
        </Link>
      </div>

      {/* Right CTAs */}
      <div className="flex items-center space-x-4">
        <div className="hidden sm:flex items-center space-x-3">
          <PillButton
            variant="glass"
            onClick={openApplyModal}
          >
            Apply
          </PillButton>
          <PillButton
            variant="dark"
            href="/request-crew"
          >
            Request Crews
          </PillButton>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
          className="flex md:hidden flex-col justify-center items-center w-10 h-10 space-y-1.5 focus:outline-none"
        >
          <span
            className={`w-6 h-0.5 bg-content-dark transition-all duration-300 ${
              isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
            }`}
          />
          <span
            className={`w-6 h-0.5 bg-content-dark transition-all duration-300 ${
              isMobileMenuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`w-6 h-0.5 bg-content-dark transition-all duration-300 ${
              isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
            }`}
          />
        </button>
      </div>
    </header>
  );
};
