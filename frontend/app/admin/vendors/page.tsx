'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AdminVendors() {
  const params = useSearchParams();
  const [status, setStatus] = useState(params.get('status') ?? '');
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => { void load(); }, [status]);
  async function load() {
    const r = await fetch(`/api/admin/vendors${status ? `?status=${status}` : ''}`);
    const d = await r.json();
    setVendors(d.vendors ?? []);
  }

  const setVendorStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/admin/vendors/${id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }),
    });
    void load();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#154278] mb-4">Vendors</h1>
      <div className="flex gap-2 mb-6">
        {['', 'pending', 'under_review', 'active', 'inactive'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1 rounded ${status === s ? 'bg-[#154278] text-white' : 'bg-white border border-[#89B3E5] text-[#154278]'}`}>
            {s || 'all'}
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#89B3E5] rounded">
        {vendors.length === 0 ? <div className="p-8 text-center text-[#6B8CAE]">No vendors in this status.</div>
          : vendors.map((v, i) => (
          <div key={v.vendor_id} className={`flex items-center gap-4 p-4 ${i % 2 ? 'bg-[#EEF5FB]' : 'bg-white'}`}>
            <div className="flex-1">
              <div className="font-bold text-[#154278]">{v.company}</div>
              <div className="text-sm text-[#6B8CAE]">{v.name} - {v.email}</div>
            </div>
            <div className="text-sm text-[#6B8CAE]">{v.status}</div>
            {v.status === 'under_review' && (
              <>
                <button onClick={() => setVendorStatus(v.vendor_id, 'active')}
                  className="bg-[#154278] text-white px-3 py-1 rounded text-sm">Activate</button>
                <button onClick={() => setVendorStatus(v.vendor_id, 'inactive')}
                  className="border border-[#89B3E5] text-[#154278] px-3 py-1 rounded text-sm">Reject</button>
              </>
            )}
            {v.status === 'active' && (
              <button onClick={() => setVendorStatus(v.vendor_id, 'inactive')}
                className="border border-[#89B3E5] text-[#154278] px-3 py-1 rounded text-sm">Deactivate</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
