'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Search, CheckCircle2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Compagnie } from '@/types';

interface AttribuerQuaiModalProps {
  isOpen: boolean;
  onClose: () => void;
  compagnies: Compagnie[];
  onSelect: (compagnieId: number) => Promise<void>;
}

export function AttribuerQuaiModal({ isOpen, onClose, compagnies, onSelect }: AttribuerQuaiModalProps) {
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return compagnies.filter(c => 
      c.nom.toLowerCase().includes(search.toLowerCase()) || 
      c.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [compagnies, search]);

  const handleSelect = async (id: number) => {
    setLoadingId(id);
    try {
      await onSelect(id);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[101] px-4"
          >
            <div className="bg-white dark:bg-zinc-950 border border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
              <div className="bg-orange-500 p-8 text-white relative">
                 <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black italic">Attribution Quai</h2>
                        <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mt-1">Sélectionnez une compagnie partenaire</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                        <X size={24} />
                    </button>
                 </div>
              </div>

              <div className="p-6 border-b border-border/50">
                 <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-orange-500 transition-colors" size={18} />
                    <input 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher une compagnie..."
                        className="w-full bg-secondary/50 dark:bg-zinc-800 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                    />
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                {filtered.map(compagnie => (
                  <button
                    key={compagnie.id}
                    onClick={() => handleSelect(compagnie.id)}
                    disabled={loadingId !== null}
                    className="w-full flex items-center justify-between p-4 bg-secondary/30 dark:bg-zinc-900/50 hover:bg-orange-500 hover:text-white rounded-2xl border border-transparent hover:border-orange-500 transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-500/10 group-hover:bg-white/20 rounded-xl flex items-center justify-center text-orange-500 group-hover:text-white transition-colors">
                            <Building2 size={18} />
                        </div>
                        <div className="text-left">
                            <div className="font-black text-sm uppercase tracking-tight">{compagnie.nom}</div>
                            <div className="text-[10px] font-bold opacity-60 uppercase">{compagnie.code}</div>
                        </div>
                    </div>
                    {loadingId === compagnie.id ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                    ) : (
                      <CheckCircle2 size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                ))}
                
                {filtered.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground font-medium">
                    Aucune compagnie correspondante
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
