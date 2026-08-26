'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, FeatureIcon } from '../ui/Icons';
import { FLOW_CONFIG, FLOW_CHROME } from './flowConfig';
import { HERO_COPY } from './heroCopy';
import { applySiteContent, SITE_CONTENT, SITE_CONTENT_EVENT } from './siteContent';

export const HomeContent: React.FC = () => {
  const [, setRevision] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setRevision((value) => value + 1);
      requestAnimationFrame(() => applySiteContent());
    };
    window.addEventListener(SITE_CONTENT_EVENT, refresh);
    return () => window.removeEventListener(SITE_CONTENT_EVENT, refresh);
  }, []);

  return (
    <div data-taxi-view="home">
      <div className="top">
        <section className="hero" data-site-section="scene">
          <div className="hero__content">
            <h1
              className="hero__title"
              dir="rtl"
              style={{
                opacity: 0,
                transform: 'perspective(1000px) translate3d(-222.2px, 88px, 0) rotateY(60deg) rotateX(35deg)',
              }}
            >
              <span>{HERO_COPY.titleLine1}</span>
              <span>{HERO_COPY.titleLine2}</span>
            </h1>
            <p
              className="hero__subtitle"
              dir="rtl"
              style={{
                opacity: 0,
                transform: 'perspective(1000px) translate3d(-222.2px, 88px, 0) rotateY(60deg) rotateX(35deg)',
              }}
            >
              <span data-hero-sub="1">{HERO_COPY.subtitleLine1}</span>
              <br className="sp" />
              <span data-hero-sub="2">{HERO_COPY.subtitleLine2}</span>
            </p>
          </div>
          <div className="hero__scroll-btn">
            <span>
              <span className="hsbtn-in" style={{ transform: 'translate3d(0, calc(100% + 7px), 0)' }}>
                {' '}
                {HERO_COPY.scrollHint}{' '}
              </span>
            </span>
          </div>
        </section>

        <div className="hero-spacer" data-site-section="scene" />

        {/* Process Flow Section preserving 100% authentic HTML DOM for legacy Astro animations */}
        <section className="flow" data-site-section="scene" data-align={FLOW_CHROME.align} data-dir={FLOW_CHROME.dir}>
          <div className="flow__wrapper">
            <div className="flow__steps">
              {FLOW_CONFIG.map((step, idx) => (
                <div key={step.num} className="flow__step" data-step={idx + 1}>
                  <div className="flow__header">
                    <div className="flow__number">
                      <span>{step.num}</span>
                    </div>
                    <h3 className="flow__title" dir="auto">{step.title}</h3>
                  </div>
                  <div className="flow__body">
                    <div className="flow__body-inner">
                      <div className="flow__track">
                        <div className="flow__track-bar">
                          <div className="flow__track-fill" />
                        </div>
                      </div>
                      <p className="flow__description" dir="auto">
                        <span className="flow__description-kicker">{step.subtitle}</span>
                        <br className="flow__description-break" hidden={!step.subtitle} />
                        <span className="flow__description-copy">{step.caption}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="features" data-site-section="features">
          <div className="features__sticky">
            <h2 className="features__title">
              <span data-features-title="1">{SITE_CONTENT.features.titleLine1}</span>
              <br className="pc" />
              <span data-features-title="2">{SITE_CONTENT.features.titleLine2}</span>
            </h2>
            <div className="features__grid">
              {SITE_CONTENT.features.items.map((item, index) => (
                <article className="feature-item" key={`${index}-${item.title}`}>
                  <div className="feature-item__content">
                    <div className="feature-item__icon">
                      {item.iconImage ? (
                        <img src={item.iconImage} alt="" width={96} height={96} />
                      ) : (
                        <FeatureIcon name={item.icon} label={item.title} width={96} height={96} />
                      )}
                    </div>
                    <div className="feature-item__text">
                      <h3 className="feature-item__title">{item.title}</h3>
                      <p className="feature-item__description">{item.description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="standards">
          <div className="standards__container">
            <div className="standards__image">
              {SITE_CONTENT.standards.imageSrc ? (
                <img src={SITE_CONTENT.standards.imageSrc} alt="" loading="lazy" decoding="async" width={800} height={400} />
              ) : (
                <picture>
                  <source srcSet="/_astro/apply-door.CA6YLUcA_HnYyn.avif 360w, /_astro/apply-door.CA6YLUcA_ZmDXJs.avif 720w, /_astro/apply-door.CA6YLUcA_Z1Wri67.avif 800w" type="image/avif" sizes="(max-width: 820px) 100vw, 800px" />
                  <source srcSet="/_astro/apply-door.CA6YLUcA_GOkXG.webp 360w, /_astro/apply-door.CA6YLUcA_ZndCk9.webp 720w, /_astro/apply-door.CA6YLUcA_Z1X0VFN.webp 800w" type="image/webp" sizes="(max-width: 820px) 100vw, 800px" />
                  <img src="/_astro/apply-door.CA6YLUcA_Z12L5fE.png" srcSet="/_astro/apply-door.CA6YLUcA_1C4coP.png 360w, /_astro/apply-door.CA6YLUcA_x1e60.png 720w, /_astro/apply-door.CA6YLUcA_Z12L5fE.png 800w" alt="Workers in safety vests coordinating at industrial site" loading="lazy" decoding="async" sizes="(max-width: 820px) 100vw, 800px" width={800} height={400} />
                </picture>
              )}
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

        <section className="faq" data-site-section="faq">
          <div className="faq__container">
            <div className="faq__left">
              <h2 className="faq__title">{SITE_CONTENT.faq.title}</h2>
            </div>
            <div className="faq_split_bar" />
            <div className="faq__right">
              {SITE_CONTENT.faq.items.map((item, index) => (
                <div key={item.question} className={index === 0 ? 'faq-item faq-item--open' : 'faq-item'}>
                  <button className="faq-item__header" type="button" aria-expanded={index === 0 ? 'true' : 'false'}>
                    <span className="faq-item__question">{item.question}</span>
                    <span className="faq-item__icon">
                      <ChevronDown width={40} height={24} />
                    </span>
                  </button>
                  <div className="faq-item__content">
                    <p className="faq-item__answer">{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-section" data-site-section="cta">
          <h2 className="cta-section__title">
            <span>{SITE_CONTENT.cta.titleLine1}</span>
            <span>{SITE_CONTENT.cta.titleLine2}</span>
          </h2>
          <div className="flx">
            <Link href={SITE_CONTENT.cta.href} className="pill-btn pill-btn--light">
              <span className="pill-btn-span">{SITE_CONTENT.cta.button}</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};
