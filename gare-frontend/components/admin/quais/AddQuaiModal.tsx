'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Hash, Banknote, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface AddQuaiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { numero: number; tarifHoraire: number }) => Promise<void>;
}

export function AddQuaiModal({ isOpen, onClose, onSubmit }: AddQuaiModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    numero: 0,
    tarifHoraire: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({ numero: 0, tarifHoraire: 0 });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101] px-4"
          >
            <div className="bg-white dark:bg-zinc-950 border border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="bg-emerald-500 p-8 text-white relative">
                 <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black italic tracking-tight">Nouveau Quai</h2>
                        <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mt-1">Expansion du Terminal de Parking</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                        <X size={24} />
                    </button>
                 </div>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Numéro du Quai *</label>
                    <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" size={18} />
                        <input 
                            required
                            type="number"
                            min={1}
                            value={formData.numero || ''}
                            onChange={(e) => setFormData({...formData, numero: parseInt(e.target.value)})}
                            placeholder="ex: 12"
                            className="w-full bg-secondary/50 dark:bg-zinc-800 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tarif Horaire (DH) *</label>
                    <div className="relative">
                        <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" size={18} />
                        <input 
                            required
                            type="number"
                            step="0.01"
                            min={0}
                            value={formData.tarifHoraire || ''}
                            onChange={(e) => setFormData({...formData, tarifHoraire: parseFloat(e.target.value)})}
                            placeholder="ex: 25.00"
                            className="w-full bg-secondary/50 dark:bg-zinc-800 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button 
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? "Création..." : (
                            <>
                                <CheckCircle2 size={18} />
                                CRÉER LE QUAI
                            </>
                        )}
                    </button>
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-6 bg-secondary dark:bg-zinc-800 text-muted-foreground font-bold py-4 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                    >
                        ANNULER
                    </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
