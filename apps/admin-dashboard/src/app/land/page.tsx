import { redirect } from 'next/navigation';

export default function LandPage() {
  redirect('/opportunities?tab=land');
}
