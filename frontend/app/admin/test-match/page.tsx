'use client';

import { useEffect, useState } from 'react';

export default function TestMatch() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch('/api/admin/test-match/sessions').then(r => r.json()).then(d => setSessions(d.sessions ?? []));
  }, []);

  const run = async () => {
    setRunning(true); setResult(null);
    const r = await fetch(`/api/admin/test-match/${selected}`, { method: 'POST' });
    setResult(await r.json());
    setRunning(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#154278] mb-2">Test match</h1>
      <p className="text-[#6B8CAE] mb-6">Dry-run the matching engine against any session. Nothing is saved; no vendor is notified.</p>

      <div className="bg-white border border-[#89B3E5] rounded p-5 mb-6">
        <label className="block text-[#6B8CAE] text-sm mb-2">Select session</label>
        <select className="w-full rounded border border-[#89B3E5] px-3 py-2 text-[#154278]"
          value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">-</option>
          {sessions.map(s => (
            <option key={s.id} value={s.id}>
              {s.company} - {s.persona_tags?.join(', ')} - {s.status} - {new Date(s.created_at).toLocaleDateString()}
            </option>
          ))}
        </select>
        <button disabled={!selected || running} onClick={run}
          className="mt-3 bg-[#154278] text-white px-4 py-2 rounded hover:bg-[#2C6098] disabled:opacity-50">
          {running ? 'Running...' : 'Run test match'}
        </button>
      </div>

      {result && <TestResult r={result} />}
    </div>
  );
}

function TestResult({ r }: { r: any }) {
  return (
    <div className="space-y-5">
      <div className="bg-white border border-[#89B3E5] rounded p-5">
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Qualifying vendors" value={r.qualified_count} />
          <Stat label="Would shortlist" value={r.would_shortlist.length} />
          <Stat label="Would hold?" value={r.would_hold ? 'Yes' : 'No'} warn={r.would_hold} />
        </div>
      </div>

      <div className="bg-white border border-[#89B3E5] rounded p-5">
        <div className="font-bold text-[#154278] mb-3">All vendors, ranked</div>
        <div className="space-y-2">
          {r.all_results.map((row: any) => (
            <div key={row.vendor_id} className="flex items-center gap-4 p-3 bg-[#EEF5FB] rounded">
              <div className="flex-1 text-[#154278]">{row.vendor_name}</div>
              <div className="text-xs text-[#6B8CAE]">{row.phase1_pass ? 'P1 ok' : 'P1 fail'}</div>
              <div className="font-bold text-[#154278] w-12 text-right">{Number(row.total).toFixed(0)}</div>
              <div className="text-xs text-[#6B8CAE] w-28 text-right">{row.tier.replace('_',' ')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: any; warn?: boolean }) {
  return (
    <div className={`rounded p-4 ${warn ? 'bg-[#7B4400]/10 border border-[#7B4400]' : 'bg-[#EEF5FB]'}`}>
      <div className="text-sm text-[#6B8CAE]">{label}</div>
      <div className="text-3xl font-bold text-[#154278]">{String(value)}</div>
    </div>
  );
}
