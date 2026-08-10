import React from 'react';
import Link from 'next/link';
import { Logo } from '../ui/Logo';
import { tokens } from '@/tokens/design-tokens';

export const Header: React.FC = () => {
  return (
    <header>
      <nav className="header__nav-left">
        <Link href="/industries">Our Industries</Link>
        <Link href="/our-mission">Our Mission</Link>
      </nav>

      <div className="header__logo">
        <Link href="/" className="header__logo_link" aria-label="Rastaak Home">
          <Logo variant="dark" fontSize="text-2xl sm:text-3xl" />
        </Link>
      </div>

      <nav className="header__nav-right">
        <div className="header__ctas">
          <Link href="/apply" className="pill-btn pill-btn--glass">
            <span className="pill-btn-span">Apply</span>
          </Link>
          <Link href="/request-crew" className="pill-btn pill-btn--dark">
            <span className="pill-btn-span">Request Crews</span>
          </Link>
        </div>
        <button className="menu-btn" type="button" aria-label="Toggle menu" aria-expanded="false">
          <span className="menu-btn__icon">
            <span className="menu-btn__line menu-btn__line--1" />
            <span className="menu-btn__line menu-btn__line--2" />
            <span className="menu-btn__line menu-btn__line--3" />
          </span>
        </button>
      </nav>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <div className="mobile-nav__panel-bg" />
        <div className="mobile-nav__panel">
          <div className="mobile-nav__header">
            <Link href="/" className="mobile-nav__logo" aria-label="Rastaak Home">
              <Logo variant="dark" fontSize="text-2xl" />
            </Link>
            <button className="mobile-nav__close" type="button" aria-label="Close menu">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect y="14.1421" width="20" height="2" transform="rotate(-45 0 14.1421)" fill={tokens.colors.textDark} />
                <rect x="1.41406" y="0.000610352" width="20" height="2" transform="rotate(45 1.41406 0.000610352)" fill={tokens.colors.textDark} />
              </svg>
            </button>
          </div>
          <ul className="mobile-nav__list">
            <li className="mobile-nav__item">
              <Link href="/industries">Our Industries</Link>
            </li>
            <li className="mobile-nav__item">
              <Link href="/our-mission">Our Mission</Link>
            </li>
          </ul>
          <div className="mobile-nav__ctas">
            <div className="mncta">
              <Link href="/apply" className="pill-btn pill-btn--glass mobile-nav__cta">
                <span className="pill-btn-span">Apply</span>
              </Link>
            </div>
            <div className="mncta">
              <Link href="/request-crew" className="pill-btn pill-btn--dark mobile-nav__cta">
                <span className="pill-btn-span">Request Crews</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
