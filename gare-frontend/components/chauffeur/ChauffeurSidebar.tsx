'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  QrCode,
  Luggage,
  AlertTriangle,
  LogOut,
  History,
  Bus,
  ChevronRight,
  Map,
  Scan,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChauffeurSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const menuItems = [
    { name: 'Tableau de bord', href: `/chauffeur/dashboard`, icon: LayoutDashboard },
    { name: 'Mes trajets', href: `/chauffeur/trajets`, icon: CalendarDays },
    { name: 'Scanner ticket', href: `/chauffeur/scanner/ticket`, icon: QrCode },
    { name: 'Scanner bagage', href: `/chauffeur/scanner/bagage`, icon: Luggage },
    { name: 'Bagage arrivée', href: `/chauffeur/scanner/bagage-arrivee`, icon: Scan },
    { name: 'Plan quai 3D', href: `/chauffeur/plan-quai`, icon: Map },
    { name: 'Signaler incident', href: `/chauffeur/incidents`, icon: AlertTriangle },
    { name: 'Historique', href: '/chauffeur/historique', icon: History },
  ];

  const isActive = (href: string) => pathname === `/fr${href}` || pathname.startsWith(`/fr${href}`);

  const initials = user
    ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()
    : 'C';

  return (
    <aside className="w-64 bg-white border-r border-slate-100 h-screen flex-shrink-0 flex flex-col shadow-sm transition-colors duration-300">

      {/* ── Brand RIHLA ── */}
      <div className="px-6 py-8 border-b border-slate-50">
        <div className="mb-6">
          <p className="font-black text-blue-600 text-3xl tracking-tighter uppercase italic leading-none">
            RIHLA
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Espace Chauffeur</p>
        </div>

        {/* Avatar utilisateur */}
        {user && (
          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100/50">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate leading-none mb-1">
                {user.prenom} {user.nom}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">En service</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 mb-3">
          Menu Principal
        </p>
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={`/fr${item.href}`}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative",
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
              )}
            >
              <item.icon
                size={17}
                className={cn(
                  "flex-shrink-0 transition-transform group-hover:scale-110",
                  active ? "text-white" : "text-slate-400 group-hover:text-blue-500"
                )}
              />
              <span className="flex-1 truncate">{item.name}</span>
              {active && (
                <ChevronRight size={14} className="text-white/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Déconnexion ── */}
      <div className="px-3 py-4 border-t border-slate-50">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-all duration-200 group"
        >
          <LogOut size={17} className="flex-shrink-0" />
          <span>Déconnexion</span>
        </button>
      </div>

    </aside>
  );
}