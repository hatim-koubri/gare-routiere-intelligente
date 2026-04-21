'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Role } from '@/types';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { locale } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(`/${locale}/auth/login`);
      } 
      // ✅ REDIRECTION POUR CHAUFFEUR
      else if (user.role === Role.CHAUFFEUR) {
        router.push(`/${locale}/chauffeur/dashboard`);
      }
      // ✅ REDIRECTION POUR ADMIN
      else if (user.role === Role.ADMIN) {
        router.push(`/${locale}/admin`);
      }
    }
  }, [user, isLoading, router, locale]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-t-[3px] border-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Pour les voyageurs, afficher le dashboard voyageur
  if (user.role === Role.VOYAGEUR) {
    return (
      // ... ton code voyageur existant
      <div>Dashboard Voyageur</div>
    );
  }

  return null;
}