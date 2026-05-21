'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { reservationApi } from '@/lib/api/voyageur/reservation';
import { preferencesApi } from '@/lib/api/voyageur/preferences';
import { SiegePlanDTO } from '@/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ShieldCheck, Bus, Armchair, CheckCircle2, AlertCircle, AlertTriangle, Wand2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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

export default function PlanBusPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const trajetId = searchParams.get('trajetId');
  const reservationId = searchParams.get('reservationId');

  const [sieges, setSieges] = useState<SiegePlanDTO[]>([]);
  const [selectedSieges, setSelectedSieges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reservationTemp, setReservationTemp] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [prixUnitaire, setPrixUnitaire] = useState<number>(0);
  const [trajetInfo, setTrajetInfo] = useState<any>(null);
  const [nbPassagers, setNbPassagers] = useState<number>(1);
  const [propositionLoading, setPropositionLoading] = useState(false);
  const [prefPosition, setPrefPosition] = useState<string | null>(null);
  const [prefAccepteOppose, setPrefAccepteOppose] = useState(true);
  const [warningPopup, setWarningPopup] = useState<{ siege: SiegePlanDTO; warnings: ('position' | 'gender')[] } | null>(null);

  useEffect(() => {
    if (trajetId) {
      loadPlanBus();
      loadReservationTemp();
      loadTrajetInfo();
    }
  }, [trajetId]);

  const loadReservationTemp = () => {
    const temp = sessionStorage.getItem('reservation_temp');
    if (temp) {
      const parsed = JSON.parse(temp);
      setReservationTemp(parsed);
      setNbPassagers(parsed.nbPassagers || 1);
    } else {
      router.push(`/fr/recherche`);
    }
  };

  const loadTrajetInfo = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      // URL du backend via variable d'environnement (compatible Docker)
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${API_BASE}/voyageur/trajets/${trajetId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPrixUnitaire(data.prixBase || 0);
      setTrajetInfo(data);
    } catch (error) {
      console.error('Erreur chargement trajet:', error);
    }
  };

  const loadPlanBus = async () => {
    try {
      const data = await reservationApi.getPlanBus(parseInt(trajetId!));
      setSieges(data);
    } catch (error) {
      setError('Impossible de charger le plan du bus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    preferencesApi.getPreferenceVoisinage()
      .then(data => {
        setPrefAccepteOppose(data.accepteSexeOppose);
        if (data.preferencePosition) setPrefPosition(data.preferencePosition);
      })
      .catch(() => {});
  }, []);

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
      if (selectedSieges.length < nbPassagers) {
        const warnings = getSeatWarnings(siege);
        if (warnings.length > 0) {
          setWarningPopup({ siege, warnings });
          return;
        }
        setSelectedSieges([...selectedSieges, siege.numeroSiege]);
      } else {
        setError(`Vous ne pouvez sélectionner que ${nbPassagers} siège(s)`);
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const confirmWarningSelection = () => {
    if (!warningPopup) return;
    setSelectedSieges([...selectedSieges, warningPopup.siege.numeroSiege]);
    setWarningPopup(null);
  };

  const handleAutoPlacer = async () => {
    if (!reservationId && !reservationTemp?.reservationId) {
      setError('Aucune réservation en cours');
      return;
    }
    setPropositionLoading(true);
    try {
      const finalId = reservationId || reservationTemp?.reservationId;
      const result = await reservationApi.proposerSiegesIntelligents(parseInt(finalId));
      if (result.numerosSieges.length > 0) {
        setSelectedSieges(result.numerosSieges);
      } else {
        setError(result.description || 'Aucune proposition disponible');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de proposition');
    } finally {
      setPropositionLoading(false);
    }
  };

  const handleConfirmerReservation = async () => {
    if (selectedSieges.length !== nbPassagers) {
      setError(`Veuillez sélectionner ${nbPassagers} siège(s)`);
      return;
    }

    setIsProcessing(true);
    try {
      const finalReservationId = reservationId || reservationTemp?.reservationId;
      await reservationApi.verrouillerSieges(parseInt(finalReservationId), parseInt(trajetId!), selectedSieges);

      const prixTotal = reservationTemp?.prixTotal || (prixUnitaire * nbPassagers);

      const trajetFullInfo = {
        reservationId: finalReservationId,
        trajetId: parseInt(trajetId!),
        selectedSieges, nbPassagers, prixUnitaire, prixTotal,
        villeDepart: reservationTemp?.villeDepart || trajetInfo?.villeDepart,
        villeArrivee: reservationTemp?.villeArrivee || trajetInfo?.villeArrivee,
        dateDepart: reservationTemp?.dateDepart || trajetInfo?.dateDepart,
        compagnieNom: reservationTemp?.compagnieNom || trajetInfo?.compagnieNom,
        busMatricule: reservationTemp?.busMatricule || trajetInfo?.busMatricule,
        quaiNumero: reservationTemp?.quaiNumero || trajetInfo?.quaiNumero,
        membres: reservationTemp?.membres || [],
      };

      sessionStorage.setItem('trajet_info', JSON.stringify(trajetFullInfo));
      sessionStorage.removeItem('reservation_temp');
      router.push(`/fr/paiement?reservationId=${finalReservationId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la réservation');
      setIsProcessing(false);
    }
  };

  const totalEstime = reservationTemp?.prixTotal || (prixUnitaire * nbPassagers);
  const rows: SiegePlanDTO[][] = [];
  for (let i = 0; i < sieges.length; i += 4) { rows.push(sieges.slice(i, i + 4)); }

  if (loading) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" /><p className="text-orange-500 font-black uppercase tracking-widest text-xs animate-pulse">Chargement du bus...</p></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 selection:bg-orange-500/30 overflow-x-hidden">
      <Header />

      <main>
        <section className="relative pt-20 pb-32 overflow-hidden bg-slate-900">
            <div className="absolute inset-0 z-0 opacity-40">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.15),transparent_70%)]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full mb-6">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">Étape 2: Choix des sièges</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic leading-none">
                            Configurez votre <br/><span className="text-orange-500">Confort</span>
                        </h1>
                    </motion.div>

                    <div className="hidden lg:flex items-center gap-8 text-white/40 pb-4">
                        <div className="flex flex-col items-center gap-2 opacity-50">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black italic">✓</div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Passagers</span>
                        </div>
                        <div className="w-10 h-px bg-white/10" />
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center text-orange-500 font-black italic">2</div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">Sièges</span>
                        </div>
                        <div className="w-10 h-px bg-white/10" />
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center font-black italic">3</div>
                            <span className="text-[9px] font-black uppercase tracking-widest">Paiement</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-24 bg-[#f8fafc] dark:bg-slate-950" style={{ clipPath: 'ellipse(70% 100% at 50% 100%)' }} />
        </section>

        <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20 pb-32">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Left Side: Seat Map */}
                <div className="lg:col-span-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl">

                        {/* Legend */}
                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-10 pb-8 border-b border-slate-50 dark:border-slate-800">
                            {LEGEND_ITEMS.map(l => (
                                <div key={l.label} className="flex items-center gap-2.5">
                                    <div className={cn("w-4 h-4 rounded-full shadow-md", l.color)} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{l.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Bus Interior */}
                        <div className="relative max-w-sm mx-auto">
                            <div className="h-32 bg-slate-50 dark:bg-slate-800/50 rounded-t-[5rem] mb-12 flex flex-col items-center justify-center border-x border-t border-slate-100 dark:border-slate-800">
                                <Bus size={32} className="text-slate-200 mb-2" />
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Cabine Chauffeur</span>
                            </div>

                            <div className="space-y-4 px-4">
                                {rows.map((row, rIdx) => (
                                    <div key={rIdx} className="grid grid-cols-5 gap-3">
                                        {row.slice(0, 2).map(s => <Seat key={s.numeroSiege} siege={s} status={getSiegeStatus(s)} warnings={getSeatWarnings(s)} onClick={() => handleSiegeClick(s)} />)}
                                        <div className="flex items-center justify-center opacity-10">
                                            <div className="w-px h-full bg-slate-400" />
                                        </div>
                                        {row.slice(2, 4).map(s => <Seat key={s.numeroSiege} siege={s} status={getSiegeStatus(s)} warnings={getSeatWarnings(s)} onClick={() => handleSiegeClick(s)} />)}
                                    </div>
                                ))}
                            </div>

                            <div className="h-16 mt-12 bg-slate-50 dark:bg-slate-800/50 rounded-b-[3rem] border-x border-b border-slate-100 dark:border-slate-800 flex items-center justify-center">
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Arrière du Bus</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Side: Info & Selection */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Selection Summary */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-8">Ma Sélection</h3>

                        <div className="space-y-6 mb-8">
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Passagers attendus</span>
                                <span className="text-lg font-black italic">{nbPassagers}</span>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sièges sélectionnés</span>
                                <div className="flex gap-2 flex-wrap justify-end">
                                    {selectedSieges.length > 0 ? selectedSieges.map(s => (
                                        <span key={s} className="bg-yellow-400 text-yellow-900 w-10 h-10 rounded-xl flex items-center justify-center font-black italic shadow-lg shadow-yellow-400/30">{s}</span>
                                    )) : <span className="text-slate-300 italic text-sm">Aucun</span>}
                                </div>
                             </div>
                        </div>

                        {/* Auto-place button */}
                        <button
                            onClick={handleAutoPlacer}
                            disabled={propositionLoading}
                            className="w-full bg-purple-600 text-white py-3.5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-purple-700 active:scale-95 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-30 flex items-center justify-center gap-2 mb-6"
                        >
                            <Wand2 size={14} />
                            {propositionLoading ? "Recherche..." : "Placer automatiquement"}
                        </button>

                        {error && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-500 text-[10px] font-bold flex items-center gap-3 mb-6">
                                <AlertCircle size={16} /> {error}
                            </motion.div>
                        )}

                        <div className="pt-8 border-t border-slate-50 dark:border-slate-800">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Total à régler</p>
                             <p className="text-5xl font-black text-slate-900 dark:text-white italic tracking-tighter mb-10">
                                {totalEstime} <span className="text-xl text-orange-500">DH</span>
                             </p>

                             <button
                                onClick={handleConfirmerReservation}
                                disabled={isProcessing || selectedSieges.length !== nbPassagers}
                                className="w-full bg-slate-900 dark:bg-orange-500 text-white py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-black/20 disabled:opacity-30 disabled:hover:scale-100"
                            >
                                {isProcessing ? "Verrouillage..." : "Confirmer et Payer"}
                            </button>
                        </div>
                    </motion.div>

                    <div className="bg-slate-900 p-8 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="relative z-10">
                            <ShieldCheck size={32} className="text-emerald-500 mb-4" />
                            <h4 className="text-white font-black uppercase tracking-tighter italic mb-2">Sécurité & Hygiène</h4>
                            <p className="text-white/40 text-[10px] leading-relaxed font-medium">
                                Tous nos sièges sont désinfectés avant chaque départ. Profitez d'un voyage serein avec climatisation individuelle et ports USB.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
                    </div>
                </div>
            </div>
        </div>
      </main>
      <Footer />

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
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
              {/* Glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl" />

              <div className="relative z-10 p-8">
                {/* Close */}
                <button
                  onClick={() => setWarningPopup(null)}
                  className="absolute top-4 right-4 w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>

                {/* Brand Logo */}
                <div className="mb-6">
                  <div className="flex items-center">
                      {"RIHLA".split("").map((letter, i) => (
                        <span key={i} className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)] select-none">
                          {letter}
                        </span>
                      ))}
                    </div>
                    <p className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mt-0.5">Gare Routière Intelligente</p>
                  </div>

                {/* Warning badge */}
                <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-amber-50 to-rose-50 dark:from-amber-900/20 dark:to-rose-900/20 rounded-[2rem] border border-amber-200/50 dark:border-amber-800/30 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-rose-400 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                    <AlertTriangle size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                      Attention
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                      Ce siège ne respecte pas une ou plusieurs de vos préférences.
                    </p>
                  </div>
                </div>

                {/* Preferences */}
                <div className="space-y-4 mb-8">
                  <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Vos préférences</p>

                  {prefPosition && prefPosition !== 'INDIFFERENT' && (
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem]">
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
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem]">
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

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setWarningPopup(null)}
                    className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-zinc-300 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
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
    </div>
  );
}

function Seat({ siege, status, warnings, onClick }: { siege: SiegePlanDTO, status: string, warnings: ('position' | 'gender')[], onClick: () => void }) {
    const isAvailable = status === 'available';
    const isSelected = status === 'selected';
    const hasPosition = warnings.includes('position');
    const hasGender = warnings.includes('gender');
    const warnRing = hasPosition && hasGender ? 'ring-2 ring-amber-400/50 ring-rose-400/50' : hasPosition ? 'ring-2 ring-amber-400/50' : hasGender ? 'ring-2 ring-rose-400/50' : '';

    return (
        <motion.button
            whileHover={isAvailable ? { scale: 1.1, y: -2 } : {}}
            whileTap={isAvailable ? { scale: 0.9 } : {}}
            onClick={onClick}
            disabled={!isAvailable && !isSelected}
            title={
                hasPosition && hasGender ? 'Ne correspond pas à votre côté préféré et voisin de sexe opposé'
                : hasPosition ? 'Ne correspond pas à votre côté préféré'
                : hasGender ? 'Voisin de sexe opposé'
                : siege.numeroSiege
            }
            className={cn(
                "w-full aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative",
                getSiegeColor(status, siege.typeOccupant),
                warnRing
            )}
        >
            <Armchair size={16} className={cn("mb-0.5", (status === 'locked' || status === 'occupied') && !isSelected ? 'opacity-20' : 'opacity-100')} />
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
            {isSelected && (
                <motion.div layoutId="seat-check" className="absolute -top-1 -right-1 w-4 h-4 bg-white text-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle2 size={10} />
                </motion.div>
            )}
        </motion.button>
    );
}
