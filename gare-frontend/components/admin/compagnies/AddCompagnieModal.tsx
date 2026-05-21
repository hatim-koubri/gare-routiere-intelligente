'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Phone, Mail, FileText, Code, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface AddCompagnieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export function AddCompagnieModal({ isOpen, onClose, onSubmit }: AddCompagnieModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    telephone: '',
    email: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({ nom: '', code: '', telephone: '', email: '', description: '' });
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-slate-100 dark:border-zinc-800 rounded-[3rem] shadow-2xl overflow-hidden"
          >
            {/* Orbs */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl"
            />
            <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-gradient-to-br from-cyan-400/10 to-emerald-500/10 rounded-full blur-3xl" />

            {/* Header */}
            <div className="relative z-10 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 p-8 md:p-10 text-white">
              <div className="relative z-10">
                {/* RIHLA branding */}
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 }}
                  className="flex items-center gap-1.5 mb-4"
                >
                  {"RIHLA".split("").map((letter, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ y: 0 }}
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: idx * 0.08, ease: 'easeInOut' }}
                      className="text-xl font-black tracking-tighter select-none"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </motion.div>

                <div className="flex justify-between items-center">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 }}
                  >
                    <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase">Ajouter une Compagnie</h2>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Extension du Réseau Partenaire</p>
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                  >
                    <X size={22} />
                  </motion.button>
                </div>
              </div>
              <Building2 size={140} className="absolute -right-12 -bottom-12 text-white/5 rotate-12" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="relative z-10 p-8 md:p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40 dark:text-emerald-400/50 ml-1 italic">Nom de la compagnie *</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900/20 dark:text-zinc-500" size={18} />
                    <input
                      required
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      placeholder="ex: CTM Express"
                      className="w-full bg-emerald-50/50 dark:bg-zinc-800/80 border border-emerald-900/10 dark:border-zinc-700 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-black text-emerald-950 dark:text-zinc-100 focus:ring-4 focus:ring-emerald-950/10 dark:focus:ring-emerald-400/20 focus:border-emerald-600/30 dark:focus:border-emerald-500/30 outline-none transition-all placeholder:text-emerald-900/20 dark:placeholder:text-zinc-500"
                    />
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.13 }}
                  className="space-y-2"
                >
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40 dark:text-emerald-400/50 ml-1 italic">Code d'enregistrement *</label>
                  <div className="relative">
                    <Code className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900/20 dark:text-zinc-500" size={18} />
                    <input
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      placeholder="ex: CTM-001"
                      className="w-full bg-emerald-50/50 dark:bg-zinc-800/80 border border-emerald-900/10 dark:border-zinc-700 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-black text-emerald-950 dark:text-zinc-100 focus:ring-4 focus:ring-emerald-950/10 dark:focus:ring-emerald-400/20 focus:border-emerald-600/30 dark:focus:border-emerald-500/30 outline-none transition-all placeholder:text-emerald-900/20 dark:placeholder:text-zinc-500"
                    />
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16 }}
                  className="space-y-2"
                >
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40 dark:text-emerald-400/50 ml-1 italic">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900/20 dark:text-zinc-500" size={18} />
                    <input
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                      placeholder="+212 …"
                      className="w-full bg-emerald-50/50 dark:bg-zinc-800/80 border border-emerald-900/10 dark:border-zinc-700 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-black text-emerald-950 dark:text-zinc-100 focus:ring-4 focus:ring-emerald-950/10 dark:focus:ring-emerald-400/20 focus:border-emerald-600/30 dark:focus:border-emerald-500/30 outline-none transition-all placeholder:text-emerald-900/20 dark:placeholder:text-zinc-500"
                    />
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.19 }}
                  className="space-y-2"
                >
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40 dark:text-emerald-400/50 ml-1 italic">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900/20 dark:text-zinc-500" size={18} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="contact@compagnie.ma"
                      className="w-full bg-emerald-50/50 dark:bg-zinc-800/80 border border-emerald-900/10 dark:border-zinc-700 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-black text-emerald-950 dark:text-zinc-100 focus:ring-4 focus:ring-emerald-950/10 dark:focus:ring-emerald-400/20 focus:border-emerald-600/30 dark:focus:border-emerald-500/30 outline-none transition-all placeholder:text-emerald-900/20 dark:placeholder:text-zinc-500"
                    />
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="space-y-2"
              >
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40 dark:text-emerald-400/50 ml-1 italic">Description</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 text-emerald-900/20 dark:text-zinc-500" size={18} />
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Décrivez le rôle et la mission de la compagnie..."
                    rows={3}
                    className="w-full bg-emerald-50/50 dark:bg-zinc-800/80 border border-emerald-900/10 dark:border-zinc-700 rounded-[1.5rem] p-4 pl-11 text-sm font-black text-emerald-950 dark:text-zinc-100 focus:ring-4 focus:ring-emerald-950/10 dark:focus:ring-emerald-400/20 focus:border-emerald-600/30 dark:focus:border-emerald-500/30 outline-none transition-all resize-none placeholder:text-emerald-900/20 dark:placeholder:text-zinc-500"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26 }}
                className="flex flex-col sm:flex-row gap-3 pt-2"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white font-black py-4 rounded-2xl shadow-[0_15px_35px_rgba(6,78,59,0.25)] hover:shadow-[0_20px_40px_rgba(6,78,59,0.35)] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 uppercase text-xs tracking-widest leading-none"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> CRÉATION...</>
                  ) : (
                    <><CheckCircle2 size={18} /> Confirmer la création</>
                  )}
                </motion.button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 bg-emerald-50 dark:bg-zinc-800 text-emerald-800/40 dark:text-zinc-400 font-black py-4 rounded-2xl hover:bg-emerald-100/50 dark:hover:bg-zinc-700 hover:text-emerald-900 dark:hover:text-zinc-200 transition-all uppercase text-xs tracking-widest leading-none"
                >
                  Annuler
                </button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
