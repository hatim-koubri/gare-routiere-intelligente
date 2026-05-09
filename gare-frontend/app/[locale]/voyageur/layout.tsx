// app/[locale]/voyageur/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Ticket, Calendar, Search,
  Home, LogOut, Menu, X, Bus, ChevronRight,
  Luggage, GitCompare, Heart, RefreshCw, FileText,
  Download, ClipboardList, AlertCircle, Wallet,
} from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import { WebSocketProvider } from '@/lib/websocket/WebSocketProvider';
import { ThemeToggle } from '@/components/ui/curtain-theme-toggle';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const navigationItems = [
  { name: 'Tableau de bord', href: '/fr/voyageur/dashboard', icon: LayoutDashboard },
  { name: 'Mes réservations', href: '/fr/voyageur/reservations', icon: Calendar },
  { name: 'Mes tickets', href: '/fr/voyageur/tickets', icon: Ticket },
  { name: 'Mes historiques', href: '/fr/voyageur/historique', icon: ClipboardList },
  { name: 'Rechercher', href: '/fr/recherche', icon: Search },
  { name: 'Mes favoris', href: '/fr/voyageur/favoris', icon: Heart },
  { name: 'Comparaison', href: '/fr/voyageur/comparaison', icon: GitCompare },
  { name: 'Mes bagages', href: '/fr/voyageur/bagages/declarer', icon: Luggage },
  { name: 'Plan des quais', href: '/fr/voyageur/plan-quai', icon: MapPin },
  { name: 'Télécharger plan', href: '/fr/voyageur/telechargements', icon: Download },
  { name: 'Mes réclamations', href: '/fr/voyageur/reclamations', icon: AlertCircle },
  { name: 'Mes remboursements', href: '/fr/voyageur/remboursements', icon: Wallet },
];

export default function VoyageurLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/fr/auth/login');
    } else if (!isLoading && user && user.role !== 'VOYAGEUR') {
      if (user.role === 'ADMIN') router.push('/fr/admin');
      else if (user.role === 'CHAUFFEUR') router.push('/fr/chauffeur/dashboard');
      else router.push('/fr/auth/login');
    }
  }, [user, isLoading, router]);

  const isActive = (href: string) =>
    href === '/fr/voyageur/dashboard' ? pathname === href : pathname.startsWith(href);

  const handleLogout = () => {
    logout();
    router.push('/fr/auth/login');
  };

  const initials = user
    ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()
    : 'V';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">Chargement de votre espace…</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'VOYAGEUR') return null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-zinc-900">

      {/* Brand - RIHLA WOW */}
      <div className="flex items-center gap-3 px-6 py-8 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div>
          <p className="font-black text-blue-600 dark:text-blue-500 text-3xl tracking-tighter uppercase italic leading-none">
            RIHLA
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Espace Voyageur</p>
        </div>
      </div>

      {/* User card */}
      <div className="mx-4 my-6 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-white text-sm font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user.prenom} {user.nom}</p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar">
        <p className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Menu</p>
        {navigationItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200
                ${active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-blue-700 dark:hover:text-blue-400'
                }
              `}
            >
              <item.icon
                size={17}
                className={`flex-shrink-0 transition-transform group-hover:scale-110
                  ${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`}
              />
              <span className="flex-1 truncate">{item.name}</span>
              {active && <ChevronRight size={14} className="text-white/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-6 pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-1 mt-2 bg-white dark:bg-zinc-900">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all"
        >
          <Home size={17} className="text-slate-400" />
          <span>Accueil Public</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
        >
          <LogOut size={17} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  const currentPage = navigationItems.find(i => isActive(i.href))?.name ?? 'Espace Voyageur';

  return (
    <WebSocketProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex transition-colors duration-300">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col border-r border-slate-100 dark:border-zinc-800 fixed left-0 top-0 h-full z-30 shadow-sm">
          <SidebarContent />
        </aside>

        {/* ── Mobile Overlay ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 flex flex-col shadow-2xl transition-transform duration-300 ease-out lg:hidden bg-white dark:bg-zinc-900",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="font-black text-blue-600 dark:text-blue-500 text-2xl tracking-tighter uppercase italic">RIHLA</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <SidebarContent />
          </div>
        </aside>

        {/* ── Main Area ── */}
        <div className="flex-1 flex flex-col lg:ml-64 min-h-screen">

          {/* Topbar Unified */}
          <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-100 dark:border-zinc-800 px-4 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-blue-600 rounded-full hidden md:block" />
                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">{currentPage}</h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle variant="icon" />
              
              <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 mx-1 hidden md:block" />
              
              <NotificationBell />
              
              <Link
                href="/fr/recherche"
                className="hidden sm:flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-md shadow-blue-200 dark:shadow-none"
              >
                <Search size={14} />
                Réserver
              </Link>

              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 p-4 md:p-8 lg:p-10 bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </WebSocketProvider>
  );
}