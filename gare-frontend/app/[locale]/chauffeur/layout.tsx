'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Role } from '@/types';
import ChauffeurSidebar from '@/components/chauffeur/ChauffeurSidebar';
import Header from '@/components/layout/Header';

export default function ChauffeurLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { locale } = useParams();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== Role.CHAUFFEUR)) {
      router.push(`/${locale}/auth/login`);
    }
  }, [user, isLoading, router, locale]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user || user.role !== Role.CHAUFFEUR) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="flex">
        <ChauffeurSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}