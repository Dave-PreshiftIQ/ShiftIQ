'use client';

import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

const CONSENT = `By creating an account, you agree to PreShiftIQ's Terms of Service and Privacy Policy. Your assessment data will be used solely to match you with pre-audited technology vendors. Your contact information will not be shared with any vendor until you have been notified of a match and the vendor has formally accepted the lead under the PreShiftIQ Lead Exchange Agreement. PreShiftIQ does not sell your data.`;

export default function ClientSignUp() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', password: '' });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');

  const inputCls = 'w-full rounded border border-[#89B3E5] px-3 py-2 font-arial text-[#154278] focus:outline-none focus:border-[#154278]';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isLoaded) return;
    if (!consent) { setError('You must agree to the terms to continue.'); return; }

    setLoading(true);
    try {
      const gate = await fetch('/api/public/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      }).then(r => r.json());
      if (!gate.ok) { setError(gate.message); setLoading(false); return; }

      await signUp.create({
        emailAddress: form.email,
        password: form.password,
        firstName: form.name.split(' ')[0],
        lastName: form.name.split(' ').slice(1).join(' ') || '-',
        unsafeMetadata: { role: 'client', company: form.company, phone: form.phone },
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setVerifying(true);
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? 'Something went wrong.');
    }
    setLoading(false);
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/client/onboarding');
      } else {
        // Verification didn't complete - reload the signup state and try again
        setError(`Verification status: ${result.status}. Please reload and try again.`);
      }
    } catch (err: any) {
      const code = err?.errors?.[0]?.code;
      if (code === 'verification_already_verified' || code === 'session_exists') {
        // Already verified - just redirect
        router.push('/client/onboarding');
        return;
      }
      setError(err?.errors?.[0]?.message ?? 'Invalid code.');
    }
    setLoading(false);
  };

  if (verifying) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 bg-white border border-[#89B3E5] rounded shadow-sm">
        <h1 className="text-2xl font-bold text-[#154278] mb-2">Verify your email</h1>
        <p className="text-[#6B8CAE] mb-6">Enter the 6-digit code we sent to {form.email}.</p>
        <form onSubmit={onVerify} className="space-y-4">
          <input className={inputCls} value={code} onChange={e => setCode(e.target.value)} placeholder="Verification code" maxLength={6} />
          {error && <p className="text-[#8B1A1A] text-sm">{error}</p>}
          <button disabled={loading} className="w-full bg-[#154278] text-white py-2 rounded hover:bg-[#2C6098] disabled:opacity-50">
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white border border-[#89B3E5] rounded shadow-sm">
      <h1 className="text-2xl font-bold text-[#154278] mb-2">Create your ShiftIQ account</h1>
      <p className="text-[#6B8CAE] mb-6">For transportation technology buyers.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <input className={inputCls} value={form.name}    onChange={e => setForm({ ...form, name: e.target.value })}    placeholder="Full name" required />
        <input className={inputCls} value={form.email}   onChange={e => setForm({ ...form, email: e.target.value })}   placeholder="Business email" type="email" required />
        <input className={inputCls} value={form.phone}   onChange={e => setForm({ ...form, phone: e.target.value })}   placeholder="Phone" type="tel" required />
        <input className={inputCls} value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Company" required />
        <input className={inputCls} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" type="password" required minLength={10} />

        <label className="flex items-start gap-2 text-sm text-[#154278]">
          <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1" />
          <span>{CONSENT}</span>
        </label>

        {error && <p className="text-[#8B1A1A] text-sm">{error}</p>}
        <button disabled={loading} className="w-full bg-[#154278] text-white py-2 rounded hover:bg-[#2C6098] disabled:opacity-50">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
