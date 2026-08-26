import React from 'react';
import Link from 'next/link';
import { Logo } from '../ui/Logo';
import { ArrowRight } from '../ui/Icons';
import { SITE_CONTENT } from '@/components/home/siteContent';

const FooterArrow: React.FC<{ className: string }> = ({ className }) => (
  <ArrowRight width={23} height={32} className={className} />
);

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" data-site-section="footer">
      <nav className="footer-nav" data-site-section="links">
        <Link href={SITE_CONTENT.links.industries.href} className="footer-nav-btn">
          <span className="footer-nav-btn__bg" />
          <span className="footer-nav-btn__label" data-link="industries">{SITE_CONTENT.links.industries.label}</span>
          <span className="footer-nav-btn__arrows">
            <FooterArrow className="footer-nav-btn__arrow footer-nav-btn__arrow--current" />
            <FooterArrow className="footer-nav-btn__arrow footer-nav-btn__arrow--next" />
          </span>
        </Link>
        <Link href={SITE_CONTENT.links.mission.href} className="footer-nav-btn">
          <span className="footer-nav-btn__bg" />
          <span className="footer-nav-btn__label" data-link="mission">{SITE_CONTENT.links.mission.label}</span>
          <span className="footer-nav-btn__arrows">
            <FooterArrow className="footer-nav-btn__arrow footer-nav-btn__arrow--current" />
            <FooterArrow className="footer-nav-btn__arrow footer-nav-btn__arrow--next" />
          </span>
        </Link>
        <Link href={SITE_CONTENT.links.apply.href} className="footer-nav-btn">
          <span className="footer-nav-btn__bg" />
          <span className="footer-nav-btn__label" data-link="apply">{SITE_CONTENT.links.apply.label}</span>
          <span className="footer-nav-btn__arrows">
            <FooterArrow className="footer-nav-btn__arrow footer-nav-btn__arrow--current" />
            <FooterArrow className="footer-nav-btn__arrow footer-nav-btn__arrow--next" />
          </span>
        </Link>
      </nav>

      <div className="footer__bottom">
        <Logo variant="light" fontSize="text-2xl sm:text-3xl" className="footer__logo" />
        <div className="footer__meta">
          <span className="footer__copyright" data-footer="copyright">© {currentYear} {SITE_CONTENT.footer.copyright}</span>
          <p className="footer__credit" dir="rtl">
            <span data-footer="credit-prefix">{SITE_CONTENT.footer.creditPrefix}</span>{' '}
            <a
              className="footer__credit-name"
              data-footer="credit-name"
              href={SITE_CONTENT.footer.creditHref ?? 'http://www.bumims.ir'}
              target="_blank"
              rel="noreferrer"
            >
              {SITE_CONTENT.footer.creditName}
            </a>
          </p>
          <Link href={SITE_CONTENT.footer.privacyHref ?? '/privacy'} className="footer__privacy" data-footer="privacy">{SITE_CONTENT.footer.privacy}</Link>
          <Link href={SITE_CONTENT.footer.termsHref ?? '/terms'} className="footer__privacy" data-footer="terms">{SITE_CONTENT.footer.terms}</Link>
        </div>
      </div>
    </footer>
  );
};
