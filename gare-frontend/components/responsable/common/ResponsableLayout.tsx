'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Role } from '@/types';
import ResponsableSidebar from './ResponsableSidebar';

const pageTitles: Record<string, string> = {
  '/fr/responsable': 'Tableau de bord',
  '/fr/responsable/chauffeurs': 'Chauffeurs',
  '/fr/responsable/bus': 'Flotte de Bus',
  '/fr/responsable/lignes': 'Lignes',
  '/fr/responsable/trajets': 'Trajets',
  '/fr/responsable/promos': 'Codes Promo',
  '/fr/responsable/reclamations': 'Réclamations',
  '/fr/responsable/tarification': 'Tarification',
  '/fr/responsable/notifications': 'Notifications',
  '/fr/responsable/annonces': 'Annonces',
  '/fr/responsable/messages': 'Messagerie',
  '/fr/responsable/analytics': 'Analytics',
  '/fr/responsable/sieges': 'Gestion des sièges',
  '/fr/responsable/remboursements': 'Remboursements',
};

export default function ResponsableLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== Role.RESPONSABLE_COMPAGNIE)) {
      router.push('/fr/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== Role.RESPONSABLE_COMPAGNIE) return null;

  const pageTitle = Object.entries(pageTitles).find(
    ([key]) => key === pathname || (key !== '/fr/responsable' && pathname.startsWith(key))
  )?.[1] ?? 'Espace Responsable';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <ResponsableSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar */}
        <header className="flex-shrink-0 bg-white border-b border-slate-100 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 bg-blue-600 rounded-full" />
            <h2 className="text-sm font-semibold text-slate-700">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:block">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
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
