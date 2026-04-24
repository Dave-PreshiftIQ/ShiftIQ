'use client';

import { useEffect, useState } from 'react';

export default function AuditLog() {
  const [entries, setEntries] = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => { void load(); }, [actionFilter]);
  async function load() {
    const r = await fetch(`/api/admin/audit-log${actionFilter ? `?action=${actionFilter}` : ''}`);
    const d = await r.json();
    setEntries(d.entries ?? []);
  }

  const actions = Array.from(new Set(entries.map(e => e.action))).sort();

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#154278] mb-4">Audit log</h1>
      <select className="mb-6 rounded border border-[#89B3E5] px-3 py-2 text-[#154278]"
        value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
        <option value="">All actions</option>
        {actions.map(a => <option key={a} value={a}>{a}</option>)}
      </select>

      <div className="bg-white border border-[#89B3E5] rounded">
        {entries.map((e, i) => (
          <details key={e.id} className={`p-4 ${i % 2 ? 'bg-[#EEF5FB]' : 'bg-white'}`}>
            <summary className="cursor-pointer flex gap-4 items-center">
              <span className="text-xs text-[#6B8CAE] w-40">{new Date(e.timestamp).toLocaleString()}</span>
              <span className="font-bold text-[#154278] w-48">{e.action}</span>
              <span className="text-sm text-[#6B8CAE] flex-1">{e.actor_name ?? 'system'} ({e.actor_role ?? '-'})</span>
              <span className="text-xs text-[#6B8CAE]">{e.entity_type ?? ''}</span>
            </summary>
            <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
              <div>
                <div className="text-[#6B8CAE] mb-1">Before</div>
                <pre className="bg-[#EEF5FB] p-3 rounded overflow-auto max-h-60 text-[#154278]">{JSON.stringify(e.before, null, 2)}</pre>
              </div>
              <div>
                <div className="text-[#6B8CAE] mb-1">After</div>
                <pre className="bg-[#EEF5FB] p-3 rounded overflow-auto max-h-60 text-[#154278]">{JSON.stringify(e.after, null, 2)}</pre>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
