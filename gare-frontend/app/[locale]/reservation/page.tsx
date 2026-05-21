// app/[locale]/reservation/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { reservationApi } from '@/lib/api/voyageur/reservation';
import { preferencesApi } from '@/lib/api/voyageur/preferences';
import { apiClient } from '@/lib/api/client';
import { storage } from '@/lib/utils/storage';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { UserPlus, UserMinus, AlertCircle, ArrowLeft, Briefcase, Plus, X, Heart, Sparkles, ShieldCheck, Bus, MapPin, Clock, Ticket, CheckCircle2 } from 'lucide-react';
import { BagageRequest } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TrajetDTO {
  id: number;
  dateDepart: string;
  dateArriveePrevue: string;
  villeDepart: string;
  villeArrivee: string;
  prixBase: number;
  compagnieNom: string;
  busMarque: string;
  busMatricule: string;
  nbSieges: number;
  nbReservations: number;
  quaiNumero: number;
}

interface MembreForm {
  nomManuel: string;
  prenomManuel: string;
  sexe: string;
  age: number | '';
  categorieTarifaire: string;
  lienOrganisateur: string;
  enfantSurGenoux: boolean;
  accepteSexeOppose: boolean;
}

const defaultMembre = (): MembreForm => ({
  nomManuel: '',
  prenomManuel: '',
  sexe: 'HOMME',
  age: 25,
  categorieTarifaire: 'NORMAL',
  lienOrganisateur: 'AMI',
  enfantSurGenoux: false,
  accepteSexeOppose: true,
});

