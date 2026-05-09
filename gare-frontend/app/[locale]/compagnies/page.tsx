'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { compagnieApi } from '@/lib/api/voyageur/compagnie';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CompagnieCard } from '@/components/ui/compagnie-card';
import { Search, Star, SlidersHorizontal, X, Building2, Sparkles, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompagnieAvecNote {
  id: number;
  nom: string;
  code: string;
  email?: string;
  telephone?: string;
  description?: string;
  noteMoyenne?: number;
  nbAvis?: number;
  actif: boolean;
  nombreBus: number;
  nombreQuais: number;
}

export default function CompagniesPage() {
  const router = useRouter();
  const [compagnies, setCompagnies] = useState<CompagnieAvecNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'nom' | 'note' | 'bus'>('nom');

  useEffect(() => {
    loadCompagnies();
  }, []);

  const loadCompagnies = async () => {
    try {
      const data = await compagnieApi.getAll() as unknown as CompagnieAvecNote[];
      setCompagnies(data.filter(c => c.actif));
    } catch (error) {
      console.error('Erreur chargement compagnies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = compagnies
    .filter(c =>
      c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'note') return (b.noteMoyenne || 0) - (a.noteMoyenne || 0);
      if (sortBy === 'bus') return (b.nombreBus || 0) - (a.nombreBus || 0);
      return a.nom.localeCompare(b.nom);
    });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950">
      <Header />
      
      <main>
        {/* ── Hero Section WOW ── */}
        <section className="relative pt-20 pb-32 overflow-hidden bg-slate-900">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.15),transparent_70%)]" />
                {/* Floating Elements */}
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-32 h-32 bg-orange-500/5 rounded-full blur-3xl"
                        animate={{
                            x: [0, 50, -30, 0],
                            y: [0, -50, 20, 0],
                            scale: [1, 1.1, 0.9, 1],
                        }}
                        transition={{
                            duration: 15 + i * 3,
                            repeat: Infinity,
                            ease: "easeInOut"
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
                        <Building2 className="w-4 h-4 text-orange-400 animate-pulse" />
                        <span className="text-orange-400 text-xs font-black uppercase tracking-[0.2em]">Partenaires Officiels</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 uppercase tracking-tighter italic">
                        Nos <span className="text-orange-500">Compagnies</span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed mb-10">
                        Découvrez les flottes les plus modernes et réservez votre voyage en toute confiance.
                    </p>

                    {/* Search Bar Premium */}
                    <div className="max-w-2xl mx-auto relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                            <div className="pl-6 pr-4 py-4 text-orange-500">
                                <Search size={22} />
                            </div>
                            <input
                                type="text"
                                placeholder="Rechercher une compagnie par nom ou code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full py-4 text-sm font-bold bg-transparent text-slate-800 dark:text-white outline-none placeholder:text-slate-400 placeholder:font-medium"
                            />
                            <div className="pr-4">
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
            
            {/* Curved bottom decoration */}
            <div className="absolute bottom-0 left-0 w-full h-24 bg-[#f8fafc] dark:bg-slate-950" style={{ clipPath: 'ellipse(70% 100% at 50% 100%)' }} />
        </section>

        {/* ── Content ── */}
        <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-20 pb-32">
          
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
            <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm font-bold uppercase tracking-widest text-slate-400"
            >
              <span className="text-orange-500">{filtered.length}</span> compagnie{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}
            </motion.p>
            
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 gap-3"
            >
              <div className="flex items-center gap-2 pl-4 text-slate-400">
                <SlidersHorizontal size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Trier par</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-700 dark:text-white outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors appearance-none pr-8 relative"
              >
                <option value="nom">Ordre alphabétique</option>
                <option value="note">Meilleure note</option>
                <option value="bus">Taille de la flotte</option>
              </select>
            </motion.div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-[2.5rem] h-80 animate-pulse border border-slate-100 dark:border-slate-800" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24 bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800"
            >
              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Building2 size={40} className="text-slate-200" />
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Désert total...</p>
              <p className="text-slate-400 font-light mt-2">Aucune compagnie ne correspond à votre recherche.</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-8 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-orange-500/20"
                >
                  Effacer la recherche
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
            >
              {filtered.map((comp, index) => (
                <motion.div
                  key={comp.id}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  onClick={() => router.push(`/fr/compagnies/${comp.id}`)}
                  className="cursor-pointer"
                >
                  <CompagnieCard
                    compagnieId={comp.id}
                    nom={comp.nom}
                    code={comp.code}
                    email={comp.email}
                    telephone={comp.telephone}
                    description={comp.description}
                    actif={comp.actif}
                    nbBus={comp.nombreBus}
                    index={index}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
