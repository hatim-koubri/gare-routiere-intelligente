'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Role } from '@/types';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { locale } = useParams();
  const router = useRouter();

  // ✅ Déplacer la redirection dans useEffect
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(`/${locale}/auth/login`);
      } else if (user.role === Role.ADMIN) {
        router.push(`/${locale}/admin`);
      }
    }
  }, [user, isLoading, router, locale]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;
  if (user.role === Role.ADMIN) return null; // Ne rien afficher, la redirection se fait

  return (
    // Ton dashboard pour les non-admin
    <div>Dashboard Voyageur/Chauffeur</div>
  );
}