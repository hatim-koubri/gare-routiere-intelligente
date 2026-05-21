import { apiClient } from './client';
import { LoginRequest, RegisterRequest, AuthResponse } from '@/types';
import { storage } from '@/lib/utils/storage';

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    if (response.data.token) {
      storage.setToken(response.data.token);
      storage.setUser({
        id: response.data.userId,
        email: response.data.email,
        nom: response.data.nom,
        prenom: response.data.prenom,
        role: response.data.role,
        sexe: response.data.sexe,
      });
    }
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    if (response.data.token) {
      storage.setToken(response.data.token);
      storage.setUser({
        id: response.data.userId,
        email: response.data.email,
        nom: response.data.nom,
        prenom: response.data.prenom,
        role: response.data.role,
        sexe: response.data.sexe,
      });
    }
    return response.data;
  },

  logout: (): void => {
    storage.clear();
    if (typeof window !== 'undefined') {
      window.location.href = '/fr/auth/login';
    }
  },

  getCurrentUser: () => {
    return storage.getUser();
  },

  isAuthenticated: (): boolean => {
    return !!storage.getToken();
  },
};