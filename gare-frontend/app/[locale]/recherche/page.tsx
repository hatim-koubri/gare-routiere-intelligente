// app/recherche/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { rechercheApi } from '@/lib/api/voyageur/recherche';
import { favorisApi } from '@/lib/api/voyageur/favoris';
import { useAuth } from '@/lib/auth/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Calendar, Clock, MapPin, Filter, ArrowRight, Users, Building, Heart, Sparkles, Search, X, ChevronRight } from 'lucide-react';
import { FlightCard } from '@/components/ui/flight-card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TrajetDTO {
  id: number;
  dateDepart: string;
  dateArriveePrevue: string;
  statut: string;
  retardMinutes: number;
  nbReservations: number;
  ligneId: number;
  villeDepart: string;
  villeArrivee: string;
  prixBase: number;
  busId: number;
  busMatricule: string;
  busMarque: string;
  nbSieges: number;
  chauffeurId: number;
  chauffeurNom: string;
  chauffeurPrenom: string;
  quaiId: number;
  quaiNumero: number;
  compagnieId: number;
  compagnieNom: string;
  compagnieNoteMoyenne?: number;
}

interface Compagnie {
  id: number;
  nom: string;
}

export default function RecherchePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [allTrajets, setAllTrajets] = useState<TrajetDTO[]>([]);
  const [allCorrespondances, setAllCorrespondances] = useState<TrajetDTO[][]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<'directs' | 'correspondances'>('directs');
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [favorisLigneIds, setFavorisLigneIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user) {
      favorisApi.getAll().then(f => setFavorisLigneIds(new Set(f.map(fav => fav.ligneId)))).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const vd = searchParams.get('villeDepart');
    const va = searchParams.get('villeArrivee');
    const d = searchParams.get('date');
    if (vd && va) {
      setFormData(prev => ({ ...prev, villeDepart: vd, villeArrivee: va, date: d || prev.date }));
      setTimeout(() => {
        const event = { preventDefault: () => {} } as React.FormEvent;
        handleSearch(event);
      }, 100);
    }
  }, []);

  const [formData, setFormData] = useState({
    villeDepart: '',
    villeArrivee: '',
    date: new Date().toISOString().split('T')[0],
    prixMin: 0,
    prixMax: 1000,
    heureDepartMin: 0,
    heureDepartMax: 23,
    nbArretsMax: 10,
    noteMin: 0,
    compagnieId: null as number | null,
  });

  const extractCompagnies = (trajets: TrajetDTO[]) => {
    const uniqueCompagnies = new Map<number, Compagnie>();
    trajets.forEach(t => {
      if (!uniqueCompagnies.has(t.compagnieId)) {
        uniqueCompagnies.set(t.compagnieId, {
          id: t.compagnieId,
          nom: t.compagnieNom
        });
      }
    });
    setCompagnies(Array.from(uniqueCompagnies.values()));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(false);
    try {
      const searchData = {
        villeDepart: formData.villeDepart,
        villeArrivee: formData.villeArrivee,
        date: formData.date,
      };
      
      const [directsData, correspondancesData] = await Promise.all([
        rechercheApi.rechercherDirects(searchData).catch(() => []),
        rechercheApi.rechercherCorrespondances(searchData).catch(() => []),
      ]);
      
      setAllTrajets(directsData as TrajetDTO[]);
      setAllCorrespondances(correspondancesData as TrajetDTO[][]);
      extractCompagnies(directsData as TrajetDTO[]);
      setSearched(true);
    } catch (error) {
      console.error('Erreur recherche', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTrajets = () => {
    let filtered = [...allTrajets];
    filtered = filtered.filter(t => t.prixBase >= formData.prixMin && t.prixBase <= formData.prixMax);
    filtered = filtered.filter(t => {
      const heure = new Date(t.dateDepart).getHours();
      return heure >= formData.heureDepartMin && heure <= formData.heureDepartMax;
    });
    if (formData.compagnieId) {
      filtered = filtered.filter(t => t.compagnieId === formData.compagnieId);
    }
    if (formData.noteMin > 0) {
      filtered = filtered.filter(t => (t.compagnieNoteMoyenne ?? 0) >= formData.noteMin);
    }
    return filtered;
  };

  const filteredTrajets = getFilteredTrajets();
  const filteredCorrespondances = allCorrespondances; // Simpler for now

  const handleReserver = (trajetId: number) => {
    router.push(`/fr/reservation?trajetId=${trajetId}`);
  };

  const formatHeure = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuree = (depart: string, arrivee: string) => {
    if (!depart || !arrivee) return 'N/A';
    const diff = new Date(arrivee).getTime() - new Date(depart).getTime();
    const heures = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return heures > 0 ? `${heures}h${minutes > 0 ? minutes + 'min' : ''}` : `${minutes}min`;
  };

  const getSiegesDisponibles = (trajet: TrajetDTO) => {
    return Math.max(0, (trajet.nbSieges || 0) - (trajet.nbReservations || 0));
  };

  const handleSwap = () => {
    setFormData(prev => ({ ...prev, villeDepart: prev.villeArrivee, villeArrivee: prev.villeDepart }));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950">
      <Header />
      
      {/* ── Hero Search WOW ── */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.15),transparent_70%)]" />
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-24 h-24 bg-orange-500/10 rounded-full blur-3xl"
              animate={{ x: [0, 80, -40, 0], y: [0, -60, 30, 0] }}
              transition={{ duration: 12 + i * 2, repeat: Infinity, ease: "linear" }}
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
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
                    <span className="text-orange-400 text-xs font-black uppercase tracking-[0.2em]">Destinations au Maroc</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter italic leading-none">
                    Trouvez votre <span className="text-orange-500 text-shadow-xl">Trajet</span>
                </h1>
                
                {/* Search Form Premium (Glassmorphism) */}
                <div className="max-w-5xl mx-auto mt-10">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-[2.5rem] shadow-2xl relative"
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-orange-600 rounded-t-[2.5rem]" />
                        
                        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end relative z-10">
                            <div className="md:col-span-3 flex flex-col gap-2 text-left relative">
                                <label className="text-[10px] uppercase text-white/50 font-black tracking-widest ml-1">Départ</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500">
                                        <MapPin size={18} />
                                    </div>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Ville de départ"
                                        value={formData.villeDepart}
                                        onChange={(e) => setFormData({ ...formData, villeDepart: e.target.value })}
                                        className="w-full bg-white/10 border border-white/20 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                    {/* Swap Button Desktop */}
                                    <button 
                                        type="button"
                                        onClick={handleSwap}
                                        className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-8 h-8 bg-slate-900 border border-white/10 rounded-full items-center justify-center text-orange-500 hover:rotate-180 transition-transform"
                                    >
                                        <ChevronRight size={14} className="rotate-90 md:rotate-0" />
                                    </button>
                                </div>
                            </div>

                            <div className="md:col-span-3 flex flex-col gap-2 text-left">
                                <label className="text-[10px] uppercase text-white/50 font-black tracking-widest ml-1">Arrivée</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500">
                                        <MapPin size={18} />
                                    </div>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Ville d'arrivée"
                                        value={formData.villeArrivee}
                                        onChange={(e) => setFormData({ ...formData, villeArrivee: e.target.value })}
                                        className="w-full bg-white/10 border border-white/20 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-3 flex flex-col gap-2 text-left">
                                <label className="text-[10px] uppercase text-white/50 font-black tracking-widest ml-1">Date</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500">
                                        <Calendar size={18} />
                                    </div>
                                    <input 
                                        type="date" 
                                        required
                                        value={formData.date}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-white/10 border border-white/20 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl py-4 h-[58px] transition-all hover:scale-[1.02] shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                                >
                                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Rechercher <Search size={18} /></>}
                                </button>
                            </div>
                        </form>
                        
                        {/* Advanced Filters Trigger */}
                        <div className="mt-6 flex justify-center">
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className="text-white/60 hover:text-orange-400 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 transition-colors"
                            >
                                <Filter size={12} /> {showFilters ? 'Masquer Filtres' : 'Filtres Avancés'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-24 bg-[#f8fafc] dark:bg-slate-950" style={{ clipPath: 'ellipse(70% 100% at 50% 100%)' }} />
      </section>

      <main className="max-w-7xl mx-auto px-6 -mt-12 relative z-30 pb-32">
        
        {/* ── Advanced Filters WOW ── */}
        <AnimatePresence>
            {showFilters && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-12"
                >
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-2xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Prix Max (DH)</label>
                                <input type="number" value={formData.prixMax} onChange={(e) => setFormData({ ...formData, prixMax: parseInt(e.target.value) || 1000 })} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Heure Min</label>
                                <input type="number" min={0} max={23} value={formData.heureDepartMin} onChange={(e) => setFormData({ ...formData, heureDepartMin: parseInt(e.target.value) || 0 })} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Compagnie</label>
                                <select value={formData.compagnieId || ''} onChange={(e) => setFormData({ ...formData, compagnieId: e.target.value ? parseInt(e.target.value) : null })} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none">
                                    <option value="">Toutes</option>
                                    {compagnies.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button onClick={() => { setShowFilters(false); handleSearch({ preventDefault: () => {} } as any); }} className="w-full bg-slate-900 dark:bg-slate-800 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-colors">Appliquer</button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* ── Results WOW ── */}
        {searched && (
            <div className="space-y-12">
                {/* Tabs */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => setActiveTab('directs')}
                        className={cn(
                            "px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all",
                            activeTab === 'directs' ? "bg-orange-500 text-white shadow-xl shadow-orange-500/20" : "bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800"
                        )}
                    >
                        Directs ({filteredTrajets.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('correspondances')}
                        className={cn(
                            "px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all",
                            activeTab === 'correspondances' ? "bg-orange-500 text-white shadow-xl shadow-orange-500/20" : "bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800"
                        )}
                    >
                        Escale ({filteredCorrespondances.length})
                    </button>
                </div>

                {activeTab === 'directs' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {filteredTrajets.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-4xl mb-4">🔍</p>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aucun trajet direct trouvé</p>
                            </div>
                        ) : (
                            filteredTrajets.map((trajet) => (
                                <motion.div key={trajet.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative group">
                                     {user && (
                                        <button
                                            onClick={(e) => toggleFavori(trajet.ligneId, e)}
                                            className={cn(
                                                "absolute top-4 right-4 z-20 w-10 h-10 rounded-2xl flex items-center justify-center transition shadow-lg",
                                                favorisLigneIds.has(trajet.ligneId) ? "bg-rose-500 text-white" : "bg-white/90 backdrop-blur-sm text-slate-400"
                                            )}
                                        >
                                            <Heart size={18} className={favorisLigneIds.has(trajet.ligneId) ? "fill-white" : ""} />
                                        </button>
                                    )}
                                    <FlightCard
                                        airline={trajet.compagnieNom}
                                        flightCode={`BUS-${trajet.busMatricule?.slice(-4) || trajet.id}`}
                                        flightClass="Standard"
                                        departureCode={trajet.villeDepart.slice(0, 3).toUpperCase()}
                                        departureCity={trajet.villeDepart}
                                        departureTime={formatHeure(trajet.dateDepart)}
                                        arrivalCode={trajet.villeArrivee.slice(0, 3).toUpperCase()}
                                        arrivalCity={trajet.villeArrivee}
                                        arrivalTime={formatHeure(trajet.dateArriveePrevue)}
                                        duration={formatDuree(trajet.dateDepart, trajet.dateArriveePrevue)}
                                        price={trajet.prixBase}
                                        availableSeats={getSiegesDisponibles(trajet)}
                                        onSelect={() => handleReserver(trajet.id)}
                                    />
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                )}

                {activeTab === 'correspondances' && (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {filteredCorrespondances.length === 0 ? (
                             <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-4xl mb-4">🔄</p>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aucune correspondance disponible</p>
                            </div>
                        ) : (
                            filteredCorrespondances.map((groupe, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-xl">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="bg-blue-500/10 text-blue-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {groupe.length} Etapes
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {groupe.map((t) => (
                                            <FlightCard
                                                key={t.id}
                                                airline={t.compagnieNom}
                                                flightCode={`BUS-${t.busMatricule?.slice(-4) || t.id}`}
                                                flightClass="Escale"
                                                departureCode={t.villeDepart.slice(0, 3).toUpperCase()}
                                                departureCity={t.villeDepart}
                                                departureTime={formatHeure(t.dateDepart)}
                                                arrivalCode={t.villeArrivee.slice(0, 3).toUpperCase()}
                                                arrivalCity={t.villeArrivee}
                                                arrivalTime={formatHeure(t.dateArriveePrevue)}
                                                duration={formatDuree(t.dateDepart, t.dateArriveePrevue)}
                                                price={t.prixBase}
                                                availableSeats={getSiegesDisponibles(t)}
                                                onSelect={() => handleReserver(t.id)}
                                            />
                                        ))}
                                    </div>
                                    <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Voyage</span>
                                            <span className="text-3xl font-black text-slate-800 dark:text-white italic tracking-tighter">
                                                {groupe.reduce((sum, t) => sum + (t.prixBase || 0), 0).toFixed(0)} <span className="text-sm font-bold text-orange-500 uppercase tracking-normal">DH</span>
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => router.push(`/fr/reservation?trajetsIds=${groupe.map(t => t.id).join(',')}`)}
                                            className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-500/20"
                                        >
                                            Réserver la combinaison
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                     </motion.div>
                )}
            </div>
        )}

        {/* Initial State */}
        {!searched && !loading && (
            <div className="text-center py-24">
                <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
                    <p className="text-8xl mb-8 opacity-20">🚌</p>
                </motion.div>
                <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Entrez votre destination pour commencer</p>
            </div>
        )}

      </main>
      <Footer />
    </div>
  );
}