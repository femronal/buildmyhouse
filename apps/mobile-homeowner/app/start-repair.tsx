import StartRepairHeroPage from '@/components/start-repair/StartRepairHeroPage';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { useWebSeo } from '@/lib/seo';

const INTAKE_FAQS = [
  {
    question: 'What is a tracked repair on BuildMyHouse?',
    answer:
      'A tracked repair breaks work into stages with photo evidence and approval checkpoints so you pay after verified progress — not on vague promises.',
  },
  {
    question: 'Who is this for?',
    answer:
      'Homeowners in Lagos and diaspora clients managing property remotely who want verified workers and clearer repair accountability.',
  },
  {
    question: 'What happens after I continue?',
    answer:
      'You choose how to start — browse verified project ideas or upload your brief — then scope the repair and assign verified workers.',
  },
] as const;

export default function StartRepairPage() {
  const canonicalPath = '/start-repair';
  const title = 'Start a Tracked Repair in Lagos';
  const description =
    'Verified workers, staged updates, and photo evidence before you pay — for plumbing, electrical, roof leaks, and urgent Lagos repairs.';

  const jsonLd = buildSeoJsonLd({
    path: canonicalPath,
    title,
    description,
    schemaType: 'Service',
    faqs: [...INTAKE_FAQS],
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Start a tracked repair', path: canonicalPath },
    ],
  });

  useWebSeo({
    title: `${title} | BuildMyHouse`,
    description,
    canonicalPath,
    robots: 'index,follow',
    jsonLd,
  });

  return <StartRepairHeroPage />;
}
