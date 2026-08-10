'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PillButton } from '../ui/PillButton';

interface FormDataState {
  firstName: string;
  lastName: string;
  companyName: string;
  workEmail: string;
  contactNumber: string;
  industry: string;
}

export const RequestCrewForm: React.FC = () => {
  const [formData, setFormData] = useState<FormDataState>({
    firstName: '',
    lastName: '',
    companyName: '',
    workEmail: '',
    contactNumber: '',
    industry: 'nuclear',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/request-crew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Request failed');

      setIsSuccess(true);
    } catch (err) {
      setErrorMessage('Something went wrong. Please check your information and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-surface-light border border-edge-light shadow-xl text-center space-y-4">
        <div className="w-16 h-16 bg-brand-primary text-content-light rounded-full flex items-center justify-center mx-auto mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-3xl font-bold text-content-dark">Thank you!</h3>
        <p className="text-lg text-content-muted max-w-md mx-auto">
          We&apos;ve received your request and will be in touch immediately to mobilize your specialized crews.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 sm:p-12 rounded-3xl bg-surface-light border border-edge-light shadow-xl space-y-6">
      {errorMessage && (
        <div className="p-4 bg-state-error-surface text-state-error rounded-xl text-sm font-medium">
          {errorMessage}
        </div>
      )}

      {/* Name Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold text-content-muted uppercase mb-2">
            First Name <span className="text-brand-primary">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border border-edge-light bg-surface-muted/50 focus:bg-surface-light focus:border-brand-primary outline-none transition-all text-content-dark"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-content-muted uppercase mb-2">
            Last Name <span className="text-brand-primary">*</span>
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border border-edge-light bg-surface-muted/50 focus:bg-surface-light focus:border-brand-primary outline-none transition-all text-content-dark"
          />
        </div>
      </div>

      {/* Company Name */}
      <div>
        <label className="block text-xs font-semibold text-content-muted uppercase mb-2">
          Company Name <span className="text-brand-primary">*</span>
        </label>
        <input
          type="text"
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 rounded-xl border border-edge-light bg-surface-muted/50 focus:bg-surface-light focus:border-brand-primary outline-none transition-all text-content-dark"
        />
      </div>

      {/* Work Email */}
      <div>
        <label className="block text-xs font-semibold text-content-muted uppercase mb-2">
          Work Email <span className="text-brand-primary">*</span>
        </label>
        <input
          type="email"
          name="workEmail"
          value={formData.workEmail}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 rounded-xl border border-edge-light bg-surface-muted/50 focus:bg-surface-light focus:border-brand-primary outline-none transition-all text-content-dark"
        />
      </div>

      {/* Contact Number */}
      <div>
        <label className="block text-xs font-semibold text-content-muted uppercase mb-2">
          Contact Number
        </label>
        <input
          type="tel"
          name="contactNumber"
          value={formData.contactNumber}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl border border-edge-light bg-surface-muted/50 focus:bg-surface-light focus:border-brand-primary outline-none transition-all text-content-dark"
        />
      </div>

      {/* Industry Radio Group */}
      <div>
        <span className="block text-xs font-semibold text-content-muted uppercase mb-3">
          Industry <span className="text-brand-primary">*</span>
        </span>
        <div className="flex flex-wrap gap-3">
          {[
            { id: 'nuclear', label: 'Nuclear' },
            { id: 'gas', label: 'Gas' },
            { id: 'data-centers', label: 'Data Centers' },
            { id: 'semiconductor', label: 'Semiconductors' },
            { id: 'other', label: 'Other' },
          ].map((item) => (
            <label
              key={item.id}
              className={`cursor-pointer px-5 py-2.5 rounded-full text-sm font-medium border transition-all ${
                formData.industry === item.id
                  ? 'bg-surface-dark text-content-light border-surface-dark'
                  : 'bg-surface-muted/50 text-content-dark border-edge-light hover:border-brand-primary'
              }`}
            >
              <input
                type="radio"
                name="industry"
                value={item.id}
                checked={formData.industry === item.id}
                onChange={handleChange}
                className="sr-only"
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-content-muted pt-2 space-y-1 leading-relaxed">
        <p>
          By submitting, you agree that Rastaak collects the information in this form to respond to your staffing inquiry. We do not sell or share it for advertising. See our{' '}
          <Link href="/privacy" className="underline hover:text-content-dark">
            Privacy Policy
          </Link>
          .
        </p>
        <details className="cursor-pointer text-content-subtle pt-1">
          <summary className="hover:text-content-dark">Read more</summary>
          <span className="block mt-1">
            Categories collected: name, company, email, phone, industry. Submissions are delivered to our team and stored for up to 12 months.
          </span>
        </details>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <PillButton
          type="submit"
          variant="dark"
          disabled={isSubmitting}
          className="w-full py-4 text-base"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </PillButton>
      </div>
    </form>
  );
};
