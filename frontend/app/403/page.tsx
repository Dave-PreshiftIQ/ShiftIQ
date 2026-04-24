import Link from 'next/link';

export default function Forbidden() {
  return (
    <div className="max-w-md mx-auto mt-24 p-10 text-center">
      <h1 className="text-3xl font-bold text-[#154278] mb-4">Access denied</h1>
      <p className="text-[#6B8CAE] mb-6">You don't have permission to view this page.</p>
      <Link href="/" className="text-[#2C6098] underline">Return home</Link>
    </div>
  );
}
