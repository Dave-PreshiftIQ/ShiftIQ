'use client';
import Link from 'next/link';

export default function ClientOnboarding() {
  return (
    <div className="max-w-3xl mx-auto mt-12 p-10 bg-white border border-[#89B3E5] rounded shadow-sm font-arial">
      <h1 className="text-3xl font-bold text-[#154278] mb-8">How ShiftIQ Works</h1>
      <div className="space-y-6 text-[#154278]">
        <Step n={1} title="Complete your assessment."
          body="Answer questions about your operation, technology needs, and priorities. This takes 15-30 minutes depending on your profile." />
        <Step n={2} title="We match you."
          body="Our algorithm compares your profile against pre-audited vendors and generates a scored shortlist - no vendor pays to appear." />
        <Step n={3} title="You review your matches."
          body="You'll see how many vendors match and their fit scores. Vendor identity is revealed only after mutual acceptance." />
        <Step n={4} title="Vendors accept or decline."
          body="Matching vendors review an anonymized summary of your profile and choose whether to accept the lead." />
        <Step n={5} title="Information is exchanged."
          body="Once a vendor accepts, both parties receive each other's contact details and a warm introduction from PreShiftIQ." />
      </div>
      <p className="mt-10 text-[#6B8CAE]">
        Questions? Contact us at <a href="mailto:info@preshiftiq.com" className="text-[#2C6098] underline">info@preshiftiq.com</a>
      </p>
      <Link href="/client/persona" className="inline-block mt-8 bg-[#154278] text-white px-6 py-3 rounded hover:bg-[#2C6098]">
        Start my assessment
      </Link>
    </div>
  );
}
function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="bg-[#EEF5FB] rounded p-5">
      <div className="font-bold text-[#154278] mb-1">Step {n}: {title}</div>
      <div className="text-[#154278]">{body}</div>
    </div>
  );
}
