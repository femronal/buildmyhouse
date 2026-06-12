import { Redirect } from 'expo-router';

/** Legacy URL — permanent redirect to SEO canonical path. */
export default function ExploreLegacyRedirect() {
  return <Redirect href="/property-projects-nigeria" />;
}
