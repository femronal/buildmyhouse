import { Redirect } from 'expo-router';

/** Auth entry — send users straight to the sign up / log in form. */
export default function LoginRoute() {
  return <Redirect href={'/email-login' as any} />;
}
