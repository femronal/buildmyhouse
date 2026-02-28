import { useEffect } from 'react';
import { AppState } from 'react-native';
import { registerPushToken } from '@/services/pushNotificationService';

export function usePushTokenRegistration(app: 'homeowner' | 'contractor') {
  useEffect(() => {
    registerPushToken(app);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        registerPushToken(app);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [app]);
}
