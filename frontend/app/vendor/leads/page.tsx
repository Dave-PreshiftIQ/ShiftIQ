'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function VendorLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);
  async function load() {
    const r = await fetch('/api/vendor/leads');
    const d = await r.json();
    setLeads(d.leads ?? []);
    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto mt-8 p-8 font-arial">
      <h1 className="text-3xl font-bold text-[#154278] mb-2">Your client leads</h1>
      <p className="text-[#6B8CAE] mb-8">Client identity is revealed only after you accept the lead and the $250 lead fee is paid.</p>

      {loading ? <p className="text-[#6B8CAE]">Loading...</p>
        : leads.length === 0 ? (
          <div className="bg-[#EEF5FB] rounded p-8 text-center text-[#6B8CAE]">
            No leads yet. You'll be notified when a client matches.
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map(l => <LeadCard key={l.match_id} lead={l} />)}
          </div>
        )}
    </div>
  );
}

function LeadCard({ lead }: { lead: any }) {
  const tierBg: Record<string, string> = { strong: '#154278', good: '#2E7D32', conditional: '#7B4400', not_recommended: '#8B1A1A' };
  const tierLabel: Record<string, string> = { strong: 'Strong Match', good: 'Good Match', conditional: 'Conditional', not_recommended: 'Not Recommended' };

  return (
    <div className="bg-white border border-[#89B3E5] rounded p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-sm text-[#6B8CAE] mb-1">Match #{lead.match_id.slice(0, 8)}</div>
          <div className="flex flex-wrap gap-2">
            {(lead.persona_tags ?? []).map((p: string) => (
              <span key={p} className="px-2 py-1 bg-[#EEF5FB] text-[#154278] text-xs rounded">{p}</span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-[#154278]">{Number(lead.total_score).toFixed(0)}</div>
          <div className="inline-block px-3 py-1 text-white text-xs font-bold rounded" style={{ backgroundColor: tierBg[lead.tier] }}>
            {tierLabel[lead.tier]}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        {lead.freight_spend_range && <Row label="Freight spend" value={String(lead.freight_spend_range).replace(/"/g,'')} />}
        {Array.isArray(lead.modes) && <Row label="Modes" value={lead.modes.join(', ')} />}
        {Array.isArray(lead.current_systems) && <Row label="Current systems" value={lead.current_systems.join(', ')} />}
        {Array.isArray(lead.watch_points) && lead.watch_points.length > 0 && (
          <Row label="Watch points" value={lead.watch_points.join(', ')} />
        )}
      </div>

      {lead.vendor_accepted
        ? <div className="bg-[#EEF5FB] rounded p-3 text-[#154278] text-sm">You accepted this lead on {new Date(lead.accepted_at).toLocaleDateString()}.</div>
        : <Link href={`/vendor/leads/${lead.match_id}`}
            className="inline-block bg-[#154278] text-white px-4 py-2 rounded hover:bg-[#2C6098]">
            Review & accept
          </Link>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[#6B8CAE]">{label}</div>
      <div className="text-[#154278] font-bold">{value}</div>
    </div>
  );
}
