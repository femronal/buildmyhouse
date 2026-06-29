import RepairPricingPage from '@/components/agent/RepairPricingPage';
import { buildRepairPricingJsonLd } from '@/lib/agent-jsonld';
import { useWebSeo } from '@/lib/seo';

export default function RepairPricingRoute() {
  const canonicalPath = '/pricing/repairs';
  const title = 'Repair Pricing Guide Lagos | BuildMyHouse';
  const description =
    'Parseable repair pricing ranges in Lagos (NGN). Plumbing, electrical, roof leaks, drainage, windows. BuildMyHouse platform service fee is free for now.';

  useWebSeo({
    title,
    description,
    canonicalPath,
    robots: 'index,follow',
    markdownAlternatePath: '/pricing/repairs.md',
    jsonLd: buildRepairPricingJsonLd(),
  });

  return <RepairPricingPage />;
}
