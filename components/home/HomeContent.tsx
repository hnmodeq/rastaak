import React from 'react';
import Link from 'next/link';

export const HomeContent: React.FC = () => {
  return (
    <div data-taxi-view="home">
      <div className="top">
        <section className="hero">
          <div className="hero__content">
            <h1
              className="hero__title"
              style={{
                opacity: 0,
                transform: 'perspective(1000px) translateX(50%) translate3d(-222.2px, 88px, 0) rotateY(60deg) rotateX(35deg)',
              }}
            >
              <span>The New Standard </span>
              <span>in Staffing</span>
            </h1>
            <p
              className="hero__subtitle"
              style={{
                opacity: 0,
                transform: 'perspective(1000px) translateX(50%) translate3d(-222.2px, 88px, 0) rotateY(60deg) rotateX(35deg)',
              }}
            >
              <span>
                AI driven speed. Expert curation.
                <br className="sp" />
              </span>
              <span>
                We mobilize verified crews to protect your schedule and your bottom line in high-consequence environments.
              </span>
            </p>
          </div>
          <div className="hero__scroll-btn">
            <span>
              <span className="hsbtn-in" style={{ transform: 'translate3d(0, calc(100% + 7px), 0)' }}>
                {' '}
                scroll to discover our process{' '}
              </span>
            </span>
          </div>
        </section>

        <div className="hero-spacer" />

        <section className="flow">
          <div className="flow__wrapper">
            <div className="flow__steps">
              <div className="flow__step" data-step="1">
                <div className="flow__header">
                  <div className="flow__number">
                    <span>01</span>
                  </div>
                  <h3 className="flow__title">Activation, simplified</h3>
                </div>
                <div className="flow__body">
                  <div className="flow__body-inner">
                    <div className="flow__track">
                      <div className="flow__track-bar">
                        <div className="flow__track-fill" />
                      </div>
                    </div>
                    <p className="flow__description">
                      One call triggers mobilization.
                      <br /> Your requirements: craft, count, and start date route directly to our verified crews. No hand-offs. No escalations. Just boots on the ground in minutes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flow__step" data-step="2">
                <div className="flow__header">
                  <div className="flow__number">
                    <span>02</span>
                  </div>
                  <h3 className="flow__title">Cleared to count</h3>
                </div>
                <div className="flow__body">
                  <div className="flow__body-inner">
                    <div className="flow__track">
                      <div className="flow__track-bar">
                        <div className="flow__track-fill" />
                      </div>
                    </div>
                    <p className="flow__description">
                      Our team handles all screening and verification before dispatch. Compliance, background, certifications, and fitness-for-duty — we enforce a zero-fail model to guarantee every worker clears the gate on Day 1.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flow__step" data-step="3">
                <div className="flow__header">
                  <div className="flow__number">
                    <span>03</span>
                  </div>
                  <h3 className="flow__title">Proven field match</h3>
                </div>
                <div className="flow__body">
                  <div className="flow__body-inner">
                    <div className="flow__track">
                      <div className="flow__track-bar">
                        <div className="flow__track-fill" />
                      </div>
                    </div>
                    <p className="flow__description">
                      We don&apos;t just provide available workers. We deploy proven crews. By filtering for past performance, role fit, and reliability, we deliver teams engineered for endurance — ensuring your project stays fully manned from first break to completion.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flow__step" data-step="4">
                <div className="flow__header">
                  <div className="flow__number">
                    <span>04</span>
                  </div>
                  <h3 className="flow__title">Seamless arrival</h3>
                </div>
                <div className="flow__body">
                  <div className="flow__body-inner">
                    <div className="flow__track">
                      <div className="flow__track-bar">
                        <div className="flow__track-fill" />
                      </div>
                    </div>
                    <p className="flow__description">
                      We manage the &quot;last mile&quot; of mobilization. Every crew arrives site-ready with finalized reporting details. With real-time arrival monitoring and active coordination, we ensure your shift starts on time, even when field conditions shift.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="features">
          <div className="features__sticky">
            <h2 className="features__title">
              {' '}
              Designed for today&apos;s operations,
              <br className="pc" /> beyond legacy staffing workflows.{' '}
            </h2>
            <div className="features__grid">
              <article className="feature-item">
                <div className="feature-item__content">
                  <div className="feature-item__icon">
                    <img src="/icons/features/rapid-activation.svg" alt="Rapid Activation icon" loading="lazy" decoding="async" width="96" height="96" />
                  </div>
                  <div className="feature-item__text">
                    <h3 className="feature-item__title">Rapid Activation</h3>
                    <p className="feature-item__description">
                      We believe speed is a skill. Our platform uses machine learning to turn staffing into instant logistics, deploying a precisely matched workforce the moment demand strikes.
                    </p>
                  </div>
                </div>
              </article>

              <article className="feature-item">
                <div className="feature-item__content">
                  <div className="feature-item__icon">
                    <img src="/icons/features/rigorous-selection.svg" alt="Rigorous Selection icon" loading="lazy" decoding="async" width="96" height="96" />
                  </div>
                  <div className="feature-item__text">
                    <h3 className="feature-item__title">Rigorous Selection</h3>
                    <p className="feature-item__description">
                      Geography is a core metric. Our engine uses AI to find and contact qualified talent within defined radii, securing top local contractors first, filtered for cost and skill.
                    </p>
                  </div>
                </div>
              </article>

              <article className="feature-item">
                <div className="feature-item__content">
                  <div className="feature-item__icon">
                    <img src="/icons/features/verified.svg" alt="100% Verified Before Arrival icon" loading="lazy" decoding="async" width="96" height="96" />
                  </div>
                  <div className="feature-item__text">
                    <h3 className="feature-item__title">100% Verified Before Arrival</h3>
                    <p className="feature-item__description">
                      We use a Zero-Trust verification model with secure API integrations to run automated background checks and drug testing, blocking dispatch access until fully cleared.
                    </p>
                  </div>
                </div>
              </article>

              <article className="feature-item">
                <div className="feature-item__content">
                  <div className="feature-item__icon">
                    <img src="/icons/features/controlled-outcomes.svg" alt="Controlled Outcomes icon" loading="lazy" decoding="async" width="96" height="96" />
                  </div>
                  <div className="feature-item__text">
                    <h3 className="feature-item__title">Controlled Outcomes</h3>
                    <p className="feature-item__description">
                      We guarantee controlled outcomes by managing staffing&apos;s biggest variables—cost and compliance—prioritizing local mobilization and automating safety for every dispatch.
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="standards">
          <div className="standards__container">
            <div className="standards__image">
              <picture>
                <source srcSet="/_astro/apply-door.CA6YLUcA_HnYyn.avif 360w, /_astro/apply-door.CA6YLUcA_ZmDXJs.avif 720w, /_astro/apply-door.CA6YLUcA_Z1Wri67.avif 800w" type="image/avif" sizes="(max-width: 820px) 100vw, 800px" />
                <source srcSet="/_astro/apply-door.CA6YLUcA_GOkXG.webp 360w, /_astro/apply-door.CA6YLUcA_ZndCk9.webp 720w, /_astro/apply-door.CA6YLUcA_Z1X0VFN.webp 800w" type="image/webp" sizes="(max-width: 820px) 100vw, 800px" />
                <img src="/_astro/apply-door.CA6YLUcA_Z12L5fE.png" srcSet="/_astro/apply-door.CA6YLUcA_1C4coP.png 360w, /_astro/apply-door.CA6YLUcA_x1e60.png 720w, /_astro/apply-door.CA6YLUcA_Z12L5fE.png 800w" alt="Workers in safety vests coordinating at industrial site" loading="lazy" decoding="async" sizes="(max-width: 820px) 100vw, 800px" width={800} height={400} />
              </picture>
            </div>
            <div className="standards__content">
              <h2 className="standards__title">
                <span>Nuclear-grade </span>
                <span>standards across </span>
                <span>every site.</span>
              </h2>
              <p className="standards__description">
                Modeled on nuclear-grade environments, our process enforces badge compliance, protected timelines and zero-error tolerance.
              </p>
              <div className="flx">
                <Link href="/industries" className="pill-btn pill-btn--dark">
                  <span className="pill-btn-span">Explore our industries</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="faq">
          <div className="faq__container">
            <div className="faq__left">
              <h2 className="faq__title">How we work and how we deliver industrial-grade staffing.</h2>
            </div>
            <div className="faq_split_bar" />
            <div className="faq__right">
              <div className="faq-item faq-item--open">
                <button className="faq-item__header" type="button" aria-expanded="true">
                  <span className="faq-item__question">How fast can crews be mobilized?</span>
                  <span className="faq-item__icon">
                    <img src="/icons/chevron-down.svg" alt="" loading="lazy" decoding="async" />
                  </span>
                </button>
                <div className="faq-item__content">
                  <p className="faq-item__answer">
                    We move at the speed of your schedule. Our platform maintains a deep network of verified industrial craft, eliminating the weeks wasted in traditional hiring cycles. One call activates our mobilization engine to source and deploy precision-matched crews in hours, not days, ensuring your most critical paths remain fully manned.
                  </p>
                </div>
              </div>

              <div className="faq-item">
                <button className="faq-item__header" type="button" aria-expanded="false">
                  <span className="faq-item__question">How do you handle compliance &amp; background checks?</span>
                  <span className="faq-item__icon">
                    <img src="/icons/chevron-down.svg" alt="" loading="lazy" decoding="async" />
                  </span>
                </button>
                <div className="faq-item__content">
                  <p className="faq-item__answer">
                    We use a Zero-Fail Compliance model. Before a worker is even cleared for dispatch, our system automates the verification of background checks, drug testing (FFD), and site-specific certifications including nuclear grade requirements. We block access to the gate for anyone who isn&apos;t 100% cleared, ensuring your badging office has zero headaches on Day 1.
                  </p>
                </div>
              </div>

              <div className="faq-item">
                <button className="faq-item__header" type="button" aria-expanded="false">
                  <span className="faq-item__question">What is the coverage during outages?</span>
                  <span className="faq-item__icon">
                    <img src="/icons/chevron-down.svg" alt="" loading="lazy" decoding="async" />
                  </span>
                </button>
                <div className="faq-item__content">
                  <p className="faq-item__answer">
                    We provide 24/7 active coordination to match the 24/7 nature of an outage. Our coverage spans the full range of outage craft: from general laborers and painters to specialized repairs and schedulers. More importantly, we manage the &quot;last mile&quot; of arrival, monitoring deployments in real-time to ensure your night and day shifts remain fully manned, even when field conditions shift.
                  </p>
                </div>
              </div>

              <div className="faq-item">
                <button className="faq-item__header" type="button" aria-expanded="false">
                  <span className="faq-item__question">How does Vectr differ from traditional staffing vendors?</span>
                  <span className="faq-item__icon">
                    <img src="/icons/chevron-down.svg" alt="" loading="lazy" decoding="async" />
                  </span>
                </button>
                <div className="faq-item__content">
                  <p className="faq-item__answer">
                    Traditional vendors are reactive; Vectr is an operational engine. While legacy agencies rely on manual resumes and &apos;available&apos; warm bodies, we use intelligent workflows and expert curation to deliver field-validated precision. We don&apos;t just find people who are looking for work; we deploy proven crews that are engineered for the high-tempo grind of a critical path environment.
                  </p>
                </div>
              </div>
            </div>
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

      {/* 3D WebGL mount container */}
      <div id="app" />
    </div>
  );
};
