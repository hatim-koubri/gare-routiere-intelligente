'use client';

import { useState, useEffect } from 'react';
import { abonnementsApi, LigneDisponible } from '@/lib/api/voyageur/abonnements';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Building2, Sparkles, Bus, Search, Filter, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PublicAbonnementsPage() {
  const [lignes, setLignes] = useState<LigneDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [compagnieFilter, setCompagnieFilter] = useState('');
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    loadLignes();
  }, []);

  const loadLignes = async () => {
    try {
      const data = await abonnementsApi.getDisponibles();
      setLignes(data);
    } catch (error) {
      console.error('Erreur chargement abonnements:', error);
    } finally {
      setLoading(false);
    }
  };

  const compagnies = [...new Set(lignes.map(l => l.compagnieNom))].sort();

  const filtrees = lignes.filter(l => {
    if (compagnieFilter && l.compagnieNom !== compagnieFilter) return false;
    if (recherche) {
      const q = recherche.toLowerCase();
      return l.villeDepart.toLowerCase().includes(q) || l.villeArrivee.toLowerCase().includes(q);
    }
    return true;
  });

  const grouperParCompagnie = () => {
    const grouped: Record<string, LigneDisponible[]> = {};
    for (const l of filtrees) {
      if (!grouped[l.compagnieNom]) grouped[l.compagnieNom] = [];
      grouped[l.compagnieNom].push(l);
    }
    return grouped;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950">
      <Header />
      
      <main>
        {/* ── Hero Section WOW ── */}
        <section className="relative pt-20 pb-32 overflow-hidden bg-slate-900">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.15),transparent_70%)]" />
                {/* Floating Elements (Violet for Abonnements) */}
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-32 h-32 bg-violet-500/5 rounded-full blur-3xl"
                        animate={{ x: [0, 50, -30, 0], y: [0, -50, 20, 0] }}
                        transition={{ duration: 15 + i * 3, repeat: Infinity, ease: "easeInOut" }}
                        style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                    />
                ))}
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 backdrop-blur-md px-4 py-2 rounded-full mb-6">
                        <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
                        <span className="text-violet-400 text-xs font-black uppercase tracking-[0.2em]">Voyages Illimités</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 uppercase tracking-tighter italic">
                        Les <span className="text-violet-500">Abonnements</span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed mb-10">
                        Économisez sur vos trajets fréquents avec nos forfaits mensuels exclusifs.
                    </p>
                </motion.div>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full h-24 bg-[#f8fafc] dark:bg-slate-950" style={{ clipPath: 'ellipse(70% 100% at 50% 100%)' }} />
        </section>

        {/* ── Search & Filters ── */}
        <div className="max-w-6xl mx-auto px-6 -mt-10 relative z-20 mb-20">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-2 border border-slate-100 dark:border-slate-800"
            >
                <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex-1 flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl px-6 py-4">
                        <Search className="text-slate-400 mr-4" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher une destination..."
                            value={recherche}
                            onChange={(e) => setRecherche(e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-sm font-bold text-slate-700 dark:text-white"
                        />
                    </div>
                    <div className="flex-1 flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl px-6 py-4">
                        <Building2 className="text-slate-400 mr-4" size={20} />
                        <select
                            value={compagnieFilter}
                            onChange={(e) => setCompagnieFilter(e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-sm font-bold text-slate-700 dark:text-white cursor-pointer"
                        >
                            <option value="">Toutes les compagnies</option>
                            {compagnies.map(comp => (
                                <option key={comp} value={comp}>{comp}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </motion.div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pb-32">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-white dark:bg-slate-900 rounded-[2.5rem] animate-pulse border border-slate-100 dark:border-slate-800" />
              ))}
            </div>
          ) : filtrees.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800">
              <Bus size={60} className="mx-auto text-slate-200 mb-6" />
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Aucune offre</h3>
              <p className="text-slate-400 font-light mt-2">Revenez plus tard pour découvrir de nouveaux abonnements.</p>
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-16">
              {Object.entries(grouperParCompagnie()).map(([compagnie, lignesComp], groupIdx) => (
                <div key={compagnie}>
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: groupIdx * 0.1 }}
                    className="flex items-center gap-4 mb-8"
                  >
                    <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center">
                      <Building2 size={24} className="text-violet-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">{compagnie}</h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{lignesComp.length} OFFRE(S) DISPONIBLE(S)</p>
                    </div>
                  </motion.div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {lignesComp.map(ligne => (
                      <motion.div 
                        key={ligne.id} 
                        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                        whileHover={{ y: -8 }}
                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl group"
                      >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 px-3 py-1 bg-violet-500/10 text-violet-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                                <MapPin size={12} /> Trajet Direct
                            </div>
                            <ShieldCheck className="text-emerald-500" size={20} />
                        </div>

                        <div className="mb-8">
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">{ligne.villeDepart}</p>
                            <ArrowRight size={20} className="text-slate-200 mb-1" />
                            <p className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">{ligne.villeArrivee}</p>
                        </div>

                        <div className="mb-8">
                            <p className="text-4xl font-black text-violet-500 tracking-tighter italic">
                                {ligne.prixAbonnementMensuel.toFixed(0)} <span className="text-sm font-bold uppercase text-slate-400">DH</span>
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Par mois / Illimité</p>
                        </div>

                        <Link
                          href="/fr/voyageur/abonnements"
                          className="flex items-center justify-center gap-2 w-full bg-slate-900 dark:bg-slate-800 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-500 transition-all shadow-xl shadow-slate-900/10"
                        >
                          Souscrire Maintenant <ArrowRight size={14} />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
