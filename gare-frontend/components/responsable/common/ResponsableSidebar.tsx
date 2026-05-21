'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  LayoutDashboard, Bus, LogOut, ChevronRight, Home, MapPin, Route, Users, Tag, MessageSquare, Settings, Bell, Megaphone, ArrowLeftRight, BarChart3, Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
    <div className="w-64 min-w-[256px] h-screen bg-white dark:bg-zinc-900 flex flex-col flex-shrink-0 border-r border-slate-100 dark:border-zinc-800 shadow-sm transition-colors duration-300">

      {/* Brand - RIHLA */}
      <div className="flex flex-col gap-1 px-6 py-8 border-b border-slate-100 dark:border-zinc-800">
        <Link href="/" className="group flex items-center outline-none">
          <motion.div
            initial="initial"
            whileHover="hover"
            className="flex items-center"
          >
            {"RIHLA".split("").map((letter, index) => (
              <motion.span
                key={index}
                variants={{
                  initial: { y: 0, filter: "blur(0px)" },
                  hover: {
                    y: -2,
                    filter: "blur(0.1px)",
                    transition: {
                      type: "spring",
                      stiffness: 400,
                      damping: 10,
                      delay: index * 0.03
                    }
                  }
                }}
                className={cn(
                  "text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-orange-400 via-orange-500 to-red-500",
                  "drop-shadow-[0_2px_8px_rgba(249,115,22,0.3)] select-none"
                )}
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>
        </Link>
        <div className="flex items-center gap-2 mt-1 ml-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-orange-400 to-red-500" />
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.3em]">Espace Responsable</p>
        </div>
      </div>

      {/* User Card */}
      {user && (
        <div className="mx-4 my-6">
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-500 to-red-500 rounded-2xl p-4 shadow-lg shadow-orange-200/50 dark:shadow-none">
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full" />
            <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-white/5 rounded-full" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 border border-white/30">
                <span className="text-white text-sm font-bold">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{user.prenom} {user.nom}</p>
                <p className="text-[11px] text-orange-100 truncate">Responsable Compagnie</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto custom-scrollbar">
        <p className="px-3 py-3 text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em]">Menu Principal</p>
        {menu.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-200/60 dark:shadow-none"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-orange-50 dark:hover:bg-zinc-800 hover:text-orange-600 dark:hover:text-orange-400"
              )}
            >
              <item.icon
                size={17}
                className={cn(
                  "flex-shrink-0 transition-transform group-hover:scale-110",
                  active ? "text-white" : "text-slate-400 dark:text-zinc-500 group-hover:text-orange-500"
                )}
              />
              <span className="flex-1 truncate">{item.name}</span>
              {active && <div className="w-1.5 h-1.5 rounded-full bg-white/70" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-6 pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-zinc-400 hover:bg-orange-50 dark:hover:bg-zinc-800 hover:text-orange-600 dark:hover:text-orange-400 transition-all"
        >
          <Home size={17} className="text-slate-400 dark:text-zinc-500" />
          <span>Tableau de Bord Public</span>
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
}
