'use client';

import React from 'react';
import Image from 'next/image';
import { useNavigation } from '@/components/layout/NavigationContext';
import { PillButton } from '@/components/ui/PillButton';
import { CtaBanner } from '@/components/home/CtaBanner';

export default function ApplyPage() {
  const { openApplyModal } = useNavigation();

  return (
    <div className="w-full pt-32">
      {/* Sub-Hero Header */}
      <section className="px-6 md:px-12 pb-16 max-w-5xl">
        <h1 className="text-5xl sm:text-7xl font-medium tracking-tight text-content-dark leading-tight">
          Great projects rely
          <br />
          on great people.
        </h1>
        <p className="mt-6 text-xl sm:text-2xl text-content-muted max-w-2xl font-normal leading-relaxed">
          We continuously source top industry talent, from engineers to precision millwrights. So when work begins, the right team is already in place.
        </p>
        <div className="mt-8">
          <PillButton variant="dark" onClick={openApplyModal} className="text-base px-8 py-4">
            Apply Now to Vectr
          </PillButton>
        </div>
      </section>

      {/* Sticky Stack Feature Sections */}
      <section className="px-6 md:px-12 pb-24 max-w-7xl mx-auto space-y-16">
        {/* Item 1 */}
        <div className="sticky-stack__item p-8 sm:p-12 rounded-3xl bg-surface-light border border-edge-light shadow-2xl flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
          <div className="w-full lg:w-1/2 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
              Proactive Sourcing
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-content-dark">
              The search never stops
            </h2>
            <p className="text-base sm:text-lg text-content-muted leading-relaxed">
              We don&apos;t wait for an outage to start looking for a crew. We are constantly scouting for top-tier tradespeople. Whether you are available right now or locked in on another job for six months, we want to know who you are.
            </p>
          </div>
          <div className="w-full lg:w-1/2 rounded-2xl overflow-hidden shadow-lg border border-edge-light">
            <Image
              src="/_astro/apply-search.DV53RPfL_1nIG7.png"
              alt="Professional reviewing work"
              width={800}
              height={500}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Item 2 */}
        <div className="sticky-stack__item p-8 sm:p-12 rounded-3xl bg-surface-light border border-edge-light shadow-2xl flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
          <div className="w-full lg:w-1/2 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
              High-Stakes Excellence
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-content-dark">
              Skill is our currency
            </h2>
            <p className="text-base sm:text-lg text-content-muted leading-relaxed">
              We specialize in high-stakes environments. Nuclear, gas, data infrastructure. In these industries, precision isn&apos;t optional. We prioritize talent, experience, and certification above all else. If you take pride in your craft, you belong here.
            </p>
          </div>
          <div className="w-full lg:w-1/2 rounded-2xl overflow-hidden shadow-lg border border-edge-light">
            <Image
              src="/_astro/apply-skill.D1gb7yac_Zexoil.png"
              alt="Precision skill in action"
              width={800}
              height={500}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Item 3 */}
        <div className="sticky-stack__item p-8 sm:p-12 rounded-3xl bg-surface-light border border-edge-light shadow-2xl flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
          <div className="w-full lg:w-1/2 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
              Continuous Opportunity
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-content-dark">
              Always open doors
            </h2>
            <p className="text-base sm:text-lg text-content-muted leading-relaxed">
              Once you clear our verification process, you join our premier industrial network with direct access to continuous critical-path outage deployments and competitive contractor compensation.
            </p>
          </div>
          <div className="w-full lg:w-1/2 rounded-2xl overflow-hidden shadow-lg border border-edge-light">
            <Image
              src="/_astro/apply-door.CA6YLUcA_1bcsRC.png"
              alt="Industrial entrance and doors"
              width={800}
              height={500}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <CtaBanner
        title="Ready to join the elite network of industrial craft?"
        buttonText="Apply to Vectr Now"
        buttonHref="#"
      />
    </div>
  );
}
