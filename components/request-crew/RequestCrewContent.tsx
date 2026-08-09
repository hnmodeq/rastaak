import React from 'react';
import Link from 'next/link';

export const RequestCrewContent: React.FC = () => {
  return (
    <div data-taxi-view="request-crew">
      <div className="request-crew">
        <div className="request-crew__left">
          <h1 className="request-crew__title">Request Crews</h1>
          <div className="request-crew__description">
            <p>Critical outages don&apos;t wait.</p>
            <p>Contact Rastaak 24/7 to mobilize a specialized team to your site immediately.</p>
            <p>&nbsp;</p>
            <p>Tell us your scope; we&apos;ll handle the scale.</p>
          </div>
        </div>

        <div className="request-crew__right">
          <div className="request-crew__form-wrapper">
            <form className="form" id="request-crew-form" noValidate>
              <div className="form__row">
                <div className="form__field">
                  <label className="form__label" htmlFor="firstName">
                    {' '}
                    First Name <span className="form__required"> *</span>
                  </label>
                  <input type="text" id="firstName" name="firstName" className="form__input" required data-error-message />
                  <span className="form__error" data-field-error />
                </div>
                <div className="form__field">
                  <label className="form__label" htmlFor="lastName">
                    {' '}
                    Last Name <span className="form__required"> *</span>
                  </label>
                  <input type="text" id="lastName" name="lastName" className="form__input" required data-error-message />
                  <span className="form__error" data-field-error />
                </div>
              </div>

              <div className="form__field form__field--full">
                <label className="form__label" htmlFor="companyName">
                  {' '}
                  Company Name <span className="form__required"> *</span>
                </label>
                <input type="text" id="companyName" name="companyName" className="form__input" required data-error-message />
                <span className="form__error" data-field-error />
              </div>

              <div className="form__field form__field--full">
                <label className="form__label" htmlFor="workEmail">
                  {' '}
                  Work email <span className="form__required"> *</span>
                </label>
                <input type="email" id="workEmail" name="workEmail" className="form__input" required data-error-message />
                <span className="form__error" data-field-error />
              </div>

              <div className="form__field form__field--full">
                <label className="form__label" htmlFor="contactNumber">
                  {' '}
                  Contact Number{' '}
                </label>
                <input type="tel" id="contactNumber" name="contactNumber" className="form__input" data-error-message />
                <span className="form__error" data-field-error />
              </div>

              <div className="form__field form__radio-group">
                <span className="form__label">
                  {' '}
                  Industry <span className="form__required"> *</span>
                </span>
                <div className="form__radio-options">
                  <label className="form__radio">
                    <input type="radio" name="industry" value="nuclear" defaultChecked />
                    <span>Nuclear</span>
                  </label>
                  <label className="form__radio">
                    <input type="radio" name="industry" value="gas" />
                    <span>Gas</span>
                  </label>
                  <label className="form__radio">
                    <input type="radio" name="industry" value="data-centers" />
                    <span>Data Centers</span>
                  </label>
                  <label className="form__radio">
                    <input type="radio" name="industry" value="semiconductor" />
                    <span>Semiconductors</span>
                  </label>
                  <label className="form__radio">
                    <input type="radio" name="industry" value="other" />
                    <span>Other</span>
                  </label>
                </div>
              </div>

              <div className="form__field">
                <div className="form__disclaimer-wrap">
                  <p className="form__disclaimer">
                    {' '}
                    By submitting, you agree that Rastaak collects the information in this form to respond to your staffing inquiry. We do not sell or share it for advertising. See our{' '}
                    <Link href="/privacy">Privacy Policy</Link>.
                  </p>
                  <details className="form__disclaimer-details">
                    <summary>Read more</summary>
                    <span>Categories collected: name, company, email, phone, industry. Submissions are delivered to our team and stored for up to 12 months.</span>
                  </details>
                </div>
              </div>

              <button type="submit" className="pill-btn pill-btn--dark w-100 form__submit">
                <span className="pill-btn-span">Submit</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
