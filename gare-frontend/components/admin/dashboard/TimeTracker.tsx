'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { motion } from 'framer-motion';

export function TimeTracker() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white rounded-[2.5rem] p-10 h-full flex flex-col justify-between relative overflow-hidden group border border-emerald-900/5 shadow-[0_20px_50px_rgba(6,78,59,0.03)]">
      {/* Animated background highlights */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 45, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -right-1/2 w-[150%] h-[150%] border-2 border-emerald-900/5 rounded-[4rem]" 
        />
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="text-emerald-800/40 text-[11px] uppercase font-black tracking-[0.3em] italic">Network Clock</div>
        
        <div className="text-[52px] font-black text-emerald-950 tracking-tighter tabular-nums leading-none">
          {time.toLocaleTimeString('fr-FR', { hour12: false })}
        </div>

        <div className="flex items-center gap-4">
          <button className="px-6 py-3 rounded-2xl bg-emerald-50 text-emerald-800 font-black text-[10px] uppercase tracking-widest hover:bg-[#064e3b] hover:text-white transition-all shadow-sm">
            Pause Scan
          </button>
          <button className="w-12 h-12 rounded-2xl bg-red-50 hover:bg-red-500 flex items-center justify-center text-red-500 hover:text-white transition-all border border-red-100/50">
            <Square size={18} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}
