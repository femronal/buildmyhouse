import { PriceCheckerWorkspace } from '@/components/tools/price-checker/PriceCheckerWorkspace';
import { useWebSeo } from '@/lib/seo';
import { buildCanonical } from '@/lib/seo-schema';

/**
 * Stage 6 — BuildMyHouse Price Checker consumer experience.
 * Replaces the previous static repair-ranges page with the live product:
 * catalogue search → clarifying questions → research → Stage 5 report.
 */
export default function PriceCheckerPage() {
  useWebSeo({
    title: 'Price Checker | Building Material Prices Nigeria | BuildMyHouse',
    description:
      'Check current Nigerian building material prices with source-backed ranges, confidence scores and clear caveats. Free daily checks available.',
    canonicalPath: '/tools/price-checker',
    robots: 'index,follow',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'BuildMyHouse Price Checker',
          description:
            'Source-backed Nigerian building material price ranges with confidence scoring for homeowners and contractors.',
          url: buildCanonical('/tools/price-checker'),
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'NGN',
          },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: buildCanonical('/') },
            { '@type': 'ListItem', position: 2, name: 'Tools', item: buildCanonical('/tools') },
            { '@type': 'ListItem', position: 3, name: 'Price Checker', item: buildCanonical('/tools/price-checker') },
          ],
        },
      ],
    },
  });

  return <PriceCheckerWorkspace />;
}
