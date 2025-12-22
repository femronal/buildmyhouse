import { getAuthToken } from './auth';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3001/api' 
  : 'https://api.buildmyhouse.com/api';

async function getHeaders() {
  const token = await getAuthToken();
  
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

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `Failed to create resource: ${response.status} ${response.statusText}`);
    }

    return response.json();
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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Failed to delete resource');
    }

    return response.json();
  },
};