'use client';

import { useEffect, useState } from 'react';

type Notif = { id: string; type: string; payload: any; read: boolean; created_at: string };

export function NotificationBell() {
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void load();
    const iv = setInterval(load, 30_000);
    return () => clearInterval(iv);
  }, []);

  async function load() {
    const r = await fetch('/api/me/notifications');
    if (r.ok) { const d = await r.json(); setItems(d.items ?? []); }
  }

  async function markRead(id: string) {
    await fetch(`/api/me/notifications/${id}/read`, { method: 'POST' });
    setItems(xs => xs.map(x => x.id === id ? { ...x, read: true } : x));
  }

  const unread = items.filter(x => !x.read).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="relative p-2 rounded hover:bg-[#EEF5FB]">
        <span className="text-[#154278] text-xl">{unread > 0 ? 'o' : 'o'}</span>
        {unread > 0 && (
          <span className="absolute top-0 right-0 bg-[#8B1A1A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-[#89B3E5] rounded shadow-lg z-50 max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-4 text-[#6B8CAE] text-sm">No notifications.</div>
          ) : (
            items.map(n => (
              <button key={n.id} onClick={() => markRead(n.id)}
                className={`block w-full text-left p-3 border-b border-[#EEF5FB] last:border-0 hover:bg-[#EEF5FB] ${!n.read ? 'bg-[#EEF5FB]' : 'bg-white'}`}>
                <div className="text-sm font-bold text-[#154278]">{labelFor(n.type)}</div>
                <div className="text-xs text-[#6B8CAE] mt-1">{new Date(n.created_at).toLocaleString()}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function labelFor(type: string): string {
  const map: Record<string, string> = {
    client_submitted: 'New client assessment',
    vendor_submitted: 'New vendor audit',
    vendor_accepted_lead: 'Vendor accepted a lead',
    vendor_declined_lead: 'Vendor declined a lead',
    client_answer_update: 'Client answer update request',
    vendor_answer_update: 'Vendor answer update request',
    match_created: 'Match results',
    intro_sent: 'Warm intro sent',
  };
  return map[type] ?? type;
}
