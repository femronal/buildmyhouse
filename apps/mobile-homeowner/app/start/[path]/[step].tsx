import StartProjectPage from '@/components/start/StartProjectPage';
import { stepStaticParams } from '@/lib/start-project/flow';

export function generateStaticParams() {
  return stepStaticParams();
}

export default function StartStepRoute() {
  return <StartProjectPage />;
}
