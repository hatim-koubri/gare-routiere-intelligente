'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Bus, Navigation,
  Clock, Loader2, Ticket, ArrowRight, Calendar, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';

interface Reservation {
  id: number;
  dateReservation: string;
  prixTotal: number;
  statut: string;
  trajet?: {
    id: number;
    dateDepart: string;
    villeDepart: string;
    villeArrivee: string;
    compagnieNom: string;
    busMatricule?: string;
    quaiNumero?: number;
  };
  tickets?: Array<{
    id: number;
    numeroSiege: string;
  }>;
}

export default function VoyageurPlanQuaiPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedResId, setSelectedResId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredQuai, setHoveredQuai] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/fr/auth/login');
      else if (user.role !== 'VOYAGEUR') {
        router.push('/');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'VOYAGEUR') {
      loadReservations();
    }
  }, [user]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/voyageur/reservations');
      const data = res.data || [];
      // Filter for confirmed future reservations
      const today = new Date();
      const active = data.filter((r: Reservation) => 
        r.statut === 'CONFIRMEE' && 
        r.trajet?.dateDepart && 
        new Date(r.trajet.dateDepart) > today
      ).sort((a: Reservation, b: Reservation) => 
        new Date(a.trajet!.dateDepart).getTime() - new Date(b.trajet!.dateDepart).getTime()
      );
      
      setReservations(active);
      if (active.length > 0) {
        setSelectedResId(active[0].id);
      }
    } catch (err) {
      console.error("Failed to load reservations", err);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedRes = reservations.find(r => r.id === selectedResId);
  const selectedQuai = selectedRes?.trajet?.quaiNumero ?? null;

  const totalQuais = 15;
  const cols = 5;

  const getQuaiPosition = (n: number) => {
    if (n <= 0) return { x: 50, y: 100 };
    const row = Math.floor((n - 1) / cols);
    const col = (n - 1) % cols;
    return {
      x: 10 + col * 20,
      y: 15 + row * 28
    };
  };

  const targetPos = getQuaiPosition(selectedQuai || 0);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium italic">Chargement de vos trajets...</p>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-6">
            <Ticket size={32} className="text-slate-300" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Aucun trajet à venir</h2>
        <p className="text-slate-500 mt-2 max-w-xs mx-auto">Vous n'avez pas de réservations confirmées pour le moment. Planifiez votre voyage dès maintenant !</p>
        <Link 
            href="/fr/recherche"
            className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase italic tracking-tighter shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
        >
            <Search size={18} />
            Rechercher un bus
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      {/* Header with selector */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Plan des Quais</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gare RIHLA • Terminal Voyageur</p>
            </div>
            <div className="bg-emerald-500 text-white px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg shadow-emerald-500/20">
                <Ticket size={18} />
                <span className="text-sm font-black italic">
                    {selectedQuai ? `QUAI #${selectedQuai}` : 'QUAI NON ATTRIBUÉ'}
                </span>
            </div>
        </div>

        {/* Reservation Selector (Tabs) */}
        {reservations.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {reservations.map((res) => (
                    <button
                        key={res.id}
                        onClick={() => setSelectedResId(res.id)}
                        className={cn(
                            "flex-shrink-0 px-6 py-3 rounded-2xl text-xs font-black uppercase italic tracking-tighter transition-all border-2",
                            selectedResId === res.id 
                                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" 
                                : "bg-white border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-600"
                        )}
                    >
                        {res.trajet?.villeArrivee} • {res.trajet?.dateDepart ? new Date(res.trajet.dateDepart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </button>
                ))}
            </div>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left: Journey Info */}
        <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex-1">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-8">Détails d'embarquement</h3>
                
                <div className="space-y-8">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400">Destination</p>
                            <p className="text-lg font-black text-slate-900 uppercase italic leading-none mt-1">{selectedRes?.trajet?.villeArrivee}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400">Date</p>
                            <p className="text-lg font-black text-slate-900 mt-1">
                                {selectedRes?.trajet?.dateDepart ? new Date(selectedRes.trajet.dateDepart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '—'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400">Heure de départ</p>
                            <p className="text-lg font-black text-slate-900 mt-1">
                                {selectedRes?.trajet?.dateDepart ? new Date(selectedRes.trajet.dateDepart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                            <Bus size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400">Bus / Compagnie</p>
                            <p className="text-lg font-black text-slate-900 mt-1">{selectedRes?.trajet?.compagnieNom}</p>
                        </div>
                    </div>
                </div>

                {selectedQuai ? (
                    <div className="mt-10 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest leading-relaxed">
                            Suivez la ligne verte pour rejoindre votre quai d'embarquement.
                        </p>
                    </div>
                ) : (
                    <div className="mt-10 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest leading-relaxed">
                            Le quai pour ce trajet n'a pas encore été attribué. Veuillez consulter les écrans en gare.
                        </p>
                    </div>
                )}
            </div>
        </div>

        {/* Right: Focused 3D Map with Path */}
        <div className="lg:col-span-8 flex flex-col">
            <div className="bg-white rounded-[2.5rem] p-10 md:p-16 border border-slate-100 shadow-sm flex-1 flex items-center justify-center relative overflow-hidden">
                
                {/* SVG Path Overlay - Animated Green Line */}
                <div className="absolute inset-0 z-10 pointer-events-none" style={{ perspective: '1200px' }}>
                    <div className="w-full h-full relative" style={{ transform: 'rotateX(55deg) rotateZ(-35deg) scale(1.1) translateY(-20px)' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                            <AnimatePresence>
                                {selectedQuai && (
                                    <motion.path
                                        key={`vpath-${selectedResId}-${selectedQuai}`}
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 1.5, ease: "easeInOut" }}
                                        d={`M 50 95 L 50 85 L ${targetPos.x + 10} 85 L ${targetPos.x + 10} ${targetPos.y + 10}`}
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeDasharray="3,3"
                                        className="drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                                    />
                                )}
                            </AnimatePresence>
                        </svg>
                    </div>
                </div>

                <div className="relative w-full h-full max-h-[500px]" style={{ perspective: '1200px' }}>
                    <motion.div 
                        initial={{ rotateX: 55, rotateZ: -35, opacity: 0 }}
                        animate={{ rotateX: 55, rotateZ: -35, opacity: 1 }}
                        className="relative w-full h-full grid grid-cols-5 gap-6 md:gap-10"
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {Array.from({ length: totalQuais }).map((_, i) => {
                            const id = i + 1;
                            const isTarget = id === selectedQuai;
                            const isHovered = id === hoveredQuai;
                            
                            return (
                                <div
                                    key={i}
                                    onMouseEnter={() => setHoveredQuai(id)}
                                    onMouseLeave={() => setHoveredQuai(null)}
                                    className="relative h-16 md:h-20"
                                    style={{ transformStyle: 'preserve-3d' }}
                                >
                                    <motion.div 
                                        animate={{ 
                                            translateZ: isTarget ? 35 : (isHovered ? 15 : 0),
                                            backgroundColor: isTarget ? '#10b981' : (isHovered ? '#f1f5f9' : '#fff'),
                                            borderColor: isTarget ? '#10b981' : '#f1f5f9'
                                        }}
                                        className={cn(
                                            "w-full h-full rounded-xl flex items-center justify-center border-2 transition-all duration-300 relative shadow-sm",
                                            isTarget && "shadow-xl shadow-emerald-500/30"
                                        )}
                                        style={{ transformStyle: 'preserve-3d' }}
                                    >
                                        <span className={cn(
                                            "text-xl font-black italic tracking-tighter",
                                            isTarget ? "text-white" : "text-slate-200"
                                        )}>
                                            {id}
                                        </span>

                                        <div className={cn(
                                            "absolute bottom-0 left-0 right-0 h-8 origin-bottom rounded-b-xl",
                                            isTarget ? "bg-emerald-600" : "bg-slate-100"
                                        )} style={{ transform: 'rotateX(-90deg)' }} />
                                        
                                        <div className={cn(
                                            "absolute top-0 bottom-0 right-0 w-8 origin-right rounded-r-xl",
                                            isTarget ? "bg-emerald-700" : "bg-slate-200"
                                        )} style={{ transform: 'rotateY(90deg)' }} />

                                        {isTarget && (
                                            <motion.div 
                                                animate={{ translateZ: 80 }}
                                                className="absolute -top-12"
                                            >
                                                <Bus className="w-6 h-6 text-emerald-500 drop-shadow-xl" />
                                            </motion.div>
                                        )}
                                    </motion.div>
                                </div>
                            );
                        })}

                        {/* "YOU ARE HERE" POINT - BLUE */}
                        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ transform: 'translateZ(10px)' }}>
                            <div className="w-5 h-5 bg-blue-600 rounded-full border-4 border-white shadow-[0_0_20px_rgba(37,99,235,0.6)] animate-bounce" />
                            <div className="bg-blue-600 text-white px-3 py-1 rounded-full shadow-lg">
                                <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">Vous êtes ici</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
