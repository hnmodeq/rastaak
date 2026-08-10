import React from 'react';

export const TermsContent: React.FC = () => {
  return (
    <div data-taxi-view="terms">
      <div className="privacy-layout">
        <section className="sub-hero">
          <h1 className="sub-hero__title">Terms of Service</h1>
          <div className="sub-hero__content">
            <div className="sub-hero__body">
              <p className="sub-hero__text">
                Please read these Terms of Service carefully before using our website or staffing services.
              </p>
            </div>
          </div>
        </section>

        <section className="privacy-section">
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access our services.
          </p>
        </section>

        <section className="privacy-section">
          <h2>2. Services</h2>
          <p>
            Vectr provides specialized workforce mobilization and staffing solutions for high-consequence industrial facilities and outages.
          </p>
        </section>
      </div>
    </div>
  );
};
