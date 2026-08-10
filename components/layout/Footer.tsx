import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '../ui/Logo';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <nav className="footer-nav">
        <Link href="/industries" className="footer-nav-btn">
          <span className="footer-nav-btn__bg" />
          <span className="footer-nav-btn__label">Our Industries</span>
          <span className="footer-nav-btn__arrows">
            <Image src="/_astro/arrow-right.BfejkNdO.svg" alt="" width={23} height={32} className="footer-nav-btn__arrow footer-nav-btn__arrow--current" />
            <Image src="/_astro/arrow-right.BfejkNdO.svg" alt="" width={23} height={32} className="footer-nav-btn__arrow footer-nav-btn__arrow--next" />
          </span>
        </Link>
        <Link href="/our-mission" className="footer-nav-btn">
          <span className="footer-nav-btn__bg" />
          <span className="footer-nav-btn__label">Our Mission</span>
          <span className="footer-nav-btn__arrows">
            <Image src="/_astro/arrow-right.BfejkNdO.svg" alt="" width={23} height={32} className="footer-nav-btn__arrow footer-nav-btn__arrow--current" />
            <Image src="/_astro/arrow-right.BfejkNdO.svg" alt="" width={23} height={32} className="footer-nav-btn__arrow footer-nav-btn__arrow--next" />
          </span>
        </Link>
        <Link href="/apply" className="footer-nav-btn">
          <span className="footer-nav-btn__bg" />
          <span className="footer-nav-btn__label">Apply</span>
          <span className="footer-nav-btn__arrows">
            <Image src="/_astro/arrow-right.BfejkNdO.svg" alt="" width={23} height={32} className="footer-nav-btn__arrow footer-nav-btn__arrow--current" />
            <Image src="/_astro/arrow-right.BfejkNdO.svg" alt="" width={23} height={32} className="footer-nav-btn__arrow footer-nav-btn__arrow--next" />
          </span>
        </Link>
      </nav>

      <div className="footer__bottom">
        <Logo variant="light" fontSize="text-2xl sm:text-3xl" className="footer__logo" />

        <div className="footer__meta">
          <p className="footer__copyright">© {currentYear} Rastaak, Inc.</p>
          <Link href="/privacy" className="footer__privacy">Privacy Policy</Link>
          <Link href="/terms" className="footer__privacy">ToS</Link>
          <a href="https://utsubo.com" target="_blank" rel="noopener noreferrer" className="footer__credit">
            Made by Bumim
          </a>
        </div>
      </div>
    </footer>
  );
};
