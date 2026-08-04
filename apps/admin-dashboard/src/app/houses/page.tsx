import { redirect } from 'next/navigation';

export default function HousesPage() {
  redirect('/opportunities?tab=houses');
}
