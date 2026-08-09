import { RequestCrewForm } from '@/components/forms/RequestCrewForm';

export default function RequestCrewPage() {
  return (
    <div className="w-full pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-start">
        {/* Left Intro */}
        <div className="lg:w-1/2 space-y-6">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
            24/7 Outage Response
          </span>
          <h1 className="text-5xl sm:text-7xl font-medium tracking-tight text-content-dark leading-tight">
            Request Crews
          </h1>
          <div className="space-y-4 text-xl sm:text-2xl text-content-muted leading-relaxed">
            <p>Critical outages don&apos;t wait.</p>
            <p>Contact Vectr 24/7 to mobilize a specialized team to your site immediately.</p>
            <p className="font-semibold text-content-dark pt-4">
              Tell us your scope; we&apos;ll handle the scale.
            </p>
          </div>
        </div>

        {/* Right Form */}
        <div className="w-full lg:w-1/2">
          <RequestCrewForm />
        </div>
      </div>
    </div>
  );
}
