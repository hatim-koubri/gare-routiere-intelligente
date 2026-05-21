'use client';

import { useState, useEffect } from 'react';
import { responsableTarificationApi } from '@/lib/api/responsable/tarification';
import { TarificationConfigRequest } from '@/types';
import { Settings, Save, Loader2, Tag, ArrowRight, TrendingUp, Clock, Percent, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const defaultValues: TarificationConfigRequest = {
  reductionTrenteJours: 20,
  reductionQuinzeJours: 10,
  supplementJourMeme: 10,
  seuilHaut: 80,
  supplementHaut: 15,
  seuilBas: 30,
  reductionBas: 10,
};

const fields: {
  key: keyof TarificationConfigRequest;
  label: string;
  desc: string;
  suffix: string;
  icon: React.ElementType;
  category: 'anticipation' | 'remplissage';
}[] = [
  { key: 'reductionTrenteJours', label: 'Réduction 30 jours', desc: 'Pour les billets achetés 30 jours avant le départ', suffix: '%', icon: Calendar, category: 'anticipation' },
  { key: 'reductionQuinzeJours', label: 'Réduction 15 jours', desc: 'Pour les billets achetés 15 jours avant le départ', suffix: '%', icon: Calendar, category: 'anticipation' },
  { key: 'supplementJourMeme', label: 'Supplément same-day', desc: 'Supplément pour les billets achetés le jour même', suffix: '%', icon: Clock, category: 'anticipation' },
  { key: 'seuilHaut', label: 'Seuil fort remplissage', desc: 'Au-dessus de ce seuil, le supplément s\'applique', suffix: '%', icon: TrendingUp, category: 'remplissage' },
  { key: 'supplementHaut', label: 'Supplément fort remplissage', desc: 'Supplément quand le taux dépasse le seuil haut', suffix: '%', icon: Percent, category: 'remplissage' },
  { key: 'seuilBas', label: 'Seuil faible remplissage', desc: 'En-dessous de ce seuil, la réduction s\'applique', suffix: '%', icon: TrendingUp, category: 'remplissage' },
  { key: 'reductionBas', label: 'Réduction faible remplissage', desc: 'Réduction quand le taux est sous le seuil bas', suffix: '%', icon: Percent, category: 'remplissage' },
];

const categories = [
  { id: 'anticipation' as const, label: 'Réservation anticipée', gradient: 'from-orange-400 to-red-500', icon: Clock },
  { id: 'remplissage' as const, label: 'Taux de remplissage', gradient: 'from-blue-400 to-indigo-600', icon: TrendingUp },
];

export default function ResponsableTarificationPage() {
  const [formData, setFormData] = useState<TarificationConfigRequest>(defaultValues);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const config = await responsableTarificationApi.get();
      if (config) {
        setFormData({
          reductionTrenteJours: config.reductionTrenteJours,
          reductionQuinzeJours: config.reductionQuinzeJours,
          supplementJourMeme: config.supplementJourMeme,
          seuilHaut: config.seuilHaut,
          supplementHaut: config.supplementHaut,
          seuilBas: config.seuilBas,
          reductionBas: config.reductionBas,
        });
      }
      setLoading(false);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await responsableTarificationApi.save(formData);
      setMessage({ type: 'success', text: 'Configuration enregistrée avec succès.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors de l\'enregistrement.' });
    } finally { setSaving(false); }
  };

  const update = (key: keyof TarificationConfigRequest, value: string) => {
    setFormData(prev => ({ ...prev, [key]: Number(value) }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
        <div className="flex items-center gap-0.5">
          {"RIHLA".split("").map((letter, i) => (
            <motion.span key={i}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity, repeatDelay: 1 }}
              className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-orange-400 via-orange-500 to-red-500">{letter}</motion.span>
          ))}
        </div>
        <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">Chargement de la configuration…</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl space-y-6 pb-10">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-md shadow-orange-200/50">
          <Settings size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Configuration tarification</h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mt-0.5">Paramétrez la tarification dynamique de votre compagnie</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
          {message.text}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {categories.map((cat, catIdx) => {
          const catFields = fields.filter(f => f.category === cat.id);
          return (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: catIdx * 0.1 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className={`bg-gradient-to-r ${cat.gradient} px-6 py-4`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                    <cat.icon size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white">{cat.label}</h2>
                    <p className="text-xs text-white/70">
                      {catFields.length} paramètre{catFields.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                {catFields.map((f, idx) => (
                  <motion.div key={f.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                    <label className="block text-sm font-bold text-slate-700 dark:text-zinc-200 mb-1">{f.label}</label>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mb-2">{f.desc}</p>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-lg flex items-center justify-center">
                        <f.icon size={13} className="text-orange-500" />
                      </div>
                      <input type="number" min={0} max={100} step={0.5} value={formData[f.key]}
                        onChange={e => update(f.key, e.target.value)}
                        className="w-full pl-12 pr-10 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-zinc-500 font-bold">{f.suffix}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* Save Button */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex items-center justify-end gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50 shadow-md shadow-orange-200/50 dark:shadow-none">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Enregistrement...' : 'Enregistrer la configuration'}
          </button>
        </motion.div>
      </form>
    </motion.div>
  );
}
