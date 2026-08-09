'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '../layout/NavigationContext';
import { PillButton } from '../ui/PillButton';

interface ApplyFormData {
  fullName: string;
  email: string;
  phone: string;
  craft: string;
  yearsExperience: string;
  certifications: string;
  resume: File | null;
}

export const ApplyModal: React.FC = () => {
  const { isApplyModalOpen, closeApplyModal } = useNavigation();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ApplyFormData>({
    fullName: '',
    email: '',
    phone: '',
    craft: 'Millwright',
    yearsExperience: '5+',
    certifications: '',
    resume: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, resume: e.target.files![0] }));
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.fullName.trim() || !formData.email.trim()) {
        setErrorMessage('Please fill in your name and email.');
        return;
      }
    }
    setErrorMessage('');
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setErrorMessage('');
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const data = new FormData();
      data.append('fullName', formData.fullName);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('craft', formData.craft);
      data.append('yearsExperience', formData.yearsExperience);
      data.append('certifications', formData.certifications);
      if (formData.resume) {
        data.append('resume', formData.resume);
      }

      const res = await fetch('/api/apply', {
        method: 'POST',
        body: data,
      });

      if (!res.ok) throw new Error('Submission failed');

      setIsSuccess(true);
    } catch (err) {
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setIsSuccess(false);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      craft: 'Millwright',
      yearsExperience: '5+',
      certifications: '',
      resume: null,
    });
    closeApplyModal();
  };

  return (
    <AnimatePresence>
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeApplyModal}
            className="fixed inset-0 bg-surface-dark/60 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-surface-light rounded-3xl p-8 shadow-2xl z-10 overflow-hidden border border-edge-light"
          >
            {/* Close Button */}
            <button
              onClick={closeApplyModal}
              className="absolute top-6 right-6 p-2 text-content-muted hover:text-content-dark transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect y="14.1421" width="20" height="2" transform="rotate(-45 0 14.1421)" fill="currentColor" />
                <rect x="1.41406" y="0.000610352" width="20" height="2" transform="rotate(45 1.41406 0.000610352)" fill="currentColor" />
              </svg>
            </button>

            {isSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-brand-primary text-content-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-content-dark mb-2">Application Received!</h3>
                <p className="text-content-muted mb-6">
                  Thank you for applying to Rastaak. Our recruiting team will review your profile and reach out for upcoming project dispatches.
                </p>
                <PillButton variant="dark" onClick={handleReset}>
                  Close
                </PillButton>
              </div>
            ) : (
              <div>
                {/* Header & Steps */}
                <div className="mb-6">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                    Step {step} of 3
                  </span>
                  <h2 className="text-2xl font-bold text-content-dark mt-1">
                    {step === 1 && 'Personal Information'}
                    {step === 2 && 'Craft & Experience'}
                    {step === 3 && 'Certifications & Resume'}
                  </h2>
                </div>

                {errorMessage && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={step === 3 ? handleSubmit : handleNext} className="space-y-4">
                  {step === 1 && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                          placeholder="John Smith"
                          className="w-full px-4 py-3 rounded-xl border border-edge-light bg-surface-muted/50 focus:bg-surface-light focus:border-brand-primary outline-none transition-all text-content-dark"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="john@example.com"
                          className="w-full px-4 py-3 rounded-xl border border-edge-light bg-surface-muted/50 focus:bg-surface-light focus:border-brand-primary outline-none transition-all text-content-dark"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="(555) 000-0000"
                          className="w-full px-4 py-3 rounded-xl border border-edge-light bg-surface-muted/50 focus:bg-surface-light focus:border-brand-primary outline-none transition-all text-content-dark"
                        />
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                          Primary Craft / Trade *
                        </label>
                        <select
                          name="craft"
                          value={formData.craft}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-edge-light bg-surface-muted/50 focus:bg-surface-light focus:border-brand-primary outline-none transition-all text-content-dark cursor-pointer"
                        >
                          <option value="Millwright">Precision Millwright</option>
                          <option value="Electrician">Industrial Electrician</option>
                          <option value="Pipefitter">Pipefitter / Steamfitter</option>
                          <option value="Boilermaker">Boilermaker</option>
                          <option value="Instrumentation">I&C Technician</option>
                          <option value="Welder">Certified Combo Welder</option>
                          <option value="Machinist">Field Machinist</option>
                          <option value="Laborer">Nuclear Decontamination / Labor</option>
                          <option value="Engineer">Outage Engineer / Planner</option>
                          <option value="Other">Other Craft</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                          Years of Industrial Experience
                        </label>
                        <select
                          name="yearsExperience"
                          value={formData.yearsExperience}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-edge-light bg-surface-muted/50 focus:bg-surface-light focus:border-brand-primary outline-none transition-all text-content-dark cursor-pointer"
                        >
                          <option value="1-3">1 - 3 Years</option>
                          <option value="3-5">3 - 5 Years</option>
                          <option value="5+">5 - 10 Years</option>
                          <option value="10+">10+ Years (Senior)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                          Key Certifications (e.g. OSHA 30, TWIC, Nuclear Badged)
                        </label>
                        <textarea
                          name="certifications"
                          value={formData.certifications}
                          onChange={handleChange}
                          rows={3}
                          placeholder="OSHA 30, TWIC, Unescorted Nuclear Access, NCCER, EPRI..."
                          className="w-full px-4 py-3 rounded-xl border border-edge-light bg-surface-muted/50 focus:bg-surface-light focus:border-brand-primary outline-none transition-all text-content-dark resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                          Upload Resume / Certs (Optional)
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="w-full text-sm text-content-muted file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-surface-muted file:text-content-dark hover:file:bg-brand-primary hover:file:text-content-light file:cursor-pointer transition-all"
                        />
                      </div>
                    </>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-edge-light">
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="text-sm font-semibold text-content-muted hover:text-content-dark transition-colors"
                      >
                        Back
                      </button>
                    ) : (
                      <div />
                    )}

                    <PillButton
                      type="submit"
                      variant="dark"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? 'Submitting...'
                        : step === 3
                        ? 'Submit Application'
                        : 'Next Step'}
                    </PillButton>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
