'use client';

import { useState, useEffect } from 'react';
import { responsableTarificationApi } from '@/lib/api/responsable/tarification';
import { TarificationConfigRequest } from '@/types';
import { Settings, Save, Loader2 } from 'lucide-react';

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
}[] = [
  { key: 'reductionTrenteJours', label: 'Réduction réservation anticipée 30 jours', desc: 'Pour les billets achetés 30 jours avant le départ', suffix: '%' },
  { key: 'reductionQuinzeJours', label: 'Réduction réservation anticipée 15 jours', desc: 'Pour les billets achetés 15 jours avant le départ', suffix: '%' },
  { key: 'supplementJourMeme', label: 'Supplément same-day', desc: 'Supplément pour les billets achetés le jour même', suffix: '%' },
  { key: 'seuilHaut', label: 'Seuil fort taux remplissage', desc: 'Au-dessus de ce seuil, le supplément s\'applique', suffix: '%' },
  { key: 'supplementHaut', label: 'Supplément fort taux remplissage', desc: 'Supplément quand le taux dépasse le seuil haut', suffix: '%' },
  { key: 'seuilBas', label: 'Seuil faible taux remplissage', desc: 'En-dessous de ce seuil, la réduction s\'applique', suffix: '%' },
  { key: 'reductionBas', label: 'Réduction faible taux remplissage', desc: 'Réduction quand le taux est sous le seuil bas', suffix: '%' },
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
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof TarificationConfigRequest, value: string) => {
    setFormData(prev => ({ ...prev, [key]: Number(value) }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
          <Settings size={22} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Configuration tarification</h1>
          <p className="text-slate-500 text-sm mt-0.5">Paramétrez la tarification dynamique de votre compagnie</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div className="space-y-5">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{f.label}</label>
              <p className="text-xs text-slate-400 mb-2">{f.desc}</p>
              <div className="relative">
                <input
                  type="number"
                  min={0} max={100} step={0.5}
                  value={formData[f.key]}
                  onChange={e => update(f.key, e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">{f.suffix}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Enregistrement...' : 'Enregistrer la configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
