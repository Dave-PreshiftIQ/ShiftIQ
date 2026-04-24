'use client';

import { useEffect, useState } from 'react';

export default function ChangeRequestsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState<'pending'|'approved'|'rejected'>('pending');

  useEffect(() => { void load(); }, [status]);
  async function load() {
    const r = await fetch(`/api/admin/change-requests?status=${status}`);
    const d = await r.json();
    setItems(d.requests ?? []);
  }

  const act = async (id: string, action: 'approve'|'reject', note: string) => {
    await fetch(`/api/admin/change-requests/${id}/${action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }),
    });
    void load();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#154278] mb-2">Answer change requests</h1>
      <div className="flex gap-2 mb-6">
        {(['pending','approved','rejected'] as const).map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-2 rounded ${status === s ? 'bg-[#154278] text-white' : 'bg-white border border-[#89B3E5] text-[#154278]'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="bg-[#EEF5FB] rounded p-8 text-center text-[#6B8CAE]">No {status} requests.</div>
        ) : items.map(cr => <ChangeCard key={cr.id} cr={cr} onAct={act} readOnly={status !== 'pending'} />)}
      </div>
    </div>
  );
}

function ChangeCard({ cr, onAct, readOnly }: { cr: any; onAct: (id: string, a: 'approve'|'reject', n: string) => void; readOnly: boolean }) {
  const [note, setNote] = useState('');
  return (
    <div className="bg-white border border-[#89B3E5] rounded p-5 shadow-sm">
      <div className="flex justify-between mb-3">
        <div>
          <div className="font-bold text-[#154278]">
            {cr.requester_name} <span className="text-[#6B8CAE] text-sm font-normal">({cr.requester_role})</span>
          </div>
          <div className="text-sm text-[#6B8CAE]">{cr.requester_email} - Section {cr.section} - {new Date(cr.created_at).toLocaleString()}</div>
        </div>
        <div className="text-xs text-[#6B8CAE]">{cr.session_type}</div>
      </div>

      {cr.reason && <p className="text-[#154278] text-sm mb-3"><strong>Reason:</strong> {cr.reason}</p>}

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <div className="text-[#6B8CAE] mb-1">Before</div>
          <pre className="bg-[#EEF5FB] p-3 rounded overflow-auto max-h-40 text-[#154278]">{JSON.stringify(cr.old_answers, null, 2)}</pre>
        </div>
        <div>
          <div className="text-[#6B8CAE] mb-1">Proposed</div>
          <pre className="bg-[#EEF5FB] p-3 rounded overflow-auto max-h-40 text-[#154278]">{JSON.stringify(cr.new_answers, null, 2)}</pre>
        </div>
      </div>

      {!readOnly && (
        <>
          <input className="w-full rounded border border-[#89B3E5] px-3 py-2 mb-3 text-[#154278]"
            placeholder="Admin note (optional)" value={note} onChange={e => setNote(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={() => onAct(cr.id, 'approve', note)}
              className="bg-[#154278] text-white px-4 py-2 rounded hover:bg-[#2C6098]">
              Approve {cr.session_type === 'client' && '(triggers re-match)'}
            </button>
            <button onClick={() => onAct(cr.id, 'reject', note)}
              className="border border-[#89B3E5] text-[#154278] px-4 py-2 rounded hover:bg-[#EEF5FB]">
              Reject
            </button>
          </div>
        </>
      )}
    </div>
  );
}
