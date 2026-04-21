'use client';

import { Search, Bell, Mail, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { motion } from 'framer-motion';

export default function AdminHeader() {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between gap-8 mb-10 px-2">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-800/40 group-focus-within:text-[#064e3b] transition-colors" />
          <input 
            type="text" 
            placeholder="Search network analytics, partners, or logs..." 
            className="w-full bg-white border border-emerald-900/5 rounded-2.5xl py-4 pl-14 pr-8 outline-none focus:ring-4 focus:ring-emerald-900/5 focus:border-[#064e3b]/20 transition-all font-black text-sm text-emerald-950 placeholder:text-emerald-900/20 shadow-sm"
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 bg-emerald-50 px-2.5 py-1.5 rounded-xl text-[10px] font-black text-emerald-800/40 border border-emerald-900/5 pointer-events-none uppercase tracking-widest">
            Alt K
          </div>
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-6">
        {/* Simple Icon buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button className="p-3.5 bg-white border border-emerald-900/5 rounded-2xl text-emerald-800/40 hover:text-[#064e3b] hover:bg-emerald-50 transition-all shadow-sm">
            <Mail size={22} />
          </button>
          <button className="p-3.5 bg-white border border-emerald-900/5 rounded-2xl text-emerald-800/40 hover:text-[#064e3b] hover:bg-emerald-50 transition-all shadow-sm relative">
            <Bell size={22} />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-600 rounded-full border-2 border-white" />
          </button>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Divider */}
        <div className="h-10 w-px bg-emerald-900/5 mx-2" />

        {/* User Profile */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-4 bg-white p-2 pr-6 rounded-2.5xl border border-emerald-900/5 cursor-pointer hover:shadow-xl transition-all shadow-sm"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center text-white font-black text-sm shadow-[0_8px_15px_rgba(6,78,59,0.2)]">
            {user?.nom?.charAt(0) || 'D'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-black text-emerald-950 leading-none mb-1.5">{user?.nom || 'Admin'} {user?.prenom}</div>
            <div className="text-[10px] uppercase font-black text-emerald-800/40 tracking-[0.2em] leading-none">Dispatcher Root</div>
          </div>
          <ChevronDown size={14} className="text-emerald-900/20 ml-2" />
        </motion.div>
      </div>
    </header>
  );
}
