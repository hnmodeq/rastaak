import React from 'react';
import Link from 'next/link';

export const IndustriesContent: React.FC = () => {
  return (
    <div data-taxi-view="industries">
      <div className="industries">
        <section className="sub-hero">
          <h1 className="sub-hero__title">
            Outages are predictable.
            <br />
            Our teams are ready.
          </h1>
          <div className="sub-hero__content">
            <div className="sub-hero__body">
              <p className="sub-hero__text">
                From nuclear refueling to planned semiconductor retrofits, our staffing engine handles all compliance, badging, and craft coordination.
              </p>
            </div>
          </div>
        </section>

        <section className="industry-section sticky-stack">
          <div className="industry-section__header-row">
            <div className="industry-section__header-top">
              <div className="industry-section__title-col">
                <span className="industry-section__tag">01 / Outage Operations</span>
                <h2 className="industry-section__title">Nuclear Power</h2>
              </div>
            </div>
            <p className="industry-section__desc">
              Zero-tolerance badging and strict fitness-for-duty compliance before Day 1.
            </p>
          </div>
          <div className="industry-section__image">
            <picture>
              <source srcSet="/_astro/industry-nuclear.CXIgxjA8_1dQyYN.avif 360w, /_astro/industry-nuclear.CXIgxjA8_1KYg5H.avif 720w, /_astro/industry-nuclear.CXIgxjA8_Z2kzYTL.avif 800w" type="image/avif" sizes="(max-width: 820px) 100vw, 800px" />
              <source srcSet="/_astro/industry-nuclear.CXIgxjA8_pyqvP.webp 360w, /_astro/industry-nuclear.CXIgxjA8_WG7BJ.webp 720w, /_astro/industry-nuclear.CXIgxjA8_Z29YlHi.webp 800w" type="image/webp" sizes="(max-width: 820px) 100vw, 800px" />
              <img src="/_astro/industry-nuclear.CXIgxjA8_8Nn67.png" srcSet="/_astro/industry-nuclear.CXIgxjA8_dMvEQ.png 360w, /_astro/industry-nuclear.CXIgxjA8_Z1obWNJ.png 720w, /_astro/industry-nuclear.CXIgxjA8_8Nn67.png 800w" alt="Nuclear power facility" loading="lazy" decoding="async" sizes="(max-width: 820px) 100vw, 800px" width={800} height={500} />
            </picture>
          </div>
        </section>

        <section className="cta-section">
          <h2 className="cta-section__title">
            <span>Staff your outage with fast response, </span>
            <span>and crews you can rely on.</span>
          </h2>
          <div className="flx">
            <Link href="/request-crew" className="pill-btn pill-btn--light">
              <span className="pill-btn-span">Request Crews</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};
