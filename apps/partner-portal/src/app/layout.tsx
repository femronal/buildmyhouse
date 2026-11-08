import type { ReactNode } from 'react';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

const description =
  'Introduce them to BuildMyHouse. We manage the project, track progress, and handle payments. You earn when their projects are completed, including future projects from the same homeowner.';

export const metadata = {
  metadataBase: new URL('https://partner.buildmyhouse.app'),
  title: 'BuildMyHouse Partner Network',
  description,
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'BuildMyHouse Partner Network',
    description,
    url: 'https://partner.buildmyhouse.app',
    siteName: 'BuildMyHouse',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'BuildMyHouse' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BuildMyHouse Partner Network',
    description,
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-poppins antialiased`}>{children}</body>
    </html>
  );
}
