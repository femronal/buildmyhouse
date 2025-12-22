/**
 * Google Maps Configuration
 * 
 * To get your Google Maps API key:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select existing
 * 3. Enable APIs:
 *    - Maps SDK for iOS
 *    - Maps SDK for Android
 *    - Places API
 *    - Geocoding API
 * 4. Create credentials (API Key)
 * 5. Add your key below and to app.json
 */

export const GOOGLE_MAPS_CONFIG = {
  // Use environment variable in production, placeholder for local dev
  apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDJJ1acllPA41MzxJenjIpY-C7H1BnOQ5k',
  
  // Default map region (Lagos, Nigeria)
  defaultRegion: {
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },
  
  // Map styling options
  mapStyle: 'standard', // 'standard' | 'satellite' | 'hybrid' | 'terrain'
};

/**
 * Address component types for Google Places API
 */
export const ADDRESS_COMPONENTS = {
  STREET_NUMBER: 'street_number',
  ROUTE: 'route',
  LOCALITY: 'locality',
  ADMIN_AREA_1: 'administrative_area_level_1',
  ADMIN_AREA_2: 'administrative_area_level_2',
  COUNTRY: 'country',
  POSTAL_CODE: 'postal_code',
};
