'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { reclamationApi } from '@/lib/api/voyageur/reclamations';
import { apiClient } from '@/lib/api/client';
import { compagnieApi } from '@/lib/api/voyageur/compagnie';
import { TypeReclamation, Compagnie } from '@/types';
import Link from 'next/link';
import {
  ArrowLeft, AlertTriangle, Package, Clock,
  HeadphonesIcon, HelpCircle, Send, AlertCircle,
  CheckCircle2, Info, QrCode, Building2, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const typeOptions: {
  value: TypeReclamation; label: string; desc: string; icon: any;
  gradient: string; activeBorder: string; activeBg: string;
}[] = [
  {
    value: 'BAGAGE_PERDU', label: 'Bagage perdu', desc: 'Je ne trouve plus mon bagage',
    icon: AlertTriangle, gradient: 'from-rose-500 to-pink-600',
    activeBorder: 'border-rose-400', activeBg: 'bg-rose-50 dark:bg-rose-500/10',
  },
  {
    value: 'BAGAGE_ENDOMMAGE', label: 'Bagage endommagé', desc: 'Mon bagage a subi des dégâts',
    icon: Package, gradient: 'from-amber-500 to-orange-600',
    activeBorder: 'border-amber-400', activeBg: 'bg-amber-50 dark:bg-amber-500/10',
  },
  {
    value: 'RETARD', label: 'Retard', desc: 'Mon voyage a eu du retard',
    icon: Clock, gradient: 'from-orange-500 to-red-500',
    activeBorder: 'border-orange-400', activeBg: 'bg-orange-50 dark:bg-orange-500/10',
  },
  {
    value: 'SERVICE_CLIENT', label: 'Service client', desc: 'Question sur un service',
    icon: HeadphonesIcon, gradient: 'from-violet-500 to-purple-600',
    activeBorder: 'border-violet-400', activeBg: 'bg-violet-50 dark:bg-violet-500/10',
  },
  {
    value: 'AUTRE', label: 'Autre', desc: 'Autre motif de réclamation',
    icon: HelpCircle, gradient: 'from-slate-500 to-zinc-600',
    activeBorder: 'border-slate-400', activeBg: 'bg-slate-50 dark:bg-zinc-800',
  },
];

interface ReservationOption { id: number; label: string; }

export default function CreerReclamationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [type, setType] = useState<TypeReclamation>('SERVICE_CLIENT');
  const [sujet, setSujet] = useState('');
  const [description, setDescription] = useState('');
  const [reservationId, setReservationId] = useState<number | undefined>(
    searchParams.get('reservation') ? Number(searchParams.get('reservation')) : undefined
  );
  const [codeBagage, setCodeBagage] = useState('');
  const [compagnieId, setCompagnieId] = useState<number | undefined>();
  const [reservations, setReservations] = useState<ReservationOption[]>([]);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [compagnieError, setCompagnieError] = useState<string | null>(null);

  const isBagageType = type === 'BAGAGE_PERDU' || type === 'BAGAGE_ENDOMMAGE';
  const isServiceOuAutre = type === 'SERVICE_CLIENT' || type === 'AUTRE';
  const currentType = typeOptions.find(o => o.value === type)!;

  useEffect(() => {
    if (!authLoading && !user) { router.push('/fr/auth/login'); return; }
    if (user) { loadReservations(); loadCompagnies(); }
  }, [user, authLoading, router]);

  const loadReservations = async () => {
    try {
      const res = await apiClient.get('/voyageur/reservations');
      const list = (res.data.content || res.data || [])
        .filter((r: any) => r.statut === 'CONFIRMEE' || r.statut === 'ANNULEE')
        .map((r: any) => ({
          id: r.id,
          label: `#${r.id} - ${r.trajet?.villeDepart || ''} → ${r.trajet?.villeArrivee || ''} (${new Date(r.trajet?.dateDepart).toLocaleDateString('fr-FR')})`,
        }));
      setReservations(list);
    } catch {}
  };

  const loadCompagnies = async () => {
    try {
      const res = await apiClient.get('/voyageur/compagnies');
      const list = res.data;
      if (Array.isArray(list)) {
        setCompagnies(list);
        setCompagnieError(list.length === 0 ? 'Aucune compagnie trouvée dans la base de données' : null);
      } else {
        setCompagnieError('Format de réponse inattendu');
        setCompagnies([]);
      }
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message;
      setCompagnieError(status ? `Erreur ${status} : ${msg}` : `Erreur réseau : ${msg}`);
      setCompagnies([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sujet.trim() || !description.trim()) { setError('Veuillez remplir tous les champs obligatoires'); return; }
    if (isBagageType && !codeBagage.trim()) { setError('Veuillez entrer le code QR de votre bagage'); return; }
    if (isServiceOuAutre && !compagnieId) { setError('Veuillez sélectionner une compagnie'); return; }
    setSubmitting(true); setError(null);
    try {
      await reclamationApi.creer({ type, sujet: sujet.trim(), description: description.trim(), reservationId: reservationId || undefined, codeBagage: codeBagage.trim() || undefined, compagnieId: compagnieId || undefined });
      setSuccess(true);
    } catch (err: any) {
      const data = err.response?.data;
      setError(data?.message || data?.error || err.message || 'Erreur lors de la création de la réclamation');
    } finally { setSubmitting(false); }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Success State ── */
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
      >
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200/50 dark:shadow-none">
            <CheckCircle2 size={42} className="text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Réclamation envoyée !</h2>
        <p className="text-slate-500 dark:text-zinc-400 max-w-sm mb-8 leading-relaxed">
          Votre réclamation a été transmise à notre équipe. Vous recevrez une notification dès qu&apos;une réponse sera apportée — sous 48h ouvrées.
        </p>
        <div className="flex gap-3">
          <Link
            href="/fr/voyageur/reclamations"
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl text-sm font-bold hover:opacity-90 transition shadow-md shadow-orange-200/50 dark:shadow-none"
          >
            Voir mes réclamations
          </Link>
          <button
            onClick={() => { setSuccess(false); setSujet(''); setDescription(''); setCodeBagage(''); }}
            className="px-6 py-3 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded-2xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
          >
            Créer une autre
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <Link
          href="/fr/voyageur/reclamations"
          className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-500 hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-800 transition"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Nouvelle réclamation</h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mt-0.5">Soumettez votre réclamation à notre équipe</p>
        </div>
      </motion.div>

      {/* ── Info Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-start gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 border border-orange-100 dark:border-orange-500/20 rounded-2xl"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
          <Info size={14} className="text-white" />
        </div>
        <p className="text-sm text-orange-800 dark:text-orange-300 leading-relaxed">
          Les réclamations sont traitées sous <strong className="font-black">48 heures ouvrées</strong>. Vous recevrez une notification dès qu&apos;une réponse sera apportée.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden"
      >
        <div className="p-6 space-y-7">

          {/* ── Type Selector ── */}
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-3">
              Type de réclamation <span className="text-orange-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {typeOptions.map(opt => {
                const isActive = type === opt.value;
                const Icon = opt.icon;
                return (
                  <motion.button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 overflow-hidden ${
                      isActive
                        ? `${opt.activeBorder} ${opt.activeBg}`
                        : 'border-slate-100 dark:border-zinc-700 hover:border-slate-200 dark:hover:border-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={11} className="text-white" />
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                      isActive ? `bg-gradient-to-br ${opt.gradient} shadow-md` : 'bg-slate-100 dark:bg-zinc-800'
                    }`}>
                      <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 dark:text-zinc-500'} />
                    </div>
                    <p className={`text-sm font-black leading-tight ${isActive ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-zinc-300'}`}>
                      {opt.label}
                    </p>
                    <p className={`text-[11px] mt-1 leading-tight ${isActive ? 'text-slate-500 dark:text-zinc-400' : 'text-slate-400 dark:text-zinc-500'}`}>
                      {opt.desc}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── Sujet ── */}
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
              Sujet <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              value={sujet}
              onChange={e => setSujet(e.target.value)}
              placeholder="Résumez votre réclamation en quelques mots…"
              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
            />
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1.5">{sujet.length}/100 caractères</p>
          </div>

          {/* ── Description ── */}
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
              Description détaillée <span className="text-orange-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Décrivez votre problème avec le maximum de détails : date, lieu, circonstances…"
              rows={5}
              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition resize-none leading-relaxed"
            />
          </div>

          {/* ── Code Bagage (conditionnel) ── */}
          <AnimatePresence>
            {isBagageType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
                  Code QR du bagage <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <QrCode size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-400" />
                  <input
                    type="text"
                    value={codeBagage}
                    onChange={e => setCodeBagage(e.target.value)}
                    placeholder="Ex : BAG-12345"
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                  />
                </div>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1.5">Le code QR se trouve sur l&apos;étiquette de votre bagage scannée par le chauffeur</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Compagnie (SERVICE_CLIENT / AUTRE) ── */}
          <AnimatePresence>
            {isServiceOuAutre && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
                  Compagnie <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <Building2 size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-400" />
                  <select
                    value={compagnieId || ''}
                    onChange={e => setCompagnieId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition appearance-none"
                  >
                    <option value="">Sélectionnez une compagnie</option>
                    {compagnies.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>
                {compagnieError && (
                  <p className="text-xs text-red-500 mt-1.5">{compagnieError}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Réservation ── */}
          {!isServiceOuAutre && reservations.length > 0 && !searchParams.get('reservation') && (
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
                Réservation concernée <span className="text-slate-400">(optionnel)</span>
              </label>
              <select
                value={reservationId || ''}
                onChange={e => setReservationId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
              >
                <option value="">Aucune réservation spécifique</option>
                {reservations.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
          )}

          {!isServiceOuAutre && searchParams.get('reservation') && (
            <div className="flex items-center gap-2.5 p-3.5 bg-orange-50 dark:bg-orange-500/10 rounded-xl border border-orange-100 dark:border-orange-500/20 text-sm text-orange-700 dark:text-orange-400">
              <Info size={15} className="flex-shrink-0" />
              Réclamation liée à la réservation #{searchParams.get('reservation')}
            </div>
          )}
        </div>

        {/* ── Error ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 pb-2"
            >
              <div className="flex items-center gap-2.5 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-semibold">
                <AlertCircle size={16} className="flex-shrink-0" /> {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Submit ── */}
        <div className="px-6 py-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900">
          <button
            type="submit"
            disabled={submitting || !sujet.trim() || !description.trim()}
            className="w-full flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-black text-sm hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-200/50 dark:shadow-none"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={17} />
            )}
            {submitting ? 'Envoi en cours…' : 'Soumettre la réclamation'}
          </button>
          <p className="text-center text-xs text-slate-400 dark:text-zinc-500 mt-3">
            Réponse garantie sous 48h ouvrées · Suivi en temps réel
          </p>
        </div>
      </motion.form>
    </div>
  );
}
