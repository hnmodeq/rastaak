import React from 'react';
import Link from 'next/link';
import { Logo } from '../ui/Logo';
import { ArrowRight } from '../ui/Icons';

const FooterArrow: React.FC<{ className: string }> = ({ className }) => (
  <ArrowRight width={23} height={32} className={className} />
);

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <nav className="footer-nav">
        <Link href="/industries" className="footer-nav-btn">
          <span className="footer-nav-btn__bg" />
          <span className="footer-nav-btn__label">Our Industries</span>
          <span className="footer-nav-btn__arrows">
            <FooterArrow className="footer-nav-btn__arrow footer-nav-btn__arrow--current" />
            <FooterArrow className="footer-nav-btn__arrow footer-nav-btn__arrow--next" />
          </span>
        </Link>
        <Link href="/our-mission" className="footer-nav-btn">
          <span className="footer-nav-btn__bg" />
          <span className="footer-nav-btn__label">Our Mission</span>
          <span className="footer-nav-btn__arrows">
            <FooterArrow className="footer-nav-btn__arrow footer-nav-btn__arrow--current" />
            <FooterArrow className="footer-nav-btn__arrow footer-nav-btn__arrow--next" />
          </span>
        </Link>
        <Link href="/apply" className="footer-nav-btn">
          <span className="footer-nav-btn__bg" />
          <span className="footer-nav-btn__label">Apply</span>
          <span className="footer-nav-btn__arrows">
            <FooterArrow className="footer-nav-btn__arrow footer-nav-btn__arrow--current" />
            <FooterArrow className="footer-nav-btn__arrow footer-nav-btn__arrow--next" />
          </span>
        </Link>
      </nav>

      <div className="footer__bottom">
        <Logo variant="light" fontSize="text-2xl sm:text-3xl" className="footer__logo" />
        <div className="footer__meta">
          <span className="footer__copyright">© {currentYear} Rastaak. All rights reserved.</span>
          <Link href="/privacy" className="footer__privacy">Privacy</Link>
          <Link href="/terms" className="footer__privacy">Terms</Link>
        </div>
      </div>
    </footer>
  );
};
