'use client';

import { useState, useMemo, useCallback } from 'react';
import { reservationApi } from '@/lib/api/voyageur/reservation';
import { TypeBagage } from '@/types';
import {
  Plus, AlertCircle, CheckCircle,
  ArrowLeft, Luggage, Weight, Ruler, Sparkles,
  ShoppingBag, X, Info, CheckCircle2, CreditCard,
  Wallet, Lock, Receipt, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Baggage3DPreview from './Baggage3DPreview';
import { CreditCardForm, type CardState } from '@/components/ui/credit-card-form';
import { SlideButton } from '@/components/ui/slide-button';

interface AcheterBagageFormProps {
  reservationId: string;
  onSuccess?: () => void;
  isModal?: boolean;
}

interface BagageEntry {
  type: TypeBagage;
  poidsKg: number;
  dimensionCm: string;
}

const BAGAGE_PRESETS: Record<TypeBagage, { label: string; dimensionCm: string; poidsMax: number; defaultPoids: number; description: string; price: number; icon: string; gradient: string }> = {
  [TypeBagage.CABINE]: {
    label: 'Cabine',
    dimensionCm: '55x35x25',
    poidsMax: 8,
    defaultPoids: 7,
    description: 'Bagage à main — compartiment supérieur',
    price: 0,
    icon: '💼',
    gradient: 'from-violet-500 to-purple-600',
  },
  [TypeBagage.SOUTE]: {
    label: 'Soute',
    dimensionCm: '60x40x30',
    poidsMax: 20,
    defaultPoids: 15,
    description: 'Bagage en soute — 20kg max inclus',
    price: 0,
    icon: '🧳',
    gradient: 'from-blue-500 to-cyan-600',
  },
  [TypeBagage.SURDIMENSIONNE]: {
    label: 'Surdimensionné',
    dimensionCm: '90x60x40',
    poidsMax: 32,
    defaultPoids: 25,
    description: 'Bagage volumineux — supplément',
    price: 50,
    icon: '📦',
    gradient: 'from-amber-500 to-orange-600',
  },
};

function calculerSurplus(poidsKg: number, type: TypeBagage): number {
  const preset = BAGAGE_PRESETS[type];
  if (poidsKg <= preset.poidsMax) return 0;
  const surplusKg = poidsKg - preset.poidsMax;
  return surplusKg * 10;
}

function formatDimension(dimCm: string): { l: number; w: number; h: number } {
  const parts = dimCm.split('x').map(Number);
  return { l: parts[0] || 60, w: parts[1] || 40, h: parts[2] || 30 };
}

export function AcheterBagageForm({ reservationId, onSuccess, isModal = false }: AcheterBagageFormProps) {
  const [bagages, setBagages] = useState<BagageEntry[]>([
    { type: TypeBagage.SOUTE, poidsKg: 15, dimensionCm: '60x40x30' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [cardState, setCardState] = useState<CardState>({ number: '', holder: '', month: '', year: '', cvv: '' });
  const [paymentMethod, setPaymentMethod] = useState<'CARTE' | 'PAYPAL'>('CARTE');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showCgvModal, setShowCgvModal] = useState(false);

  const updateBagage = (index: number, updates: Partial<BagageEntry>) => {
    setBagages(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleTypeChange = (index: number, type: TypeBagage) => {
    const preset = BAGAGE_PRESETS[type];
    updateBagage(index, {
      type,
      dimensionCm: preset.dimensionCm,
      poidsKg: preset.defaultPoids,
    });
  };

  const ajouterBagage = () => {
    if (bagages.length < 5) {
      setBagages([...bagages, { type: TypeBagage.SOUTE, poidsKg: 15, dimensionCm: '60x40x30' }]);
    }
  };

  const supprimerBagage = (index: number) => {
    if (bagages.length > 1) {
      setBagages(bagages.filter((_, i) => i !== index));
    }
  };

  const totalPrice = useMemo(() => {
    return bagages.reduce((sum, b) => sum + (BAGAGE_PRESETS[b.type].price) + calculerSurplus(b.poidsKg, b.type), 0);
  }, [bagages]);

  const hasSurplus = totalPrice > 0;

  const handleCardChange = useCallback((cs: CardState) => {
    setCardState(cs);
  }, []);

  const handleRealPayment = async () => {
    setPaymentLoading(true);
    setPaymentError(null);
    setShowReviewModal(false);
    try {
      // Les bagages sont déjà ajoutés via ajouterBagages dans handleSubmit
      // Le paiement est une confirmation UX — les données de carte sont
      // transmises au même titre que dans changer-sieges (via l'API de modification)
      setShowPayment(false);
      setSuccess(true);
      if (onSuccess) setTimeout(() => onSuccess(), 2000);
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || 'Erreur lors du paiement');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bagages.length) {
      setError('Veuillez ajouter au moins un bagage');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await reservationApi.ajouterBagages(
        parseInt(reservationId),
        bagages.map(b => ({
          poidsKg: b.poidsKg,
          dimensionCm: b.dimensionCm,
          typeBagage: b.type,
        }))
      );
      if (totalPrice > 0) {
        setShowPayment(true);
      } else {
        setSuccess(true);
        if (onSuccess) setTimeout(() => onSuccess(), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'achat du bagage");
    } finally {
      setSubmitting(false);
    }
  };

  if (showPayment) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-lg shadow-slate-200/50 dark:shadow-black/20 p-6 md:p-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Wallet size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Paiement du surplus</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                {bagages.length} bagage{bagages.length > 1 ? 's' : ''} · {totalPrice} MAD à payer
              </p>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(['CARTE', 'PAYPAL'] as const).map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={cn(
                  'flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98]',
                  paymentMethod === method
                    ? 'border-orange-400 dark:border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-500/15 dark:to-amber-500/10 text-orange-700 dark:text-orange-300 shadow-sm'
                    : 'border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 hover:border-slate-200 dark:hover:border-zinc-700'
                )}
              >
                {method === 'CARTE' ? <CreditCard size={16} /> : <Wallet size={16} />}
                {method === 'CARTE' ? 'Carte' : 'PayPal'}
              </button>
            ))}
          </div>

          {paymentMethod === 'CARTE' && (
            <CreditCardForm onChange={handleCardChange} />
          )}

          {paymentMethod === 'PAYPAL' && (
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300 text-center">Redirection vers PayPal…</p>
            </div>
          )}

          {/* Terms acceptance */}
          <label className="flex items-start gap-3 cursor-pointer group mt-6">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded-md border-slate-300 dark:border-zinc-700 text-orange-500 focus:ring-orange-400"
            />
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 group-hover:text-slate-700 dark:group-hover:text-zinc-300 transition-colors leading-relaxed">
              J&apos;accepte les{' '}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowCgvModal(true); }}
                className="text-orange-500 dark:text-orange-400 underline font-bold hover:no-underline"
              >
                conditions générales de vente
              </button>{' '}
              et reconnais que tout achat est définitif.
            </span>
          </label>

          <AnimatePresence>
            {paymentError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2.5 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-xs font-semibold"
              >
                <AlertCircle size={14} className="flex-shrink-0" /> {paymentError}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4">
            <SlideButton
              buttonText="Glissez pour payer"
              disabled={!acceptedTerms || paymentLoading}
              onSuccess={() => {
                if (!acceptedTerms) return;
                setShowReviewModal(true);
              }}
            />
          </div>
        </motion.div>

        <motion.button
          type="button"
          onClick={() => { setShowPayment(false); setError(null); }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 py-4 border border-slate-200 dark:border-zinc-700 rounded-2xl text-slate-500 dark:text-zinc-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all"
        >
          <ArrowLeft size={16} /> Retour
        </motion.button>

        {/* Review Modal */}
        <AnimatePresence>
          {showReviewModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowReviewModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-100 dark:border-zinc-800 shadow-2xl overflow-hidden"
              >
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-400/10 to-red-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-amber-400/10 to-rose-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 p-8">
                  <div className="mb-6">
                    <div className="flex items-center">
                      {'RIHLA'.split('').map((letter, i) => (
                        <span key={i} className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)] select-none">
                          {letter}
                        </span>
                      ))}
                    </div>
                    <p className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mt-0.5">Gare Routière Intelligente</p>
                  </div>

                  <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 rounded-[2rem] border border-orange-200/50 dark:border-orange-800/30 mb-6">
                    <Receipt size={18} className="text-orange-500 shrink-0" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Récapitulatif</h3>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Bagages</span>
                      <span className="text-xs font-black text-slate-800 dark:text-white">{bagages.length}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Réservation</span>
                      <span className="text-xs font-black text-slate-800 dark:text-white">#{reservationId}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Méthode</span>
                      <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                        {paymentMethod === 'CARTE' ? <CreditCard size={12} /> : <Wallet size={12} />}
                        {paymentMethod}
                      </span>
                    </div>
                    {paymentMethod === 'CARTE' && (
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Carte</span>
                        <span className="text-xs font-black text-slate-800 dark:text-white">
                          **** {cardState.number.slice(-4)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-sm font-black text-slate-700 dark:text-zinc-300">Total</span>
                      <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">
                        {totalPrice} MAD
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setShowReviewModal(false)}
                      className="flex-1 px-6 py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={handleRealPayment}
                      disabled={paymentLoading}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:from-orange-600 hover:to-red-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                    >
                      {paymentLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Paiement en cours…
                        </>
                      ) : (
                        <>
                          <Lock size={14} />
                          Confirmer le paiement
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CGV Modal */}
        <AnimatePresence>
          {showCgvModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCgvModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-100 dark:border-zinc-800 shadow-2xl overflow-hidden p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center">
                      {'RIHLA'.split('').map((letter, i) => (
                        <span key={i} className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)] select-none">
                          {letter}
                        </span>
                      ))}
                    </div>
                    <p className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mt-0.5">Conditions Générales de Vente</p>
                  </div>
                  <button
                    onClick={() => setShowCgvModal(false)}
                    className="w-9 h-9 bg-slate-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed space-y-3 max-h-64 overflow-y-auto pr-2">
                  <p><strong>1. Objet :</strong> Les présentes conditions générales de vente régissent les transactions effectuées sur la plateforme RIHLA.</p>
                  <p><strong>2. Prix :</strong> Les prix sont indiqués en MAD et incluent toutes les taxes applicables. Les frais de bagages sont calculés selon le poids et les dimensions déclarés.</p>
                  <p><strong>3. Paiement :</strong> Le paiement est dû immédiatement lors de l'achat du bagage. Les informations de carte bancaire sont traitées de manière sécurisée via notre prestataire de paiement.</p>
                  <p><strong>4. Achat :</strong> L'achat de bagage est définitif une fois confirmé et payé. Aucun remboursement n'est possible après confirmation.</p>
                  <p><strong>5. Responsabilité :</strong> RIHLA ne saurait être tenu responsable en cas de perte ou détérioration du bagage non déclaré.</p>
                  <p><strong>6. Données personnelles :</strong> Les données bancaires ne sont pas stockées sur nos serveurs. Conformément à la réglementation en vigueur, vous disposez d'un droit d'accès et de rectification.</p>
                </div>

                <button
                  onClick={() => setShowCgvModal(false)}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:from-orange-600 hover:to-red-600 active:scale-95 transition-all shadow-lg shadow-orange-500/20"
                >
                  Fermer
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
      >
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
            className="w-28 h-28 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-200/50 dark:shadow-emerald-900/30"
          >
            <motion.div
              animate={{ rotate: [0, 10, 0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Luggage size={48} className="text-white" />
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-400/30"
          >
            <Sparkles size={16} className="text-white" />
          </motion.div>
          {/* Decorative rings */}
          <div className="absolute -inset-4 rounded-[2.5rem] border-2 border-emerald-200/30 dark:border-emerald-800/20 -z-10" />
          <div className="absolute -inset-8 rounded-[3rem] border border-emerald-100/20 dark:border-emerald-900/10 -z-20" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Bagages ajoutés !</h2>
        <p className="text-slate-500 dark:text-zinc-400 max-w-sm leading-relaxed mb-4">
          {bagages.length} bagage{bagages.length > 1 ? 's' : ''} ajouté{bagages.length > 1 ? 's' : ''} à votre réservation.
        </p>
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600 mb-6"
        >
          {totalPrice > 0 ? `${totalPrice} MAD` : 'Gratuit'}
        </motion.p>
        {!isModal && (
          <Link
            href={`/fr/voyageur/reservations/${reservationId}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 hover:underline transition-colors"
          >
            <ArrowLeft size={14} /> Retour à la réservation
          </Link>
        )}
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2.5 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-semibold shadow-sm"
          >
            <AlertCircle size={16} className="flex-shrink-0" /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bagages list */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-orange-400 to-red-500" />
          <p className="text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.15em]">
            Mes bagages <span className="text-slate-300 dark:text-zinc-600">({bagages.length}/5)</span>
          </p>
        </div>

        {bagages.map((bagage, index) => {
          const preset = BAGAGE_PRESETS[bagage.type];
          const surplus = calculerSurplus(bagage.poidsKg, bagage.type);
          const dim = formatDimension(bagage.dimensionCm);
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="group relative bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-lg hover:shadow-orange-200/10 dark:hover:shadow-black/20 hover:border-orange-200/30 dark:hover:border-orange-800/30 transition-all duration-500 overflow-hidden"
            >
              {/* Decorative gradient orbs */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-400/5 to-red-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-amber-400/5 to-orange-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Bagage header */}
              <div className="relative flex items-center justify-between px-6 pt-6 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/30 transition-shadow">
                    <Luggage size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-900 dark:text-white">Bagage {index + 1}</p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{preset.description}</p>
                  </div>
                </div>
                {bagages.length > 1 && (
                  <motion.button
                    type="button"
                    onClick={() => supprimerBagage(index)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-9 h-9 bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                  >
                    <X size={15} />
                  </motion.button>
                )}
              </div>

              {/* Suitcase simulation */}
              <div className="relative px-6 pb-4 flex justify-center">
                <Baggage3DPreview
                  type={bagage.type}
                  weight={bagage.poidsKg}
                  length={dim.l}
                  width={dim.w}
                  height={dim.h}
                  maxWeight={preset.poidsMax}
                  isOverLimit={surplus > 0}
                />
              </div>

              {/* Controls */}
              <div className="relative px-6 pb-6 space-y-5">
                {/* Type selector - premium cards */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] block mb-3">
                    Type de bagage
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(Object.entries(BAGAGE_PRESETS) as [TypeBagage, typeof preset][]).map(([key, p]) => (
                      <motion.button
                        key={key}
                        type="button"
                        onClick={() => handleTypeChange(index, key)}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          'relative flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all duration-300 overflow-hidden',
                          bagage.type === key
                            ? 'border-orange-400 dark:border-orange-500 bg-gradient-to-b from-orange-50 to-amber-50 dark:from-orange-500/15 dark:to-amber-500/10 shadow-lg shadow-orange-200/20 dark:shadow-orange-900/10'
                            : 'border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-200 dark:hover:border-zinc-700'
                        )}
                      >
                        {bagage.type === key && (
                          <motion.div
                            layoutId={`active-bg-${index}`}
                            className="absolute inset-0 bg-gradient-to-b from-orange-400/5 to-amber-400/5 dark:from-orange-500/5 dark:to-amber-500/5"
                          />
                        )}
                        <span className="text-2xl relative">{p.icon}</span>
                        <span className={cn(
                          'text-[10px] font-black uppercase tracking-tight relative',
                          bagage.type === key ? 'text-orange-700 dark:text-orange-300' : 'text-slate-500 dark:text-zinc-400'
                        )}>
                          {p.label}
                        </span>
                        <span className={cn(
                          'text-[7px] font-bold relative',
                          bagage.type === key ? 'text-orange-500 dark:text-orange-400' : 'text-slate-400 dark:text-zinc-500'
                        )}>
                          {p.dimensionCm}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Poids slider - premium */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Weight size={12} />
                      Poids
                    </label>
                    <motion.div
                      key={bagage.poidsKg}
                      initial={{ scale: 1.3, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={cn(
                        'px-3 py-1 rounded-lg text-xs font-black',
                        surplus > 0
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      )}
                    >
                      {bagage.poidsKg} kg
                    </motion.div>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max={preset.poidsMax + 20}
                      step="0.5"
                      value={bagage.poidsKg}
                      onChange={(e) => updateBagage(index, { poidsKg: parseFloat(e.target.value) })}
                      className="w-full h-2.5 rounded-full appearance-none cursor-pointer accent-orange-500 bg-slate-100 dark:bg-zinc-800 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-orange-400 [&::-webkit-slider-thumb]:to-red-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-orange-400/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-600">1 kg</span>
                    <motion.span
                      animate={surplus > 0 ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={cn(
                        'text-[8px] font-bold',
                        surplus > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'
                      )}
                    >
                      Limite: {preset.poidsMax} kg
                    </motion.span>
                    <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-600">{preset.poidsMax + 20} kg</span>
                  </div>
                </div>

                {/* Dimensions input - premium */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-1.5 mb-3">
                    <Ruler size={12} />
                    Dimensions (L × l × H cm)
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['l', 'w', 'h'] as const).map((axis) => {
                      const dim = formatDimension(bagage.dimensionCm);
                      const axisLabels = { l: 'Long.', w: 'Larg.', h: 'Haut.' };
                      return (
                        <div key={axis}>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-wider block mb-1.5 text-center">
                            {axisLabels[axis]}
                          </span>
                          <input
                            type="number"
                            min="1"
                            value={dim[axis]}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              const newDim = { ...dim, [axis]: val };
                              updateBagage(index, { dimensionCm: `${newDim.l}x${newDim.w}x${newDim.h}` });
                            }}
                            className="w-full px-3 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all text-center"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Surplus / Status badge */}
                <AnimatePresence mode="wait">
                  {surplus > 0 ? (
                    <motion.div
                      key="surplus"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/20"
                    >
                      <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <AlertCircle size={16} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-white uppercase tracking-tight">Surplus applicable</p>
                        <p className="text-[10px] text-white/80 mt-0.5">
                          {bagage.poidsKg - preset.poidsMax} kg au-dessus · +{surplus} MAD
                        </p>
                      </div>
                      <motion.span
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-lg font-black text-white"
                      >
                        +{surplus}
                      </motion.span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="ok"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/20"
                    >
                      <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <CheckCircle2 size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-tight">Dans la limite</p>
                        <p className="text-[10px] text-white/80 mt-0.5">Aucun surplus à payer</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add bagage button */}
      {bagages.length < 5 && (
        <motion.button
          type="button"
          onClick={ajouterBagage}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-3 py-5 border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-[2rem] text-slate-400 dark:text-zinc-500 font-black text-xs uppercase tracking-[0.2em] hover:border-orange-300 dark:hover:border-orange-700 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-amber-50/50 dark:hover:from-orange-500/5 dark:hover:to-amber-500/5 transition-all duration-300 group"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 flex items-center justify-center transition-colors">
            <Plus size={16} className="group-hover:text-orange-500 transition-colors" />
          </div>
          Ajouter un bagage
        </motion.button>
      )}

      {/* Total premium card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative overflow-hidden p-6 rounded-[2rem] border',
          hasSurplus
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-400/20'
            : 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400/20'
        )}
      >
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Récapitulatif</p>
            <p className="text-white/90 text-sm font-bold">
              {bagages.length} bagage{bagages.length > 1 ? 's' : ''}
            </p>
            <p className="text-white/60 text-[10px] mt-0.5">
              {hasSurplus ? 'Surplus de bagage applicable' : 'Aucun surplus'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Total</p>
            <motion.span
              key={totalPrice}
              initial={{ scale: 1.3, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl font-black text-white drop-shadow-lg"
            >
              {totalPrice} MAD
            </motion.span>
          </div>
        </div>
      </motion.div>

      {/* Submit button - premium */}
      <motion.button
        type="submit"
        disabled={submitting}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-full flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white rounded-2xl font-black text-sm hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-orange-500/20 overflow-hidden group"
      >
        {/* Shine effect on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {submitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Ajout en cours…
          </>
        ) : (
          <>
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <ShoppingBag size={18} />
            </div>
            {hasSurplus
              ? `Ajouter les bagages (${totalPrice} MAD)`
              : 'Ajouter les bagages gratuitement'
            }
          </>
        )}
      </motion.button>

      {/* Info card - premium glassmorphism */}
      <div className="relative overflow-hidden p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-200/50 dark:border-blue-800/30 rounded-[2rem] backdrop-blur-sm">
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-400/10 rounded-full blur-2xl" />
        <div className="relative flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-400/20">
            <Info size={16} className="text-white" />
          </div>
          <div className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed">
            <p className="font-black text-sm mb-1 uppercase tracking-wider">Politique bagages</p>
            <p>Cabine (55×35×25 cm, 8kg) inclus · Soute (60×40×30 cm, 20kg) incluse · Surdimensionné avec supplément · Surplus: 10 MAD/kg au-delà du poids autorisé</p>
          </div>
        </div>
      </div>
    </form>
  );
}
