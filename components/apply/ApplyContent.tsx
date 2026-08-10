import React from 'react';
import Link from 'next/link';

export const ApplyContent: React.FC = () => {
  return (
    <div data-taxi-view="apply">
      <div className="apply">
        <section className="sub-hero">
          <h1 className="sub-hero__title">
            Great projects rely
            <br />
            on great people.
          </h1>
          <div className="sub-hero__content">
            <div className="sub-hero__body">
              <p className="sub-hero__text">
                We continuously source top industry talent, from engineers to precision millwrights. So when work begins, the right team is already in place.
              </p>
              <div className="flx sub-hero__cta">
                <button type="button" className="pill-btn pill-btn--dark" data-apply-trigger="true">
                  <span className="pill-btn-span">Apply Now to Vectr</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="apply-sections sticky-stack">
          <div className="apply-section-wrapper sticky-stack__item">
            <section className="apply-section">
              <div className="apply-section__side">
                <h2 className="apply-section__title">The search never stops</h2>
              </div>
              <div className="apply-section__content">
                <p className="apply-section__text">
                  We don&apos;t wait for an outage to start looking for a crew. We are constantly scouting for top-tier tradespeople. Whether you are available right now or locked in on another job for six months, we want to know who you are.
                </p>
                <div className="apply-section__image">
                  <picture>
                    <source srcSet="/_astro/apply-search.DV53RPfL_mkkXE.avif 360w, /_astro/apply-search.DV53RPfL_Phvvq.avif 720w, /_astro/apply-search.DV53RPfL_Z24fcV5.avif 800w" type="image/avif" sizes="(max-width: 820px) calc(100vw - 48px), 800px" />
                    <source srcSet="/_astro/apply-search.DV53RPfL_1zR0mQ.webp 360w, /_astro/apply-search.DV53RPfL_Z1WH6IW.webp 720w, /_astro/apply-search.DV53RPfL_cWiCt.webp 800w" type="image/webp" sizes="(max-width: 820px) calc(100vw - 48px), 800px" />
                    <img src="/_astro/apply-search.DV53RPfL_1nIG7.png" srcSet="/_astro/apply-search.DV53RPfL_Z2fRjVS.png 360w, /_astro/apply-search.DV53RPfL_M21RB.png 720w, /_astro/apply-search.DV53RPfL_Z27uGyT.png 800w" alt="Professional reviewing work in office environment" loading="lazy" decoding="async" sizes="(max-width: 820px) calc(100vw - 48px), 800px" width={1568} height={2336} className="apply-section__img" />
                  </picture>
                </div>
              </div>
              <div className="apply-section__overlay" aria-hidden="true" />
            </section>
          </div>

          <div className="apply-section-wrapper sticky-stack__item">
            <section className="apply-section">
              <div className="apply-section__side">
                <h2 className="apply-section__title">Skill is our currency</h2>
              </div>
              <div className="apply-section__content">
                <p className="apply-section__text">
                  We specialize in high-stakes environments. Nuclear, gas, data infrastructure. In these industries, precision isn&apos;t optional. We prioritize talent, experience, and certification above all else. If you take pride in your craft, you belong here.
                </p>
                <div className="apply-section__image">
                  <picture>
                    <source srcSet="/_astro/apply-skill.D1gb7yac_1WdTmz.avif 360w, /_astro/apply-skill.D1gb7yac_Z1hn4I1.avif 720w, /_astro/apply-skill.D1gb7yac_1m5KTl.avif 800w" type="image/avif" sizes="(max-width: 820px) calc(100vw - 48px), 800px" />
                    <source srcSet="/_astro/apply-skill.D1gb7yac_1EBMee.webp 360w, /_astro/apply-skill.D1gb7yac_Z1yYbQm.webp 720w, /_astro/apply-skill.D1gb7yac_14tDL0.webp 800w" type="image/webp" sizes="(max-width: 820px) calc(100vw - 48px), 800px" />
                    <img src="/_astro/apply-skill.D1gb7yac_Zexoil.png" srcSet="/_astro/apply-skill.D1gb7yac_ZQ9yQ2.png 360w, /_astro/apply-skill.D1gb7yac_1zyIkx.png 720w, /_astro/apply-skill.D1gb7yac_Zg1qnN.png 800w" alt="Tradesperson welding with precision" loading="lazy" decoding="async" sizes="(max-width: 820px) calc(100vw - 48px), 800px" width={1568} height={2336} className="apply-section__img" />
                  </picture>
                </div>
              </div>
              <div className="apply-section__overlay" aria-hidden="true" />
            </section>
          </div>

          <div className="apply-section-wrapper sticky-stack__item">
            <section className="apply-section">
              <div className="apply-section__side">
                <h2 className="apply-section__title">Always open doors</h2>
              </div>
              <div className="apply-section__content">
                <p className="apply-section__text">
                  Once you clear our verification process, you join our premier network with direct access to continuous critical outage deployments and top contractor rates.
                </p>
                <div className="apply-section__image">
                  <picture>
                    <source srcSet="/_astro/apply-door.CA6YLUcA_blNGt.avif 360w, /_astro/apply-door.CA6YLUcA_Z29KqcB.avif 720w, /_astro/apply-door.CA6YLUcA_1Lpi0h.avif 800w" type="image/avif" sizes="(max-width: 820px) calc(100vw - 48px), 800px" />
                    <source srcSet="/_astro/apply-door.CA6YLUcA_aMa6M.webp 360w, /_astro/apply-door.CA6YLUcA_Z2ak4Mi.webp 720w, /_astro/apply-door.CA6YLUcA_1KPDpA.webp 800w" type="image/webp" sizes="(max-width: 820px) calc(100vw - 48px), 800px" />
                    <img src="/_astro/apply-door.CA6YLUcA_1bcsRC.png" srcSet="/_astro/apply-door.CA6YLUcA_Z1f5dm9.png 360w, /_astro/apply-door.CA6YLUcA_Z2o6CXc.png 720w, /_astro/apply-door.CA6YLUcA_1621wV.png 800w" alt="Industrial entrance" loading="lazy" decoding="async" sizes="(max-width: 820px) calc(100vw - 48px), 800px" width={1568} height={2336} className="apply-section__img" />
                  </picture>
                </div>
              </div>
              <div className="apply-section__overlay" aria-hidden="true" />
            </section>
          </div>
        </div>

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
