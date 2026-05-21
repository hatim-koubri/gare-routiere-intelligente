// app/[locale]/confirmation/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Home, ChevronLeft, ChevronRight, Briefcase, Sparkles, CheckCircle2, FileWarning, Clock, Ticket, Ban, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedTicket } from "@/components/ui/ticket-confirmation-card";
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ConfirmationPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const reservationId = searchParams.get('reservationId');

  const [paiementData, setPaiementData] = useState<any>(null);
  const [confirmationData, setConfirmationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);

  useEffect(() => {
    const storedPaiement = sessionStorage.getItem('paiement_response');
    const storedReservationInfo = sessionStorage.getItem('trajet_info');
    
    if (storedPaiement) setPaiementData(JSON.parse(storedPaiement));
    if (storedReservationInfo) setConfirmationData(JSON.parse(storedReservationInfo));
    
    setLoading(false);
  }, []);

  const tousLesPassagers = confirmationData?.tickets || confirmationData?.membres || [];
  const currentPassager = tousLesPassagers[currentTicketIndex];
  const trajetInfo = confirmationData || {};
  
  if (loading) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full" /><p className="text-emerald-500 font-black uppercase tracking-widest text-xs animate-pulse">Finalisation...</p></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 selection:bg-emerald-500/30 overflow-x-hidden">
      <Header />
      
      <main>
        {/* ── WOW Hero Header ── */}
        <section className="relative pt-20 pb-32 overflow-hidden bg-slate-900">
            <div className="absolute inset-0 z-0 opacity-40">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.15),transparent_70%)]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full mb-6">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">Transaction réussie !</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic leading-none">
                            Félicitations, <br/><span className="text-emerald-500">C'est confirmé !</span>
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
                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black italic">✓</div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Confirmé</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full h-24 bg-[#f8fafc] dark:bg-slate-950" style={{ clipPath: 'ellipse(70% 100% at 50% 100%)' }} />
        </section>

        <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20 flex flex-col items-center pb-32">
            
            {/* Multi-Ticket Navigation */}
            {tousLesPassagers.length > 1 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-8 mb-12 bg-white dark:bg-slate-950 p-4 rounded-full shadow-xl border border-slate-100 dark:border-slate-800">
                    <button 
                        onClick={() => setCurrentTicketIndex(p => (p - 1 + tousLesPassagers.length) % tousLesPassagers.length)} 
                        className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all"
                    >
                        <ChevronLeft />
                    </button>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Passager {currentTicketIndex + 1} / {tousLesPassagers.length}</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                            {currentPassager?.nomManuel || user?.nom} {currentPassager?.prenomManuel || user?.prenom}
                        </p>
                    </div>
                    <button 
                        onClick={() => setCurrentTicketIndex(p => (p + 1) % tousLesPassagers.length)} 
                        className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all"
                    >
                        <ChevronRight />
                    </button>
                </motion.div>
            )}

            {/* THE TICKET COMPONENT */}
            <AnimatePresence mode='wait'>
                <motion.div 
                    key={currentTicketIndex}
                    initial={{ scale: 0.9, opacity: 0, rotateY: 90 }}
                    animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                    exit={{ scale: 0.9, opacity: 0, rotateY: -90 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="perspective-1000"
                >
                    <AnimatedTicket 
                        ticketId={currentPassager?.qrCode || `TK-${reservationId}-${currentTicketIndex}`}
                        amount={paiementData?.montant || trajetInfo.prixTotal || 0}
                        date={new Date(trajetInfo.dateDepart)}
                        cardHolder={`${user?.prenom || ''} ${user?.nom || ''}`}
                        last4Digits={paiementData?.last4Digits || "4242"}
                        barcodeValue={currentPassager?.qrCode || `28937261273650-${reservationId}`}
                        villeDepart={trajetInfo.villeDepart}
                        villeArrivee={trajetInfo.villeArrivee}
                        numeroSiege={currentPassager?.numeroSiege || 'A1'}
                        compagnieNom={trajetInfo.compagnieNom}
                        quai={trajetInfo.quaiNumero || '01'}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Recaps & Actions */}
            <div className="mt-20 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Info Card */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-slate-950 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center"><Briefcase size={20} /></div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Mes Bagages</h3>
                        </div>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed">
                            {trajetInfo.bagages?.length || 0} article(s) enregistré(s). Présentez-vous 30 minutes avant le départ au guichet pour l'étiquetage physique.
                        </p>
                    </div>
                    <button className="mt-8 text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline flex items-center gap-2">Consulter la politique bagages →</button>
                </motion.div>

                {/* Action Card */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center"><Home size={20} /></div>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Prochaines Étapes</h3>
                        </div>
                        <p className="text-sm text-white/40 font-medium leading-relaxed">
                            Vous pouvez retrouver tous vos tickets dans votre tableau de bord. Un email de confirmation vous a également été envoyé.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <button onClick={() => router.push('/fr/voyageur/dashboard')} className="bg-white text-slate-900 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.03] transition-all">Tableau de Bord</button>
                        <button onClick={() => router.push('/fr')} className="bg-white/10 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Accueil</button>
                    </div>
                </motion.div>
            </div>

            {/* ── Règles Importantes ── */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-12 w-full max-w-4xl bg-white dark:bg-slate-950 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden"
            >
                <div className="bg-orange-500 p-6">
                    <div className="flex items-center gap-3">
                        <FileWarning size={24} className="text-white" />
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Règles Importantes à Savoir</h3>
                    </div>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
                            <Clock size={18} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-1">Présentez-vous à l'avance</h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                L'embarquement commence <strong className="text-slate-700 dark:text-slate-300">30 minutes avant le départ</strong>. 
                                Les portes ferment 10 minutes avant le départ. Aucun remboursement en cas de retard.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
                            <Ticket size={18} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-1">Ticket Obligatoire</h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                Votre ticket (numérique ou imprimé) est <strong className="text-slate-700 dark:text-slate-300">strictement obligatoire</strong> pour embarquer. 
                                Il est personnel et non transmissible.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-rose-100 dark:bg-rose-500/20 rounded-2xl flex items-center justify-center shrink-0">
                            <Ban size={18} className="text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-1">Annulation & Remboursement</h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                Annulation possible jusqu'à <strong className="text-slate-700 dark:text-slate-300">24h avant le départ</strong>. 
                                Des frais de dossier s'appliquent. Aucun remboursement moins de 12h avant le départ.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="px-8 pb-8">
                    <Link
                        href="/fr/conditions"
                        className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 hover:scale-[1.03] transition-all"
                    >
                        Voir toutes les conditions générales <ExternalLink size={12} />
                    </Link>
                </div>
            </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}