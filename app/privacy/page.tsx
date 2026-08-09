import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="w-full pt-32 pb-24 px-6 md:px-12 max-w-4xl mx-auto">
      <h1 className="text-4xl sm:text-6xl font-bold text-content-dark tracking-tight mb-8">
        Privacy Policy
      </h1>

      <div className="prose prose-lg text-content-muted space-y-8 leading-relaxed">
        <p className="text-sm text-content-subtle">
          Last updated: January 2026
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-content-dark">1. Overview</h2>
          <p>
            Vectr, Inc. (&quot;Vectr&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy describes how we collect, use, and share information about you when you visit our website, apply for trade positions, or submit staffing inquiries.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-content-dark">2. Information We Collect</h2>
          <p>
            We collect personal information that you provide directly to us when requesting craft crews or submitting trade applications:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Contact details: name, business email, telephone number, and employer company name.</li>
            <li>Professional profile: craft trade, years of experience, certifications (OSHA, TWIC, badging), and uploaded resumes.</li>
            <li>Operational metadata: site locations, outage timelines, and craft requirements.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-content-dark">3. How We Use Information</h2>
          <p>
            We use collected information solely for business operations:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>To match verified contractors with high-consequence project scopes.</li>
            <li>To verify credentials, badging, and fitness-for-duty compliance.</li>
            <li>To respond to inbound crew mobilization inquiries and schedule dispatches.</li>
          </ul>
          <p className="font-semibold text-content-dark">
            We do not sell or share personal information for third-party cross-context behavioral advertising.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-content-dark">4. Your Privacy Rights</h2>
          <p>
            California and state residents have specific rights regarding personal data access, deletion, and correction. To submit a request, visit our{' '}
            <Link href="/privacy-request" className="text-brand-primary underline">
              Privacy Request page
            </Link>
            .
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-content-dark">5. Contact Us</h2>
          <p>
            If you have questions about this policy, contact our compliance team at{' '}
            <a href="mailto:privacy@vectrfl.com" className="text-brand-primary underline">
              privacy@vectrfl.com
            </a>
            {' '}or by mail at:
          </p>
          <p className="p-4 bg-surface-light border border-edge-light rounded-xl font-mono text-sm">
            Vectr, Inc.
            <br />
            480 N Orlando Ave, Suite 236
            <br />
            Winter Park, FL 32789, United States
          </p>
        </section>
      </div>
    </div>
  );
}
