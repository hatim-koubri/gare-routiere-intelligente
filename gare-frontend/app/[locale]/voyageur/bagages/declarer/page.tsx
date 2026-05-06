'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
import {
  ArrowLeft, Luggage, AlertTriangle, Package,
  CheckCircle2, AlertCircle, QrCode, Info,
  ShieldAlert
} from 'lucide-react';

type DeclarationType = 'PERDU' | 'ENDOMMAGE';

export default function DeclarerBagagePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [qrCode, setQrCode] = useState('');
  const [type, setType] = useState<DeclarationType>('PERDU');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !user) {
    router.push('/fr/auth/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCode.trim()) {
      setError('Veuillez entrer le code QR du bagage');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post('/voyageur/reservations/bagage/declarer', {
        qrCodeBagage: qrCode,
        type,
      });
      setSuccess(true);
      setTimeout(() => router.push('/fr/voyageur/dashboard'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la déclaration');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Chargement…</p>
      </div>
    );
  }

  /* ── Succès ── */
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto">
            <CheckCircle2 size={38} className="text-emerald-600" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Déclaration enregistrée</h2>
        <p className="text-slate-500 max-w-sm mb-2">
          Votre déclaration de bagage{' '}
          <span className="font-semibold text-slate-700">
            {type === 'PERDU' ? 'perdu' : 'endommagé'}
          </span>{' '}
          a été prise en compte. Notre équipe vous contactera sous 48h.
        </p>
        <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-4">
          <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-violet-600 rounded-full animate-spin" />
          Redirection vers le tableau de bord…
        </p>
      </div>
    );
  }

  const typeConfig = {
    PERDU: {
      label: 'Bagage perdu',
      desc: 'Je ne trouve plus mon bagage',
      Icon: AlertTriangle,
      active: 'border-rose-400 bg-rose-50',
      iconActive: 'text-rose-500',
      textActive: 'text-rose-700',
      inactive: 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
      iconInactive: 'text-slate-400',
      textInactive: 'text-slate-600',
    },
    ENDOMMAGE: {
      label: 'Bagage endommagé',
      desc: 'Mon bagage a subi des dégâts',
      Icon: Package,
      active: 'border-amber-400 bg-amber-50',
      iconActive: 'text-amber-500',
      textActive: 'text-amber-700',
      inactive: 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
      iconInactive: 'text-slate-400',
      textInactive: 'text-slate-600',
    },
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Déclarer un bagage</h1>
          <p className="text-slate-500 text-sm mt-0.5">Signalez un bagage perdu ou endommagé</p>
        </div>
        <Link
          href="/fr/voyageur/dashboard"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft size={16} />
          Retour
        </Link>
      </div>

      {/* ── Info banner ── */}
      <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-2xl">
        <Info size={17} className="text-violet-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-violet-700">
          Une fois la déclaration soumise, notre service client traitera votre dossier dans les <strong>48 heures ouvrées</strong>.
        </p>
      </div>

      {/* ── Formulaire ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">

            {/* Type de déclaration */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                Type de déclaration
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['PERDU', 'ENDOMMAGE'] as DeclarationType[]).map((t) => {
                  const cfg = typeConfig[t];
                  const isActive = type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`
                        relative p-5 rounded-2xl border-2 text-left transition-all duration-150
                        ${isActive ? cfg.active : cfg.inactive}
                      `}
                    >
                      {isActive && (
                        <span className="absolute top-3 right-3 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <CheckCircle2 size={13} className={t === 'PERDU' ? 'text-rose-500' : 'text-amber-500'} />
                        </span>
                      )}
                      <cfg.Icon
                        size={24}
                        className={`mb-3 ${isActive ? cfg.iconActive : cfg.iconInactive}`}
                      />
                      <p className={`font-semibold text-sm ${isActive ? cfg.textActive : cfg.textInactive}`}>
                        {cfg.label}
                      </p>
                      <p className={`text-xs mt-0.5 ${isActive ? cfg.textActive + '/80' : 'text-slate-400'}`}>
                        {cfg.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Code QR */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Code QR du bagage
              </label>
              <div className="relative">
                <QrCode size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={qrCode}
                  onChange={e => setQrCode(e.target.value)}
                  placeholder="Ex: BAG-12345"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition placeholder:text-slate-300"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                <Info size={11} />
                Le code QR se trouve sur l'étiquette de votre bagage
              </p>
            </div>

            {/* Erreur */}
            {error && (
              <div className="flex items-center gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Avertissement type */}
          <div className={`px-6 py-4 border-t flex items-start gap-3 ${
            type === 'PERDU' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
          }`}>
            <ShieldAlert size={16} className={`mt-0.5 flex-shrink-0 ${type === 'PERDU' ? 'text-rose-400' : 'text-amber-400'}`} />
            <p className={`text-xs ${type === 'PERDU' ? 'text-rose-600' : 'text-amber-600'}`}>
              {type === 'PERDU'
                ? 'Attention : une fausse déclaration de perte est passible de sanctions. Assurez-vous de ne plus avoir votre bagage avant de soumettre.'
                : 'Veillez à conserver le bagage endommagé pour inspection. Des photos peuvent vous être demandées.'}
            </p>
          </div>

          {/* Submit */}
          <div className="p-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitting}
              className={`
                w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                ${type === 'PERDU'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'}
              `}
            >
              {submitting
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Luggage size={18} />
              }
              {submitting ? 'Envoi en cours…' : 'Soumettre la déclaration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}