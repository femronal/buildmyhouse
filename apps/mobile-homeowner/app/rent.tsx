import { Redirect } from 'expo-router';

/** Legacy URL — permanent redirect to SEO canonical path. */
export default function RentLegacyRedirect() {
  return <Redirect href="/build-opportunities-nigeria" />;
}
