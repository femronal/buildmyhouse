import { getAuthToken } from './auth';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3001/api' 
  : 'https://api.buildmyhouse.com/api';

async function getHeaders() {
  const token = await getAuthToken();
  console.log('🔑 [Contractor App] API Token:', token ? 'Token exists' : 'NO TOKEN FOUND');
  if (!token) {
    console.error('❌ [Contractor App] No auth token available for API request');
  }
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export const api = {
  get: async (endpoint: string) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: await getHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Failed to fetch data');
    }
    
    return response.json();
  },

  post: async (endpoint: string, data: any, options?: { headers?: any }) => {
    console.log('📤 [Contractor App] POST request:', endpoint);
    console.log('📦 [Contractor App] Request data:', data);
    
    try {
      const isFormData = data instanceof FormData;
      const headers = await getHeaders();
      
      // For FormData, don't set Content-Type (browser will set it with boundary)
      // For JSON, use application/json
      const finalHeaders = isFormData
        ? { ...(headers.Authorization && { Authorization: headers.Authorization }) }
        : headers;

      // Merge with any custom headers
      const mergedHeaders = { ...finalHeaders, ...(options?.headers || {}) };
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: mergedHeaders,
        body: isFormData ? data : JSON.stringify(data),
      });

      console.log('📥 [Contractor App] Response status:', response.status);
      console.log('📥 [Contractor App] Response ok:', response.ok);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('❌ [Contractor App] Error response:', errorData);
        } catch (e) {
          const text = await response.text();
          console.error('❌ [Contractor App] Error response (text):', text);
          errorData = { message: text || 'Request failed' };
        }
        
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).data = errorData;
        throw error;
      }

      const result = await response.json();
      console.log('✅ [Contractor App] Response data:', result);
      return result;
    } catch (error: any) {
      console.error('❌ [Contractor App] POST error:', error);
      if (error.message) {
        console.error('❌ [Contractor App] Error message:', error.message);
      }
      throw error;
    }
  },

  patch: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Failed to update resource');
    }

    return response.json();
  },

  delete: async (endpoint: string) => {
    console.log('🗑️ [Contractor App] DELETE request:', endpoint);
    
    try {
      const headers = await getHeaders();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers,
      });

      console.log('🗑️ [Contractor App] DELETE response status:', response.status);
      console.log('🗑️ [Contractor App] DELETE response ok:', response.ok);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('❌ [Contractor App] DELETE error response:', errorData);
        } catch (e) {
          const text = await response.text();
          console.error('❌ [Contractor App] DELETE error response (text):', text);
          errorData = { message: text || 'Request failed' };
        }
        
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).data = errorData;
        throw error;
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        console.log('✅ [Contractor App] DELETE successful (204 No Content)');
        return { message: 'Deleted successfully' };
      }

      const result = await response.json();
      console.log('✅ [Contractor App] DELETE successful:', result);
      return result;
    } catch (error: any) {
      console.error('❌ [Contractor App] DELETE error:', error);
      throw error;
    }
  },
};