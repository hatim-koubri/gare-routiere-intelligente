// components/ui/collapsible-sidebar.tsx
"use client"
import React, { useState } from "react";
import {
  ChevronDown,
  ChevronsRight,
  Bus,
  ChevronRight
} from "lucide-react";
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const CollapsibleSidebar = ({ navigationItems, pathname, user, onLogout }) => {
  const [open, setOpen] = useState(true);

  const isActive = (href: string) =>
    href === '/fr/voyageur/dashboard' ? pathname === href : pathname.startsWith(href);

  const initials = user
    ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()
    : 'V';

  return (
    <nav
      className={cn(
        "sticky top-0 h-screen shrink-0 border-r transition-all duration-300 ease-in-out z-50",
        open ? 'w-64' : 'w-20',
        "border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 p-2 shadow-sm flex flex-col"
      )}
    >
      {/* Title / User Section */}
      <div className="mb-6 border-b border-slate-50 dark:border-slate-900 pb-4">
        <div className="flex items-center gap-3 p-2">
            <div className="grid size-10 shrink-0 place-content-center rounded-xl bg-orange-500 shadow-lg shadow-orange-500/20">
                <Bus className="h-5 w-5 text-white" />
            </div>
            {open && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="flex flex-col"
                >
                    <span className="block text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
                        Gare<span className="text-orange-500">Connect</span>
                    </span>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Espace Voyageur
                    </span>
                </motion.div>
            )}
        </div>
      </div>

      {/* Navigation Options */}
      <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar px-1">
        {navigationItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex h-11 w-full items-center rounded-xl transition-all duration-200 group",
                active 
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <div className="grid h-full w-14 flex-shrink-0 place-content-center">
                <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", active ? "text-white" : "text-slate-400 group-hover:text-orange-500")} />
              </div>
              
              {open && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs font-black uppercase tracking-widest truncate pr-4"
                >
                  {item.name}
                </motion.span>
              )}

              {active && open && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="mt-auto border-t border-slate-50 dark:border-slate-900 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl"
      >
        <div className="flex items-center p-3">
          <div className="grid size-10 place-content-center">
            <ChevronsRight
              className={cn(
                "h-5 w-5 transition-transform duration-500 text-slate-400",
                open ? "rotate-180" : ""
              )}
            />
          </div>
          {open && (
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Réduire
            </span>
          )}
        </div>
      </button>
    </nav>
  );
};
