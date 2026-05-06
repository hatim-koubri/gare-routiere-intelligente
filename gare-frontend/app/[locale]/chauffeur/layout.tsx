'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Role } from '@/types';
import ChauffeurSidebar from '@/components/chauffeur/ChauffeurSidebar';

export default function ChauffeurLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== Role.CHAUFFEUR)) {
      router.push('/fr/auth/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== Role.CHAUFFEUR) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      {/* Sidebar fixe */}
      <div className="sticky top-0 h-screen">
        <ChauffeurSidebar />
      </div>

      {/* Contenu principal */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}