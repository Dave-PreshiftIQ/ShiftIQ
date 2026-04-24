import Link from 'next/link';
import { NotificationBell } from '@/app/components/NotificationBell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#EEF5FB] font-arial">
      <nav className="bg-white border-b-4 border-[#89B3E5]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="font-bold text-[#154278] text-xl">PreShiftIQ Admin</Link>
            <div className="flex gap-6 text-[#154278] text-sm">
              <NavLink href="/admin">Overview</NavLink>
              <NavLink href="/admin/clients">Clients</NavLink>
              <NavLink href="/admin/vendors">Vendors</NavLink>
              <NavLink href="/admin/matches">Matches</NavLink>
              <NavLink href="/admin/change-requests">Change Requests</NavLink>
              <NavLink href="/admin/questions">Questions</NavLink>
              <NavLink href="/admin/scoring">Scoring</NavLink>
              <NavLink href="/admin/test-match">Test Match</NavLink>
              <NavLink href="/admin/audit-log">Audit Log</NavLink>
            </div>
          </div>
          <NotificationBell />
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-6">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="hover:text-[#2C6098]">{children}</Link>;
}
