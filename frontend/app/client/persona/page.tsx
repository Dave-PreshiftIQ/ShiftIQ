'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PERSONAS } from '@/lib/personas';

export default function PersonaSelect() {
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const toggle = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const onContinue = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    const res = await fetch('/api/client/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona_tags: selected }),
    });
    const { session_id } = await res.json();
    router.push(`/client/assessment/${session_id}`);
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 p-10 bg-white border border-[#89B3E5] rounded shadow-sm font-arial">
      <h1 className="text-3xl font-bold text-[#154278] mb-2">Tell us about your operation</h1>
      <p className="text-[#6B8CAE] mb-8">Select all that apply. You can select more than one if your business spans multiple models.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PERSONAS.map(p => {
          const on = selected.includes(p.id);
          return (
            <button key={p.id} type="button" onClick={() => toggle(p.id)}
              className={`text-left p-4 rounded transition ${on
                ? 'bg-[#154278] text-white border-2 border-[#154278]'
                : 'bg-white text-[#154278] border-2 border-[#89B3E5] hover:border-[#2C6098]'}`}>
              <span className="font-bold">{p.label}</span>
            </button>
          );
        })}
      </div>

      <button disabled={selected.length === 0 || saving} onClick={onContinue}
        className="mt-10 bg-[#154278] text-white px-6 py-3 rounded hover:bg-[#2C6098] disabled:opacity-50">
        {saving ? 'Starting...' : `Start assessment (${selected.length} selected)`}
      </button>
    </div>
  );
}
