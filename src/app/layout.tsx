import type { Metadata } from 'next';
import { Source_Serif_4, IBM_Plex_Sans } from 'next/font/google';
import { QueryProvider } from '@/components/providers/QueryProvider';
import './globals.css';

const sourceSerif4 = Source_Serif_4({
  variable: '--font-source-serif',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-ibm-plex-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Nebula Mail',
  description: 'Classic correspondence mail application with native AI assistant controls.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sourceSerif4.variable} ${ibmPlexSans.variable} h-full antialiased`}>
      <body className="h-full bg-[#FAFAF8] text-[#201F1B] font-sans selection:bg-[#6B9971]/25 selection:text-[#201F1B]">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
