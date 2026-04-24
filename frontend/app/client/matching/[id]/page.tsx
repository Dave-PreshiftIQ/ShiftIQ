'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function Matching() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [msg] = useState('Running your assessment through the matching engine...');

  useEffect(() => {
    const iv = setInterval(async () => {
      const r = await fetch(`/api/client/session/${id}/status`);
      const d = await r.json();
      if (d.status === 'matched') {
        clearInterval(iv);
        const m = await fetch('/api/client/matches').then(x => x.json());
        router.replace(`/client/results?matches=${m.matches?.length ?? 0}`);
      }
    }, 1500);
    return () => clearInterval(iv);
  }, [id, router]);

  return (
    <div className="max-w-xl mx-auto mt-24 p-10 bg-white border border-[#89B3E5] rounded shadow-sm font-arial text-center">
      <div className="w-12 h-12 border-4 border-[#EEF5FB] border-t-[#154278] rounded-full animate-spin mx-auto mb-6" />
      <h1 className="text-2xl font-bold text-[#154278] mb-3">Matching in progress</h1>
      <p className="text-[#6B8CAE]">{msg}</p>
    </div>
  );
}
