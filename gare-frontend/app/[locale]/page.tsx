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
        router.push(`/${locale}/admin/dashboard`);
      } else if (user.role === Role.CHAUFFEUR) {
        router.push(`/${locale}/chauffeur/dashboard`);
      } else if (user.role === Role.VOYAGEUR) {
        router.push(`/${locale}/voyageur/dashboard`);
      }
    }
  }, [user, isLoading, router, locale]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) return null;
  
  // Ne rien afficher, la redirection se fait
  return null;
}