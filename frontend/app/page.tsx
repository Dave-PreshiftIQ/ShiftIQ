import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto mt-24 p-10 text-center">
      <h1 className="text-5xl font-bold text-[#154278] mb-4">ShiftIQ</h1>
      <p className="text-[#6B8CAE] text-lg mb-10">
        The fiduciary matching platform for transportation technology.
      </p>
      <div className="flex gap-4 justify-center">
        <Link href="/sign-up" className="bg-[#154278] text-white px-6 py-3 rounded hover:bg-[#2C6098]">Get started</Link>
        <Link href="/sign-in" className="border border-[#89B3E5] text-[#154278] px-6 py-3 rounded hover:bg-[#EEF5FB]">Sign in</Link>
      </div>
    </div>
  );
}
