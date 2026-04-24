'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Question = {
  id: string; section: number; order_index: number;
  text: string; help_text?: string; type: string; options?: any;
  required: boolean; dimension?: string;
};

const SECTION_LABELS: Record<number, string> = {
  101: 'Identity & Market Fit',
  102: 'Architectural Integrity',
  103: 'Security & Compliance',
  104: 'AI & Intelligence',
  105: 'Connectivity',
  106: 'Implementation & Ops',
  107: 'Fiduciary Financials',
  108: 'Company Health & Legal Risk',
  109: 'Platform Scalability & Data',
};

export default function VendorAudit() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [status, setStatus] = useState<string>('pending');
  const [currentSection, setCurrentSection] = useState(101);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => { void load(); }, []);

  async function load() {
    const r = await fetch('/api/vendor/audit');
    const d = await r.json();
    setQuestions(d.questions);
    setAnswers(d.vendor.audit_answers ?? {});
    setStatus(d.vendor.status);
    if (d.questions.length > 0) setCurrentSection(d.questions[0].section);
  }

  const save = useCallback(async (qid: string, value: any) => {
    setAnswers(a => ({ ...a, [qid]: value }));
    await fetch('/api/vendor/audit/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: qid, value }),
    });
  }, []);

  const submit = async () => {
    setSubmitting(true);
    await fetch('/api/vendor/audit/submit', { method: 'POST' });
    router.push('/vendor/audit/submitted');
  };

  const sections = Array.from(new Set(questions.map(q => q.section))).sort();
  const sectionQs = questions.filter(q => q.section === currentSection);

  const totalRequired = questions.filter(q => q.required).length;
  const answeredRequired = questions.filter(q => q.required && answers[q.id] !== undefined && answers[q.id] !== '').length;
  const pct = totalRequired === 0 ? 0 : Math.round((answeredRequired / totalRequired) * 100);
  const canSubmit = pct === 100 && status === 'pending';

  if (status !== 'pending') {
    return (
      <div className="max-w-2xl mx-auto mt-24 p-10 bg-white border border-[#89B3E5] rounded shadow-sm font-arial text-center">
        <h1 className="text-2xl font-bold text-[#154278] mb-3">Your audit is {status.replace('_', ' ')}.</h1>
        <p className="text-[#6B8CAE]">
          {status === 'under_review' && "We'll reach out to schedule your 60-minute audit walkthrough."}
          {status === 'active' && "You're active and eligible for client matches."}
          {status === 'inactive' && 'Your record is currently inactive. Contact Dave if you have questions.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-8 font-arial">
      <div className="bg-white border border-[#89B3E5] rounded p-5 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold text-[#154278]">Vendor Audit Scorecard</h1>
          <span className="text-[#6B8CAE]">Completion: {pct}%</span>
        </div>
        <div className="h-2 bg-[#EEF5FB] rounded">
          <div className="h-2 bg-[#154278] rounded transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {sections.map(s => (
          <button key={s} onClick={() => setCurrentSection(s)}
            className={`px-3 py-2 rounded text-sm ${s === currentSection
              ? 'bg-[#154278] text-white'
              : 'bg-white border border-[#89B3E5] text-[#154278] hover:border-[#2C6098]'}`}>
            {s - 100}. {SECTION_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#89B3E5] rounded p-6 space-y-6">
        <div className="bg-[#154278] text-white font-bold px-4 py-2 -mx-6 -mt-6 mb-4 rounded-t">
          Section {currentSection - 100}: {SECTION_LABELS[currentSection]}
        </div>
        {sectionQs.map(q => (
          <QuestionField key={q.id} q={q} value={answers[q.id]} onChange={v => save(q.id, v)} />
        ))}
      </div>

      <button onClick={submit} disabled={!canSubmit || submitting}
        className="mt-8 bg-[#154278] text-white px-6 py-3 rounded hover:bg-[#2C6098] disabled:opacity-50">
        {submitting ? 'Submitting...' : 'Submit audit for review'}
      </button>
    </div>
  );
}

function QuestionField({ q, value, onChange }: { q: Question; value: any; onChange: (v: any) => void }) {
  const inputCls = 'w-full rounded border border-[#89B3E5] px-3 py-2 font-arial text-[#154278] focus:outline-none focus:border-[#154278]';

  return (
    <div>
      <label className="block text-[#154278] font-bold mb-1">
        {q.text}{q.required && <span className="text-[#8B1A1A]"> *</span>}
        {q.dimension && <span className="ml-2 text-xs text-[#6B8CAE]">[{q.dimension}]</span>}
      </label>
      {q.help_text && <p className="text-sm text-[#6B8CAE] mb-2">{q.help_text}</p>}

      {q.type === 'text' && <textarea className={inputCls} value={value ?? ''} onChange={e => onChange(e.target.value)} rows={3} />}
      {q.type === 'number' && <input type="number" className={inputCls} value={value ?? ''} onChange={e => onChange(Number(e.target.value))} />}
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
    </div>
  );
}
