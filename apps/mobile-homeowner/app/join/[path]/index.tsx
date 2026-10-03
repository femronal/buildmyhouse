import JoinPage from '@/components/join/JoinPage';

export function generateStaticParams() {
  return ['repairs', 'cleaning', 'builders', 'professional', 'materials'].map((path) => ({ path }));
}

export default function JoinPathRoute() {
  return <JoinPage />;
}
