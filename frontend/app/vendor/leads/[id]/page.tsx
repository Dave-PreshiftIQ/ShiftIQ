'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const LEAD_TERMS = `PreShiftIQ Lead Exchange Agreement

1. By accepting this lead, Vendor agrees to pay a non-refundable Lead Fee of $250.00 USD, charged at the moment of acceptance.
2. Upon successful payment, PreShiftIQ will release the Client's contact details (name, business email, phone, company) to Vendor, and will release Vendor's contact details to the Client.
3. Vendor agrees to conduct outreach in a professional manner and in accordance with all applicable laws (including but not limited to CAN-SPAM, TCPA, and GDPR where applicable).
4. Vendor is prohibited from reselling, sharing, or re-exposing Client contact information to any third party.
5. The Lead Fee is non-refundable except in the case of a verified duplicate charge, fraudulent charge, or material error by PreShiftIQ.
6. PreShiftIQ makes no representation or warranty regarding the Client's likelihood to purchase. Vendor assumes all commercial risk.
7. This Agreement does not create any employment, agency, joint venture, or partnership relationship between Vendor and PreShiftIQ.
8. Any disputes will be governed by the laws of the State of Illinois, USA, and resolved in the courts of DuPage County, Illinois.
9. Vendor represents that the individual accepting this lead has authority to bind Vendor to these terms.
10. PreShiftIQ reserves the right to suspend or terminate Vendor participation for violations of these terms.
`;

export default function AcceptLead() {
  const { id } = useParams<{ id: string }>();
  return (
    <Elements stripe={stripePromise}>
      <AcceptLeadInner id={id} />
    </Elements>
  );
}

function AcceptLeadInner({ id }: { id: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const termsRef = useRef<HTMLDivElement>(null);

  const [lead, setLead] = useState<any>(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<any>(null);

  useEffect(() => { void load(); }, []);
  async function load() {
    const r = await fetch('/api/vendor/leads');
    const d = await r.json();
    setLead((d.leads ?? []).find((x: any) => x.match_id === id));
  }

  const onScroll = () => {
    const el = termsRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) setScrolledToEnd(true);
  };

  const onAccept = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true); setError(null);

    const card = elements.getElement(CardElement);
    if (!card) { setSubmitting(false); return; }

    const { paymentMethod, error: pmErr } = await stripe.createPaymentMethod({ type: 'card', card });
    if (pmErr) { setError(pmErr.message ?? 'Card error'); setSubmitting(false); return; }

    const res = await fetch(`/api/vendor/leads/${id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terms_accepted: true, payment_method_id: paymentMethod.id }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Acceptance failed'); setSubmitting(false); return; }

    setAccepted(data);
    setSubmitting(false);
  };

  if (!lead) return <div className="max-w-3xl mx-auto mt-12 p-8 font-arial text-[#6B8CAE]">Loading...</div>;

  if (accepted) {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-10 bg-white border border-[#89B3E5] rounded shadow-sm font-arial">
        <h1 className="text-3xl font-bold text-[#154278] mb-3">Lead accepted.</h1>
        <p className="text-[#154278] mb-6">The client's contact details are below. A warm introduction from Dave is on its way.</p>
        <div className="bg-[#EEF5FB] rounded p-5 space-y-1 text-[#154278]">
          <div><span className="text-[#6B8CAE]">Name:</span> <strong>{accepted.client.name}</strong></div>
          <div><span className="text-[#6B8CAE]">Company:</span> <strong>{accepted.client.company}</strong></div>
          <div><span className="text-[#6B8CAE]">Email:</span> <strong>{accepted.client.email}</strong></div>
          <div><span className="text-[#6B8CAE]">Phone:</span> <strong>{accepted.client.phone}</strong></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 p-10 bg-white border border-[#89B3E5] rounded shadow-sm font-arial">
      <h1 className="text-2xl font-bold text-[#154278] mb-2">Accept lead</h1>
      <p className="text-[#6B8CAE] mb-6">Match score: {Number(lead.total_score).toFixed(0)} - {lead.tier.replace('_',' ')}</p>

      <div className="bg-[#EEF5FB] rounded p-4 mb-6 text-sm text-[#154278]">
        <strong>Lead Fee:</strong> $250.00 USD, charged at the moment of acceptance. Non-refundable per the Lead Exchange Agreement below.
      </div>

      <h2 className="text-lg font-bold text-[#154278] mb-2">Lead Exchange Agreement</h2>
      <p className="text-sm text-[#6B8CAE] mb-2">Please scroll to the end before confirming.</p>
      <div ref={termsRef} onScroll={onScroll}
        className="h-64 overflow-y-scroll bg-[#EEF5FB] rounded p-4 text-sm text-[#154278] whitespace-pre-wrap mb-4">
        {LEAD_TERMS}
      </div>

      <label className="flex items-start gap-2 mb-4 text-sm text-[#154278]">
        <input type="checkbox" disabled={!scrolledToEnd} checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1" />
        <span>I have read and agree to the PreShiftIQ Lead Exchange Agreement, including the $250 non-refundable Lead Fee.</span>
      </label>

      <div className="mb-4">
        <label className="block text-sm text-[#6B8CAE] mb-2">Payment details</label>
        <div className="border border-[#89B3E5] rounded p-3">
          <CardElement options={{ style: { base: { fontFamily: 'Arial', fontSize: '16px', color: '#154278' } } }} />
        </div>
      </div>

      {error && <p className="text-[#8B1A1A] text-sm mb-3">{error}</p>}

      <button disabled={!scrolledToEnd || !agreed || submitting} onClick={onAccept}
        className="bg-[#154278] text-white px-6 py-3 rounded hover:bg-[#2C6098] disabled:opacity-50">
        {submitting ? 'Processing...' : 'Accept lead & pay $250'}
      </button>
    </div>
  );
}
