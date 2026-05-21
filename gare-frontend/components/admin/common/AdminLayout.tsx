'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Role } from '@/types';
import AdminSidebar from './AdminSidebar';
import { ThemeToggle } from './ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { WebSocketProvider } from '@/lib/websocket/WebSocketProvider';
import NotificationBell from '@/components/notifications/NotificationBell';

const pageTitles: Record<string, string> = {
  '/fr/admin': 'Tableau de bord',
  '/fr/admin/compagnies': 'Compagnies',
  '/fr/admin/bus': 'Flotte de bus',
  '/fr/admin/lignes': 'Lignes',
  '/fr/admin/trajets': 'Trajets',
  '/fr/admin/quais': 'Quais',
  '/fr/admin/facturation-quais': 'Facturation Quais',
  '/fr/admin/chauffeurs': 'Chauffeurs',
  '/fr/admin/ocr': 'Scanner OCR',
  '/fr/admin/annonces': 'Annonces',
  '/fr/admin/promotions': 'Promotions',
  '/fr/admin/notifications': 'Notifications',
};

const pageIcons: Record<string, string> = {
  '/fr/admin': 'LayoutDashboard',
  '/fr/admin/compagnies': 'Building2',
  '/fr/admin/bus': 'Bus',
  '/fr/admin/lignes': 'MapPin',
  '/fr/admin/trajets': 'MapPin',
  '/fr/admin/quais': 'SquareStack',
  '/fr/admin/facturation-quais': 'FileText',
  '/fr/admin/chauffeurs': 'Users',
  '/fr/admin/ocr': 'ScanEye',
  '/fr/admin/annonces': 'Megaphone',
  '/fr/admin/promotions': 'Tag',
};

function LayoutParticles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: 1 + Math.random() * 3, delay: Math.random() * 12, duration: 7 + Math.random() * 10,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-gradient-to-br from-emerald-300/15 to-teal-400/8 dark:from-emerald-400/10 dark:to-teal-500/5"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -60 - Math.random() * 40],
            x: [0, (Math.random() - 0.5) * 30],
            opacity: [0, 0.4, 0],
            scale: [0, 1.3, 0],
          }}
          transition={{
            duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut',
          }}
        />
      ))}
      {/* Gradient orbs */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-400/5 dark:bg-emerald-500/5 rounded-full blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-teal-400/5 dark:bg-teal-500/5 rounded-full blur-[120px]" />
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Bonjour');
    else if (h < 18) setGreeting('Bon après-midi');
    else setGreeting('Bonsoir');
  }, []);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== Role.ADMIN)) {
      router.push('/fr/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900">
        <LayoutParticles />
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-14 h-14 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-1.5 rounded-full border-2 border-emerald-200/30 dark:border-emerald-800/30 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -inset-3 rounded-full border border-emerald-400/20"
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <p className="text-slate-500 dark:text-zinc-400 text-sm font-bold tracking-wider uppercase">Chargement</p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">Initialisation de l&apos;interface...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== Role.ADMIN) return null;

  const pageTitle = Object.entries(pageTitles).find(
    ([key]) => key === pathname || (key !== '/fr/admin' && pathname.startsWith(key))
  )?.[1] ?? 'Administration';

  const initials = `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase();

  return (
    <WebSocketProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-zinc-950 dark:to-zinc-900 flex transition-colors duration-300">
        <LayoutParticles />
        <AdminSidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
          {/* Animated gradient line at top */}
          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent z-20"
          />

          {/* Topbar */}
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 22, stiffness: 200 }}
            className="relative z-10 flex-shrink-0 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-zinc-800/60 px-6 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.05 }}
                className="w-1.5 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"
              />
              <motion.h2
                key={pageTitle}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight"
              >
                {pageTitle}
              </motion.h2>
            </div>

            <div className="flex items-center gap-4">
              {/* Live date */}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xs text-slate-400 dark:text-zinc-500 hidden sm:block font-medium"
              >
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </motion.span>

              {/* Theme Toggle */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', damping: 15 }}
              >
                <ThemeToggle />
              </motion.div>

              {/* Notification Bell */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.17, type: 'spring', damping: 15 }}
              >
                <NotificationBell notificationsHref="/fr/admin/notifications" variant="emerald" />
              </motion.div>

              {/* User badge */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2.5 px-3.5 py-1.5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-xl border border-emerald-100/50 dark:border-emerald-800/30 shadow-sm"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-2 h-2 rounded-full bg-emerald-500"
                />
                <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider hidden sm:block">
                  {greeting}, {user.prenom}
                </span>
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                  <span className="text-white text-[10px] font-bold">{initials}</span>
                </div>
              </motion.div>
            </div>
          </motion.header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-5 lg:p-7 relative z-0">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="max-w-[1500px] mx-auto"
            >
              {children}
            </motion.div>

            {/* Footer spacer */}
            <div className="h-8" />
          </main>
        </div>
      </div>
    </WebSocketProvider>
  );
}
