'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { compagnieApi } from '@/lib/api/voyageur/compagnie';
import { avisApi } from '@/lib/api/voyageur/avis';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Star, ArrowLeft, Bus, MapPin, Award, Clock, ThumbsUp, MessageSquare, Phone, Mail, Sparkles, ShieldCheck, Quote, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CompagnieDetail {
  id: number; nom: string; code: string; description?: string;
  telephone?: string; email?: string; noteMoyenne?: number; nbAvis?: number;
  actif: boolean; nombreBus: number; nombreQuais: number;
}

interface AvisItem {
  id: number; voyageurNom: string; voyageurPrenom: string;
  notePonctualite: number; noteConfort: number; noteChauffeur: number;
  commentaire: string; dateAvis: string;
  villeDepart: string; villeArrivee: string; dateDepart: string;
}

export default function CompagnieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [compagnie, setCompagnie] = useState<CompagnieDetail | null>(null);
  const [avis, setAvis] = useState<AvisItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([
        compagnieApi.getById(id).then(d => setCompagnie(d as unknown as CompagnieDetail)),
        avisApi.getByCompagnie(id).then(d => setAvis(d as unknown as AvisItem[])).catch(() => {}),
      ]).finally(() => setLoading(false));
    }
  }, [id]);

  const renderStars = (note: number, size = 18) => {
    const full = Math.floor(note);
    const half = note - full >= 0.5;
    return (
      <span className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={cn(
                "transition-all duration-300",
                i <= full ? 'text-orange-500 fill-orange-500' : i === full + 1 && half ? 'text-orange-500 fill-orange-500/50' : 'text-slate-200 dark:text-slate-700'
            )}
          />
        ))}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" />
        <p className="text-orange-500 font-black uppercase tracking-widest text-xs animate-pulse">Chargement de la compagnie...</p>
      </div>
    );
  }

  if (!compagnie) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-black uppercase tracking-tighter italic">Compagnie introuvable</div>;

  const reviewsCount = avis.length;
  const noteGlobale = reviewsCount > 0 
    ? avis.reduce((s, a) => s + (a.notePonctualite + a.noteConfort + a.noteChauffeur) / 3, 0) / reviewsCount 
    : (compagnie.noteMoyenne || 0);
  
  const displayReviewsCount = reviewsCount || compagnie.nbAvis || 0;

  const avgPonctualite = avis.length ? Math.round(avis.reduce((s, a) => s + a.notePonctualite, 0) / avis.length * 10) / 10 : 0;
  const avgConfort = avis.length ? Math.round(avis.reduce((s, a) => s + a.noteConfort, 0) / avis.length * 10) / 10 : 0;
  const avgChauffeur = avis.length ? Math.round(avis.reduce((s, a) => s + a.noteChauffeur, 0) / avis.length * 10) / 10 : 0;

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-950 selection:bg-orange-500/30 overflow-x-hidden">
      <Header />
      
      <main>
        {/* ── Hero Section (The "Nice" Part, slightly enhanced) ── */}
        <section className="relative pt-24 pb-44 overflow-hidden bg-slate-900">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.15),transparent_70%)]" />
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-40 h-40 bg-orange-500/5 rounded-full blur-[100px]"
                        animate={{ x: [0, 100, -50, 0], y: [0, -80, 40, 0], scale: [1, 1.2, 1] }}
                        transition={{ duration: 15 + i * 2, repeat: Infinity, ease: "easeInOut" }}
                        style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                    />
                ))}
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.button 
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    onClick={() => router.back()} 
                    className="group mb-12 inline-flex items-center gap-3 text-slate-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.3em] bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Retour
                </motion.button>

                <div className="flex flex-col md:flex-row items-center md:items-end gap-12">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        className="w-40 h-40 bg-gradient-to-br from-orange-500 to-orange-600 rounded-[3rem] flex items-center justify-center text-5xl font-black text-white italic shadow-[0_20px_50px_rgba(249,115,22,0.3)] relative group"
                    >
                        <div className="absolute inset-0 rounded-[3rem] bg-white/20 animate-pulse group-hover:scale-110 transition-transform" />
                        <span className="relative z-10">{compagnie.nom.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}</span>
                    </motion.div>
                    
                    <div className="text-center md:text-left pb-4">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                                <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-1.5 rounded-full">
                                    <ShieldCheck size={14} className="text-orange-400" />
                                    <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest">Partenaire de confiance</span>
                                </div>
                                <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/40 text-[10px] font-black uppercase tracking-widest">
                                    Code: {compagnie.code}
                                </div>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white mb-6 uppercase tracking-tighter italic leading-none">
                                {compagnie.nom}
                            </h1>
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-8">
                                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                                    {renderStars(noteGlobale, 24)}
                                    <span className="text-3xl font-black text-white italic tracking-tighter">{noteGlobale.toFixed(1)}</span>
                                </div>
                                <div className="flex flex-col items-center md:items-start">
                                    <span className="text-white font-black text-xl italic leading-none">{displayReviewsCount}</span>
                                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Avis certifiés</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full h-32 bg-[#f1f5f9] dark:bg-slate-950" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 0 100%)' }} />
        </section>

        {/* ── Content Body (The "Pleasant" Redesign) ── */}
        <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20 pb-40">
            
            {/* Stats Bar - Float Above */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-20">
                {[
                    { icon: <Bus />, label: 'Flotte Moderne', value: compagnie.nombreBus + ' Bus', desc: 'Véhicules climatisés' },
                    { icon: <MapPin />, label: 'Présence', value: compagnie.nombreQuais + ' Quais', desc: 'Points d\'embarquement' },
                    { icon: <Clock />, label: 'Ponctualité', value: avis.length > 0 ? (avgPonctualite * 20).toFixed(0) + '%' : '—', desc: 'Note moyenne' },
                    { icon: <Award />, label: 'Qualité', value: displayReviewsCount + ' Avis', desc: 'Note ' + noteGlobale.toFixed(1) + '/5' },
                ].map((s, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                        className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white dark:border-slate-800 group hover:bg-slate-900 dark:hover:bg-orange-500 transition-all duration-500"
                    >
                        <div className="w-12 h-12 bg-orange-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-orange-500 group-hover:bg-white/20 group-hover:text-white transition-all">
                            {s.icon}
                        </div>
                        <h4 className="text-2xl font-black text-slate-800 dark:text-white italic tracking-tighter group-hover:text-white">{s.value}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white/60 mt-1">{s.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Left: About & Feedback */}
                <div className="lg:col-span-8 space-y-12">
                    
                    {/* Magazine Style About */}
                    <motion.section 
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                        className="bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden border border-white dark:border-slate-800 shadow-2xl relative"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="p-12 md:p-16 relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-px w-12 bg-orange-500" />
                                <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em]">L'excellence du voyage</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-8 leading-tight">
                                Redéfinir votre <br/><span className="text-orange-500">Expérience Routière</span>
                            </h2>
                            <div className="columns-1 md:columns-2 gap-12 text-slate-500 dark:text-slate-400 font-medium leading-relaxed space-y-6">
                                <p className="first-letter:text-5xl first-letter:font-black first-letter:text-orange-500 first-letter:mr-3 first-letter:float-left">
                                    {compagnie.description || "Cette compagnie s'engage à fournir un service de transport de haute qualité sur l'ensemble du territoire national. Avec une attention particulière portée au confort des passagers et à la sécurité des trajets, chaque voyage devient une expérience sereine."}
                                </p>
                                <p>
                                    Avec {displayReviewsCount} avis certifiés et une note moyenne de {noteGlobale.toFixed(1)}/5, {compagnie.nom} s'engage à offrir un service de qualité. Les voyageurs attribuent en moyenne {avgConfort.toFixed(1)}/5 pour le confort, {avgPonctualite.toFixed(1)}/5 pour la ponctualité et {avgChauffeur.toFixed(1)}/5 pour le service chauffeur.
                                </p>
                            </div>
                        </div>
                    </motion.section>

                    {/* Airy & Modern Review Section */}
                    <section className="space-y-10">
                        <div className="flex items-end justify-between px-6">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">La voix des <span className="text-orange-500">Voyageurs</span></h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Basé sur {avis.length} expériences récentes</p>
                            </div>
                            <div className="hidden md:flex gap-2">
                                <div className="p-3 rounded-full border border-slate-200 dark:border-slate-800 text-slate-400"><MessageSquare size={16} /></div>
                            </div>
                        </div>

                        {avis.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {avis.map((a, i) => (
                                    <motion.div 
                                        key={a.id} 
                                        initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                        className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl flex flex-col group relative overflow-hidden"
                                    >
                                        <div className="absolute top-6 right-8 text-slate-100 dark:text-slate-800 group-hover:text-orange-500/10 transition-colors">
                                            <Quote size={60} />
                                        </div>
                                        
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black italic shadow-xl">
                                                {a.voyageurPrenom?.[0]}{a.voyageurNom?.[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">{a.voyageurPrenom} {a.voyageurNom}</h4>
                                                <div className="flex items-center gap-2">
                                                    {renderStars((a.notePonctualite + a.noteConfort + a.noteChauffeur) / 3, 12)}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed italic flex-grow mb-6">
                                            "{a.commentaire}"
                                        </p>
                                        
                                        <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
                                            <div className="flex items-center gap-2 text-[9px] font-black text-orange-500 uppercase tracking-widest">
                                                <MapPin size={10} /> {a.villeDepart} → {a.villeArrivee}
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                                {a.dateDepart ? new Date(a.dateDepart).toLocaleDateString('fr-FR') : ''}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-20 text-center border border-dashed border-slate-200 dark:border-slate-800">
                                <Sparkles className="mx-auto mb-4 text-slate-200" size={40} />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Soyez le premier à laisser un avis</p>
                            </div>
                        )}
                    </section>
                </div>

                {/* Right: Contact, Performance & Booking */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* Performance Radar - Visual Placeholder */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                        className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-white dark:border-slate-800 shadow-2xl"
                    >
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-8 flex items-center justify-between">
                            Performance <Sparkles className="text-orange-500" size={16} />
                        </h3>
                        <div className="space-y-6">
                            {[
                                { label: 'Confort', value: avgConfort },
                                { label: 'Ponctualité', value: avgPonctualite },
                                { label: 'Service Chauffeur', value: avgChauffeur },
                            ].map((p, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{p.label}</span>
                                        <span className="text-xs font-black text-slate-900 dark:text-white italic">{p.value.toFixed(1)}/5</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }} whileInView={{ width: `${(p.value / 5) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                                            className="h-full bg-orange-500" 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Sleek Contact Cards */}
                    <div className="space-y-4">
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-white dark:border-slate-800 shadow-xl flex items-center gap-5 group"
                        >
                            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                                <Mail size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Email Officiel</p>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-300 truncate">{compagnie.email || "contact@agence.ma"}</p>
                            </div>
                            <ChevronRight size={14} className="text-slate-200" />
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-white dark:border-slate-800 shadow-xl flex items-center gap-5 group"
                        >
                            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <Phone size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Support Client</p>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-300 truncate">{compagnie.telephone || "+212 5XX XX XX XX"}</p>
                            </div>
                            <ChevronRight size={14} className="text-slate-200" />
                        </motion.div>
                    </div>

                    {/* Premium Call to Action */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                        className="bg-slate-900 dark:bg-orange-500 p-10 rounded-[3rem] shadow-[0_30px_60px_rgba(249,115,22,0.2)] text-center relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-4">Embarquez avec Nous</h3>
                            <p className="text-white/60 text-xs font-medium mb-8 leading-relaxed">Réservez votre siège en moins de 2 minutes et profitez du voyage.</p>
                            <button 
                                onClick={() => router.push('/fr/recherche')}
                                className="w-full bg-white text-slate-900 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all shadow-xl"
                            >
                                Trouver un trajet
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
