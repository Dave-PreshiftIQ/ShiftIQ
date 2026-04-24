'use client';

import { useEffect, useState } from 'react';
import { PERSONAS } from '@/lib/personas';

type Q = {
  id: string; section: number; tier: 1 | 2; order_index: number;
  text: string; help_text?: string; type: string; options?: any;
  persona_tags: string[]; required: boolean; active: boolean;
  weight: number; dimension?: string; audience: 'client' | 'vendor';
};

const TYPES = ['single_select','multi_select','text','number','boolean','scale'];
const DIMS  = ['D1','D2','D3','D4','D5','D6','D7','D8','D9'];

export default function QuestionsAdmin() {
  const [items, setItems] = useState<Q[]>([]);
  const [filter, setFilter] = useState<'client'|'vendor'>('client');
  const [editing, setEditing] = useState<Q | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => { void load(); }, [filter]);
  async function load() {
    const r = await fetch(`/api/admin/questions?audience=${filter}`);
    const d = await r.json();
    setItems(d.questions);
  }

  const save = async (q: Partial<Q>) => {
    if (editing) {
      await fetch(`/api/admin/questions/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q),
      });
    } else {
      await fetch(`/api/admin/questions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...q, audience: filter }),
      });
    }
    setEditing(null); setCreating(false); void load();
  };

  const toggleActive = async (q: Q) => {
    await fetch(`/api/admin/questions/${q.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !q.active }),
    });
    void load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#154278]">Questions</h1>
        <button onClick={() => { setEditing(null); setCreating(true); }}
          className="bg-[#154278] text-white px-4 py-2 rounded hover:bg-[#2C6098]">+ New question</button>
      </div>

      <div className="flex gap-2 mb-6">
        {(['client','vendor'] as const).map(a => (
          <button key={a} onClick={() => setFilter(a)}
            className={`px-4 py-2 rounded ${filter === a ? 'bg-[#154278] text-white' : 'bg-white border border-[#89B3E5] text-[#154278]'}`}>
            {a === 'client' ? 'Client assessment' : 'Vendor audit'}
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#89B3E5] rounded p-4 space-y-2">
        {items.map(q => (
          <div key={q.id} className="flex items-center gap-3 p-3 rounded hover:bg-[#EEF5FB]">
            <div className="text-xs text-[#6B8CAE] w-24">S{q.section} - T{q.tier}{q.dimension ? ` - ${q.dimension}` : ''}</div>
            <div className="flex-1">
              <div className={`text-[#154278] ${!q.active ? 'line-through opacity-50' : ''}`}>{q.text}</div>
              {q.persona_tags.length > 0 && (
                <div className="text-xs text-[#6B8CAE]">{q.persona_tags.join(', ')}</div>
              )}
            </div>
            <button onClick={() => toggleActive(q)} className="text-xs px-2 py-1 rounded bg-[#EEF5FB] text-[#154278] hover:bg-[#89B3E5]">
              {q.active ? 'Disable' : 'Enable'}
            </button>
            <button onClick={() => { setEditing(q); setCreating(false); }}
              className="text-xs px-2 py-1 rounded bg-[#154278] text-white hover:bg-[#2C6098]">Edit</button>
          </div>
        ))}
      </div>

      {(editing || creating) && (
        <QuestionEditor key={editing?.id ?? 'new'}
          initial={editing ?? emptyQ(filter)}
          onCancel={() => { setEditing(null); setCreating(false); }}
          onSave={save} />
      )}
    </div>
  );
}

function emptyQ(audience: 'client'|'vendor'): Q {
  return {
    id: '', section: audience === 'vendor' ? 101 : 1, tier: 1, order_index: 0,
    text: '', type: 'single_select', persona_tags: [], required: true, active: true,
    weight: 1, audience,
  };
}

function QuestionEditor({ initial, onCancel, onSave }:
  { initial: Q; onCancel: () => void; onSave: (q: Partial<Q>) => void }) {
  const [q, setQ] = useState<Q>(initial);
  const [optionsText, setOptionsText] = useState(Array.isArray(initial.options) ? initial.options.join('\n') : '');

  const submit = () => {
    const options = ['single_select','multi_select'].includes(q.type)
      ? optionsText.split('\n').map(s => s.trim()).filter(Boolean)
      : null;
    onSave({ ...q, options });
  };

  const input = 'w-full rounded border border-[#89B3E5] px-3 py-2 text-[#154278]';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[#154278] mb-4">{initial.id ? 'Edit question' : 'New question'}</h2>

        <div className="space-y-3">
          <textarea className={input} rows={2} placeholder="Question text"
            value={q.text} onChange={e => setQ({ ...q, text: e.target.value })} />

          <textarea className={input} rows={2} placeholder="Help text (optional)"
            value={q.help_text ?? ''} onChange={e => setQ({ ...q, help_text: e.target.value })} />

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-[#6B8CAE]">Section</label>
              <input type="number" className={input} value={q.section}
                onChange={e => setQ({ ...q, section: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-[#6B8CAE]">Tier</label>
              <select className={input} value={q.tier} onChange={e => setQ({ ...q, tier: Number(e.target.value) as 1|2 })}>
                <option value={1}>1</option><option value={2}>2</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#6B8CAE]">Order</label>
              <input type="number" className={input} value={q.order_index}
                onChange={e => setQ({ ...q, order_index: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-[#6B8CAE]">Type</label>
              <select className={input} value={q.type} onChange={e => setQ({ ...q, type: e.target.value })}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#6B8CAE]">Dimension (optional - links answer to scoring)</label>
            <select className={input} value={q.dimension ?? ''} onChange={e => setQ({ ...q, dimension: e.target.value || undefined })}>
              <option value="">-</option>
              {DIMS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {['single_select','multi_select'].includes(q.type) && (
            <div>
              <label className="text-xs text-[#6B8CAE]">Options (one per line)</label>
              <textarea className={input} rows={4} value={optionsText} onChange={e => setOptionsText(e.target.value)} />
            </div>
          )}

          <div>
            <label className="text-xs text-[#6B8CAE]">Personas (empty = all)</label>
            <div className="flex flex-wrap gap-2">
              {PERSONAS.map(p => {
                const on = q.persona_tags.includes(p.id);
                return (
                  <button key={p.id} type="button"
                    onClick={() => setQ({ ...q, persona_tags: on ? q.persona_tags.filter(x => x !== p.id) : [...q.persona_tags, p.id] })}
                    className={`px-2 py-1 rounded text-xs ${on ? 'bg-[#154278] text-white' : 'bg-[#EEF5FB] text-[#154278]'}`}>
                    {p.id}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-[#154278]">
              <input type="checkbox" checked={q.required} onChange={e => setQ({ ...q, required: e.target.checked })} />
              Required
            </label>
            <label className="flex items-center gap-2 text-[#154278]">
              <input type="checkbox" checked={q.active} onChange={e => setQ({ ...q, active: e.target.checked })} />
              Active
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={submit} className="bg-[#154278] text-white px-4 py-2 rounded hover:bg-[#2C6098]">Save</button>
          <button onClick={onCancel} className="border border-[#89B3E5] text-[#154278] px-4 py-2 rounded hover:bg-[#EEF5FB]">Cancel</button>
        </div>
      </div>
    </div>
  );
}
