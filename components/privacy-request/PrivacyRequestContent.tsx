import React from 'react';
import Link from 'next/link';

export const PrivacyRequestContent: React.FC = () => {
  return (
    <div data-taxi-view="privacy-request">
      <div className="privacy-request">
        <section className="sub-hero">
          <h1 className="sub-hero__title">Submit a Privacy Request</h1>
          <div className="sub-hero__content">
            <div className="sub-hero__body">
              <p className="sub-hero__text">
                California residents can exercise their rights under the CCPA/CPRA by contacting us. We will respond within 45 days.
              </p>
            </div>
          </div>
        </section>

        <div className="privacy-request__layout">
          <section className="privacy-request__intro">
            <h2>How this works</h2>
            <div>
              <p>
                You can request to know what personal information we have about you, delete it, correct it, opt out of its sale or sharing, or limit our use of sensitive personal information.
              </p>
              <p>
                We will verify your identity before processing your request. If you submit a request through an authorized agent, we will ask the agent for written proof of authorization.
              </p>
            </div>
          </section>

          <aside className="privacy-request__alternatives">
            <h2>How to contact us</h2>
            <p>
              Submit your privacy request through one of the methods below. Please include the type of request, full name, email, and state of residence.
            </p>
            <ul>
              <li>
                <strong>Email:</strong>
                <a href="mailto:privacy@rastaak.com?subject=Privacy%20Request"> privacy@rastaak.com </a>
                <br />
                <small>Include &quot;Privacy Request&quot; in the subject line.</small>
              </li>
              <li>
                <strong>Mail:</strong> Rastaak, Inc.., 480 N Orlando Ave, Suite 236, Winter Park, FL 32789, United States
              </li>
            </ul>
            <p className="form__disclaimer">
              <Link href="/privacy">Privacy Policy</Link>
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
};
