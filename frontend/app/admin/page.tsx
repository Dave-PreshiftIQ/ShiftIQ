'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Overview = {
  active_clients: number; active_vendors: number;
  pending_leads: number; accepted_leads: number;
  pending_vendor_applications: number;
  pending_answer_updates: number;
  held_sessions: number;
};

export default function AdminOverview() {
  const [o, setO] = useState<Overview | null>(null);

  useEffect(() => {
    fetch('/api/admin/overview').then(r => r.json()).then(setO);
  }, []);

  if (!o) return <p className="text-[#6B8CAE]">Loading...</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#154278] mb-6">Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="Active Clients"               value={o.active_clients}              href="/admin/clients?status=active" />
        <Card label="Active Vendors"               value={o.active_vendors}              href="/admin/vendors?status=active" />
        <Card label="Pending Leads"                value={o.pending_leads}               href="/admin/matches?status=pending" />
        <Card label="Accepted Leads"               value={o.accepted_leads}              href="/admin/matches?status=accepted" />
        <Card label="Pending Vendor Applications"  value={o.pending_vendor_applications} href="/admin/vendors?status=under_review" highlight={o.pending_vendor_applications > 0} />
        <Card label="Pending Answer Updates"       value={o.pending_answer_updates}      href="/admin/change-requests" highlight={o.pending_answer_updates > 0} />
        <Card label="Held Sessions"                value={o.held_sessions}               href="/admin/matches?status=held" highlight={o.held_sessions > 0} />
      </div>
    </div>
  );
}

function Card({ label, value, href, highlight }: { label: string; value: number; href: string; highlight?: boolean }) {
  return (
    <Link href={href}
      className={`block bg-white rounded p-5 border ${highlight ? 'border-[#7B4400] border-2' : 'border-[#89B3E5]'} shadow-sm hover:border-[#2C6098]`}>
      <div className="text-sm text-[#6B8CAE] mb-2">{label}</div>
      <div className="text-4xl font-bold text-[#154278]">{value}</div>
    </Link>
  );
}
