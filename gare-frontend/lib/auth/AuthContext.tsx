'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api/auth';
import { User, Role } from '@/types';
import { storage } from '@/lib/utils/storage';
import { useRouter, useParams } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  hasRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { locale } = useParams() as { locale: string };

  useEffect(() => {
    const storedUser = storage.getUser();
    if (storedUser && storage.getToken()) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const loggedUser = {
      id: response.userId,
      email: response.email,
      nom: response.nom,
      prenom: response.prenom,
      role: response.role,
    };
    setUser(loggedUser);
    
    // Redirection selon le rôle
    if (response.role === Role.ADMIN) {
      router.push(`/${locale}/admin`);
    } else {
      router.push(`/${locale}/dashboard`);
    }
  };

  const register = async (data: any) => {
    const response = await authApi.register(data);
    const newUser = {
      id: response.userId,
      email: response.email,
      nom: response.nom,
      prenom: response.prenom,
      role: response.role,
    };
    setUser(newUser);
    
    // Redirection selon le rôle après inscription
    if (response.role === Role.ADMIN) {
      router.push(`/${locale}/admin`);
    } else {
      router.push(`/${locale}/dashboard`);
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const hasRole = (roles: Role[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};