'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle2, Car, MapPin, Clock, AlertCircle
} from 'lucide-react';

import { useState, useEffect } from 'react';

import {
  StationnementOCR,
  OCRCorrectionRequest
} from '@/types';

interface ManualOCRCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationnement: StationnementOCR | null;
  onSubmit: (
    data: OCRCorrectionRequest
  ) => Promise<void>;
}

export function ManualOCRCorrectionModal({
  isOpen,
  onClose,
  stationnement,
  onSubmit
}: ManualOCRCorrectionModalProps) {

  const [loading, setLoading] =
    useState(false);

  const [formData, setFormData] =
    useState<OCRCorrectionRequest>({
      matricule: '',
      quaiId: undefined,
      heureEntree: '',
    });

  useEffect(() => {

    if (!stationnement) return;

    setFormData({
      matricule:
        stationnement.matricule &&
          stationnement.matricule !== 'INCONNU' &&
          stationnement.matricule !== 'ILLISIBLE'
          ? stationnement.matricule
          : '',

      quaiId:
        stationnement.quaiAttribue
          ? Number(stationnement.quaiAttribue)
          : undefined,

      heureEntree:
        stationnement.debut
          ? new Date(stationnement.debut)
            .toISOString()
            .slice(0, 16)
          : '',
    });

  }, [stationnement]);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setLoading(true);

    try {

      await onSubmit(formData);

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
            className="relative w-full max-w-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-slate-100 dark:border-zinc-800 rounded-[3rem] shadow-2xl overflow-hidden"
          >
            {/* Orbs */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-full blur-3xl"
            />
            <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-gradient-to-br from-amber-400/10 to-orange-500/10 rounded-full blur-3xl" />

            {/* Header */}
            <div className="relative z-10 bg-gradient-to-br from-orange-700 via-orange-600 to-red-700 p-8 text-white">
              {/* RIHLA branding */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 }}
                className="flex items-center gap-1.5 mb-3"
              >
                {"RIHLA".split("").map((letter, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ y: 0 }}
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: idx * 0.08, ease: 'easeInOut' }}
                    className="text-lg font-black tracking-tighter select-none"
                  >
                    {letter}
                  </motion.span>
                ))}
              </motion.div>
              <div className="flex justify-between items-start">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 }}
                >
                  <h2 className="text-2xl font-black italic tracking-tighter uppercase">Correction OCR</h2>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Saisie Manuelle & Vérification</p>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                >
                  <X size={20} />
                </motion.button>
              </div>
              <Car size={110} className="absolute -right-8 -bottom-8 text-white/5 rotate-12" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="relative z-10 p-8 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Car size={15} className="text-orange-500" />
                  <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-900/40 dark:text-orange-400/50">
                    Plaque d'immatriculation <span className="text-rose-500">*</span>
                  </label>
                </div>
                <input
                  required
                  type="text"
                  value={formData.matricule || ''}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value.toUpperCase() })}
                  placeholder="331-A-26"
                  className="w-full bg-orange-50/50 dark:bg-zinc-800/80 border border-orange-900/10 dark:border-zinc-700 rounded-2xl py-4 px-5 text-lg font-bold tracking-wider text-orange-950 dark:text-zinc-100 focus:ring-4 focus:ring-orange-950/10 dark:focus:ring-orange-400/20 focus:border-orange-600/30 outline-none transition-all placeholder:text-orange-900/20 dark:placeholder:text-zinc-500"
                />
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.13 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-orange-500" />
                    <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-900/40 dark:text-orange-400/50">
                      Quai
                    </label>
                  </div>
                  <input
                    type="number"
                    value={formData.quaiId ?? ''}
                    onChange={(e) => setFormData({ ...formData, quaiId: parseInt(e.target.value) || undefined })}
                    placeholder="5"
                    className="w-full bg-orange-50/50 dark:bg-zinc-800/80 border border-orange-900/10 dark:border-zinc-700 rounded-2xl py-4 px-5 text-sm font-semibold text-orange-950 dark:text-zinc-100 focus:ring-4 focus:ring-orange-950/10 dark:focus:ring-orange-400/20 focus:border-orange-600/30 outline-none transition-all placeholder:text-orange-900/20 dark:placeholder:text-zinc-500"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-orange-500" />
                    <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-900/40 dark:text-orange-400/50">
                      Heure d'entrée
                    </label>
                  </div>
                  <input
                    type="datetime-local"
                    value={formData.heureEntree || ''}
                    onChange={(e) => setFormData({ ...formData, heureEntree: e.target.value })}
                    className="w-full bg-orange-50/50 dark:bg-zinc-800/80 border border-orange-900/10 dark:border-zinc-700 rounded-2xl py-4 px-5 text-sm font-semibold text-orange-950 dark:text-zinc-100 focus:ring-4 focus:ring-orange-950/10 dark:focus:ring-orange-400/20 focus:border-orange-600/30 outline-none transition-all"
                  />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.19 }}
                className="flex flex-col sm:flex-row gap-4 pt-2"
              >
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-gradient-to-r from-orange-700 to-red-600 text-white font-bold py-4 rounded-2xl shadow-[0_15px_35px_rgba(234,88,12,0.25)] hover:shadow-[0_20px_40px_rgba(234,88,12,0.35)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      Valider la correction
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 bg-orange-50 dark:bg-zinc-800 text-orange-800/40 dark:text-zinc-400 font-bold py-4 rounded-2xl hover:bg-orange-100/50 dark:hover:bg-zinc-700 hover:text-orange-900 dark:hover:text-zinc-200 transition-all"
                >
                  Annuler
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
