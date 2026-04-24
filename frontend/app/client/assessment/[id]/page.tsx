'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Question = {
  id: string; section: number; tier: 1 | 2; order_index: number;
  text: string; help_text?: string; type: string; options?: any;
  persona_tags: string[]; required: boolean; dimension?: string;
};

export default function Assessment() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [tier1Pct, setTier1Pct] = useState(0);
  const [tier2Unlocked, setTier2Unlocked] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { void load(); }, [id]);

  async function load() {
    const r = await fetch(`/api/client/session/${id}`);
    const d = await r.json();
    setQuestions(d.questions);
    setAnswers(d.session.answers ?? {});
    setTier1Pct(d.session.tier1_completion);
    setTier2Unlocked(d.session.tier2_unlocked);
  }

  const save = useCallback(async (qid: string, value: any) => {
    setAnswers(a => ({ ...a, [qid]: value }));
    const r = await fetch(`/api/client/session/${id}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: qid, value }),
    });
    const d = await r.json();
    setTier1Pct(d.tier1_completion);
    setTier2Unlocked(d.tier2_unlocked);
  }, [id]);

  const submit = async () => {
    setSubmitting(true);
    await fetch(`/api/client/session/${id}/submit`, { method: 'POST' });
    router.push(`/client/matching/${id}`);
  };

  const sections = Array.from(new Set(questions.map(q => q.section))).sort((a, b) => a - b);
  const sectionQs = questions.filter(q => q.section === currentSection);
  const isTier2Section = currentSection >= 10;
  const sectionLocked = isTier2Section && !tier2Unlocked;

  return (
    <div className="max-w-4xl mx-auto mt-8 p-8 font-arial">
      <div className="bg-white border border-[#89B3E5] rounded p-5 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold text-[#154278]">Your Assessment</h1>
          <span className="text-[#6B8CAE]">Tier 1 progress: {tier1Pct.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-[#EEF5FB] rounded">
          <div className="h-2 bg-[#154278] rounded transition-all" style={{ width: `${tier1Pct}%` }} />
        </div>
        <p className="mt-3 text-sm text-[#6B8CAE]">
          {tier2Unlocked
            ? 'Tier 2 sections unlocked. Complete for higher-fidelity matches.'
            : 'Reach 80% Tier 1 completion to unlock Tier 2 deep-dive sections.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {sections.map(s => {
          const locked = s >= 10 && !tier2Unlocked;
          const active = s === currentSection;
          return (
            <button key={s} disabled={locked} onClick={() => setCurrentSection(s)}
              className={`px-3 py-2 rounded text-sm ${active
                ? 'bg-[#154278] text-white'
                : locked
                  ? 'bg-[#EEF5FB] text-[#6B8CAE] cursor-not-allowed'
                  : 'bg-white border border-[#89B3E5] text-[#154278] hover:border-[#2C6098]'}`}>
              Section {s}{s >= 10 ? ' (T2)' : ''}{locked ? ' L' : ''}
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-[#89B3E5] rounded p-6 space-y-6">
        <div className="bg-[#154278] text-white font-bold px-4 py-2 -mx-6 -mt-6 mb-4 rounded-t">
          Section {currentSection}
        </div>

        {sectionLocked ? (
          <p className="text-[#6B8CAE]">This section is locked. Complete more of Tier 1 first.</p>
        ) : sectionQs.length === 0 ? (
          <p className="text-[#6B8CAE]">No questions in this section for your profile.</p>
        ) : (
          sectionQs.map(q => (
            <QuestionField key={q.id} q={q} value={answers[q.id]} onChange={v => save(q.id, v)} />
          ))
        )}
      </div>

      {tier1Pct >= 100 && (
        <button onClick={submit} disabled={submitting}
          className="mt-8 bg-[#154278] text-white px-6 py-3 rounded hover:bg-[#2C6098] disabled:opacity-50">
          {submitting ? 'Matching...' : 'Submit for matching'}
        </button>
      )}
    </div>
  );
}

function QuestionField({ q, value, onChange }: { q: Question; value: any; onChange: (v: any) => void }) {
  const inputCls = 'w-full rounded border border-[#89B3E5] px-3 py-2 font-arial text-[#154278] focus:outline-none focus:border-[#154278]';

  return (
    <div>
      <label className="block text-[#154278] font-bold mb-1">
        {q.text}{q.required && <span className="text-[#8B1A1A]"> *</span>}
      </label>
      {q.help_text && <p className="text-sm text-[#6B8CAE] mb-2">{q.help_text}</p>}

      {q.type === 'text' && (
        <textarea className={inputCls} value={value ?? ''} onChange={e => onChange(e.target.value)} rows={3} />
      )}
      {q.type === 'number' && (
        <input type="number" className={inputCls} value={value ?? ''} onChange={e => onChange(Number(e.target.value))} />
      )}
      {q.type === 'boolean' && (
        <div className="flex gap-3">
          {['Yes', 'No'].map(opt => (
            <button key={opt} type="button" onClick={() => onChange(opt === 'Yes')}
              className={`px-4 py-2 rounded ${value === (opt === 'Yes') ? 'bg-[#154278] text-white' : 'bg-white border border-[#89B3E5] text-[#154278]'}`}>
              {opt}
            </button>
          ))}
        </div>
      )}
      {q.type === 'single_select' && Array.isArray(q.options) && (
        <select className={inputCls} value={value ?? ''} onChange={e => onChange(e.target.value)}>
          <option value="">Select...</option>
          {q.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {q.type === 'multi_select' && Array.isArray(q.options) && (
        <div className="flex flex-wrap gap-2">
          {q.options.map((o: string) => {
            const on = Array.isArray(value) && value.includes(o);
            return (
              <button key={o} type="button"
                onClick={() => {
                  const arr = Array.isArray(value) ? value : [];
                  onChange(on ? arr.filter((x: string) => x !== o) : [...arr, o]);
                }}
                className={`px-3 py-2 rounded text-sm ${on ? 'bg-[#154278] text-white' : 'bg-white border border-[#89B3E5] text-[#154278]'}`}>
                {o}
              </button>
            );
          })}
        </div>
      )}
      {q.type === 'scale' && (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button" onClick={() => onChange(n)}
              className={`w-10 h-10 rounded ${value === n ? 'bg-[#154278] text-white' : 'bg-white border border-[#89B3E5] text-[#154278]'}`}>
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
