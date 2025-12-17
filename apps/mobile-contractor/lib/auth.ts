import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3001/api' 
  : 'https://api.buildmyhouse.com/api';

// Google OAuth Configuration
// TODO: Move to environment variable in production
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'your-google-client-id';

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    verified: boolean;
  };
}

export async function signInWithGoogle(): Promise<AuthResult | null> {
  try {
    // Use Expo proxy for redirect (generates a real HTTPS URL that Google accepts)
    // This requires you to be logged into Expo: npx expo whoami
    const redirectUri = AuthSession.makeRedirectUri({
      useProxy: true, // Use Expo proxy - generates https://auth.expo.io/@username/slug
    });

    console.log('🔗 Using redirect URI:', redirectUri);
    console.log('📝 IMPORTANT: Add this EXACT URI to Google Cloud Console:');
    console.log('   ', redirectUri);
    console.log('   (Make sure you\'re logged into Expo: npx expo whoami)');

    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    };

    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
      redirectUri,
    });

    const result = await request.promptAsync(discovery, {
      useProxy: true, // Use Expo proxy for HTTPS redirect
    });

    if (result.type === 'success' && result.params.code) {
      // Send the authorization code to our backend to exchange for token
      const response = await fetch(`${API_BASE_URL}/auth/google/mobile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: result.params.code,
          redirectUri: redirectUri,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText || 'Authentication failed' };
        }
        console.error('Backend auth error:', error);
        throw new Error(error.message || 'Authentication failed');
      }
    } else if (result.type === 'error') {
      console.error('OAuth error:', result.error);
      throw new Error(result.error?.message || 'OAuth authentication failed');
    }

    return null;
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

export async function storeAuthToken(token: string): Promise<void> {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  await AsyncStorage.setItem('auth_token', token);
}

export async function getAuthToken(): Promise<string | null> {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return await AsyncStorage.getItem('auth_token');
}

export async function clearAuthToken(): Promise<void> {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  await AsyncStorage.removeItem('auth_token');
}
