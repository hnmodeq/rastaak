import Link from 'next/link';

export default function PrivacyRequestPage() {
  return (
    <div className="w-full pt-32 pb-24 px-6 md:px-12 max-w-4xl mx-auto">
      <h1 className="text-4xl sm:text-6xl font-bold text-content-dark tracking-tight mb-8">
        Submit a Privacy Request
      </h1>

      <p className="text-xl text-content-muted leading-relaxed mb-12">
        California residents and state consumers can exercise their privacy rights under CCPA/CPRA by contacting our privacy compliance department. We respond to all verified inquiries within 45 days.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: How this works */}
        <div className="p-8 rounded-3xl bg-surface-light border border-edge-light shadow-lg space-y-4">
          <h2 className="text-2xl font-bold text-content-dark">How this works</h2>
          <p className="text-base text-content-muted leading-relaxed">
            You can request to know what personal information we hold, request deletion, correct inaccurate details, or restrict processing.
          </p>
          <p className="text-base text-content-muted leading-relaxed">
            We will verify your identity before processing any record changes to ensure protection against unauthorized access.
          </p>
        </div>

        {/* Right: How to contact */}
        <div className="p-8 rounded-3xl bg-surface-light border border-edge-light shadow-lg space-y-4">
          <h2 className="text-2xl font-bold text-content-dark">Contact Methods</h2>
          <ul className="space-y-4 text-base text-content-muted">
            <li>
              <strong className="block text-content-dark">Email:</strong>
              <a href="mailto:privacy@vectrfl.com?subject=Privacy%20Request" className="text-brand-primary underline">
                privacy@vectrfl.com
              </a>
              <span className="block text-xs text-content-subtle mt-0.5">Include &quot;Privacy Request&quot; in subject line.</span>
            </li>
            <li>
              <strong className="block text-content-dark">Postal Mail:</strong>
              <span>Vectr, Inc., 480 N Orlando Ave, Suite 236, Winter Park, FL 32789, USA</span>
            </li>
          </ul>
          <div className="pt-2">
            <Link href="/privacy" className="text-sm font-semibold text-brand-primary underline">
              View Full Privacy Policy →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
