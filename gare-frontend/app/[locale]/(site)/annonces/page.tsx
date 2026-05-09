'use client';

import { useState, useEffect } from 'react';
import { publicAnnonceApi, CompagnieSimple } from '@/lib/api/public/annonces';
import { Annonce } from '@/types';
import { Megaphone, Calendar, Building, Filter, X, ChevronDown, Eye, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function AnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [compagnies, setCompagnies] = useState<CompagnieSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [compagnieId, setCompagnieId] = useState<number | ''>('');
  const [dateMin, setDateMin] = useState('');
  const [dateMax, setDateMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Annonce | null>(null);

  useEffect(() => { loadData(); }, []);

  useEffect(() => { loadAnnonces(); }, [compagnieId, dateMin, dateMax]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [annoncesData, compagniesData] = await Promise.all([
        publicAnnonceApi.getAll(),
        publicAnnonceApi.getCompagnies(),
      ]);
      setAnnonces(annoncesData);
      setCompagnies(compagniesData);
    } catch { }
    finally { setLoading(false); }
  };

  const loadAnnonces = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (compagnieId !== '') params.compagnieId = compagnieId;
      if (dateMin) params.dateMin = new Date(dateMin).toISOString();
      if (dateMax) params.dateMax = new Date(dateMax).toISOString();
      setAnnonces(await publicAnnonceApi.getAll(params));
    } catch { }
    finally { setLoading(false); }
  };

  const clearFilters = () => { setCompagnieId(''); setDateMin(''); setDateMax(''); };
  const hasFilters = compagnieId !== '' || dateMin || dateMax;

  const formatDate = (d: string | undefined) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 selection:bg-orange-500/30">
      {/* ── Hero Section WOW ── */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.15),transparent_70%)]" />
          {/* Floating Particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-24 h-24 bg-orange-500/10 rounded-full blur-3xl"
              animate={{
                x: [0, 100, -50, 0],
                y: [0, -80, 40, 0],
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 backdrop-blur-md px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
              <span className="text-orange-400 text-xs font-black uppercase tracking-[0.2em]">Actualités & Promos</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 uppercase tracking-tighter italic">
              Les <span className="text-orange-500">Annonces</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                Toutes les actualités de vos compagnies préférées réunies en un seul endroit.
            </p>
          </motion.div>
        </div>
        
        {/* Curved bottom decoration */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-[#f8fafc] dark:bg-slate-950" style={{ clipPath: 'ellipse(70% 100% at 50% 100%)' }} />
      </section>

      <main className="max-w-7xl mx-auto px-6 -mt-12 relative z-20 pb-32">
        
        {/* ── Filters WOW ── */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-2 mb-12"
        >
          <div className="flex flex-col md:flex-row items-center gap-2">
            <div className="w-full md:w-auto px-6 py-4 flex items-center gap-3 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
               <Filter className="w-5 h-5 text-orange-500" />
               <span className="font-black text-sm uppercase tracking-widest text-slate-700 dark:text-slate-200">Filtres</span>
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full p-4">
               <select
                    value={compagnieId}
                    onChange={(e) => setCompagnieId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/10 transition-all appearance-none"
                >
                    <option value="">Toutes les compagnies</option>
                    {compagnies.map((c) => (<option key={c.id} value={c.id}>{c.nom}</option>))}
                </select>
                
                <input type="date" value={dateMin} onChange={(e) => setDateMin(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/10 transition-all" />
                
                <input type="date" value={dateMax} onChange={(e) => setDateMax(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/10 transition-all" />
            </div>

            {hasFilters && (
                <div className="p-4">
                    <button onClick={clearFilters}
                      className="w-full md:w-auto flex items-center justify-center gap-2 text-xs font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-6 py-3 rounded-2xl transition-all uppercase tracking-widest">
                      <X size={14} /> Réinitialiser
                    </button>
                </div>
            )}
          </div>
        </motion.div>

        {/* ── Annonces Grid WOW ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 bg-white dark:bg-slate-900 rounded-[2rem] animate-pulse border border-slate-100 dark:border-slate-800" />
            ))}
          </div>
        ) : annonces.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-20 text-center"
          >
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Megaphone size={40} className="text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tighter">Silence radio...</h3>
            <p className="text-slate-500 max-w-md mx-auto font-light">Aucune annonce ne correspond à votre recherche. Essayez de modifier vos filtres.</p>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {annonces.map((a, i) => (
              <motion.div 
                key={a.id}
                variants={cardVariants}
                whileHover={{ y: -10 }}
                className="group relative"
              >
                {/* Background Glow */}
                <div className="absolute inset-0 bg-orange-500/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none h-full flex flex-col transition-all duration-300 group-hover:border-orange-500/30">
                    {/* Top Accent */}
                    <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-400 group-hover:from-orange-600 group-hover:to-orange-500 transition-all" />
                    
                    <div className="p-8 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                                <Megaphone size={24} className="text-orange-500 group-hover:text-white" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full">Annonce</span>
                        </div>

                        <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight mb-4 uppercase tracking-tighter line-clamp-2">
                            {a.titreFr}
                        </h2>

                        <div className="space-y-3 mb-8 flex-1">
                            {a.compagnieNom && (
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-500 group-hover:text-orange-500 transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                                    <span>{a.compagnieNom}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                                <Calendar size={14} />
                                <span>{formatDate(a.dateDebut)}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelected(a)}
                            className="group/btn relative w-full bg-slate-900 dark:bg-slate-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] overflow-hidden transition-all hover:bg-orange-500"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                Voir Détails <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* ── Modal WOW ── */}
      <AnimatePresence>
        {selected && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-6"
                onClick={() => setSelected(null)}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 50 }}
                    className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-2xl shadow-3xl overflow-hidden relative border border-white/10"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal Header WOW */}
                    <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
                        
                        <button
                            onClick={() => setSelected(null)}
                            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-orange-500 rounded-full transition-all text-white/50 hover:text-white z-10"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                                    <Megaphone size={28} className="text-white" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400">Information Officielle</span>
                                    <p className="text-white/60 text-sm font-medium">{selected.compagnieNom || 'Administration'}</p>
                                </div>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic leading-tight">{selected.titreFr}</h2>
                        </div>
                    </div>

                    {/* Modal Content */}
                    <div className="p-10">
                        <div className="mb-10">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                Détails de l'annonce
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed whitespace-pre-line font-medium">
                                {selected.contenuFr}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Période de validité</p>
                                <div className="flex items-center gap-3 text-slate-700 dark:text-white font-bold">
                                    <Calendar size={18} className="text-orange-500" />
                                    <span>{formatDate(selected.dateDebut)}</span>
                                    <ArrowRight size={14} className="text-slate-300" />
                                    <span>{formatDate(selected.dateFin) || 'Indéfini'}</span>
                                </div>
                            </div>
                            
                            <div className="bg-orange-500 rounded-3xl p-6 flex flex-col justify-center">
                                <p className="text-[10px] font-black uppercase tracking-wider text-white/70 mb-2">Référence</p>
                                <p className="text-xl font-black text-white italic tracking-tighter">ANN-2024-#{selected.id}</p>
                            </div>
                        </div>
                    </div>

                    <div className="px-10 pb-10">
                        <button
                            onClick={() => setSelected(null)}
                            className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                        >
                            Fermer
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