export default function ReservationPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const trajetId = searchParams.get('trajetId');

  const [trajet, setTrajet] = useState<TrajetDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [typeGroupe, setTypeGroupe] = useState<'MOI_SEUL' | 'MOI_PLUS_ACCOMPAGNANTS' | 'AUTRE_PERSONNE'>('MOI_SEUL');
  const [accepteSeparer, setAccepteSeparer] = useState(false);
  const [membres, setMembres] = useState<MembreForm[]>([]);
  const [bagages, setBagages] = useState<BagageRequest[]>([]);
  const [showBagages, setShowBagages] = useState(false);
  const [error, setError] = useState('');
  const [userPrefs, setUserPrefs] = useState<{ accepteSexeOppose: boolean; preferencePosition?: string }>({ accepteSexeOppose: true });

  useEffect(() => {
    preferencesApi.getPreferenceVoisinage()
      .then(data => setUserPrefs(data))
      .catch(() => {});
  }, []);

  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [promoValid, setPromoValid] = useState<boolean | null>(null);
  const [promoMsg, setPromoMsg] = useState('');

  useEffect(() => {
    if (!user) {
      const returnUrl = `/fr/reservation?trajetId=${trajetId}`;
      router.push(`/fr/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (trajetId) {
      loadTrajet();
    }
  }, [trajetId, user]);

  const loadTrajet = async () => {
    try {
      const response = await apiClient.get(`/voyageur/trajets/${trajetId}`);
      setTrajet(response.data);
    } catch (error: any) {
      setError('Trajet introuvable');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoCheck = () => {
    if (!promoCode || !trajet) return;
    
    // Simple logic: Promo codes are often tied to the company name (e.g. CTM2024, SUPRATOURS10)
    const companyPrefix = trajet.compagnieNom.split(' ')[0].toUpperCase();
    if (promoCode.toUpperCase().startsWith(companyPrefix)) {
        setPromoValid(true);
        setPromoMsg(`Code promo ${promoCode} appliqué pour ${trajet.compagnieNom} !`);
    } else {
        setPromoValid(false);
        setPromoMsg(`Ce code n'est pas valide pour la compagnie ${trajet.compagnieNom}.`);
    }
  };

  const ajouterMembre = () => setMembres([...membres, defaultMembre()]);
  const supprimerMembre = (index: number) => setMembres(membres.filter((_, i) => i !== index));
  const updateMembre = (index: number, field: keyof MembreForm, value: any) => {
    const updated = [...membres];
    updated[index] = { ...updated[index], [field]: value };
    setMembres(updated);
  };

  // ----- Gestion des bagages -----
  const defaultBagage = (): BagageRequest => ({ poidsKg: 10, dimensionCm: '60x40x30' });
  const ajouterBagage = () => setBagages([...bagages, defaultBagage()]);
  const supprimerBagage = (index: number) => setBagages(bagages.filter((_, i) => i !== index));
  const updateBagage = (index: number, field: keyof BagageRequest, value: any) => {
    const updated = [...bagages];
    updated[index] = { ...updated[index], [field]: value };
    setBagages(updated);
  };

  const calculerSurplusEstime = (bagage: BagageRequest) => {
    if (!bagage.poidsKg || !bagage.dimensionCm) return 0;
    let surplusPoids = 0;
    if (bagage.poidsKg > 40) surplusPoids = 150;
    else if (bagage.poidsKg > 30) surplusPoids = 100;
    else if (bagage.poidsKg > 20) surplusPoids = 75;
    else if (bagage.poidsKg > 15) surplusPoids = 50;

    let volume = 0;
    const parts = bagage.dimensionCm.split('x');
    if (parts.length === 3) {
      const l = parseFloat(parts[0]) || 0;
      const w = parseFloat(parts[1]) || 0;
      const h = parseFloat(parts[2]) || 0;
      volume = l * w * h;
    }
    let surplusVolume = 0;
    if (volume > 300000) surplusVolume = 150;
    else if (volume > 200000) surplusVolume = 100;
    else if (volume > 120000) surplusVolume = 75;
    else if (volume > 60000) surplusVolume = 50;
    return Math.max(surplusPoids, surplusVolume);
  };

  const getSurplusTotalBagages = () => {
    if (!showBagages) return 0;
    return bagages.reduce((total, b) => total + calculerSurplusEstime(b), 0);
  };

  const getNbPassagers = () => {
    if (typeGroupe === 'MOI_SEUL') return 1;
    if (typeGroupe === 'MOI_PLUS_ACCOMPAGNANTS') return 1 + membres.length;
    return membres.length;
  };

  const getPrixTotalAvecEnfants = () => {
    if (!trajet) return 0;
    let total = 0;
    const allMembres = typeGroupe === 'MOI_SEUL'
      ? [{ enfantSurGenoux: false, categorieTarifaire: 'NORMAL' }]
      : typeGroupe === 'MOI_PLUS_ACCOMPAGNANTS'
        ? [{ enfantSurGenoux: false, categorieTarifaire: 'NORMAL' }, ...membres]
        : membres;
    allMembres.forEach(m => {
      if ((m as any).enfantSurGenoux) return;
      let prix = trajet.prixBase;
      const cat = (m as any).categorieTarifaire;
      if (cat === 'ETUDIANT') prix *= 0.75;
      else if (cat === 'ENFANT') prix *= 0.5;
      else if (cat === 'MILITAIRE') prix *= 0.7;
      else if (cat === 'SENIOR') prix *= 0.8;
      total += prix;
    });
    
    // Apply Promo Discount
    if (promoValid) {
        total *= 0.9; // 10% discount for validated promo
    }
    
    return total.toFixed(0);
  };

  const handleContinue = async () => {
    if (!trajet || !user) return;
    setError('');

    let membresData: any[] = [];
    if (typeGroupe === 'MOI_SEUL') {
      membresData = [{ nomManuel: user.nom, prenomManuel: user.prenom, sexe: (user as any).sexe || 'HOMME', age: (user as any).age || 25, categorieTarifaire: 'NORMAL', lienOrganisateur: 'MOI', enfantSurGenoux: false, accepteSexeOppose: userPrefs.accepteSexeOppose, preferencePosition: userPrefs.preferencePosition || 'INDIFFERENT' }];
    } else if (typeGroupe === 'MOI_PLUS_ACCOMPAGNANTS') {
      if (membres.length === 0) { setError('Ajoutez au moins un accompagnant'); return; }
      membresData = [{ nomManuel: user.nom, prenomManuel: user.prenom, sexe: (user as any).sexe || 'HOMME', age: (user as any).age || 25, categorieTarifaire: 'NORMAL', lienOrganisateur: 'MOI', enfantSurGenoux: false, accepteSexeOppose: userPrefs.accepteSexeOppose, preferencePosition: userPrefs.preferencePosition || 'INDIFFERENT' }, ...membres];
    } else {
      if (membres.length === 0) { setError('Ajoutez au moins un passager'); return; }
      membresData = membres;
    }

    const invalid = membresData.some(m => !m.nomManuel || !m.prenomManuel);
    if (invalid) { setError('Veuillez remplir le nom et prénom de tous les passagers'); return; }

    setSubmitting(true);
    try {
      const reservation = await reservationApi.creer({ trajetId: trajet.id, typeGroupe, accepteSeparer, membres: membresData });
      let surplusBagagesFinal = 0;
      if (showBagages && bagages.length > 0) {
        const bagagesResponse = await reservationApi.ajouterBagages(reservation.id, bagages);
        surplusBagagesFinal = bagagesResponse.reduce((sum, b) => sum + (b.surplusPrix || 0), 0);
      }
      
      const finalPrice = parseInt(getPrixTotalAvecEnfants().toString()) + surplusBagagesFinal;

      sessionStorage.setItem('reservation_temp', JSON.stringify({
        reservationId: reservation.id, trajetId: trajet.id, typeGroupe, membres: membresData, nbPassagers: membresData.length,
        prixTotal: finalPrice, villeDepart: trajet.villeDepart, villeArrivee: trajet.villeArrivee,
        dateDepart: trajet.dateDepart, compagnieNom: trajet.compagnieNom, busMatricule: trajet.busMatricule,
        quaiNumero: trajet.quaiNumero, selectedSieges: [], promoApplied: promoValid
      }));

      router.push(`/fr/plan-bus?trajetId=${trajet.id}&reservationId=${reservation.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  const formatHeure = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const formatDuree = (d: string, a: string) => {
    const diff = new Date(a).getTime() - new Date(d).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m}min`;
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" /><p className="text-orange-500 font-black uppercase tracking-widest text-xs animate-pulse">Initialisation...</p></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 selection:bg-orange-500/30">
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
                        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-full mb-6">
                            <Ticket className="w-4 h-4 text-orange-400" />
                            <span className="text-orange-400 text-[10px] font-black uppercase tracking-[0.2em]">Étape 1: Passagers</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic leading-none">
                            Finaliser ma <br/><span className="text-orange-500">Réservation</span>
                        </h1>
                    </motion.div>
                    
                    <div className="hidden lg:flex items-center gap-8 text-white/40">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center text-orange-500 font-black italic">1</div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">Passagers</span>
                        </div>
                        <div className="w-10 h-px bg-white/10" />
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center font-black italic">2</div>
                            <span className="text-[9px] font-black uppercase tracking-widest">Sièges</span>
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
                
                {/* Left Side: Form */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Trajet Summary Card WOW */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl" />
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-900 dark:text-white">
                                    <Bus size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none mb-1">{trajet.compagnieNom}</h3>
                                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{trajet.busMatricule} • Quai {trajet.quaiNumero}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-slate-800 dark:text-white italic tracking-tighter">{formatHeure(trajet.dateDepart)}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{trajet.villeDepart}</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-px bg-slate-100 dark:bg-slate-800" />
                                    <span className="text-[9px] font-black text-orange-500 my-1">{formatDuree(trajet.dateDepart, trajet.dateArriveePrevue)}</span>
                                    <div className="w-12 h-px bg-slate-100 dark:bg-slate-800" />
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-slate-800 dark:text-white italic tracking-tighter">{formatHeure(trajet.dateArriveePrevue)}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{trajet.villeArrivee}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Passenger Type Select */}
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-8">Type de Réservation</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: 'MOI_SEUL', label: 'Moi Seul', icon: '🙋' },
                                { id: 'MOI_PLUS_ACCOMPAGNANTS', label: 'Moi + Amis', icon: '👨‍👩‍👧' },
                                { id: 'AUTRE_PERSONNE', label: 'Un Tiers', icon: '👤' },
                            ].map(opt => (
                                <button 
                                    key={opt.id}
                                    onClick={() => { setTypeGroupe(opt.id as any); setMembres([]); }}
                                    className={cn(
                                        "flex flex-col items-center p-6 rounded-[2rem] border-2 transition-all duration-300",
                                        typeGroupe === opt.id ? "border-orange-500 bg-orange-500/5" : "border-slate-50 dark:border-slate-800 hover:border-orange-500/30"
                                    )}
                                >
                                    <span className="text-3xl mb-3">{opt.icon}</span>
                                    <span className={cn("text-[10px] font-black uppercase tracking-widest", typeGroupe === opt.id ? "text-orange-500" : "text-slate-400")}>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Member Forms */}
                    <AnimatePresence>
                        {(typeGroupe !== 'MOI_SEUL') && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-6">
                                <div className="flex justify-between items-center px-4">
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Informations Passagers</h3>
                                    <button onClick={ajouterMembre} className="bg-orange-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 flex items-center gap-2">
                                        <UserPlus size={14} /> Ajouter un Passager
                                    </button>
                                </div>
                                {membres.map((m, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Passager #{i + 1}</span>
                                            <button onClick={() => supprimerMembre(i)} className="text-rose-500 hover:text-rose-600 transition-colors"><UserMinus size={18} /></button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input type="text" placeholder="NOM" value={m.nomManuel} onChange={e => updateMembre(i, 'nomManuel', e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none" />
                                            <input type="text" placeholder="PRÉNOM" value={m.prenomManuel} onChange={e => updateMembre(i, 'prenomManuel', e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none" />
                                            <select value={m.categorieTarifaire} onChange={e => updateMembre(i, 'categorieTarifaire', e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none">
                                                <option value="NORMAL">TARIF NORMAL</option>
                                                <option value="ETUDIANT">ÉTUDIANT (-25%)</option>
                                                <option value="ENFANT">ENFANT (-50%)</option>
                                                <option value="SENIOR">SENIOR (-20%)</option>
                                            </select>
                                            <select value={m.sexe} onChange={e => updateMembre(i, 'sexe', e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none">
                                                <option value="HOMME">HOMME</option>
                                                <option value="FEMME">FEMME</option>
                                            </select>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Separation Preference (groupe only) */}
                    {typeGroupe !== 'MOI_SEUL' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Séparation dans le bus</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                              {accepteSeparer
                                ? 'Le groupe peut être séparé si aucune rangée complète n\'est libre'
                                : 'Le groupe doit rester ensemble dans la même rangée'}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={accepteSeparer}
                              onChange={(e) => setAccepteSeparer(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-300 dark:bg-zinc-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
                          </label>
                        </div>
                      </motion.div>
                    )}

                    {/* Baggage Section WOW */}
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden relative">
                         <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white"><Briefcase size={24} /></div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Bagages en Soute</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Optionnel • Jusqu'à 15kg gratuit</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowBagages(!showBagages); if(!showBagages && bagages.length===0) ajouterBagage(); }} className={cn("px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all", showBagages ? "bg-orange-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
                                {showBagages ? "DÉCLARÉ" : "AJOUTER"}
                            </button>
                         </div>

                         <AnimatePresence>
                            {showBagages && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 pt-4">
                                    {bagages.map((b, i) => (
                                        <div key={i} className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem]">
                                            <div className="flex-1">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Poids (KG)</label>
                                                <input type="number" value={b.poidsKg} onChange={e => updateBagage(i, 'poidsKg', parseFloat(e.target.value))} className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-6 py-3 text-sm font-bold outline-none" />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Format</label>
                                                <select value={b.dimensionCm} onChange={e => updateBagage(i, 'dimensionCm', e.target.value)} className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-6 py-3 text-sm font-bold outline-none">
                                                    <option value="60x40x30">STANDARD (MOYEN)</option>
                                                    <option value="80x60x50">VOLUMINEUX (+75 DH)</option>
                                                </select>
                                            </div>
                                            <button onClick={() => supprimerBagage(i)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><X size={20} /></button>
                                        </div>
                                    ))}
                                    <button onClick={ajouterBagage} className="w-full border-2 border-dashed border-slate-100 dark:border-slate-800 py-4 rounded-[2rem] text-[9px] font-black uppercase tracking-widest text-slate-400 hover:border-orange-500/30 transition-all">+ Ajouter un autre bagage</button>
                                </motion.div>
                            )}
                         </AnimatePresence>
                    </div>
                </div>

                {/* Right Side: Price Recap & Promo */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* Promo Code Card WOW */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-6">Code Promo</h3>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="CTM2024..." 
                                value={promoCode}
                                onChange={(e) => { setPromoCode(e.target.value); setPromoValid(null); }}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-black outline-none uppercase"
                            />
                            <button 
                                onClick={handlePromoCheck}
                                className="absolute right-2 top-2 bottom-2 bg-slate-900 dark:bg-slate-700 text-white px-4 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all"
                            >
                                Vérifier
                            </button>
                        </div>
                        <AnimatePresence>
                            {promoMsg && (
                                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className={cn("mt-3 text-[10px] font-bold px-4 py-2 rounded-xl flex items-center gap-2", promoValid ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                                    {promoValid ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                    {promoMsg}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Price Summary WOW */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900 dark:bg-orange-500 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                         <div className="relative z-10">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-8">Récapitulatif</h3>
                            
                            <div className="space-y-4 mb-10">
                                <div className="flex justify-between items-center text-white/60">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Base ({getNbPassagers()} Passagers)</span>
                                    <span className="text-sm font-bold">{(trajet.prixBase * getNbPassagers()).toFixed(0)} DH</span>
                                </div>
                                {getSurplusTotalBagages() > 0 && (
                                    <div className="flex justify-between items-center text-white/60">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Surplus Bagages</span>
                                        <span className="text-sm font-bold">+{getSurplusTotalBagages()} DH</span>
                                    </div>
                                )}
                                {promoValid && (
                                    <div className="flex justify-between items-center text-emerald-400">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Réduction Promo</span>
                                        <span className="text-sm font-bold">-10%</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-white/10 pt-6 mb-10">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-2">Total à payer</p>
                                <p className="text-5xl font-black text-white italic tracking-tighter">
                                    {parseInt(getPrixTotalAvecEnfants().toString()) + getSurplusTotalBagages()} <span className="text-xl">DH</span>
                                </p>
                            </div>

                            <button 
                                onClick={handleContinue}
                                disabled={submitting}
                                className="w-full bg-white text-slate-900 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-black/20"
                            >
                                {submitting ? "Traitement..." : "Continuer vers les sièges"}
                            </button>
                         </div>
                    </motion.div>

                    {error && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-[2rem] text-rose-500 text-xs font-bold flex items-center gap-3">
                            <AlertCircle size={20} /> {error}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}