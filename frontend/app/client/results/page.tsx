'use client';

import { useEffect, useState } from 'react';

export default function Results() {
  const [matches, setMatches] = useState<any[]>([]);
  const [holdMessage, setHoldMessage] = useState<string | null>(null);

  useEffect(() => { void fetchMatches(); }, []);
  async function fetchMatches() {
    const r = await fetch('/api/client/matches');
    const d = await r.json();
    setMatches(d.matches ?? []);
    if (d.held) setHoldMessage(d.hold_message);
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 p-10 bg-white border border-[#89B3E5] rounded shadow-sm font-arial">
      <h1 className="text-3xl font-bold text-[#154278] mb-4">You're matched.</h1>

      {holdMessage ? (
        <div className="bg-[#EEF5FB] border border-[#89B3E5] rounded p-5 mb-6">
          <div className="font-bold text-[#154278] mb-1">Your matches are under manual review</div>
          <div className="text-[#154278] text-sm">{holdMessage}</div>
        </div>
      ) : (
        <p className="text-lg text-[#154278] mb-8">
          Your profile has been matched with <span className="font-bold">{matches.length}</span> vendor{matches.length === 1 ? '' : 's'}.
          Vendors are being notified and will review your anonymous profile.
        </p>
      )}

      <div className="space-y-3">
        {matches.map(m => (
          <div key={m.id} className="bg-[#EEF5FB] rounded p-5">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                {m.accepted ? (
                  <RevealedVendor matchId={m.id} />
                ) : (
                  <>
                    <div className="font-bold text-[#154278]">Vendor {m.masked_id}</div>
                    <div className="text-sm text-[#6B8CAE]">Identity revealed after vendor acceptance</div>
                  </>
                )}
              </div>
              <ScoreBadge score={m.total_score} tier={m.tier} />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm text-[#6B8CAE]">
        You'll be notified by email as vendors accept. Questions? <a href="mailto:info@preshiftiq.com" className="text-[#2C6098] underline">info@preshiftiq.com</a>
      </p>
    </div>
  );
}

function RevealedVendor({ matchId }: { matchId: string }) {
  const [vendor, setVendor] = useState<any>(null);
  useEffect(() => {
    fetch(`/api/client/matches/${matchId}/vendor-contact`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.vendor && setVendor(d.vendor));
  }, [matchId]);
  if (!vendor) return <div className="text-[#6B8CAE] text-sm">Loading vendor details...</div>;
  return (
    <div className="text-[#154278]">
      <div className="font-bold">{vendor.company}</div>
      <div className="text-sm">{vendor.name} - <a href={`mailto:${vendor.email}`} className="text-[#2C6098] underline">{vendor.email}</a> - {vendor.phone}</div>
    </div>
  );
}

function ScoreBadge({ score, tier }: { score: number; tier: string }) {
  const map: Record<string, { bg: string; label: string }> = {
    strong:         { bg: '#154278', label: 'Strong Match' },
    good:           { bg: '#2E7D32', label: 'Good Match' },
    conditional:    { bg: '#7B4400', label: 'Conditional' },
    not_recommended:{ bg: '#8B1A1A', label: 'Not Recommended' },
  };
  const s = map[tier] ?? map.conditional;
  return (
    <div className="text-right">
      <div className="text-2xl font-bold text-[#154278]">{Number(score).toFixed(0)}</div>
      <div className="inline-block px-3 py-1 text-white text-xs font-bold rounded" style={{ backgroundColor: s.bg }}>
        {s.label}
      </div>
    </div>
  );
}
