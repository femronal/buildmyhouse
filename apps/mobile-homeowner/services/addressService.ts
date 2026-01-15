import { GOOGLE_MAPS_CONFIG, ADDRESS_COMPONENTS } from '@/config/maps';

export interface AddressDetails {
  formattedAddress: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
}

/**
 * Geocode an address string to coordinates
 */
export const geocodeAddress = async (address: string): Promise<AddressDetails | null> => {
  try {
    const apiKey = GOOGLE_MAPS_CONFIG.apiKey;
    
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey.includes('Demo')) {
      console.warn('Google Maps API key not configured. Geocoding will not work.');
      throw new Error('Google Maps API key is not configured. Please set up your API key in the environment variables.');
    }
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return parseGeocodingResult(data.results[0]);
    }
    
    // Handle different error statuses from Google API
    if (data.status === 'ZERO_RESULTS') {
      throw new Error('No results found for this address. Please try a different address.');
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      throw new Error('Geocoding service is temporarily unavailable. Please try again later.');
    } else if (data.status === 'REQUEST_DENIED') {
      throw new Error('Geocoding service access denied. Please check API key configuration.');
    } else if (data.status === 'INVALID_REQUEST') {
      throw new Error('Invalid address format. Please enter a valid address.');
    }
    
    console.error('Geocoding failed:', data.status, data.error_message || '');
    throw new Error(`Geocoding failed: ${data.status}`);
  } catch (error: any) {
    // Handle network errors
    if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_INTERNET_DISCONNECTED') || error.message?.includes('NetworkError')) {
      console.error('Network error geocoding address:', error);
      throw new Error('Unable to connect to geocoding service. Please check your internet connection and try again.');
    }
    
    // Re-throw user-friendly errors
    if (error.message && !error.message.includes('Error geocoding')) {
      throw error;
    }
    
    console.error('Error geocoding address:', error);
    throw new Error('Failed to geocode address. Please try again.');
  }
};

/**
 * Reverse geocode coordinates to address
 */
export const reverseGeocode = async (latitude: number, longitude: number): Promise<AddressDetails | null> => {
  try {
    const apiKey = GOOGLE_MAPS_CONFIG.apiKey;
    
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey.includes('Demo')) {
      console.warn('Google Maps API key not configured. Reverse geocoding will not work.');
      throw new Error('Google Maps API key is not configured. Please set up your API key in the environment variables.');
    }
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return parseGeocodingResult(data.results[0]);
    }
    
    // Handle different error statuses from Google API
    if (data.status === 'ZERO_RESULTS') {
      throw new Error('No address found for these coordinates.');
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      throw new Error('Geocoding service is temporarily unavailable. Please try again later.');
    } else if (data.status === 'REQUEST_DENIED') {
      throw new Error('Geocoding service access denied. Please check API key configuration.');
    } else if (data.status === 'INVALID_REQUEST') {
      throw new Error('Invalid coordinates provided.');
    }
    
    console.error('Reverse geocoding failed:', data.status, data.error_message || '');
    throw new Error(`Reverse geocoding failed: ${data.status}`);
  } catch (error: any) {
    // Handle network errors
    if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_INTERNET_DISCONNECTED') || error.message?.includes('NetworkError')) {
      console.error('Network error reverse geocoding:', error);
      throw new Error('Unable to connect to geocoding service. Please check your internet connection and try again.');
    }
    
    // Re-throw user-friendly errors
    if (error.message && !error.message.includes('Error reverse geocoding')) {
      throw error;
    }
    
    console.error('Error reverse geocoding:', error);
    throw new Error('Failed to reverse geocode coordinates. Please try again.');
  }
};

/**
 * Parse Google Geocoding API result into AddressDetails
 */
function parseGeocodingResult(result: any): AddressDetails {
  const components = result.address_components || [];
  
  const getComponent = (type: string) => {
    const component = components.find((c: any) => c.types.includes(type));
    return component?.long_name || '';
  };
  
  const streetNumber = getComponent(ADDRESS_COMPONENTS.STREET_NUMBER);
  const route = getComponent(ADDRESS_COMPONENTS.ROUTE);
  const street = `${streetNumber} ${route}`.trim();
  
  return {
    formattedAddress: result.formatted_address || '',
    street: street || '',
    city: getComponent(ADDRESS_COMPONENTS.LOCALITY) || getComponent(ADDRESS_COMPONENTS.ADMIN_AREA_2),
    state: getComponent(ADDRESS_COMPONENTS.ADMIN_AREA_1),
    zipCode: getComponent(ADDRESS_COMPONENTS.POSTAL_CODE),
    country: getComponent(ADDRESS_COMPONENTS.COUNTRY),
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
  };
}

/**
 * Validate if address details are complete
 */
export const isAddressComplete = (address: Partial<AddressDetails>): boolean => {
  return !!(
    address.formattedAddress &&
    address.latitude &&
    address.longitude
  );
};

/**
 * Format address for display
 */
export const formatAddressDisplay = (address: Partial<AddressDetails>): string => {
  if (address.formattedAddress) {
    return address.formattedAddress;
  }
  
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zipCode,
    address.country,
  ].filter(Boolean);
  
  return parts.join(', ');
};


