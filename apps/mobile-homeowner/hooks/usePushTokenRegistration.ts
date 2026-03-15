import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

export function usePushTokenRegistration(app: 'homeowner' | 'contractor') {
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    let isActive = true;
    const register = async () => {
      const mod = await import('@/services/pushNotificationService');
      if (isActive) {
        await mod.registerPushToken(app);
      }
    };

    register();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        register();
      }
    });

    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [app]);
}
