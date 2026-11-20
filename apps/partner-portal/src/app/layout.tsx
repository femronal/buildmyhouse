import type { ReactNode } from 'react';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

const description =
  "Partners earn 2.5% of the contractor amount, paid out of BuildMyHouse's 10% fee. The homeowner pays nothing extra. Contingency is excluded. The click window is 30 days. The first partner to refer a homeowner keeps that homeowner's later projects. Commission is paid once, after the project's final stage is approved and BuildMyHouse has confirmed the homeowner's payment. A ₦2,000,000 contractor amount pays the partner ₦50,000.";

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
