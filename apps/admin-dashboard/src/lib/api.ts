const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Token management
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};

export const auth = {
  getToken,
  setToken,
  removeToken,
  isAuthenticated: () => !!getToken(),
};

const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

const getHeadersForFormData = (): HeadersInit => {
  const headers: HeadersInit = {};
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const getErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  try {
    const error = await response.json();
    if (typeof error?.message === 'string' && error.message.trim()) {
      return error.message;
    }
  } catch {
    // Ignore JSON parsing errors and try text body below.
  }

  try {
    const text = await response.text();
    if (text?.trim()) {
      return text.trim();
    }
  } catch {
    // Ignore text parsing errors and use fallback.
  }

  return fallback;
};

const isLoginEndpoint = (endpoint: string): boolean =>
  endpoint === '/auth/login' || endpoint.startsWith('/auth/login?');

const handleUnauthorized = async (response: Response, endpoint?: string): Promise<never> => {
  const message = await getErrorMessage(response, 'Unauthorized');
  removeToken();

  // Do not force a redirect when login itself fails; let the page show the server error.
  if (!endpoint || !isLoginEndpoint(endpoint)) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  throw new Error(message);
};

export const api = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: getHeaders(),
    });
    
    if (response.status === 401) {
      return handleUnauthorized(response, endpoint);
    }

    if (!response.ok) {
      const message = await getErrorMessage(response, `API Error: ${response.statusText}`);
      throw new Error(message);
    }
    
    return response.json();
  },
  
  post: async <T>(endpoint: string, data: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    
    if (response.status === 401) {
      return handleUnauthorized(response, endpoint);
    }

    if (!response.ok) {
      const message = await getErrorMessage(response, `API Error: ${response.statusText}`);
      throw new Error(message);
    }
    
    return response.json();
  },
  
  patch: async <T>(endpoint: string, data: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    
    if (response.status === 401) {
      return handleUnauthorized(response, endpoint);
    }

    if (!response.ok) {
      const message = await getErrorMessage(response, `API Error: ${response.statusText}`);
      throw new Error(message);
    }
    
    return response.json();
  },
  
  uploadFile: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: getHeadersForFormData(),
      body: formData,
    });
    if (response.status === 401) {
      return handleUnauthorized(response);
    }
    if (!response.ok) {
      const message = await getErrorMessage(response, `Upload failed: ${response.statusText}`);
      throw new Error(message);
    }
    const result = await response.json();
    const url = result.url?.startsWith('/') ? result.url : `/${result.url}`;
    return { url };
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (response.status === 401) {
      return handleUnauthorized(response, endpoint);
    }

    if (!response.ok) {
      const message = await getErrorMessage(response, `API Error: ${response.statusText}`);
      throw new Error(message);
    }
    
    return response.json();
  },
};



