'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { chauffeurTrajetApi } from '@/lib/api/chauffeur/trajets';
import { Role } from '@/types';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Bus, Navigation,
  Clock, Loader2, Search, ArrowRight, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PlanQuaiPage() {
  const [trajets, setTrajets] = useState<any[]>([]);
  const [selectedTrajet, setSelectedTrajet] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredQuai, setHoveredQuai] = useState<number | null>(null);

  useEffect(() => {
    loadTrajets();
  }, []);

  const loadTrajets = async () => {
    try {
      const data = await chauffeurTrajetApi.getTrajetsJour();
      const upcoming = Array.isArray(data)
        ? data.filter((t: any) => t.statut === 'PLANIFIE' || t.statut === 'EN_COURS')
            .sort((a: any, b: any) => new Date(a.dateDepart).getTime() - new Date(b.dateDepart).getTime())
        : [];
      setTrajets(upcoming);
      if (upcoming.length > 0) setSelectedTrajet(upcoming[0]);
    } catch {
      setTrajets([]);
    } finally {
      setLoading(false);
    }
  };

  const getQuaiNumero = (t: any) => t.quaiNumero || t.quai?.numero || 'N/A';
  const getBusMatricule = (t: any) => t.busMatricule || t.bus?.matricule || 'N/A';

  const quaiNum = selectedTrajet ? Number(getQuaiNumero(selectedTrajet)) : 0;
  const totalQuais = 15;
  const cols = 5;

  // Path calculation for the SVG line
  const getQuaiPosition = (n: number) => {
    if (n <= 0) return { x: 50, y: 100 };
    const row = Math.floor((n - 1) / cols);
    const col = (n - 1) % cols;
    // Normalized coordinates (0-100)
    return {
      x: 10 + col * 20,
      y: 15 + row * 28
    };
  };

  const targetPos = getQuaiPosition(quaiNum);

  return (
    <ProtectedRoute allowedRoles={[Role.CHAUFFEUR]}>
      <div className="min-h-screen bg-slate-50 p-6 md:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex items-center justify-between">
            <Link href="/fr/chauffeur/dashboard" className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
                <ArrowLeft size={14} /> Retour
            </Link>
            <div className="text-right">
                <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Plan des Quais</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gare Routière RIHLA</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-full">
                    <div className="flex items-center gap-2 mb-6 text-blue-600">
                        <Clock size={16} />
                        <h2 className="text-xs font-black uppercase tracking-widest">Mes Trajets du Jour</h2>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div>
                        ) : (
                            trajets.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTrajet(t)}
                                    className={cn(
                                        "w-full text-left p-5 rounded-2xl transition-all border flex flex-col gap-1",
                                        selectedTrajet?.id === t.id 
                                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20" 
                                            : "bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 text-slate-600"
                                    )}
                                >
                                    <div className="flex justify-between items-center w-full">
                                        <span className="text-sm font-black uppercase tracking-tighter italic">
                                            {t.villeDepart} → {t.villeArrivee}
                                        </span>
                                        <span className={cn(
                                            "text-[10px] font-black uppercase px-2 py-0.5 rounded-lg",
                                            selectedTrajet?.id === t.id ? "bg-white/20" : "bg-blue-100 text-blue-600"
                                        )}>
                                            Q{getQuaiNumero(t)}
                                        </span>
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold mt-1",
                                        selectedTrajet?.id === t.id ? "text-blue-100" : "text-slate-400"
                                    )}>
                                        Bus {getBusMatricule(t)} • {t.heureDepart || "À l'heure"}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="bg-white rounded-[2.5rem] p-10 md:p-16 shadow-sm border border-slate-100 flex-1 flex items-center justify-center relative overflow-hidden">
                    
                    {/* SVG Path Overlay - Animated Green Line */}
                    <div className="absolute inset-0 z-10 pointer-events-none" style={{ perspective: '1200px' }}>
                        <div className="w-full h-full relative" style={{ transform: 'rotateX(55deg) rotateZ(-35deg) scale(1.1) translateY(-20px)' }}>
                            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                                <AnimatePresence>
                                    {quaiNum > 0 && (
                                        <motion.path
                                            key={`path-${quaiNum}`}
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 1.2, ease: "easeInOut" }}
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
                                const isTarget = id === quaiNum;
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
                                                backgroundColor: isTarget ? '#2563eb' : (isHovered ? '#f1f5f9' : '#fff'),
                                                borderColor: isTarget ? '#2563eb' : '#f1f5f9'
                                            }}
                                            className={cn(
                                                "w-full h-full rounded-xl flex items-center justify-center border-2 transition-all duration-300 relative shadow-sm",
                                                isTarget && "shadow-xl shadow-blue-600/30"
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
                                                "absolute bottom-0 left-0 right-0 h-6 origin-bottom rounded-b-xl",
                                                isTarget ? "bg-blue-700" : "bg-slate-100"
                                            )} style={{ transform: 'rotateX(-90deg)' }} />
                                            
                                            <div className={cn(
                                                "absolute top-0 bottom-0 right-0 w-6 origin-right rounded-r-xl",
                                                isTarget ? "bg-blue-800" : "bg-slate-200"
                                            )} style={{ transform: 'rotateY(90deg)' }} />

                                            {isTarget && (
                                                <motion.div 
                                                    animate={{ translateZ: 80 }}
                                                    className="absolute -top-12"
                                                >
                                                    <Bus className="w-6 h-6 text-blue-600 drop-shadow-xl" />
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    </div>
                                );
                            })}

                            {/* "YOU ARE HERE" POINT - GREEN */}
                            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ transform: 'translateZ(10px)' }}>
                                <div className="w-5 h-5 bg-emerald-500 rounded-full border-4 border-white shadow-[0_0_20px_rgba(16,185,129,0.6)] animate-bounce" />
                                <div className="bg-emerald-500 text-white px-3 py-1 rounded-full shadow-lg">
                                    <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">Vous êtes ici</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <Navigation size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-emerald-600">Itinéraire suggéré</p>
                            <p className="text-lg font-black text-slate-900 italic tracking-tight">Suivez la ligne verte vers le Quai {quaiNum || "..."}</p>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className="flex gap-1">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
