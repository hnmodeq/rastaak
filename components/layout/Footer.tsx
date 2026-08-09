import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '../ui/Logo';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-surface-dark text-content-light pt-12 pb-8">
      {/* Large Navigation Action Buttons */}
      <nav className="w-full border-b border-edge-dark">
        <Link href="/industries" className="footer-nav-btn">
          <span className="footer-nav-btn__bg" />
          <span className="footer-nav-btn__label">Our Industries</span>
          <span className="footer-nav-btn__arrows">
            <Image
              src="/_astro/arrow-right.BfejkNdO.svg"
              alt=""
              width={23}
              height={32}
              className="footer-nav-btn__arrow footer-nav-btn__arrow--current"
            />
            <Image
              src="/_astro/arrow-right.BfejkNdO.svg"
              alt=""
              width={23}
              height={32}
              className="footer-nav-btn__arrow footer-nav-btn__arrow--next"
            />
          </span>
        </Link>

        <Link href="/our-mission" className="footer-nav-btn">
          <span className="footer-nav-btn__bg" />
          <span className="footer-nav-btn__label">Our Mission</span>
          <span className="footer-nav-btn__arrows">
            <Image
              src="/_astro/arrow-right.BfejkNdO.svg"
              alt=""
              width={23}
              height={32}
              className="footer-nav-btn__arrow footer-nav-btn__arrow--current"
            />
            <Image
              src="/_astro/arrow-right.BfejkNdO.svg"
              alt=""
              width={23}
              height={32}
              className="footer-nav-btn__arrow footer-nav-btn__arrow--next"
            />
          </span>
        </Link>

        <Link href="/apply" className="footer-nav-btn">
          <span className="footer-nav-btn__bg" />
          <span className="footer-nav-btn__label">Apply</span>
          <span className="footer-nav-btn__arrows">
            <Image
              src="/_astro/arrow-right.BfejkNdO.svg"
              alt=""
              width={23}
              height={32}
              className="footer-nav-btn__arrow footer-nav-btn__arrow--current"
            />
            <Image
              src="/_astro/arrow-right.BfejkNdO.svg"
              alt=""
              width={23}
              height={32}
              className="footer-nav-btn__arrow footer-nav-btn__arrow--next"
            />
          </span>
        </Link>
      </nav>

      {/* Footer Bottom Info */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <Logo color="#FCFCFC" className="h-4 w-auto" />

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-content-subtle">
          <p>© {currentYear} Vectr, Inc.</p>
          <Link href="/privacy" className="hover:text-content-light transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-content-light transition-colors">
            ToS
          </Link>
          <a
            href="https://utsubo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-content-light transition-colors"
          >
            Made by Utsubo
          </a>
        </div>
      </div>
    </footer>
  );
};
