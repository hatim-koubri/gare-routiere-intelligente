'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  LayoutDashboard, Building2, SquareStack, Megaphone,
  Tag, LogOut, ScanEye, Mail, Bell, FileText,
  ChevronRight, Home, Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const menu = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/fr/admin' },
  { name: 'Compagnies', icon: Building2, href: '/fr/admin/compagnies' },
  { name: 'Quais', icon: SquareStack, href: '/fr/admin/quais' },
  { name: 'Facturation Quais', icon: FileText, href: '/fr/admin/facturation-quais' },
  { name: 'OCR', icon: ScanEye, href: '/fr/admin/ocr' },
  { name: 'Notifications', icon: Bell, href: '/fr/admin/notifications' },
  { name: 'Annonces', icon: Megaphone, href: '/fr/admin/annonces' },
  { name: 'Promotions', icon: Tag, href: '/fr/admin/promotions' },
  { name: 'Messages', icon: Mail, href: '/fr/admin/messages' },
];

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.04, type: 'spring' as const, damping: 22, stiffness: 180 },
  }),
};

function PageParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: 1 + Math.random() * 2.5, delay: Math.random() * 10, duration: 6 + Math.random() * 8,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-gradient-to-br from-emerald-300/10 to-teal-400/5 dark:from-emerald-400/8 dark:to-teal-500/4"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -40 - Math.random() * 30], opacity: [0, 0.5, 0], scale: [0, 1.2, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

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
    <div className="w-60 min-w-[240px] h-screen bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex flex-col flex-shrink-0 relative overflow-hidden transition-colors duration-300">
      <PageParticles />

      {/* Gradient orbs */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/[0.03] dark:bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-teal-500/[0.03] dark:bg-teal-500/5 rounded-full blur-3xl" />

      {/* Brand */}
      <div className="relative z-10 flex flex-col gap-1.5 px-6 py-10 border-b border-slate-200 dark:border-zinc-800">
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
                    y: -2, filter: "blur(0.1px)",
                    transition: { type: "spring", stiffness: 400, damping: 10, delay: index * 0.03 },
                  },
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
        <div className="flex items-center gap-2 mt-1.5">
          <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Shield size={10} className="text-white" />
          </div>
          <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em]">Admin Central</p>
        </div>
      </div>

      {/* Admin card */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, type: 'spring', damping: 20 }}
          className="relative z-10 mx-4 my-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-800 dark:to-zinc-800/80 rounded-2xl p-4 flex items-center gap-3.5 border border-slate-200 dark:border-zinc-700/50 shadow-sm dark:shadow-lg dark:shadow-black/20"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20"
          >
            <span className="text-white text-sm font-bold">{initials}</span>
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.prenom} {user.nom}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Administrateur</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Nav */}
      <nav className="relative z-10 flex-1 px-3 py-1 space-y-1 overflow-y-auto">
        <p className="px-3 py-2.5 text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Navigation</p>
        {menu.map((item, i) => {
          const active = isActive(item.href);
          return (
            <motion.div
              key={item.href}
              custom={i}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <Link
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 overflow-hidden',
                  active
                    ? 'text-white shadow-lg shadow-emerald-500/20'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="adminNavBg"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
                {active && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"
                  />
                )}
                <item.icon
                  size={15}
                  className={cn(
                    'relative z-10 shrink-0 transition-colors duration-200',
                    active ? 'text-emerald-200' : 'text-slate-400 dark:text-zinc-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400'
                  )}
                />
                <span className="relative z-10 flex-1 text-sm">{item.name}</span>
                {active && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    <ChevronRight size={12} className="relative z-10 text-emerald-300" />
                  </motion.div>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="relative z-10 px-3 pt-4 pb-5 border-t border-slate-200 dark:border-zinc-800 space-y-1">
        <Link
          href="/"
          className="group flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          <Home size={15} className="text-slate-400 dark:text-zinc-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" />
          Accueil
        </Link>
        <button
          onClick={handleLogout}
          className="group w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium text-rose-500/80 dark:text-rose-400/80 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-300 transition-all"
        >
          <LogOut size={15} className="group-hover:translate-x-0.5 transition-transform" />
          Déconnexion
        </button>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/20 dark:via-emerald-500/30 to-transparent" />
    </div>
  );
}
