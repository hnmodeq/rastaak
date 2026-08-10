import React from 'react';
import Link from 'next/link';

export const MissionContent: React.FC = () => {
  return (
    <div data-taxi-view="mission">
      <div className="mission">
        <section className="sub-hero">
          <h1 className="sub-hero__title">
            Our Mission is to eliminate friction
            <br />
            from industrial operations.
          </h1>
          <div className="sub-hero__content">
            <div className="sub-hero__body">
              <p className="sub-hero__text">
                Traditional staffing is slow, manual, and bloated with layers of middleman margins. Vectr replaces legacy friction with automated, instant workforce mobilization.
              </p>
            </div>
          </div>
        </section>

        <section className="sub-section">
          <div className="sub-section__image">
            <picture>
              <source srcSet="/_astro/mission-hero.C1KE2YIt_1mJKlS.avif 360w, /_astro/mission-hero.C1KE2YIt_TeKV2.avif 720w, /_astro/mission-hero.C1KE2YIt_258hbg.avif 800w" type="image/avif" sizes="(max-width: 820px) 100vw, 800px" />
              <source srcSet="/_astro/mission-hero.C1KE2YIt_Z1Lwcet.webp 360w, /_astro/mission-hero.C1KE2YIt_27Lqke.webp 720w, /_astro/mission-hero.C1KE2YIt_Z1jfCgX.webp 800w" type="image/webp" sizes="(max-width: 820px) 100vw, 800px" />
              <img src="/_astro/mission-hero.C1KE2YIt_ZEeT2X.png" srcSet="/_astro/mission-hero.C1KE2YIt_1jugI4.png 360w, /_astro/mission-hero.C1KE2YIt_Zx4nJh.png 720w, /_astro/mission-hero.C1KE2YIt_1qtvkA.png 800w" alt="Mission hero" loading="lazy" decoding="async" sizes="(max-width: 820px) 100vw, 800px" width={800} height={400} />
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
