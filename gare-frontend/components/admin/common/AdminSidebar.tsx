'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  LayoutDashboard, Bus, Building2, SquareStack, Megaphone,
  Tag, LogOut, Users, ScanEye, MapPin, Calendar,
  ChevronRight, Home, Shield
} from 'lucide-react';

const menu = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/fr/admin' },
  { name: 'Compagnies', icon: Building2, href: '/fr/admin/compagnies' },
  { name: 'Bus', icon: Bus, href: '/fr/admin/bus' },
  { name: 'Lignes', icon: MapPin, href: '/fr/admin/lignes' },
  { name: 'Trajets', icon: Calendar, href: '/fr/admin/trajets' },
  { name: 'Quais', icon: SquareStack, href: '/fr/admin/quais' },
  { name: 'Chauffeurs', icon: Users, href: '/fr/admin/chauffeurs' },
  { name: 'OCR', icon: ScanEye, href: '/fr/admin/ocr' },
  { name: 'Annonces', icon: Megaphone, href: '/fr/admin/annonces' },
  { name: 'Promotions', icon: Tag, href: '/fr/admin/promotions' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  const isActive = (href: string) =>
    href === '/fr/admin' ? pathname === href : pathname.startsWith(href);

  const handleLogout = () => { logout(); router.push('/fr/auth/login'); };

  const initials = user
    ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()
    : 'A';

  return (
    <div className="w-60 min-w-[240px] h-screen bg-slate-900 flex flex-col flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Shield size={16} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm">GareAdmin</p>
          <p className="text-[11px] text-slate-500">Panneau de contrôle</p>
        </div>
      </div>

      {/* Admin card */}
      {user && (
        <div className="mx-3 my-3 bg-slate-800 rounded-xl p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user.prenom} {user.nom}</p>
            <p className="text-[10px] text-slate-500">Administrateur</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Navigation</p>
        {menu.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={15} className={`flex-shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-emerald-400'}`} />
              <span className="flex-1 text-sm">{item.name}</span>
              {active && <ChevronRight size={12} className="text-emerald-300" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4 pt-2 border-t border-slate-800 space-y-0.5">
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
          <Home size={15} className="text-slate-500" />Accueil
        </Link>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950 hover:text-rose-300 transition-all">
          <LogOut size={15} />Déconnexion
        </button>
      </div>
    </div>
  );
}