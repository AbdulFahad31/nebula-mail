import type { Metadata } from 'next';
import { Source_Serif_4, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

const sourceSerif = Source_Serif_4({
  variable: '--font-source-serif',
  weight: ['400', '600'],
  subsets: ['latin'],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-ibm-plex-sans',
  weight: ['400', '500'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Nebula Mail',
  description: 'Classic correspondence mail application with native AI assistant controls.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${ibmPlexSans.variable} light h-full antialiased`}>
      <body className="h-full bg-[#FAFAF8] text-[#201F1B] font-sans selection:bg-[#24463A]/15 selection:text-[#24463A]">
        {children}
      </body>
    </html>
  );
}
