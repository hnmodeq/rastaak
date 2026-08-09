import Image from 'next/image';
import { MissionAccordion } from '@/components/mission/MissionAccordion';
import { CtaBanner } from '@/components/home/CtaBanner';
import { PillButton } from '@/components/ui/PillButton';

export default function MissionPage() {
  return (
    <div className="w-full pt-32">
      {/* Sub-Hero */}
      <section className="px-6 md:px-12 pb-16 max-w-5xl">
        <h1 className="text-5xl sm:text-7xl font-medium tracking-tight text-content-dark leading-tight">
          Eliminating friction from industrial operations.
        </h1>
        <p className="mt-6 text-xl sm:text-2xl text-content-muted max-w-2xl font-normal leading-relaxed">
          Traditional industrial staffing is slow, reactive, and riddled with middleman margins. We built Vectr to turn workforce mobilization into instant operational logistics.
        </p>
      </section>

      {/* Accordion Highlights */}
      <section className="px-6 md:px-12 py-16 max-w-6xl mx-auto">
        <MissionAccordion />
      </section>

      {/* Middleman vs Vectr Operational Engine */}
      <section className="px-6 md:px-12 py-24 bg-surface-light border-y border-edge-light">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
              The Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-content-dark mt-2 mb-6 leading-tight">
              Direct connection. Zero markups.
            </h2>
            <p className="text-lg text-content-muted leading-relaxed mb-8">
              Legacy staffing agencies add layers of recruiters, account reps, and manual resume hand-offs that slow down mobilization and inflate contractor overhead. Vectr routes requirements directly to verified field craft in real time.
            </p>
            <PillButton variant="dark" href="/request-crew">
              Experience the difference
            </PillButton>
          </div>

          <div className="rounded-3xl overflow-hidden shadow-2xl border border-edge-light">
            <Image
              src="/_astro/middleman.CJLvokG8_Z2w7sR7.png"
              alt="Legacy Middleman Friction Diagram"
              width={800}
              height={500}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* Outcome Worker Section */}
      <section className="px-6 md:px-12 py-24 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="w-full lg:w-1/2 rounded-3xl overflow-hidden shadow-xl border border-edge-light">
            <Image
              src="/_astro/outcome-worker.CbAlTw26_1CzUqb.png"
              alt="Controlled Outcomes Worker"
              width={800}
              height={500}
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="w-full lg:w-1/2 space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
              The Result
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-content-dark leading-tight">
              Engineered for project completion.
            </h2>
            <p className="text-lg text-content-muted leading-relaxed">
              Every worker dispatched by Vectr is field-verified, badged, and equipped with site-specific reporting details. From initial gate clearance to the final shift handover, your project remains fully manned and protected.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <CtaBanner
        title="Ready to transform your industrial outage staffing?"
        buttonText="Request Crews"
        buttonHref="/request-crew"
      />
    </div>
  );
}
