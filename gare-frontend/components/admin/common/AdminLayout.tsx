'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Role } from '@/types';
import AdminSidebar from './AdminSidebar';

const pageTitles: Record<string, string> = {
  '/fr/admin': 'Tableau de bord',
  '/fr/admin/compagnies': 'Compagnies',
  '/fr/admin/bus': 'Flotte de bus',
  '/fr/admin/lignes': 'Lignes',
  '/fr/admin/trajets': 'Trajets',
  '/fr/admin/quais': 'Quais',
  '/fr/admin/chauffeurs': 'Chauffeurs',
  '/fr/admin/ocr': 'Scanner OCR',
  '/fr/admin/annonces': 'Annonces',
  '/fr/admin/promotions': 'Promotions',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== Role.ADMIN)) {
      router.push('/fr/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== Role.ADMIN) return null;

  const pageTitle = Object.entries(pageTitles).find(
    ([key]) => key === pathname || (key !== '/fr/admin' && pathname.startsWith(key))
  )?.[1] ?? 'Administration';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar */}
        <header className="flex-shrink-0 bg-white border-b border-slate-100 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 bg-emerald-600 rounded-full" />
            <h2 className="text-sm font-semibold text-slate-700">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:block">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user.prenom?.[0]}{user.nom?.[0]}
              </span>
            </div>
          </div>
        </header>
        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-7">
          <div className="max-w-[1500px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}