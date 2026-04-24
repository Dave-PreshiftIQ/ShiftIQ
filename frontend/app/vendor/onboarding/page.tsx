'use client';
import Link from 'next/link';

export default function VendorOnboarding() {
  return (
    <div className="max-w-3xl mx-auto mt-12 p-10 bg-white border border-[#89B3E5] rounded shadow-sm font-arial">
      <h1 className="text-3xl font-bold text-[#154278] mb-8">How Vendor Participation Works</h1>
      <div className="space-y-6 text-[#154278]">
        <Step n={1} title="Complete the Vendor Audit Form."
          body="Fill out the PreShiftIQ Vendor Audit Scorecard to the best of your ability." />
        <Step n={2} title="Schedule a review meeting."
          body="Once submitted, we will schedule a 60-minute audit walkthrough. This is required before activation." />
        <Step n={3} title="Become active."
          body="After the audit meeting, your vendor record is activated and you become eligible for client matches." />
        <Step n={4} title="Review client leads."
          body="When a client matches, you receive an anonymized Client Card: persona, freight spend, modes, current systems, match score. No client identity at this stage." />
        <Step n={5} title="Accept or decline."
          body="Check the acceptance box, agree to terms ($250 lead fee), client contact details are released." />
      </div>
      <p className="mt-10 text-[#6B8CAE]">
        Questions? Fill out the form or contact us at <a href="mailto:info@preshiftiq.com" className="text-[#2C6098] underline">info@preshiftiq.com</a>
      </p>
      <Link href="/vendor/audit" className="inline-block mt-8 bg-[#154278] text-white px-6 py-3 rounded hover:bg-[#2C6098]">
        Start the Vendor Audit
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
