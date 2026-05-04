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

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  verified: boolean;
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/admin/login', credentials);
  if (response?.user?.role !== 'admin') {
    throw new Error('Only approved admin accounts can access this dashboard.');
  }
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
  try {
    return await api.get<CurrentUser>('/auth/me');
  } catch (error) {
    return null;
  }
};



