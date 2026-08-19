import React from 'react';
import Link from 'next/link';

export const PrivacyContent: React.FC = () => {
  return (
    <div data-taxi-view="privacy">
      <div className="privacy-layout">
        <section className="sub-hero">
          <h1 className="sub-hero__title">Privacy Policy</h1>
          <div className="sub-hero__content">
            <div className="sub-hero__body">
              <p className="sub-hero__text">
                This Privacy Policy explains how Rastaak, Inc. (&quot;Rastaak,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, discloses, and protects your personal information when you use our website.
              </p>
            </div>
          </div>
        </section>

        <section className="privacy-section">
          <h2>1. Information We Collect</h2>
          <p>
            We collect personal information that you voluntarily provide to us when contacting us, requesting staffing services, or applying for employment.
          </p>
        </section>

        <section className="privacy-section">
          <h2>2. How We Use Information</h2>
          <p>
            We use your personal information solely to provide staffing logistics, verify site compliance, communicate regarding contracts, and ensure security.
          </p>
        </section>

        <section className="privacy-section">
          <h2>3. Contact Us</h2>
          <p>
            If you have questions about this policy, please contact us at <a href="mailto:privacy@rastaak.com">privacy@rastaak.com</a> or visit our <Link href="/privacy-request">Privacy Request page</Link>.
          </p>
        </section>
      </div>
    </div>
  );
};
