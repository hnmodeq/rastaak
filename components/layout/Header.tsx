import React from 'react';
import Link from 'next/link';

export const Header: React.FC = () => {
  return (
    <header>
      <nav className="header__nav-left">
        <Link href="/industries">Our Industries</Link>
        <Link href="/our-mission">Our Mission</Link>
      </nav>

      <div className="header__logo">
        <Link href="/" className="header__logo_link" aria-label="Vectr Home">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 93 16" fill="none" className="logo">
            <path d="M9.69877 11.9986H9.49841L4.39929 0H0L5.703 13.4208C6.36614 14.9841 7.90123 15.9972 9.59718 15.9972C11.2959 15.9972 12.8282 14.9841 13.4914 13.4208L19.1972 0H14.7979L9.69877 11.9986Z" fill="#050419" />
            <path d="M19.4286 3.99859V11.9986C19.4286 14.2081 21.2205 15.9972 23.4272 15.9972H35.4257V12.3965H23.4272V9.79753H33.8257V6.19683H23.4272V3.59788H35.4257V0H23.4272C21.2176 0 19.4286 1.79189 19.4286 3.99859Z" fill="#050419" />
            <path d="M44.3598 3.99859H47.5598C49.0384 3.99859 50.328 4.80282 51.0194 5.99929H55.3058C54.4169 2.54815 51.2846 0 47.5598 0H44.3598C39.9407 0 36.3598 3.58095 36.3598 8C36.3598 12.419 39.9407 16 44.3598 16H47.5598C51.2875 16 54.4198 13.4519 55.3058 10.0007H51.0194C50.328 11.1944 49.0384 12.0014 47.5598 12.0014H44.3598C42.1503 12.0014 40.3612 10.2095 40.3612 8.00282C40.3612 5.79612 42.1531 4.00423 44.3598 4.00423V3.99859Z" fill="#050419" />
            <path d="M56.0395 0V3.60071H62.0388V15.9972H66.0374V3.60071H72.0367V0H56.0395Z" fill="#050419" />
            <path d="M92.5968 5.39824C92.5968 2.41552 90.1785 0 87.1986 0H77.4011C75.1915 0 73.4025 1.79189 73.4025 3.99859V15.9972H77.4011V10.7965H84.0409L88.2003 15.9972H92.5996L88.3414 10.6751C90.7739 10.1503 92.5996 7.98871 92.5996 5.39824H92.5968ZM88.5982 5.39824C88.5982 6.39153 87.7912 7.19859 86.7979 7.19859H77.3982V3.59788H86.7979C87.7912 3.59788 88.5982 4.40494 88.5982 5.39824Z" fill="#050419" />
          </svg>
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
            <Link href="/" className="mobile-nav__logo">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 93 16" fill="none" className="logo">
                <path d="M9.69877 11.9986H9.49841L4.39929 0H0L5.703 13.4208C6.36614 14.9841 7.90123 15.9972 9.59718 15.9972C11.2959 15.9972 12.8282 14.9841 13.4914 13.4208L19.1972 0H14.7979L9.69877 11.9986Z" fill="#050419" />
                <path d="M19.4286 3.99859V11.9986C19.4286 14.2081 21.2205 15.9972 23.4272 15.9972H35.4257V12.3965H23.4272V9.79753H33.8257V6.19683H23.4272V3.59788H35.4257V0H23.4272C21.2176 0 19.4286 1.79189 19.4286 3.99859Z" fill="#050419" />
                <path d="M44.3598 3.99859H47.5598C49.0384 3.99859 50.328 4.80282 51.0194 5.99929H55.3058C54.4169 2.54815 51.2846 0 47.5598 0H44.3598C39.9407 0 36.3598 3.58095 36.3598 8C36.3598 12.419 39.9407 16 44.3598 16H47.5598C51.2875 16 54.4198 13.4519 55.3058 10.0007H51.0194C50.328 11.1944 49.0384 12.0014 47.5598 12.0014H44.3598C42.1503 12.0014 40.3612 10.2095 40.3612 8.00282C40.3612 5.79612 42.1531 4.00423 44.3598 4.00423V3.99859Z" fill="#050419" />
                <path d="M56.0395 0V3.60071H62.0388V15.9972H66.0374V3.60071H72.0367V0H56.0395Z" fill="#050419" />
                <path d="M92.5968 5.39824C92.5968 2.41552 90.1785 0 87.1986 0H77.4011C75.1915 0 73.4025 1.79189 73.4025 3.99859V15.9972H77.4011V10.7965H84.0409L88.2003 15.9972H92.5996L88.3414 10.6751C90.7739 10.1503 92.5996 7.98871 92.5996 5.39824H92.5968ZM88.5982 5.39824C88.5982 6.39153 87.7912 7.19859 86.7979 7.19859H77.3982V3.59788H86.7979C87.7912 3.59788 88.5982 4.40494 88.5982 5.39824Z" fill="#050419" />
              </svg>
            </Link>
            <button className="mobile-nav__close" type="button" aria-label="Close menu">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect y="14.1421" width="20" height="2" transform="rotate(-45 0 14.1421)" fill="#050419" />
                <rect x="1.41406" y="0.000610352" width="20" height="2" transform="rotate(45 1.41406 0.000610352)" fill="#050419" />
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
