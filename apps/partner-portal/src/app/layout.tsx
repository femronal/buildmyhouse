import type { ReactNode } from 'react';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

const description =
  'BuildMyHouse helps people in Nigeria and abroad organise a build, renovation, or repair, and pay in stages. Partners introduce those homeowners and earn when their projects are completed.';

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
