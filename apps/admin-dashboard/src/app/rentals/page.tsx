import { redirect } from 'next/navigation';

export default function RentalsPage() {
  redirect('/opportunities?tab=rentals');
}
