'use client';

import { Quai } from '@/types';
import { motion } from 'framer-motion';
import { Truck, Unlock, Lock, MoreVertical, Building2 } from 'lucide-react';

interface QuaiSlotProps {
  quai: Quai;
  onAttribuer: (id: number) => void;
  onLiberer: (id: number) => void;
}

export function QuaiSlot({ quai, onAttribuer, onLiberer }: QuaiSlotProps) {
  const isOccupied = !quai.disponible;

  return (
    <motion.div 
      layout
      className={`relative h-[240px] rounded-[2.5rem] border-2 transition-all duration-700 overflow-hidden group ${
        isOccupied 
          ? 'glass-premium border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.1)]' 
          : 'bg-white/[0.02] border-dashed border-white/10 hover:border-indigo-500/30 hover:bg-white/[0.05]'
      }`}
    >
      {/* Decorative Cyber Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="p-8 h-full flex flex-col justify-between relative z-10">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2">Slot Telemetry</span>
            <h3 className={`text-5xl font-black italic tracking-tighter transition-colors duration-500 ${isOccupied ? 'text-white text-glow' : 'text-white/20'}`}>
              Q-{quai.numero < 10 ? `0${quai.numero}` : quai.numero}
            </h3>
          </div>
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`p-3.5 rounded-2xl transition-all duration-500 ${
                isOccupied 
                    ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
                    : 'bg-white/5 text-white/40 border border-white/5'
            }`}
          >
            {isOccupied ? <Lock size={20} strokeWidth={2.5} /> : <Unlock size={20} strokeWidth={2.5} />}
          </motion.div>
        </div>

        {isOccupied ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <Building2 size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em]">Signature</span>
                <span className="text-sm font-black text-white truncate uppercase tracking-tight">{quai.compagnieNom || 'Anonymous'}</span>
              </div>
            </div>
            <button 
              onClick={() => onLiberer(quai.id)}
              className="w-full bg-white text-indigo-950 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500 hover:text-white transition-all transform active:scale-95 shadow-xl"
            >
              Release Protocol
            </button>
          </motion.div>
        ) : (
          <button 
            onClick={() => onAttribuer(quai.id)}
            className="w-full glass-premium text-indigo-400 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500 hover:text-white transition-all hover:scale-[1.02] active:scale-95 border-indigo-500/20"
          >
            Assign Segment
          </button>
        )}
      </div>

      {/* Cinematic Background Icon */}
      <Truck 
        size={160} 
        className={`absolute -right-12 -bottom-12 transition-all duration-1000 ease-in-out pointer-events-none ${
          isOccupied ? 'text-indigo-500/10 rotate-12 scale-110' : 'text-white/5 rotate-0 scale-90 opacity-20'
        }`}
      />
    </motion.div>
  );
}
