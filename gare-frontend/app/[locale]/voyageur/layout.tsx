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
  Download, ClipboardList, AlertCircle, Wallet, MapPin, ShieldCheck, Zap,
} from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import { WebSocketProvider } from '@/lib/websocket/WebSocketProvider';
import { ThemeToggle } from '@/components/ui/curtain-theme-toggle';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const navigationItems = [
  { name: 'Tableau de bord', href: '/fr/voyageur/dashboard', icon: LayoutDashboard, group: 'principal' },
  { name: 'Mes réservations', href: '/fr/voyageur/reservations', icon: Calendar, group: 'principal' },
  { name: 'Mes tickets', href: '/fr/voyageur/tickets', icon: Ticket, group: 'principal' },
  { name: 'Mes historiques', href: '/fr/voyageur/historique', icon: ClipboardList, group: 'principal' },
  { name: 'Rechercher', href: '/fr/recherche', icon: Search, group: 'voyage' },
  { name: 'Mes favoris', href: '/fr/voyageur/favoris', icon: Heart, group: 'voyage' },
  { name: 'Comparaison', href: '/fr/voyageur/comparaison', icon: GitCompare, group: 'voyage' },
  { name: 'Plan des quais', href: '/fr/voyageur/plan-quai', icon: MapPin, group: 'services' },
  { name: 'Télécharger plan', href: '/fr/voyageur/telechargements', icon: Download, group: 'services' },
  { name: 'Mes réclamations', href: '/fr/voyageur/reclamations', icon: AlertCircle, group: 'support' },
  { name: 'Mes remboursements', href: '/fr/voyageur/remboursements', icon: Wallet, group: 'support' },
  { name: 'Mes préférences', href: '/fr/voyageur/preferences', icon: ShieldCheck, group: 'support' },
];

const groupLabels: Record<string, string> = {
  principal: 'Principal',
  voyage: 'Voyage',
  services: 'Services',
  support: 'Support',
};

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
        <div className="flex flex-col items-center gap-5">
          {/* RIHLA animated logo */}
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

  if (!user || user.role !== 'VOYAGEUR') return null;

  const currentPage = navigationItems.find(i => isActive(i.href))?.name ?? 'Espace Voyageur';

  // Group nav items
  const groups = ['principal', 'voyage', 'services', 'support'];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 overflow-hidden">

      {/* Brand */}
      <div className="px-5 py-7 border-b border-slate-100 dark:border-zinc-800">
        <Link href="/" className="group flex items-center outline-none mb-3">
          <motion.div initial="initial" whileHover="hover" className="flex items-center">
            {"RIHLA".split("").map((letter, index) => (
              <motion.span
                key={index}
                variants={{
                  initial: { y: 0, filter: "blur(0px)" },
                  hover: {
                    y: -3,
                    filter: "blur(0.2px)",
                    transition: { type: "spring", stiffness: 400, damping: 10, delay: index * 0.03 }
                  }
                }}
                className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 drop-shadow-[0_2px_8px_rgba(249,115,22,0.3)] select-none"
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-orange-400 to-red-500" />
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.25em]">Espace Voyageur</p>
        </div>
      </div>

      {/* User card */}
      <div className="mx-4 my-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-500 to-red-500 rounded-2xl p-4 shadow-lg shadow-orange-200/50 dark:shadow-none">
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full" />
          <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-white/5 rounded-full" />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 border border-white/30">
              <span className="text-white text-sm font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user.prenom} {user.nom}</p>
              <p className="text-[11px] text-orange-100 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto custom-scrollbar pb-2">
        {groups.map(group => {
          const items = navigationItems.filter(i => i.group === group);
          return (
            <div key={group} className="mb-2">
              <p className="px-3 pt-4 pb-1.5 text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.3em]">
                {groupLabels[group]}
              </p>
              {items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mb-0.5',
                      active
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-200/60 dark:shadow-none'
                        : 'text-slate-600 dark:text-zinc-400 hover:bg-orange-50 dark:hover:bg-zinc-800 hover:text-orange-600 dark:hover:text-orange-400'
                    )}
                  >
                    <item.icon
                      size={17}
                      className={cn(
                        'flex-shrink-0 transition-transform group-hover:scale-110',
                        active ? 'text-white' : 'text-slate-400 dark:text-zinc-500 group-hover:text-orange-500'
                      )}
                    />
                    <span className="flex-1 truncate">{item.name}</span>
                    {active && <div className="w-1.5 h-1.5 rounded-full bg-white/70" />}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5 pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-1 bg-slate-50/50 dark:bg-zinc-900">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-zinc-400 hover:bg-orange-50 dark:hover:bg-zinc-800 hover:text-orange-600 dark:hover:text-orange-400 transition-all"
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
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <Link href="/" className="group flex items-center outline-none">
                  <motion.div initial="initial" whileHover="hover" className="flex items-center">
                    {"RIHLA".split("").map((letter, index) => (
                      <motion.span
                        key={index}
                        variants={{
                          initial: { y: 0 },
                          hover: { y: -3, transition: { type: "spring", stiffness: 400, damping: 10, delay: index * 0.03 } }
                        }}
                        className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 select-none"
                      >
                        {letter}
                      </motion.span>
                    ))}
                  </motion.div>
                </Link>
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
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Main Area ── */}
        <div className="flex-1 flex flex-col lg:ml-64 min-h-screen">

          {/* Topbar */}
          <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-100 dark:border-zinc-800 px-4 md:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-zinc-800 transition"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-5 bg-gradient-to-b from-orange-400 to-red-500 rounded-full hidden md:block" />
                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">{currentPage}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <ThemeToggle variant="icon" />
              <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700 mx-1 hidden md:block" />
              <NotificationBell />
              <Link
                href="/fr/recherche"
                className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition shadow-md shadow-orange-200/50 dark:shadow-none"
              >
                <Zap size={13} />
                Réserver
              </Link>
              <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200/50 dark:shadow-none">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
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