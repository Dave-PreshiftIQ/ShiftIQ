'use client';

import { useEffect, useState } from 'react';

type Dim = { dimension: string; label: string; weight: number; persona_boosts: Record<string, number>; };

const PERSONA_KEYS = ['shipper', 'broker', 'carrier', 'pe'] as const;

export default function ScoringAdmin() {
  const [dims, setDims] = useState<Dim[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/scoring-config').then(r => r.json()).then(d => setDims(d.dimensions.map((x: any) => ({ ...x, weight: Number(x.weight) }))));
  }, []);

  const total = dims.reduce((s, d) => s + d.weight, 0);
  const sumOk = Math.round(total * 100) === 10000;

  const setWeight = (dim: string, w: number) =>
    setDims(ds => ds.map(d => d.dimension === dim ? { ...d, weight: w } : d));

  const setBoost = (dim: string, key: string, v: number) =>
    setDims(ds => ds.map(d => d.dimension === dim ? { ...d, persona_boosts: { ...d.persona_boosts, [key]: v } } : d));

  const save = async () => {
    setSaving(true); setError(null); setSaved(false);
    const r = await fetch('/api/admin/scoring-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates: dims }),
    });
    const d = await r.json();
    if (!r.ok) setError(d.error ?? 'Save failed'); else setSaved(true);
    setSaving(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#154278] mb-2">Scoring weights</h1>
      <p className="text-[#6B8CAE] mb-6">Weights must sum to 100. Persona boosts are multipliers applied after base weighting.</p>

      <div className="bg-white border border-[#89B3E5] rounded p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-[#154278] font-bold">Total: {total.toFixed(0)}%</div>
          <div className={`px-3 py-1 rounded text-sm font-bold ${sumOk ? 'bg-[#EEF5FB] text-[#154278]' : 'bg-[#8B1A1A] text-white'}`}>
            {sumOk ? 'Balanced' : `Off by ${(100 - total).toFixed(0)}%`}
          </div>
        </div>

        <div className="space-y-5">
          {dims.map(d => (
            <div key={d.dimension} className="bg-[#EEF5FB] rounded p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold text-[#154278]">{d.dimension}: {d.label}</div>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={50} step={1} value={d.weight}
                    onChange={e => setWeight(d.dimension, Number(e.target.value))}
                    className="w-48 accent-[#154278]" />
                  <input type="number" min={0} max={50} value={d.weight}
                    onChange={e => setWeight(d.dimension, Number(e.target.value))}
                    className="w-16 rounded border border-[#89B3E5] px-2 py-1 text-[#154278]" />
                  <span className="text-[#6B8CAE]">%</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mt-3">
                {PERSONA_KEYS.map(k => (
                  <div key={k} className="bg-white rounded px-3 py-2">
                    <div className="text-xs text-[#6B8CAE] mb-1">{k} boost</div>
                    <input type="number" step={0.1} min={0.5} max={2.0}
                      value={d.persona_boosts[k] ?? 1.0}
                      onChange={e => setBoost(d.dimension, k, Number(e.target.value))}
                      className="w-full rounded border border-[#89B3E5] px-2 py-1 text-[#154278]" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-[#8B1A1A] text-sm mt-4">{error}</p>}
        {saved && <p className="text-[#2E7D32] text-sm mt-4">Saved.</p>}

        <button onClick={save} disabled={!sumOk || saving}
          className="mt-4 bg-[#154278] text-white px-5 py-2 rounded hover:bg-[#2C6098] disabled:opacity-50">
          {saving ? 'Saving...' : 'Save scoring config'}
        </button>
      </div>
    </div>
  );
}
