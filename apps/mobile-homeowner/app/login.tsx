import { Redirect } from 'expo-router';

/** Legacy auth entry — canonical landing page is `/`. */
export default function LoginRoute() {
  return <Redirect href="/" />;
}
