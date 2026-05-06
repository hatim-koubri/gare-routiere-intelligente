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
} from 'lucide-react';

export default function ChauffeurSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const menuItems = [
    {
      name: 'Tableau de bord',
      href: `/chauffeur/dashboard`,
      icon: LayoutDashboard,
    },
    {
      name: 'Mes trajets',
      href: `/chauffeur/trajets`,
      icon: CalendarDays,
    },
    {
      name: 'Scanner ticket',
      href: `/chauffeur/scanner/ticket`,
      icon: QrCode,
    },
    {
      name: 'Scanner bagage',
      href: `/chauffeur/scanner/bagage`,
      icon: Luggage,
    },
    {
      name: 'Signaler incident',
      href: `/chauffeur/incidents`,
      icon: AlertTriangle,
    },
    {
      name: 'Historique',
      href: '/chauffeur/historique',
      icon: History,
    },
  ];

  const isActive = (href: string) => pathname === `/fr${href}`;

  const initials = user
    ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()
    : 'C';

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex-shrink-0 flex flex-col">

      {/* ── Logo ── */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Bus className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none">GareConnect</p>
            <p className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider mt-0.5">Espace Chauffeur</p>
          </div>
        </div>

        {/* Avatar utilisateur */}
        {user && (
          <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-indigo-700">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {user.prenom} {user.nom}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                <span className="text-[10px] text-slate-400 font-medium">En service</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">
          Navigation
        </p>
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={`/fr${item.href}`}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {/* Barre active */}
              <span
                className={`absolute left-0 w-0.5 h-6 rounded-r-full transition-all ${
                  active ? 'bg-indigo-600 opacity-100' : 'opacity-0'
                }`}
              />
              <item.icon
                className={`w-4.5 h-4.5 flex-shrink-0 ${
                  active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
                size={18}
              />
              <span className="flex-1">{item.name}</span>
              {active && (
                <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Déconnexion ── */}
      <div className="px-3 py-4 border-t border-slate-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 group-hover:text-red-500 transition-colors" size={18} />
          <span>Déconnexion</span>
        </button>
      </div>

    </aside>
  );
}