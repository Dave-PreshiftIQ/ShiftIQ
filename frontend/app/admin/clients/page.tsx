'use client';

import { useEffect, useState } from 'react';

export default function AdminClients() {
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/clients').then(r => r.json()).then(d => setClients(d.clients ?? []));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#154278] mb-4">Clients</h1>
      <div className="bg-white border border-[#89B3E5] rounded">
        {clients.length === 0 ? <div className="p-8 text-center text-[#6B8CAE]">No clients yet.</div>
          : clients.map((c, i) => (
          <div key={c.id} className={`flex items-center gap-4 p-4 ${i % 2 ? 'bg-[#EEF5FB]' : 'bg-white'}`}>
            <div className="flex-1">
              <div className="font-bold text-[#154278]">{c.company}</div>
              <div className="text-sm text-[#6B8CAE]">{c.name} - {c.email}</div>
            </div>
            <div className="text-sm text-[#6B8CAE]">{c.session_status ?? 'no session'}</div>
            {c.held === 'true' && <span className="px-2 py-1 bg-[#7B4400] text-white text-xs rounded">HELD</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
