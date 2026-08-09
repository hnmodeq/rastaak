import { IndustryCard, IndustryItem } from '@/components/industries/IndustryCard';
import { CtaBanner } from '@/components/home/CtaBanner';

const industriesData: IndustryItem[] = [
  {
    id: 'nuclear',
    title: 'Nuclear Power Generation',
    desc: 'Unescorted access, zero-tolerance badging, and precision outage execution. We mobilize badged craft contractors cleared through strict fitness-for-duty compliance before Day 1.',
    image: '/_astro/industry-nuclear.CXIgxjA8_8Nn67.png',
    roles: ['Turbine Millwrights', 'I&C Technicians', 'Certified Riggers', 'Radiation Protection'],
  },
  {
    id: 'gas',
    title: 'Gas & Thermal Power',
    desc: 'Rapid emergency turnaround teams for combustion turbine overhauls, balance-of-plant maintenance, and critical peak-demand operational shifts.',
    image: '/_astro/industry-gas.ndQLtgaB_Z1o8TCf.png',
    roles: ['Combustion Mechanics', 'High-Pressure Welders', 'Valve Specialists', 'Pipefitters'],
  },
  {
    id: 'datacenter',
    title: 'Data Center Infrastructure',
    desc: 'High-density electrical and mechanical installations requiring continuous uptime, cleanroom protocols, and rapid commissioning cycles.',
    image: '/_astro/industry-datacenter.D7EBVRFq_Z2r0RX8.png',
    roles: ['HVAC Chiller Mechanics', 'Switchgear Electricians', 'Cable Splicers', 'Controls Engineers'],
  },
  {
    id: 'semiconductor',
    title: 'Semiconductor Fabrication',
    desc: 'Ultra-pure piping, precision cleanroom tool hookups, and specialized facility expansions delivered with sub-millimeter tolerances.',
    image: '/_astro/industry-semiconductor.BVsaldkv_Z1U3snI.png',
    roles: ['Orbital Welders', 'Ultra-Pure Gas Fitters', 'Cleanroom Millwrights', 'QA/QC Inspectors'],
  },
];

export default function IndustriesPage() {
  return (
    <div className="w-full pt-32">
      {/* Sub-Hero Header */}
      <section className="px-6 md:px-12 pb-16 max-w-5xl">
        <h1 className="text-5xl sm:text-7xl font-medium tracking-tight text-content-dark leading-tight">
          Precision staffing for high-consequence industries.
        </h1>
        <p className="mt-6 text-xl sm:text-2xl text-content-muted max-w-2xl font-normal leading-relaxed">
          From scheduled refueling outages to unplanned emergency trips, we provide verified craft teams engineered for critical path endurance.
        </p>
      </section>

      {/* Sticky Stack Industry Cards */}
      <section className="px-6 md:px-12 pb-24 max-w-7xl mx-auto">
        <div className="space-y-12">
          {industriesData.map((item, idx) => (
            <IndustryCard key={item.id} industry={item} index={idx} />
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <CtaBanner
        title="Ready to mobilize industrial-grade craft for your site?"
        buttonText="Request Crews Now"
        buttonHref="/request-crew"
      />
    </div>
  );
}
