import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getAuthToken } from '@/lib/auth';
import { api } from '@/lib/api';

let lastRegisteredToken: string | null = null;

export async function registerPushToken(app: 'homeowner' | 'contractor') {
  if (Platform.OS === 'web') {
    return;
  }

  const authToken = await getAuthToken();
  if (!authToken) {
    return;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const permissions = await Notifications.getPermissionsAsync();
    let finalStatus = permissions.status;

    if (finalStatus !== 'granted') {
      const requestResult = await Notifications.requestPermissionsAsync();
      finalStatus = requestResult.status;
    }

    if (finalStatus !== 'granted') {
      return;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    const pushToken = (
      await Notifications.getExpoPushTokenAsync(
        projectId
          ? {
              projectId,
            }
          : undefined,
      )
    ).data;

    if (!pushToken || pushToken === lastRegisteredToken) {
      return;
    }

    await api.post('/push-tokens/register', {
      token: pushToken,
      platform: Platform.OS,
      app,
    });

    lastRegisteredToken = pushToken;
  } catch (error) {
    console.warn('Failed to register Expo push token', error);
  }
}
