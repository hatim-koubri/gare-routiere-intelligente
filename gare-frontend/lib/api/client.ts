import axios from 'axios';
import { storage } from '@/lib/utils/storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = storage.getToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Ton backend n'a PAS de refresh token pour l'instant
      // Donc on déconnecte simplement l'utilisateur
      storage.clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/fr/auth/login';
      }
    }
    
    const errorData = error.response?.data;
    const hasData = errorData && typeof errorData === 'object' && Object.keys(errorData).length > 0;
    const errorMsg = hasData ? errorData : error.message;
    console.error('[API Response Error]', errorMsg);
    return Promise.reject(error);
  }
);