// app/[locale]/paiement/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { paiementApi } from '@/lib/api/voyageur/paiement';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CreditCard, Lock, ChevronLeft, Wallet, ShieldCheck, Clock, FileText, ExternalLink, CheckCircle, Receipt, Sparkles, MapPin, Bus, ArrowRight } from 'lucide-react';
import { SlideButton } from '@/components/ui/slide-button';
import { CreditCardForm, type CardState, type CardValidity } from '@/components/ui/credit-card-form';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PaiementPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const reservationId = searchParams.get('reservationId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [methode, setMethode] = useState<'CARTE' | 'PAYPAL'>('CARTE');
  const [prixTotal, setPrixTotal] = useState<number | null>(null);
  const [nbPassagers, setNbPassagers] = useState<number>(1);
  const [countdown, setCountdown] = useState(600);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [acceptConditions, setAcceptConditions] = useState(false);
  const [showCgvModal, setShowCgvModal] = useState(false);
  const [cardValid, setCardValid] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [trajetInfo, setTrajetInfo] = useState<any>(null);
  const [reservationInfo, setReservationInfo] = useState<any>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCardChange = useCallback((state: CardState, validity: CardValidity) => {
    setCardValid(validity.allValid);
  }, []);

  // Timer Persistance Logic
  useEffect(() => {
    if (!reservationId) return;

    const storageKey = `payment_expiry_${reservationId}`;
    let expiryTimestamp = localStorage.getItem(storageKey);

    if (!expiryTimestamp) {
        expiryTimestamp = (Date.now() + 10 * 60 * 1000).toString();
        localStorage.setItem(storageKey, expiryTimestamp);
    }

    const updateTimer = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((parseInt(expiryTimestamp!) - now) / 1000));
        setCountdown(diff);

        if (diff <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            localStorage.removeItem(storageKey);
            router.push(`/fr/recherche`);
        }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [reservationId, router]);

  useEffect(() => {
    const storedPrix = sessionStorage.getItem('prix_total');
    const storedNbPassagers = sessionStorage.getItem('nb_passagers');
    const storedReservation = sessionStorage.getItem('trajet_info'); // From previous step
    
    if (storedPrix) setPrixTotal(parseFloat(storedPrix));
    if (storedNbPassagers) setNbPassagers(parseInt(storedNbPassagers));
    if (storedReservation) {
      const parsed = JSON.parse(storedReservation);
      setReservationInfo(parsed);
      setTrajetInfo(parsed);
    }
    
    if (!reservationId) {
      router.push(`/fr/recherche`);
      return;
    }
    
    if (!storedPrix) fetchPrixDepuisAPI(parseInt(reservationId));
    if (!storedReservation) fetchTrajetInfo(parseInt(reservationId));
    
    setDataLoaded(true);
  }, [reservationId, router]);

  const fetchPrixDepuisAPI = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/voyageur/reservations/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const data = await response.json();
      if (data.prixTotal) {
        setPrixTotal(data.prixTotal);
        sessionStorage.setItem('prix_total', data.prixTotal.toString());
      }
    } catch (error) { console.error(error); }
  };

  const fetchTrajetInfo = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/voyageur/reservations/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const data = await response.json();
      if (data) {
        setReservationInfo(data);
        setTrajetInfo(data.trajet);
        sessionStorage.setItem('trajet_info', JSON.stringify(data));
      }
    } catch (error) { console.error(error); }
  };

  const formatCountdown = () => {
    const min = Math.floor(countdown / 60).toString().padStart(2, '0');
    const sec = (countdown % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const handleOpenReview = () => {
    if (!acceptConditions) { setError('Veuillez accepter les conditions générales'); return; }
    if (!cardValid && methode === 'CARTE') { setError('Informations de carte incomplètes'); return; }
    setError('');
    setShowReviewModal(true);
  };

  const handleConfirmPaiement = async () => {
    setShowReviewModal(false);
    setLoading(true);
    setError('');
    
    try {
      const response = await paiementApi.simuler({
        reservationId: parseInt(reservationId!),
        methodePaiement: methode,
      });
      
      if (response.confirme || response.statutReservation === 'CONFIRMEE') {
        localStorage.removeItem(`payment_expiry_${reservationId}`);
        router.push(`/fr/confirmation?reservationId=${reservationId}`);
      } else {
        setError('Le paiement a échoué.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  if (!dataLoaded || prixTotal === null) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" /><p className="text-orange-500 font-black uppercase tracking-widest text-xs animate-pulse">Sécurisation du tunnel...</p></div>;

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
                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full mb-6">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">Étape finale: Paiement Sécurisé</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic leading-none">
                            Confirmez votre <br/><span className="text-orange-500">Voyage</span>
                        </h1>
                    </motion.div>
                    
                    <div className="hidden lg:flex items-center gap-8 text-white/40 pb-4">
                        <div className="flex flex-col items-center gap-2 opacity-50">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black italic">✓</div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Passagers</span>
                        </div>
                        <div className="w-10 h-px bg-white/10" />
                        <div className="flex flex-col items-center gap-2 opacity-50">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black italic">✓</div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Sièges</span>
                        </div>
                        <div className="w-10 h-px bg-white/10" />
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center text-orange-500 font-black italic">3</div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">Paiement</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full h-24 bg-[#f8fafc] dark:bg-slate-950" style={{ clipPath: 'ellipse(70% 100% at 50% 100%)' }} />
        </section>

        <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20 pb-32">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* Left Side: Payment Methods */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Timer Banner WOW */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-500",
                            countdown < 120 ? "bg-rose-500 text-white border-rose-400 animate-pulse" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <Clock className={cn("w-6 h-6", countdown < 120 ? "text-white" : "text-orange-500")} />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Sécurisation des places</p>
                                <p className="text-sm font-bold">Vos sièges sont réservés pendant encore</p>
                            </div>
                        </div>
                        <div className="text-3xl font-black italic tracking-tighter tabular-nums">
                            {formatCountdown()}
                        </div>
                    </motion.div>

                    {/* Method Selector */}
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-8">Méthode de Paiement</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { id: 'CARTE', label: 'Carte Bancaire', desc: 'Visa, Mastercard, CMI', icon: <CreditCard size={28} /> },
                                { id: 'PAYPAL', label: 'PayPal', desc: 'Paiement électronique', icon: <Wallet size={28} /> },
                            ].map(opt => (
                                <button 
                                    key={opt.id}
                                    onClick={() => setMethode(opt.id as any)}
                                    className={cn(
                                        "flex flex-col items-center p-8 rounded-[2.5rem] border-2 transition-all duration-300 group",
                                        methode === opt.id ? "border-orange-500 bg-orange-500/5 shadow-2xl shadow-orange-500/10" : "border-slate-50 dark:border-slate-800 hover:border-orange-500/20"
                                    )}
                                >
                                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all", methode === opt.id ? "bg-orange-500 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-orange-500")}>
                                        {opt.icon}
                                    </div>
                                    <span className={cn("text-lg font-black uppercase tracking-tighter italic", methode === opt.id ? "text-slate-900 dark:text-white" : "text-slate-400")}>{opt.label}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Conditional Payment Form */}
                    <AnimatePresence mode='wait'>
                        {methode === 'CARTE' ? (
                            <motion.div key="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-1 w-8 bg-orange-500 rounded-full" />
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Détails de la Carte</h2>
                                </div>
                                <CreditCardForm
                                    defaultHolder={`${user?.prenom || ''} ${user?.nom || ''}`}
                                    maskMiddle={true}
                                    ring1="#f97316" ring2="#ea580c"
                                    onChange={handleCardChange}
                                />
                            </motion.div>
                        ) : (
                            <motion.div key="paypal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white dark:bg-slate-900 rounded-[3rem] p-16 text-center border border-slate-100 dark:border-slate-800 shadow-xl">
                                <div className="w-24 h-24 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                                    <Wallet size={48} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-4">Redirection PayPal</h3>
                                <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">Vous allez être redirigé vers l'interface sécurisée de PayPal pour finaliser votre transaction.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Terms & Security WOW */}
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl">
                        <div className="flex items-center gap-4 mb-8">
                             <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center"><Lock size={24} /></div>
                             <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Sécurité des Données</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Certifié PCI DSS • Chiffrement 256-bit</p>
                             </div>
                        </div>

                        <label className="flex items-start gap-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={acceptConditions}
                                onChange={e => setAcceptConditions(e.target.checked)}
                                className="mt-1 w-5 h-5 rounded-lg accent-orange-500"
                            />
                            <div>
                                <p className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter italic">J'accepte les Conditions Générales de Vente</p>
                                <button onClick={() => setShowCgvModal(true)} className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline flex items-center gap-1 mt-1">Consulter le contrat <ExternalLink size={10} /></button>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Right Side: Order Recap */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* Compact Recap WOW */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl" />
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-8 flex items-center gap-3">
                            <Receipt size={20} className="text-orange-500" /> Facturation
                        </h3>
                        
                        <div className="space-y-4 mb-8 border-b border-slate-50 dark:border-slate-800 pb-8">
                             <div className="flex justify-between items-center text-slate-400">
                                <span className="text-[10px] font-black uppercase tracking-widest">Réservation ID</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">#{reservationId}</span>
                             </div>
                             <div className="flex justify-between items-center text-slate-400">
                                <span className="text-[10px] font-black uppercase tracking-widest">Passagers</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{nbPassagers}</span>
                             </div>
                             {trajetInfo && (
                                <div className="pt-4 mt-4 border-t border-slate-50 dark:border-slate-800 space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                                        <MapPin size={14} className="text-orange-500" /> {trajetInfo.villeDepart} → {trajetInfo.villeArrivee}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                                        <Clock size={14} className="text-orange-500" /> {new Date(trajetInfo.dateDepart).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                             )}
                        </div>

                        <div className="mb-10">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Montant Total</p>
                             <p className="text-5xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                                {prixTotal} <span className="text-xl text-orange-500">DH</span>
                             </p>
                        </div>

                        <SlideButton 
                            onSuccess={handleOpenReview}
                            disabled={!acceptConditions || (methode === 'CARTE' && !cardValid)}
                            buttonText="Glissez pour vérifier"
                        />

                        {error && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-500 text-[10px] font-bold flex items-center gap-3">
                                <AlertCircle size={16} /> {error}
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Trust Seals */}
                    <div className="grid grid-cols-3 gap-4 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800"><ShieldCheck size={20} /></div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800"><Lock size={20} /></div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800"><CheckCircle size={20} /></div>
                    </div>
                </div>
            </div>
        </div>
      </main>

      {/* Review Modal WOW (Digital Receipt Style) */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }}
                className="bg-white dark:bg-slate-900 rounded-[3rem] max-w-2xl w-full overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white dark:border-slate-800"
            >
                <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-2">Vérification Finale</p>
                            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Récapitulatif de Commande</h2>
                        </div>
                        <Receipt size={48} className="opacity-20" />
                    </div>
                </div>

                <div className="p-10 space-y-8">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Trajet</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white uppercase italic tracking-tighter">{trajetInfo?.villeDepart} → {trajetInfo?.villeArrivee}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Compagnie</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white uppercase italic tracking-tighter">{trajetInfo?.compagnieNom}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Date & Heure</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white italic tracking-tighter">{trajetInfo && new Date(trajetInfo.dateDepart).toLocaleString('fr-FR')}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Passagers</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white italic tracking-tighter">{nbPassagers} Voyageur(s)</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center px-4">
                        <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Total Débité</p>
                        <p className="text-4xl font-black text-orange-500 italic tracking-tighter">{prixTotal} DH</p>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button onClick={() => setShowReviewModal(false)} className="flex-1 py-5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Retour</button>
                        <button onClick={handleConfirmPaiement} disabled={loading} className="flex-1 py-5 rounded-2xl bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-[1.03] transition-all flex items-center justify-center gap-2">
                             {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Confirmer le Paiement <ArrowRight size={14} /></>}
                        </button>
                    </div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

function AlertCircle({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}