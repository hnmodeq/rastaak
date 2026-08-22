import React from 'react';
import Link from 'next/link';
import { ChevronDown, FeatureIcon } from '../ui/Icons';
import { FLOW_CONFIG } from './flowConfig';

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

        {/* Process Flow Section preserving 100% authentic HTML DOM for legacy Astro animations */}
        <section className="flow">
          <div className="flow__wrapper">
            <div className="flow__steps">
              {FLOW_CONFIG.map((step, idx) => (
                <div key={step.num} className="flow__step" data-step={idx + 1}>
                  <div className="flow__header">
                    <div className="flow__number">
                      <span>{step.num}</span>
                    </div>
                    <h3 className="flow__title">{step.title}</h3>
                  </div>
                  <div className="flow__body">
                    <div className="flow__body-inner">
                      <div className="flow__track">
                        <div className="flow__track-bar">
                          <div className="flow__track-fill" />
                        </div>
                      </div>
                      <p className="flow__description">
                        {step.subtitle && (
                          <>
                            {step.subtitle}
                            <br />
                          </>
                        )}
                        {step.caption}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
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
                    <FeatureIcon name="rapid" label="Rapid Activation" width={96} height={96} />
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
                    <FeatureIcon name="selection" label="Rigorous Selection" width={96} height={96} />
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
                    <FeatureIcon name="verified" label="Verified Before Arrival" width={96} height={96} />
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
                    <FeatureIcon name="outcomes" label="Controlled Outcomes" width={96} height={96} />
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
                    <ChevronDown width={40} height={24} />
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
                    <ChevronDown width={40} height={24} />
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
                    <ChevronDown width={40} height={24} />
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
                  <span className="faq-item__question">How does Rastaak differ from traditional staffing vendors?</span>
                  <span className="faq-item__icon">
                    <ChevronDown width={40} height={24} />
                  </span>
                </button>
                <div className="faq-item__content">
                  <p className="faq-item__answer">
                    Traditional vendors are reactive; Rastaak is an operational engine. While legacy agencies rely on manual resumes and &apos;available&apos; warm bodies, we use intelligent workflows and expert curation to deliver field-validated precision. We don&apos;t just find people who are looking for work; we deploy proven crews that are engineered for the high-tempo grind of a critical path environment.
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
    </div>
  );
};
