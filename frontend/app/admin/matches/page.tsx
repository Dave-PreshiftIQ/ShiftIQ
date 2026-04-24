'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AdminMatches() {
  const params = useSearchParams();
  const [status, setStatus] = useState(params.get('status') ?? '');
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/admin/matches${status ? `?status=${status}` : ''}`).then(r => r.json()).then(d => setMatches(d.matches ?? []));
  }, [status]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#154278] mb-4">Matches</h1>
      <div className="flex gap-2 mb-6">
        {['', 'pending', 'accepted', 'declined', 'held'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1 rounded ${status === s ? 'bg-[#154278] text-white' : 'bg-white border border-[#89B3E5] text-[#154278]'}`}>
            {s || 'all'}
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#89B3E5] rounded">
        {matches.length === 0 ? <div className="p-8 text-center text-[#6B8CAE]">No matches in this view.</div>
          : matches.map((m, i) => (
          <div key={m.id} className={`flex items-center gap-4 p-4 ${i % 2 ? 'bg-[#EEF5FB]' : 'bg-white'}`}>
            <div className="flex-1">
              <div className="font-bold text-[#154278]">{m.client_company} and {m.vendor_company}</div>
              <div className="text-sm text-[#6B8CAE]">
                Score {Number(m.total_score).toFixed(0)} - {m.tier}
                {m.vendor_accepted && ' - accepted'}
                {m.vendor_declined && ' - declined'}
                {m.intro_sent_at && ' - intro sent'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
