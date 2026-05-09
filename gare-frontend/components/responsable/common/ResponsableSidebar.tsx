'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  LayoutDashboard, Bus, LogOut, ChevronRight, Home, Building2, Route, MapPin, Users, Tag, MessageSquare, Settings, Bell, Megaphone, ArrowLeftRight, ArmchairIcon, BarChart3, Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menu = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/fr/responsable' },
  { name: 'Chauffeurs', icon: Users, href: '/fr/responsable/chauffeurs' },
  { name: 'Flotte de Bus', icon: Bus, href: '/fr/responsable/bus' },
  { name: 'Lignes', icon: MapPin, href: '/fr/responsable/lignes' },
  { name: 'Trajets', icon: Route, href: '/fr/responsable/trajets' },
  { name: 'Codes Promo', icon: Tag, href: '/fr/responsable/promos' },
  { name: 'Réclamations', icon: MessageSquare, href: '/fr/responsable/reclamations' },
  { name: 'Remboursements', icon: ArrowLeftRight, href: '/fr/responsable/remboursements' },
  { name: 'Tarification', icon: Settings, href: '/fr/responsable/tarification' },
  { name: 'Notifications', icon: Bell, href: '/fr/responsable/notifications' },
  { name: 'Annonces', icon: Megaphone, href: '/fr/responsable/annonces' },
  { name: 'Sièges', icon: ArmchairIcon, href: '/fr/responsable/sieges' },
  { name: 'Analytics', icon: BarChart3, href: '/fr/responsable/analytics' },
  { name: 'Messages', icon: Mail, href: '/fr/responsable/messages' },
];

export default function ResponsableSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  const isActive = (href: string) =>
    href === '/fr/responsable' ? pathname === href : pathname.startsWith(href);

  const handleLogout = () => { logout(); router.push('/fr/auth/login'); };

  const initials = user
    ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()
    : 'R';

  return (
    <div className="w-64 min-w-[256px] h-screen bg-white flex flex-col flex-shrink-0 border-r border-slate-100 shadow-sm transition-colors duration-300">
      
      {/* Brand - RIHLA Style */}
      <div className="flex items-center gap-3 px-6 py-8 border-b border-slate-50">
        <div>
          <p className="font-black text-blue-600 text-3xl tracking-tighter uppercase italic leading-none">
            RIHLA
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Espace Responsable</p>
        </div>
      </div>

      {/* Responsable User Card */}
      {user && (
        <div className="mx-4 my-6 bg-slate-50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100/50">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate leading-none mb-1">{user.prenom} {user.nom}</p>
            <p className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest">Responsable</p>
          </div>
        </div>
      )}

      {/* Nav Section */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto custom-scrollbar">
        <p className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Menu Principal</p>
        {menu.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
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
              {active && <ChevronRight size={14} className="text-white/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="px-3 pb-6 pt-3 border-t border-slate-50 space-y-1">
        <Link 
            href="/" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <Home size={17} className="text-slate-400" />
          <span>Tableau de Bord Public</span>
        </Link>
        <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-all"
        >
          <LogOut size={17} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}
