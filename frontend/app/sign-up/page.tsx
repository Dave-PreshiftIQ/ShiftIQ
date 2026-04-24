import Link from 'next/link';

export default function SignUpChooser() {
  return (
    <div className="max-w-xl mx-auto mt-24 p-10 text-center">
      <h1 className="text-3xl font-bold text-[#154278] mb-8">Create your account</h1>
      <div className="grid gap-4">
        <Link href="/sign-up/client" className="block bg-white border border-[#89B3E5] rounded p-6 hover:border-[#2C6098] text-left">
          <div className="font-bold text-[#154278] text-lg">I'm a technology buyer</div>
          <div className="text-[#6B8CAE] text-sm mt-1">Evaluating TMS or transportation technology for my operation.</div>
        </Link>
        <Link href="/sign-up/vendor" className="block bg-white border border-[#89B3E5] rounded p-6 hover:border-[#2C6098] text-left">
          <div className="font-bold text-[#154278] text-lg">I'm a technology vendor</div>
          <div className="text-[#6B8CAE] text-sm mt-1">Represent a transportation technology provider ready to be audited.</div>
        </Link>
      </div>
    </div>
  );
}
