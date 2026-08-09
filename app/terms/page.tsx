export default function TermsPage() {
  return (
    <div className="w-full pt-32 pb-24 px-6 md:px-12 max-w-4xl mx-auto">
      <h1 className="text-4xl sm:text-6xl font-bold text-content-dark tracking-tight mb-8">
        Terms of Service
      </h1>

      <div className="prose prose-lg text-content-muted space-y-8 leading-relaxed">
        <p className="text-sm text-content-subtle">
          Last updated: January 2026
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-content-dark">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Vectr platform, websites, and mobilization services, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use our services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-content-dark">2. Industrial Staffing & Mobilization</h2>
          <p>
            Vectr connects industrial plant operators, EPC contractors, and outage directors with verified craft specialists. All dispatches, rates, and scopes of work are governed by master service agreements (MSAs) and project work orders.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-content-dark">3. Verification & Compliance</h2>
          <p>
            Craft contractors must maintain valid certifications, background clearance, and fitness-for-duty standards required by facility site badging offices. Providing falsified credentials constitutes immediate termination and removal from the platform.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-content-dark">4. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Vectr, Inc. shall not be liable for indirect, incidental, or consequential damages resulting from project delays, outage timeline shifts, or third-party contractor actions.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-content-dark">5. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law principles.
          </p>
        </section>
      </div>
    </div>
  );
}
