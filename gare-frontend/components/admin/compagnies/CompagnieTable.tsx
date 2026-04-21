'use client';

import { Compagnie } from '@/types';
import { motion } from 'framer-motion';
import { Phone, Mail, MoreVertical, Building2, ExternalLink } from 'lucide-react';

interface CompagnieTableProps {
  compagnies: Compagnie[];
}

export function CompagnieTable({ compagnies }: CompagnieTableProps) {
  return (
    <div className="bg-white rounded-[3.5rem] border border-emerald-900/5 overflow-hidden shadow-[0_20px_50px_rgba(6,78,59,0.02)] relative">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse relative z-10">
          <thead>
            <tr className="bg-emerald-50/50 text-emerald-900">
              <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] whitespace-nowrap opacity-60">Entity Signature</th>
              <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] whitespace-nowrap opacity-60">Credential ID</th>
              <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] whitespace-nowrap opacity-60">Network Interface</th>
              <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] whitespace-nowrap opacity-60">Deployment Stat</th>
              <th className="px-10 py-8 text-right opacity-60"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-900/5">
            {compagnies.map((compagnie, idx) => (
              <motion.tr 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={compagnie.id} 
                className="group hover:bg-emerald-50/30 transition-all duration-300"
              >
                <td className="px-10 py-8">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#064e3b] font-black text-sm border border-emerald-900/10 group-hover:bg-[#064e3b] group-hover:text-white transition-all duration-500 transform group-hover:rotate-6">
                      {compagnie.nom.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-black text-emerald-950 uppercase tracking-tighter italic text-[16px] group-hover:text-[#064e3b] transition-colors leading-none mb-1">{compagnie.nom}</div>
                      <div className="text-[11px] text-emerald-900/40 font-bold italic group-hover:text-emerald-900/60 transition-colors truncate max-w-[250px]">
                        {compagnie.description || "Operational parameters not defined"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-8">
                  <span className="font-black text-[11px] bg-emerald-50 text-emerald-800 px-4 py-2 rounded-xl border border-emerald-900/10 tracking-[0.1em] uppercase">
                    {compagnie.code}
                  </span>
                </td>
                <td className="px-10 py-8">
                  <div className="space-y-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    {compagnie.email && (
                      <div className="flex items-center gap-3 text-[11px] text-emerald-900 font-bold hover:text-[#064e3b] transition-colors cursor-pointer">
                        <Mail size={14} className="text-[#064e3b]/40" /> 
                        <span className="truncate max-w-[180px]">{compagnie.email}</span>
                      </div>
                    )}
                    {compagnie.telephone && (
                      <div className="flex items-center gap-3 text-[11px] text-emerald-900 font-bold hover:text-[#064e3b] transition-colors cursor-pointer">
                        <Phone size={14} className="text-[#064e3b]/40" /> {compagnie.telephone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-10 py-8">
                   <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${compagnie.actif ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${compagnie.actif ? 'text-emerald-600' : 'text-red-500'}`}>
                            {compagnie.actif ? 'Active' : 'Offline'}
                        </span>
                   </div>
                </td>
                <td className="px-10 py-8 text-right">
                  <button className="p-4 bg-emerald-50 hover:bg-[#064e3b] border border-emerald-900/5 rounded-2xl transition-all hover:scale-110 group/ext hover:text-white">
                    <ExternalLink size={20} className="text-emerald-800/40 group-hover/ext:text-white" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
