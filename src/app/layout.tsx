import type { Metadata } from 'next';
import { Fraunces, Geist } from 'next/font/google';
import { QueryProvider } from '@/components/providers/QueryProvider';
import './globals.css';

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
});

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Nebula Mail',
  description: 'Classic correspondence mail application with native AI assistant controls.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${geist.variable} dark h-full antialiased`}>
      <body className="h-full bg-[#14161A] text-[#EDECE8] font-sans selection:bg-[#6B9971]/25 selection:text-[#EDECE8]">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}


