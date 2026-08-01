'use client';

import PiSubnav from '@/components/price-intelligence/PiSubnav';

export default function PriceIntelligenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-gray-100">
      <PiSubnav />
      <div className="p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}
