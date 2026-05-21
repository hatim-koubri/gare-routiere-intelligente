'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Role } from '@/types';
import { WebSocketProvider } from '@/lib/websocket/WebSocketProvider';
import NotificationBell from '@/components/notifications/NotificationBell';
import ResponsableSidebar from './ResponsableSidebar';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/curtain-theme-toggle';

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
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-5">
          <div className="flex items-center gap-0.5">
            {"RIHLA".split("").map((letter, i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity, repeatDelay: 1 }}
                className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-orange-400 via-orange-500 to-red-500"
              >
                {letter}
              </motion.span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">Chargement de votre espace…</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== Role.RESPONSABLE_COMPAGNIE) return null;

  const pageTitle = Object.entries(pageTitles).find(
    ([key]) => key === pathname || (key !== '/fr/responsable' && pathname.startsWith(key))
  )?.[1] ?? 'Espace Responsable';

  const initials = user
    ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()
    : 'R';

  return (
    <WebSocketProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex transition-colors duration-300">
        <ResponsableSidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Topbar */}
          <header className="sticky top-0 z-30 flex-shrink-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-100 dark:border-zinc-800 px-4 md:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 bg-gradient-to-b from-orange-400 to-red-500 rounded-full" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">{pageTitle}</h2>
            </div>
            <div className="flex items-center gap-2.5">
              <ThemeToggle variant="icon" />
              <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700 mx-1" />
              <NotificationBell notificationsHref="/fr/responsable/notifications" />
              <span className="text-xs text-slate-400 dark:text-zinc-500 hidden sm:block font-medium">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200/50 dark:shadow-none">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
            </div>
          </header>
          {/* Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-[1500px] mx-auto"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </WebSocketProvider>
  );
}
