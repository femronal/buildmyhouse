import StartProjectPage from '@/components/start/StartProjectPage';
import { pathStaticParams } from '@/lib/start-project/flow';

export function generateStaticParams() {
  return pathStaticParams();
}

export default function StartPathRoute() {
  return <StartProjectPage />;
}
