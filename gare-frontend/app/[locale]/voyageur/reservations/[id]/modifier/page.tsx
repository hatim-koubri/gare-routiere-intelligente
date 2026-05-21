'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api/client';
import { reservationApi } from '@/lib/api/voyageur/reservation';
import { preferencesApi } from '@/lib/api/voyageur/preferences';
import { SiegePlanDTO } from '@/types';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, AlertCircle, Clock, MapPin,
  Building, Calendar, CreditCard, RefreshCw, Armchair,
  Sparkles, ChevronRight, Ticket, ShieldCheck, Zap,
  Bus, AlertTriangle, CheckCircle2, X, Wallet, Lock,
  FileText, ExternalLink, ArrowRight, Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SlideButton } from '@/components/ui/slide-button';
import { CreditCardForm, type CardState, type CardValidity } from '@/components/ui/credit-card-form';

interface TrajetOption {
  id: number;
  dateDepart: string;
  villeDepart: string;
  villeArrivee: string;
  compagnieNom: string;
  prixBase: number;
  busMatricule?: string;
  quaiNumero?: number;
}

interface Reservation {
  id: number;
  trajet: {
    id: number;
    dateDepart: string;
    villeDepart: string;
    villeArrivee: string;
    compagnieNom: string;
  };
  tickets: Array<{ id: number; numeroSiege: string; nomPassager: string; prenomPassager: string }>;
  prixTotal: number;
  statut: string;
  nbModif: number;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getSiegeColor(status: string, typeOccupant?: string | null): string {
  if (status === 'selected') return 'bg-yellow-400 text-yellow-900 shadow-xl shadow-yellow-400/30 border-yellow-500';
  if (status === 'available') return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm';
  if (typeOccupant === 'HOMME') return 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 border border-blue-500/30 cursor-not-allowed';
  if (typeOccupant === 'FEMME') return 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 border border-orange-500/30 cursor-not-allowed';
  if (typeOccupant === 'ENFANT') return 'bg-red-100 dark:bg-red-500/20 text-red-600 border border-red-500/30 cursor-not-allowed';
  if (status === 'locked' || status === 'occupied') return 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed';
  if (status === 'blocked') return 'bg-rose-100 text-rose-300 cursor-not-allowed';
  return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm';
}

function Seat({ siege, status, warnings, onClick }: { siege: SiegePlanDTO; status: string; warnings: ('position' | 'gender')[]; onClick: () => void }) {
  const isAvailable = status === 'available';
  const hasPosition = warnings.includes('position');
  const hasGender = warnings.includes('gender');
  const warnRing = hasPosition && hasGender ? 'ring-2 ring-amber-400/50 ring-rose-400/50' : hasPosition ? 'ring-2 ring-amber-400/50' : hasGender ? 'ring-2 ring-rose-400/50' : '';

  return (
    <motion.button
      whileHover={isAvailable ? { scale: 1.1, y: -2 } : {}}
      whileTap={isAvailable ? { scale: 0.9 } : {}}
      onClick={onClick}
      disabled={!isAvailable && status !== 'selected'}
      title={
        hasPosition && hasGender ? 'Ne correspond pas à votre côté préféré et voisin de sexe opposé'
          : hasPosition ? 'Ne correspond pas à votre côté préféré'
            : hasGender ? 'Voisin de sexe opposé'
              : siege.numeroSiege
      }
      className={cn(
        'w-full aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative',
        getSiegeColor(status, siege.typeOccupant),
        warnRing
      )}
    >
      <Armchair size={16} className={cn('mb-0.5', (status === 'locked' || status === 'occupied') ? 'opacity-20' : 'opacity-100')} />
      <span className="text-[10px] font-black italic leading-none">{siege.numeroSiege}</span>
      {warnings.length > 0 && isAvailable && (
        <div className="absolute -top-1.5 -right-1.5 flex gap-0.5">
          {hasPosition && (
            <div className="w-4 h-4 bg-amber-400 text-amber-900 rounded-full flex items-center justify-center shadow-lg shadow-amber-400/30" title="Ne correspond pas à votre côté préféré">
              <AlertTriangle size={9} strokeWidth={3} />
            </div>
          )}
          {hasGender && (
            <div className="w-4 h-4 bg-rose-400 text-rose-900 rounded-full flex items-center justify-center shadow-lg shadow-rose-400/30" title="Voisin de sexe opposé">
              <AlertTriangle size={9} strokeWidth={3} />
            </div>
          )}
        </div>
      )}
      {status === 'selected' && (
        <motion.div layoutId="seat-check" className="absolute -top-1 -right-1 w-4 h-4 bg-white text-yellow-500 rounded-full flex items-center justify-center shadow-lg">
          <CheckCircle2 size={10} />
        </motion.div>
      )}
    </motion.button>
  );
}

const LEGEND_ITEMS = [
  { type: 'available', color: 'bg-emerald-500', label: 'Libre' },
  { type: 'homme', color: 'bg-blue-500', label: 'Homme' },
  { type: 'femme', color: 'bg-orange-500', label: 'Femme' },
  { type: 'enfant', color: 'bg-red-500', label: 'Enfant' },
  { type: 'locked', color: 'bg-slate-400', label: 'Verrouillé' },
  { type: 'selected', color: 'bg-yellow-400', label: 'Sélectionné' },
  { type: 'warning-position', color: 'bg-amber-400 ring-2 ring-amber-400/50', label: 'Côté non préféré' },
  { type: 'warning-gender', color: 'bg-rose-400 ring-2 ring-rose-400/50', label: 'Voisinage sexe opposé' },
];

export default function ModifierReservationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const reservationId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [trajetsOptions, setTrajetsOptions] = useState<TrajetOption[]>([]);
  const [selectedTrajetId, setSelectedTrajetId] = useState<number | null>(null);
  const [selectedSieges, setSelectedSieges] = useState<string[]>([]);
  const [nombreSieges, setNombreSieges] = useState(1);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTrajets, setLoadingTrajets] = useState(false);
  const [modificationFee, setModificationFee] = useState(0);
  const [methode, setMethode] = useState<'CARTE' | 'PAYPAL'>('CARTE');
  const [cardValid, setCardValid] = useState(false);
  const [cardState, setCardState] = useState<CardState | null>(null);
  const [acceptConditions, setAcceptConditions] = useState(false);
  const [showCgvModal, setShowCgvModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [sieges, setSieges] = useState<SiegePlanDTO[]>([]);
  const [loadingSieges, setLoadingSieges] = useState(false);
  const [prefPosition, setPrefPosition] = useState<string | null>(null);
  const [prefAccepteOppose, setPrefAccepteOppose] = useState(true);
  const [warningPopup, setWarningPopup] = useState<{ siege: SiegePlanDTO; warnings: ('position' | 'gender')[] } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/fr/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && reservationId) {
      loadReservation();
    }
  }, [user, reservationId]);

  useEffect(() => {
    preferencesApi.getPreferenceVoisinage()
      .then(data => {
        setPrefAccepteOppose(data.accepteSexeOppose);
        if (data.preferencePosition) setPrefPosition(data.preferencePosition);
      })
      .catch(() => {});
  }, []);

  const loadReservation = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/voyageur/reservations/${reservationId}`);
      setReservation(res.data);
      setNombreSieges(res.data.tickets?.length || 1);

      const fee = (res.data.nbModif ?? 0) > 0 ? 20 : 0;
      setModificationFee(fee);

      await loadTrajetsAlternatifs(res.data.trajet.villeDepart, res.data.trajet.villeArrivee);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadTrajetsAlternatifs = async (villeDepart: string, villeArrivee: string) => {
    setLoadingTrajets(true);
    try {
      const today = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(today.getDate() + 30);

      const response = await apiClient.post('/voyageur/recherche/trajets-filtres', {
        villeDepart,
        villeArrivee,
        dateDebut: today.toISOString().split('T')[0],
        dateFin: thirtyDaysLater.toISOString().split('T')[0],
        prixMin: null,
        prixMax: null,
        heureDepartMin: null,
        heureDepartMax: null,
        nbArretsMax: null,
      });

      const trajetActuelId = reservation?.trajet?.id;
      const maintenant = new Date();
      const filtered = (response.data || []).filter((t: TrajetOption) =>
        t.id !== trajetActuelId && new Date(t.dateDepart) > maintenant
      );

      setTrajetsOptions(filtered);
    } catch {
      setTrajetsOptions([]);
    } finally {
      setLoadingTrajets(false);
    }
  };

  const loadPlanBus = async (trajetId: number) => {
    setLoadingSieges(true);
    try {
      const data = await reservationApi.getPlanBus(trajetId);
      setSieges(data);
    } catch {
      setSieges([]);
    } finally {
      setLoadingSieges(false);
    }
  };

  const handleTrajetChange = (trajetId: number) => {
    setSelectedTrajetId(trajetId);
    setSelectedSieges([]);
    loadPlanBus(trajetId);
  };

  const getSiegeStatus = (siege: SiegePlanDTO) => {
    if (selectedSieges.includes(siege.numeroSiege)) return 'selected';
    if (siege.occupe) return 'occupied';
    if (siege.bloque) return 'blocked';
    if (siege.verrouilleTemporaire) return 'locked';
    return 'available';
  };

  function getAdjacentPositions(pos: string): string[] {
    const order = ['A', 'B', 'C', 'D'];
    const idx = order.indexOf(pos);
    const result: string[] = [];
    if (idx > 0) result.push(order[idx - 1]);
    if (idx < order.length - 1) result.push(order[idx + 1]);
    return result;
  }

  function getSeatWarnings(siege: SiegePlanDTO): ('position' | 'gender')[] {
    const status = getSiegeStatus(siege);
    if (status !== 'available' && status !== 'selected') return [];

    const warnings: ('position' | 'gender')[] = [];

    if (prefPosition && prefPosition !== 'INDIFFERENT') {
      const pos = siege.positionRangee;
      if (prefPosition === 'FENETRE' && pos !== 'A' && pos !== 'D') warnings.push('position');
      if (prefPosition === 'COULOIR' && pos !== 'B' && pos !== 'C') warnings.push('position');
    }

    if (!prefAccepteOppose && user?.sexe && siege.positionRangee) {
      const adjPositions = getAdjacentPositions(siege.positionRangee);
      for (const adjPos of adjPositions) {
        const adjSeat = sieges.find(s =>
          s.numeroRangee === siege.numeroRangee && s.positionRangee === adjPos
        );
        if (adjSeat?.typeOccupant && adjSeat.typeOccupant !== 'ENFANT') {
          if (adjSeat.typeOccupant !== user.sexe) {
            warnings.push('gender');
            break;
          }
        }
      }
    }

    return warnings;
  }

  const handleSiegeClick = (siege: SiegePlanDTO) => {
    const status = getSiegeStatus(siege);
    if (status !== 'available' && status !== 'selected') return;

    if (selectedSieges.includes(siege.numeroSiege)) {
      setSelectedSieges(selectedSieges.filter(s => s !== siege.numeroSiege));
    } else {
      if (selectedSieges.length < nombreSieges) {
        const warnings = getSeatWarnings(siege);
        if (warnings.length > 0) {
          setWarningPopup({ siege, warnings });
          return;
        }
        setSelectedSieges([...selectedSieges, siege.numeroSiege]);
      } else {
        setError(`Vous ne pouvez sélectionner que ${nombreSieges} siège(s)`);
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const confirmWarningSelection = () => {
    if (!warningPopup) return;
    setSelectedSieges([...selectedSieges, warningPopup.siege.numeroSiege]);
    setWarningPopup(null);
  };

  const handleCardChange = useCallback((state: CardState, validity: CardValidity) => {
    setCardState(state);
    setCardValid(validity.allValid);
  }, []);

  const handleSubmit = async () => {
    if (!selectedTrajetId) {
      setError('Veuillez sélectionner un nouveau trajet');
      return;
    }
    if (selectedSieges.length !== nombreSieges) {
      setError(`Veuillez sélectionner ${nombreSieges} siège(s)`);
      return;
    }
    if (modificationFee > 0) {
      if (!cardValid) { setError('Informations de carte incomplètes'); return; }
      if (!acceptConditions) { setError('Veuillez accepter les conditions générales'); return; }
      setError(null);
      setShowReviewModal(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.put(`/voyageur/reservations/${reservationId}/modifier`, {
        nouveauTrajetId: selectedTrajetId,
        nouveauxSieges: selectedSieges,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/fr/voyageur/reservations/${reservationId}`);
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPaiement = async () => {
    setShowReviewModal(false);
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.put(`/voyageur/reservations/${reservationId}/modifier`, {
        nouveauTrajetId: selectedTrajetId,
        nouveauxSieges: selectedSieges,
        ...(cardState ? {
          numeroCarte: cardState.number.replace(/\s/g, ''),
          dateExpiration: `${cardState.month}/${cardState.year}`,
          cvv: cardState.cvv,
        } : {}),
      });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/fr/voyageur/reservations/${reservationId}`);
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 dark:text-zinc-500 text-sm">Chargement de la réservation…</p>
      </div>
    );
  }

  if (error && !reservation) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 space-y-4">
        <div className="flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-700 dark:text-red-400 text-sm font-semibold">
          <AlertCircle size={16} /> {error}
        </div>
        <Link
          href={`/fr/voyageur/reservations/${reservationId}`}
          className="inline-flex items-center gap-2 text-orange-500 font-bold text-sm hover:underline"
        >
          <ArrowLeft size={14} /> Retour à la réservation
        </Link>
      </div>
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
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200/50 dark:shadow-none">
            <CheckCircle size={42} className="text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Modification effectuée !</h2>
        <p className="text-slate-500 dark:text-zinc-400 max-w-sm leading-relaxed">
          Votre réservation a été modifiée avec succès. Redirection en cours…
        </p>
        <div className="mt-8 w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </motion.div>
    );
  }

  const siegesActuels = reservation?.tickets?.map(t => t.numeroSiege) || [];
  const selectedTrajet = trajetsOptions.find(t => t.id === selectedTrajetId);
  const rows: SiegePlanDTO[][] = [];
  for (let i = 0; i < sieges.length; i += 4) { rows.push(sieges.slice(i, i + 4)); }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">

      {/* ═══ HEADER ═══ */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
        <Link
          href={`/fr/voyageur/reservations/${reservationId}`}
          className="group p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 hover:border-orange-200 dark:hover:border-orange-800 transition-all shadow-sm"
        >
          <ArrowLeft size={18} className="text-slate-500 group-hover:text-orange-500 transition-colors" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Modifier la réservation</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">#{reservationId}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ═══ LEFT: FORM + BUS PLAN ═══ */}
        <div className="lg:col-span-3 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden"
          >
            {/* ── HERO CURRENT RESERVATION ── */}
            <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 px-6 pt-6 pb-10 overflow-hidden">
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-black/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider">
                    <Ticket size={10} />
                    Réservation actuelle
                  </span>
                  {reservation && reservation.nbModif > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 backdrop-blur-sm text-amber-200 text-[10px] font-bold uppercase tracking-wider">
                      <RefreshCw size={10} />
                      Modifiée {reservation.nbModif}×
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xl md:text-2xl font-black text-white drop-shadow-sm">
                    {reservation?.trajet.villeDepart}
                  </span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ChevronRight size={22} className="text-white/70" />
                  </motion.div>
                  <span className="text-xl md:text-2xl font-black text-white drop-shadow-sm">
                    {reservation?.trajet.villeArrivee}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 mt-3 text-white/80 text-sm">
                  <span className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1">
                    <Building size={12} />
                    {reservation?.trajet.compagnieNom}
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1">
                    <Ticket size={12} />
                    {reservation?.tickets?.length} passager(s)
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1">
                    <MapPin size={12} />
                    Sièges: {siegesActuels.join(', ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 pt-6 pb-6 space-y-7">
              {/* ── Sélection nouveau trajet ── */}
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-4 h-0.5 rounded-full bg-gradient-to-r from-orange-400 to-red-500" />
                  Nouveau trajet
                </label>
                {loadingTrajets ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : trajetsOptions.length === 0 ? (
                  <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-amber-700 dark:text-amber-400 text-sm font-medium flex items-center gap-2">
                    <AlertCircle size={15} />
                    Aucun trajet alternatif disponible pour cette destination
                  </div>
                ) : (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <select
                      value={selectedTrajetId || ''}
                      onChange={(e) => handleTrajetChange(Number(e.target.value))}
                      className="relative w-full appearance-none px-5 py-3.5 pr-11 bg-slate-50 dark:bg-zinc-800 border-2 border-slate-100 dark:border-zinc-700 rounded-2xl text-sm text-slate-800 dark:text-white font-medium focus:outline-none focus:border-orange-400 dark:focus:border-orange-500 focus:ring-0 transition-all duration-300 shadow-sm group-hover:shadow-md cursor-pointer"
                    >
                      <option value="">Sélectionnez un trajet alternatif</option>
                      {trajetsOptions.map((trajet) => (
                        <option key={trajet.id} value={trajet.id}>
                          {formatDate(trajet.dateDepart)} à {formatTime(trajet.dateDepart)} — {trajet.prixBase} MAD — {trajet.compagnieNom}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-orange-500 transition-colors duration-300">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 5l3 3 3-3" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Détails du trajet sélectionné ── */}
              <AnimatePresence>
                {selectedTrajet && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20"
                  >
                    <p className="text-[11px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                      <Sparkles size={13} />
                      Détails du nouveau trajet
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: Building, label: 'Compagnie', value: selectedTrajet.compagnieNom },
                        { icon: Calendar, label: 'Date', value: formatDate(selectedTrajet.dateDepart) },
                        { icon: Clock, label: 'Départ', value: formatTime(selectedTrajet.dateDepart) },
                        { icon: MapPin, label: 'Prix', value: `${selectedTrajet.prixBase} MAD` },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2.5 p-2.5 bg-white/60 dark:bg-zinc-800/60 rounded-xl border border-orange-100/50 dark:border-orange-500/10">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <item.icon size={14} className="text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase">{item.label}</p>
                            <p className="text-xs font-bold text-slate-800 dark:text-white">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── BUS PLAN ── */}
          {selectedTrajetId && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden"
            >
              <div className="px-6 pt-6 pb-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
                    <Bus size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Plan du bus</p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                      {loadingSieges ? 'Chargement…' : `${sieges.length} sièges · ${selectedSieges.length} sélectionné(s)`}
                    </p>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-8 pb-6 border-b border-slate-100 dark:border-zinc-800">
                  {LEGEND_ITEMS.map(l => (
                    <div key={l.label} className="flex items-center gap-2.5">
                      <div className={cn('w-4 h-4 rounded-full shadow-md', l.color)} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{l.label}</span>
                    </div>
                  ))}
                </div>

                {loadingSieges ? (
                  <div className="flex justify-center py-10">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : sieges.length === 0 ? (
                  <div className="p-6 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl text-center">
                    <p className="text-sm text-slate-500 dark:text-zinc-400">Aucun plan de bus disponible pour ce trajet</p>
                  </div>
                ) : (
                  /* Bus Interior */
                  <div className="relative max-w-xs mx-auto">
                    {/* Cabine chauffeur */}
                    <div className="h-24 bg-slate-50 dark:bg-zinc-800/50 rounded-t-[4rem] mb-10 flex flex-col items-center justify-center border-x border-t border-slate-100 dark:border-zinc-700">
                      <Bus size={28} className="text-slate-300 dark:text-zinc-600 mb-1" />
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-zinc-600">Cabine Chauffeur</span>
                    </div>

                    {/* Sièges */}
                    <div className="space-y-3 px-3">
                      {rows.map((row, rIdx) => (
                        <div key={rIdx} className="grid grid-cols-5 gap-2">
                          {row.slice(0, 2).map(s => (
                            <Seat key={s.numeroSiege} siege={s} status={getSiegeStatus(s)} warnings={getSeatWarnings(s)} onClick={() => handleSiegeClick(s)} />
                          ))}
                          <div className="flex items-center justify-center opacity-10">
                            <div className="w-px h-full bg-slate-400" />
                          </div>
                          {row.slice(2, 4).map(s => (
                            <Seat key={s.numeroSiege} siege={s} status={getSiegeStatus(s)} warnings={getSeatWarnings(s)} onClick={() => handleSiegeClick(s)} />
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Arrière */}
                    <div className="h-12 mt-10 bg-slate-50 dark:bg-zinc-800/50 rounded-b-[2.5rem] border-x border-b border-slate-100 dark:border-zinc-700 flex items-center justify-center">
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-zinc-600">Arrière du Bus</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* ═══ RIGHT: SUMMARY + FEE + SUBMIT ═══ */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden"
          >
            <div className="px-6 pt-6 pb-6 space-y-6">

              {/* Résumé de sélection */}
              <div>
                <p className="text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                  <span className="w-4 h-0.5 rounded-full bg-gradient-to-r from-orange-400 to-red-500" />
                  Ma sélection
                </p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Passagers</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white">{nombreSieges}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Sièges choisis</span>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {selectedSieges.length > 0 ? selectedSieges.map(s => (
                        <span key={s} className="bg-yellow-400 text-yellow-900 w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs italic shadow-lg shadow-yellow-400/30">
                          {s}
                        </span>
                      )) : (
                        <span className="text-xs text-slate-400 dark:text-zinc-500 italic">Aucun</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Résumé des frais ── */}
              {selectedTrajetId && (
                <div className={`p-4 rounded-2xl border ${
                  modificationFee > 0
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border-amber-200 dark:border-amber-500/20'
                    : 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border-emerald-200 dark:border-emerald-500/20'
                }`}>
                  <p className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                    <span className="w-4 h-0.5 rounded-full bg-gradient-to-r from-orange-400 to-red-500" />
                    Frais
                  </p>
                  {modificationFee > 0 ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">Frais de modification</span>
                        <span className="text-lg font-black text-amber-700 dark:text-amber-400">{modificationFee} MAD</span>
                      </div>
                      <p className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                        <ShieldCheck size={12} />
                        Paiement nécessaire
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle size={16} />
                      ✓ Modification gratuite (1<sup>ère</sup> modif)
                    </p>
                  )}
                </div>
              )}

              {/* ── Error ── */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2.5 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-semibold"
                  >
                    <AlertCircle size={16} className="flex-shrink-0" /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Payment Section ── */}
              {selectedTrajetId && modificationFee > 0 ? (
                <div className="space-y-5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-orange-500" />
                    <p className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-[0.15em]">
                      Paiement sécurisé
                    </p>
                  </div>

                  {/* Method Selector */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'CARTE', label: 'Carte', desc: 'Visa, Mastercard', icon: <CreditCard size={22} /> },
                      { id: 'PAYPAL', label: 'PayPal', desc: 'Paiement électronique', icon: <Wallet size={22} /> },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setMethode(opt.id as any)}
                        className={cn(
                          'flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-300',
                          methode === opt.id
                            ? 'border-orange-500 bg-orange-500/5 shadow-lg shadow-orange-500/10'
                            : 'border-slate-100 dark:border-zinc-700 hover:border-orange-200 dark:hover:border-orange-800'
                        )}
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all',
                          methode === opt.id ? 'bg-orange-500 text-white' : 'bg-slate-50 dark:bg-zinc-800 text-slate-400'
                        )}>
                          {opt.icon}
                        </div>
                        <span className={cn('text-xs font-black uppercase tracking-tight', methode === opt.id ? 'text-slate-900 dark:text-white' : 'text-slate-400')}>
                          {opt.label}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Credit Card Form */}
                  <AnimatePresence mode="wait">
                    {methode === 'CARTE' ? (
                      <motion.div key="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <CreditCardForm
                          defaultHolder={`${user?.prenom || ''} ${user?.nom || ''}`}
                          maskMiddle={true}
                          ring1="#f97316" ring2="#ea580c"
                          onChange={handleCardChange}
                        />
                      </motion.div>
                    ) : (
                      <motion.div key="paypal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-6 text-center">
                        <Wallet size={28} className="text-blue-500 mx-auto mb-3" />
                        <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">Redirection vers PayPal</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Terms */}
                  <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acceptConditions}
                      onChange={e => setAcceptConditions(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-orange-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">J'accepte les CGV</p>
                      <button onClick={() => setShowCgvModal(true)} className="text-[10px] font-bold text-orange-500 hover:underline flex items-center gap-1 mt-0.5">
                        Consulter <ExternalLink size={9} />
                      </button>
                    </div>
                  </label>

                  {/* Slide to Pay */}
                  <SlideButton
                    onSuccess={handleSubmit}
                    buttonText="Glissez pour payer"
                  />
                </div>
              ) : (
                <motion.button
                  onClick={handleSubmit}
                  disabled={submitting || !selectedTrajetId || selectedSieges.length !== nombreSieges}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-black text-sm hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-200/50 dark:shadow-none"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Traitement…
                    </>
                  ) : (
                    <>
                      <Zap size={17} />
                      Confirmer la modification
                    </>
                  )}
                </motion.button>
              )}

              {/* ── Footer info ── */}
              <p className="text-center text-[10px] text-slate-400 dark:text-zinc-600">
                1<sup>ère</sup> modification gratuite · À partir de la 2<sup>ème</sup>: 20 MAD
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Warning Confirmation Popup */}
      <AnimatePresence>
        {warningPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setWarningPopup(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-100 dark:border-zinc-800 shadow-2xl overflow-hidden"
            >
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl" />

              <div className="relative z-10 p-8">
                <button
                  onClick={() => setWarningPopup(null)}
                  className="absolute top-4 right-4 w-9 h-9 bg-slate-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>

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

                <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-amber-50 to-rose-50 dark:from-amber-900/20 dark:to-rose-900/20 rounded-[2rem] border border-amber-200/50 dark:border-amber-800/30 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-rose-400 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                    <AlertTriangle size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Attention</h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                      Ce siège ne respecte pas une ou plusieurs de vos préférences.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Vos préférences</p>

                  {prefPosition && prefPosition !== 'INDIFFERENT' && (
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-[1.5rem]">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
                        <Armchair size={18} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          Côté {prefPosition === 'FENETRE' ? 'Fenêtre' : 'Couloir'}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                          {warningPopup.warnings.includes('position')
                            ? `Le siège ${warningPopup.siege.numeroSiege} (${warningPopup.siege.positionRangee}) n'est pas à ce côté`
                            : 'Correspond à votre préférence'}
                        </p>
                      </div>
                      {warningPopup.warnings.includes('position') ? (
                        <AlertTriangle size={16} className="text-amber-400 shrink-0 ml-auto" />
                      ) : (
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 ml-auto" />
                      )}
                    </div>
                  )}

                  {!prefAccepteOppose && (
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-[1.5rem]">
                      <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center shrink-0">
                        <ShieldCheck size={18} className="text-rose-600 dark:text-rose-400" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          Pas de sexe opposé à côté
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                          {warningPopup.warnings.includes('gender')
                            ? 'Un voisin immédiat est de sexe opposé'
                            : 'Voisinage compatible'}
                        </p>
                      </div>
                      {warningPopup.warnings.includes('gender') ? (
                        <AlertTriangle size={16} className="text-rose-400 shrink-0 ml-auto" />
                      ) : (
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 ml-auto" />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setWarningPopup(null)}
                    className="flex-1 px-6 py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmWarningSelection}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:from-amber-600 hover:to-rose-600 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
                  >
                    Confirmer quand même
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white dark:bg-zinc-900 rounded-[3rem] max-w-lg w-full overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-zinc-800"
            >
              <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl -mr-24 -mt-24" />
                <div className="relative z-10 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-2">Vérification Finale</p>
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic">Récapitulatif</h2>
                  </div>
                  <Receipt size={36} className="opacity-20" />
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-zinc-700">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Trajet</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white uppercase italic tracking-tighter">
                        {reservation?.trajet.villeDepart} → {reservation?.trajet.villeArrivee}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Sièges</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white italic tracking-tighter">
                        {selectedSieges.join(', ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Passagers</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white italic tracking-tighter">{nombreSieges}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Méthode</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white italic tracking-tighter">{methode === 'CARTE' ? 'Carte Bancaire' : 'PayPal'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center px-2">
                  <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Total débité</p>
                  <p className="text-3xl font-black text-orange-500 italic tracking-tighter">{modificationFee} MAD</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleConfirmPaiement}
                    disabled={submitting}
                    className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Confirmer <ArrowRight size={14} /></>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CGV Modal */}
      <AnimatePresence>
        {showCgvModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6" onClick={() => setShowCgvModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-8 border border-slate-100 dark:border-zinc-800 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <FileText size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Conditions Générales</p>
                  <p className="text-[10px] text-slate-400">Contrat de vente</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">
                En confirmant votre paiement, vous acceptez les conditions générales de vente de RIHLA.
                Les frais de modification s'appliquent selon le nombre de modifications déjà effectuées.
                Conformément à la loi en vigueur, vous disposez d'un droit de rétractation de 14 jours.
              </p>
              <button
                onClick={() => setShowCgvModal(false)}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl text-xs font-bold hover:opacity-90 transition"
              >
                J'ai compris
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
