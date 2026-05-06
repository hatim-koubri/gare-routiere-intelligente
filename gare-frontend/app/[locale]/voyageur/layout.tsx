'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Ticket, Calendar, Search,
  Home, LogOut, Menu, X, Bus, ChevronRight,
  Luggage, GitCompare,
} from 'lucide-react';

const navigationItems = [
  { name: 'Tableau de bord', href: '/fr/voyageur/dashboard', icon: LayoutDashboard },
  { name: 'Mes réservations', href: '/fr/voyageur/reservations', icon: Calendar },
  { name: 'Mes tickets', href: '/fr/voyageur/tickets', icon: Ticket },
  { name: 'Rechercher', href: '/fr/recherche', icon: Search },
  { name: 'Comparaison', href: '/fr/voyageur/comparaison', icon: GitCompare },
  { name: 'Mes bagages', href: '/fr/voyageur/bagages/declarer', icon: Luggage },
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Chargement de votre espace…</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'VOYAGEUR') return null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">

      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
          <Bus className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm">GareConnect</p>
          <p className="text-xs text-slate-400">Espace Voyageur</p>
        </div>
      </div>

      {/* User card */}
      <div className="mx-4 my-4 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user.prenom} {user.nom}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Menu</p>
        {navigationItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150
                ${active
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                  : 'text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                }
              `}
            >
              <item.icon
                size={17}
                className={`flex-shrink-0 transition-transform group-hover:scale-110
                  ${active ? 'text-white' : 'text-slate-400 group-hover:text-violet-500'}`}
              />
              <span className="flex-1 truncate">{item.name}</span>
              {active && <ChevronRight size={14} className="text-white/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5 pt-3 border-t border-slate-100 space-y-0.5 mt-2">
        <Link
          href="/"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-all"
        >
          <Home size={17} className="text-slate-400 group-hover:text-amber-500" />
          <span>Accueil</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
        >
          <LogOut size={17} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  const currentPage = navigationItems.find(i => isActive(i.href))?.name ?? 'Espace Voyageur';

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col border-r border-slate-100 fixed left-0 top-0 h-full z-30">
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 flex flex-col shadow-2xl
          transform transition-transform duration-300 ease-out lg:hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-violet-700 rounded-lg flex items-center justify-center">
              <Bus className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">GareConnect</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col lg:ml-64 min-h-screen">

        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-slate-800 text-sm">GareConnect</span>
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
        </header>

        {/* Desktop topbar */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 bg-violet-600 rounded-full" />
            <h2 className="text-sm font-semibold text-slate-700">{currentPage}</h2>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/fr/recherche"
              className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700 transition shadow-sm"
            >
              <Search size={14} />
              Rechercher
            </Link>
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}