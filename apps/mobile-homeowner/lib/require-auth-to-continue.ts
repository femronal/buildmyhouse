import { Alert, Platform } from 'react-native';
import type { Router } from 'expo-router';
import type { HomeownerUserLike } from '@/lib/onboarding';
import { showAuthContinueModal } from '@/lib/auth-continue-modal-store';
import { setPostAuthReturnPath } from '@/lib/post-auth-navigation';

type RequireAuthOptions = {
  router: Router;
  currentUser?: HomeownerUserLike | null;
  userLoading?: boolean;
  destinationPath: string;
  promptTitle?: string;
  promptMessage?: string;
};

export async function requireAuthToContinue({
  router,
  currentUser,
  userLoading,
  destinationPath,
  promptTitle = 'Sign up to continue',
  promptMessage = 'Create a free account or sign in to view this plan scope and continue from where you left off.',
}: RequireAuthOptions): Promise<boolean> {
  if (userLoading) return false;

  if (currentUser) {
    return true;
  }

  return new Promise((resolve) => {
    const goToLogin = () => {
      void (async () => {
        await setPostAuthReturnPath(destinationPath);
        router.push('/login');
        resolve(false);
      })();
    };

    if (Platform.OS === 'web') {
      void showAuthContinueModal(promptTitle, promptMessage).then((confirmed) => {
        if (confirmed) goToLogin();
        else resolve(false);
      });
      return;
    }

    Alert.alert(promptTitle, promptMessage, [
      { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Sign up / Sign in', onPress: goToLogin },
    ]);
  });
}
