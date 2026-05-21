'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { preferencesApi } from '@/lib/api/voyageur/preferences';
import {
  ShieldCheck, AlertCircle, CheckCircle2, User, Armchair,
  Users, UserCheck, ChevronDown, Sparkles, Save, Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const POSITION_OPTIONS = [
  { value: 'INDIFFERENT', label: 'Indifférent', icon: Armchair, desc: 'Peu importe la place', color: 'from-slate-400 to-slate-500' },
  { value: 'FENETRE', label: 'Fenêtre', icon: Armchair, desc: 'Vue sur l\'extérieur', color: 'from-blue-400 to-sky-500' },
  { value: 'COULOIR', label: 'Couloir', icon: Armchair, desc: 'Accès facile', color: 'from-emerald-400 to-teal-500' },
];

const SEXE_OPTIONS = [
  { value: 'HOMME', label: 'Homme', icon: User, color: 'from-blue-400 to-sky-500' },
  { value: 'FEMME', label: 'Femme', icon: User, color: 'from-rose-400 to-pink-500' },
];

export default function PreferencesPage() {
  const { user } = useAuth();
  const [sexe, setSexe] = useState(user?.sexe || 'HOMME');
  const [accepteSexeOppose, setAccepteSexeOppose] = useState(true);
  const [preferencePosition, setPreferencePosition] = useState('INDIFFERENT');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    preferencesApi.getPreferenceVoisinage().then((data) => {
      setAccepteSexeOppose(data.accepteSexeOppose);
      if (data.preferencePosition) setPreferencePosition(data.preferencePosition);
    }).catch(() => {});
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleSaveSexe = async () => {
    setLoading(true);
    try {
      await preferencesApi.updateSexe(sexe);
      showMessage('success', 'Sexe mis à jour avec succès ✓');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showMessage('error', e.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally { setLoading(false); }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      await preferencesApi.updatePreferenceVoisinage({ accepteSexeOppose, preferencePosition });
      showMessage('success', 'Préférences de voisinage mises à jour ✓');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showMessage('error', e.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">

      {/* ── Hero Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 40%, #dc2626 100%)' }}
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-sm" />
        <div className="absolute -bottom-4 right-1/3 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Settings2 size={26} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-orange-200" />
              <span className="text-orange-100 text-xs font-bold uppercase tracking-widest">Personnalisation</span>
            </div>
            <h1 className="text-2xl font-black leading-tight">Mes Préférences</h1>
            <p className="text-orange-100 text-sm mt-0.5">Personnalisez votre expérience de voyage</p>
          </div>
        </div>
      </motion.div>

      {/* ── Toast Message ── */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-semibold border ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
            }`}
          >
            {message.type === 'success'
              ? <CheckCircle2 size={18} className="flex-shrink-0" />
              : <AlertCircle size={18} className="flex-shrink-0" />
            }
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sexe Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden"
      >
        <div className="px-6 pt-6 pb-4 border-b border-slate-50 dark:border-zinc-800 flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-sky-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-200/50 dark:shadow-none">
            <User size={16} className="text-white" />
          </div>
          <div>
            <h2 className="font-black text-slate-800 dark:text-white">Mon sexe</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Utilisé pour les préférences de siège</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-3 mb-5">
            {SEXE_OPTIONS.map(opt => {
              const isActive = sexe === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setSexe(opt.value)}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 overflow-hidden ${
                    isActive
                      ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10'
                      : 'border-slate-100 dark:border-zinc-700 hover:border-orange-200 dark:hover:border-orange-900/40 hover:bg-orange-50/30 dark:hover:bg-zinc-800'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={12} className="text-white" />
                      </div>
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                    isActive ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-slate-100 dark:bg-zinc-800'
                  }`}>
                    <opt.icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
                  </div>
                  <p className={`font-black text-sm ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-zinc-300'}`}>
                    {opt.label}
                  </p>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleSaveSexe}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl text-sm font-bold hover:opacity-90 transition disabled:opacity-50 shadow-md shadow-orange-200/50 dark:shadow-none"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            Enregistrer mon sexe
          </button>
        </div>
      </motion.div>

      {/* ── Préférences Voisinage Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden"
      >
        <div className="px-6 pt-6 pb-4 border-b border-slate-50 dark:border-zinc-800 flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200/50 dark:shadow-none">
            <Users size={16} className="text-white" />
          </div>
          <div>
            <h2 className="font-black text-slate-800 dark:text-white">Préférences de voisinage</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Confort et compatibilité à bord</p>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* Toggle sexe opposé */}
          <div className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-300 ${
            accepteSexeOppose
              ? 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10 border border-orange-100 dark:border-orange-900/30'
              : 'bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-700'
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  accepteSexeOppose ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-slate-200 dark:bg-zinc-700'
                }`}>
                  <UserCheck size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Accepter le sexe opposé à côté</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                    {accepteSexeOppose
                      ? '✓ Vous acceptez les voisins de sexe opposé'
                      : 'Vous préférez les voisins du même sexe'}
                  </p>
                </div>
              </div>
              {/* Custom toggle */}
              <button
                onClick={() => setAccepteSexeOppose(!accepteSexeOppose)}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 flex-shrink-0 ${
                  accepteSexeOppose ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-slate-200 dark:bg-zinc-600'
                }`}
              >
                <motion.div
                  animate={{ x: accepteSexeOppose ? 28 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                />
              </button>
            </div>
          </div>

          {/* Position préférée */}
          <div>
            <p className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-3">Position préférée dans le bus</p>
            <div className="grid grid-cols-3 gap-3">
              {POSITION_OPTIONS.map(opt => {
                const isActive = preferencePosition === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setPreferencePosition(opt.value)}
                    className={`relative p-3.5 rounded-2xl border-2 text-center transition-all duration-200 overflow-hidden ${
                      isActive
                        ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10'
                        : 'border-slate-100 dark:border-zinc-700 hover:border-orange-200 dark:hover:border-orange-900/40'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${
                      isActive ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-slate-100 dark:bg-zinc-800'
                    }`}>
                      <opt.icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                    </div>
                    <p className={`text-xs font-black ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-zinc-300'}`}>
                      {opt.label}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${isActive ? 'text-orange-400' : 'text-slate-400 dark:text-zinc-500'}`}>
                      {opt.desc}
                    </p>
                    {isActive && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={10} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSavePreferences}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl text-sm font-bold hover:opacity-90 transition disabled:opacity-50 shadow-md shadow-orange-200/50 dark:shadow-none"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            Enregistrer mes préférences
          </button>
        </div>
      </motion.div>
    </div>
  );
}
