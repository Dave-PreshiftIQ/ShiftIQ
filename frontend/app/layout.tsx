export const dynamic = 'force-dynamic';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata = { title: 'ShiftIQ', description: 'PreShiftIQ Platform' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#154278',
          colorText: '#154278',
          fontFamily: 'Arial, sans-serif',
          borderRadius: '6px',
        },
      }}
    >
      <html lang="en">
        <body className="font-arial bg-white text-[#154278]">{children}</body>
      </html>
    </ClerkProvider>
  );
}
