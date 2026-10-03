import JoinPage from '@/components/join/JoinPage';
import { joinStaticParams } from '@/lib/join/flow';

export function generateStaticParams() {
  return joinStaticParams();
}

export default function JoinStepRoute() {
  return <JoinPage />;
}
