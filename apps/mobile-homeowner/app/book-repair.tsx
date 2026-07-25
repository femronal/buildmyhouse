import BookRepairPage from '@/components/agent/BookRepairPage';
import { buildBookRepairJsonLd } from '@/lib/agent-jsonld';
import { useWebSeo } from '@/lib/seo';

export default function BookRepairRoute() {
  const canonicalPath = '/book-repair';
  const title = 'Book a Verified Repair in Nigeria | BuildMyHouse';
  const description =
    'Schedule a verified repair in Nigeria online. Choose service, date, and time window. BuildMyHouse service fee is free for now — pay contractor quote only.';

  useWebSeo({
    title,
    description,
    canonicalPath,
    robots: 'index,follow',
    markdownAlternatePath: '/book-repair.md',
    jsonLd: buildBookRepairJsonLd(),
  });

  return <BookRepairPage />;
}
