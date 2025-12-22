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
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      return parseGeocodingResult(data.results[0]);
    }
    
    console.error('Geocoding failed:', data.status);
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

/**
 * Reverse geocode coordinates to address
 */
export const reverseGeocode = async (latitude: number, longitude: number): Promise<AddressDetails | null> => {
  try {
    const apiKey = GOOGLE_MAPS_CONFIG.apiKey;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      return parseGeocodingResult(data.results[0]);
    }
    
    console.error('Reverse geocoding failed:', data.status);
    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
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
