// app/[locale]/plan-bus/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { reservationApi } from '@/lib/api/voyageur/reservation';
import { SiegePlanDTO } from '@/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ChevronLeft, Info, Sparkles, ShieldCheck, Bus, MapPin, Armchair, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
      const response = await fetch(`http://localhost:8080/api/voyageur/trajets/${trajetId}`, {
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

  const getSiegeStatus = (siege: SiegePlanDTO) => {
    if (selectedSieges.includes(siege.numeroSiege)) return 'selected';
    if (siege.occupe) return 'occupied';
    if (siege.bloque) return 'blocked';
    if (siege.verrouilleTemporaire) return 'locked';
    return 'available';
  };

  const handleSiegeClick = (siege: SiegePlanDTO) => {
    const status = getSiegeStatus(siege);
    if (status !== 'available' && status !== 'selected') return;

    if (selectedSieges.includes(siege.numeroSiege)) {
      setSelectedSieges(selectedSieges.filter(s => s !== siege.numeroSiege));
    } else {
      if (selectedSieges.length < nbPassagers) {
        setSelectedSieges([...selectedSieges, siege.numeroSiege]);
      } else {
        setError(`Vous ne pouvez sélectionner que ${nbPassagers} siège(s)`);
        setTimeout(() => setError(''), 3000);
      }
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
        {/* ── Hero Section WOW ── */}
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
                        
                        {/* Legend WOW */}
                        <div className="flex flex-wrap justify-center gap-8 mb-12 pb-8 border-b border-slate-50 dark:border-slate-800">
                            {[
                                { status: 'available', color: 'bg-emerald-500', label: 'Libre' },
                                { status: 'selected', color: 'bg-orange-500', label: 'Sélection' },
                                { status: 'occupied', color: 'bg-slate-200 dark:bg-slate-700', label: 'Occupé' },
                                { status: 'locked', color: 'bg-slate-900', label: 'Verrouillé' },
                            ].map(l => (
                                <div key={l.label} className="flex items-center gap-3">
                                    <div className={cn("w-4 h-4 rounded-full shadow-lg", l.color)} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{l.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Bus Interior Mockup */}
                        <div className="relative max-w-sm mx-auto">
                            {/* Dashboard / Driver Area */}
                            <div className="h-32 bg-slate-50 dark:bg-slate-800/50 rounded-t-[5rem] mb-12 flex flex-col items-center justify-center border-x border-t border-slate-100 dark:border-slate-800">
                                <Bus size={32} className="text-slate-200 mb-2" />
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Cabine Chauffeur</span>
                            </div>

                            {/* Seats Grid */}
                            <div className="space-y-4 px-4">
                                {rows.map((row, rIdx) => (
                                    <div key={rIdx} className="grid grid-cols-5 gap-3">
                                        {/* Left pair */}
                                        {row.slice(0, 2).map(s => <Seat key={s.numeroSiege} siege={s} status={getSiegeStatus(s)} onClick={() => handleSiegeClick(s)} />)}
                                        {/* Aisle */}
                                        <div className="flex items-center justify-center opacity-10">
                                            <div className="w-px h-full bg-slate-400" />
                                        </div>
                                        {/* Right pair */}
                                        {row.slice(2, 4).map(s => <Seat key={s.numeroSiege} siege={s} status={getSiegeStatus(s)} onClick={() => handleSiegeClick(s)} />)}
                                    </div>
                                ))}
                            </div>

                            {/* Rear Area */}
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
                        
                        <div className="space-y-6 mb-10">
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Passagers attendus</span>
                                <span className="text-lg font-black italic">{nbPassagers}</span>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sièges sélectionnés</span>
                                <div className="flex gap-2">
                                    {selectedSieges.length > 0 ? selectedSieges.map(s => (
                                        <span key={s} className="bg-orange-500 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black italic shadow-lg shadow-orange-500/20">{s}</span>
                                    )) : <span className="text-slate-300 italic text-sm">Aucun</span>}
                                </div>
                             </div>
                        </div>

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

                    {/* Booking Safety Tip */}
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
    </div>
  );
}

function Seat({ siege, status, onClick }: { siege: SiegePlanDTO, status: string, onClick: () => void }) {
    const isAvailable = status === 'available';
    const isSelected = status === 'selected';
    
    return (
        <motion.button
            whileHover={isAvailable ? { scale: 1.1, y: -2 } : {}}
            whileTap={isAvailable ? { scale: 0.9 } : {}}
            onClick={onClick}
            disabled={!isAvailable && !isSelected}
            className={cn(
                "w-full aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative",
                status === 'available' && "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm",
                status === 'selected' && "bg-orange-500 text-white shadow-xl shadow-orange-500/30",
                status === 'occupied' && "bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed",
                status === 'locked' && "bg-slate-900 text-slate-700 cursor-not-allowed",
                status === 'blocked' && "bg-rose-100 text-rose-300 cursor-not-allowed"
            )}
        >
            <Armchair size={16} className={cn("mb-0.5", (status === 'occupied' || status === 'locked') ? 'opacity-20' : 'opacity-100')} />
            <span className="text-[10px] font-black italic leading-none">{siege.numeroSiege}</span>
            {isSelected && (
                <motion.div layoutId="seat-check" className="absolute -top-1 -right-1 w-4 h-4 bg-white text-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle2 size={10} />
                </motion.div>
            )}
        </motion.button>
    );
}