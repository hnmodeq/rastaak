'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '../ui/Logo';
import { tokens } from '@/tokens/design-tokens';
import { SITE_CONTENT, SITE_CONTENT_EVENT } from '@/components/home/siteContent';

type HeaderItemKey = 'industries' | 'mission' | 'apply' | 'request';

const GHOST_ITEMS: HeaderItemKey[] = ['industries', 'mission'];
const CTA_ITEMS: HeaderItemKey[] = ['apply', 'request'];

export const Header: React.FC = () => {
  const [content, setContent] = useState(() => structuredClone(SITE_CONTENT));

  useEffect(() => {
    const refresh = () => setContent(structuredClone(SITE_CONTENT));
    window.addEventListener(SITE_CONTENT_EVENT, refresh);
    return () => window.removeEventListener(SITE_CONTENT_EVENT, refresh);
  }, []);

  const item = (key: HeaderItemKey) => content.links[key];
  const isVisible = (key: HeaderItemKey) => item(key).visible !== false;

  const renderGhost = (key: HeaderItemKey) => {
    const link = item(key);
    return (
      <Link key={key} href={link.href} className="header__nav-link" data-link={key} data-header-link={key}>
        {link.label}
      </Link>
    );
  };

  const renderCta = (key: HeaderItemKey) => {
    const link = item(key);
    const dark = key === 'request';
    return (
      <Link
        key={key}
        href={link.href}
        className={`pill-btn ${dark ? 'pill-btn--dark' : 'pill-btn--glass'}`}
        data-header-link={key}
      >
        <span className="pill-btn-span" data-link={key}>{link.label}</span>
      </Link>
    );
  };

  const renderSide = (side: 'left' | 'right') => {
    const ghosts = GHOST_ITEMS.filter((key) => isVisible(key) && (item(key).side ?? (key === 'apply' || key === 'request' ? 'left' : 'right')) === side);
    const ctas = CTA_ITEMS.filter((key) => isVisible(key) && (item(key).side ?? 'left') === side);
    return (
      <>
        {ghosts.map(renderGhost)}
        {ctas.length ? <div className="header__ctas">{ctas.map(renderCta)}</div> : null}
      </>
    );
  };

  return (
    <header data-site-section="header">
      <nav className="header__nav-left" aria-label="Header left actions">
        {renderSide('left')}
      </nav>

      <div className="header__logo">
        <Link href="/" className="header__logo_link" aria-label="Rastaak Home">
          <Logo variant="dark" fontSize="text-2xl sm:text-3xl" />
        </Link>
      </div>

      <nav className="header__nav-right" aria-label="Header right actions">
        {renderSide('right')}
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
            {GHOST_ITEMS.filter(isVisible).map((key) => (
              <li className="mobile-nav__item" key={key}>
                <Link href={item(key).href} data-link={key} data-header-link={key}>{item(key).label}</Link>
              </li>
            ))}
          </ul>
          <div className="mobile-nav__ctas">
            {CTA_ITEMS.filter(isVisible).map((key) => (
              <div className="mncta" key={key}>
                <Link
                  href={item(key).href}
                  className={`pill-btn ${key === 'request' ? 'pill-btn--dark' : 'pill-btn--glass'} mobile-nav__cta`}
                  data-header-link={key}
                >
                  <span className="pill-btn-span" data-link={key}>{item(key).label}</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
};
