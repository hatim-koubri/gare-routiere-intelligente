'use client';

import { Compagnie } from '@/types';
import { motion } from 'framer-motion';
import { Building2, Phone, Mail, ArrowRight, MoreHorizontal } from 'lucide-react';

interface CompagnieCardProps {
  compagnie: Compagnie;
}

export function CompagnieCard({ compagnie }: CompagnieCardProps) {
  const initials = compagnie.nom.substring(0, 2).toUpperCase();

  return (
    <motion.div 
      layout
      whileHover={{ y: -10, scale: 1.02 }}
      className="bg-white rounded-[3rem] p-10 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_25px_60px_rgba(6,78,59,0.08)] border border-emerald-900/5 hover:border-emerald-800/20"
    >
      <div className="flex justify-between items-start mb-10 relative z-10">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-800 rounded-[2rem] flex items-center justify-center font-black text-3xl border border-emerald-900/5 shadow-sm group-hover:bg-[#064e3b] group-hover:text-white transition-all duration-500 transform group-hover:rotate-6">
          {initials}
        </div>
        <button className="p-4 bg-emerald-50 rounded-2xl transition-all hover:scale-110 hover:bg-[#064e3b] group/more">
          <MoreHorizontal size={22} className="text-emerald-800/40 group-hover/more:text-white" />
        </button>
      </div>

      <div className="space-y-8 relative z-10">
        <div className="space-y-2">
          <h3 className="text-3xl font-black text-emerald-950 mb-1 group-hover:text-[#064e3b] transition-colors uppercase tracking-tighter italic truncate leading-none">
            {compagnie.nom}
          </h3>
          <div className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 tracking-[0.25em] border border-emerald-900/10 uppercase">
             SIGN: {compagnie.code}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-2">
          {compagnie.telephone && (
            <div className="flex items-center gap-4 text-xs text-emerald-900/40 font-black uppercase tracking-widest group-hover:text-emerald-900/80 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-950/5">
                <Phone size={16} className="text-[#064e3b]" />
              </div>
              {compagnie.telephone}
            </div>
          )}
          {compagnie.email && (
            <div className="flex items-center gap-4 text-xs text-emerald-900/40 font-black uppercase tracking-widest group-hover:text-emerald-900/80 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-950/5">
                <Mail size={16} className="text-[#064e3b]" />
              </div>
              <span className="truncate">{compagnie.email}</span>
            </div>
          )}
        </div>

        <div className="pt-8 border-t border-emerald-900/5 flex items-center justify-between">
           <span className="text-[10px] font-black uppercase text-emerald-800/30 tracking-[0.3em]">Operational Status</span>
           <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full animate-pulse ${compagnie.actif ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]'}`} />
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${compagnie.actif ? 'text-emerald-600' : 'text-red-500'}`}>
                    {compagnie.actif ? 'Online' : 'Restricted'}
                </span>
           </div>
        </div>
      </div>
      
      {/* Background Accent */}
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[80px] group-hover:scale-150 transition-all duration-1000" />
    </motion.div>
  );
}
