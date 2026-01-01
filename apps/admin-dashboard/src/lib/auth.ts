import { api, auth } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  // TODO: Replace with actual auth endpoint when implemented
  // For now, this is a placeholder
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  auth.setToken(response.token);
  return response;
};

export const logout = (): void => {
  auth.removeToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

export const getCurrentUser = async () => {
  // TODO: Replace with actual user endpoint when implemented
  try {
    return await api.get('/auth/me');
  } catch (error) {
    return null;
  }
};



