// components/ui/flight-card.tsx
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bus, Clock, MapPin, Users, ArrowRight, ShieldCheck, Sparkles, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FlightCardProps {
  imageUrl?: string;
  airline: string;
  flightCode: string;
  flightClass?: string;
  departureCode: string;
  departureCity: string;
  departureTime: string;
  arrivalCode: string;
  arrivalCity: string;
  arrivalTime: string;
  duration: string;
  price: number;
  availableSeats: number;
  onSelect?: () => void;
  className?: string;
}

const busImages = [
  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?q=80&w=2073&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1570125909232-263c3b7e1799?q=80&w=2071&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519003722824-482d2a1b1f89?q=80&w=2070&auto=format&fit=crop",
];

export const FlightCard = React.forwardRef<HTMLDivElement, FlightCardProps>(
  (
    {
      imageUrl,
      airline,
      flightCode,
      flightClass,
      departureCode,
      departureCity,
      departureTime,
      arrivalCode,
      arrivalCity,
      arrivalTime,
      duration,
      price,
      availableSeats,
      onSelect,
      className,
    },
    ref
  ) => {
    const randomImage = React.useMemo(() => {
      if (imageUrl) return imageUrl;
      const randomIndex = Math.floor(Math.random() * busImages.length);
      return busImages[randomIndex];
    }, [imageUrl]);

    const isLimited = availableSeats < 5;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -10 }}
        className={cn(
          "relative w-full group rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] transition-all duration-500 overflow-hidden",
          className
        )}
        onClick={onSelect}
      >
        {/* Top Image Section */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={randomImage}
            alt={airline}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
          
          {/* Badge overlays */}
          <div className="absolute top-6 left-6 flex gap-2">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-2">
                <Sparkles size={14} className="text-orange-400" />
                <span className="text-white text-[10px] font-black uppercase tracking-widest">{airline}</span>
            </div>
            {isLimited && (
                <motion.div 
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="bg-rose-500 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg shadow-rose-500/30"
                >
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Dernières places</span>
                </motion.div>
            )}
          </div>

          <div className="absolute bottom-6 left-6">
             <div className="text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Matricule</p>
                <p className="text-xl font-black italic tracking-tighter uppercase">{flightCode}</p>
             </div>
          </div>

          <div className="absolute bottom-6 right-6">
             <div className="bg-orange-500 text-white px-5 py-2 rounded-2xl shadow-xl shadow-orange-500/30">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">À partir de</p>
                <p className="text-2xl font-black italic tracking-tighter">{price}<span className="text-xs ml-1">DH</span></p>
             </div>
          </div>
        </div>

        {/* Path Section */}
        <div className="p-8">
            <div className="flex items-center justify-between gap-6 mb-8 relative">
                {/* Departure */}
                <div className="text-left z-10">
                    <p className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white italic tracking-tighter leading-none mb-1">{departureCode}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{departureCity}</p>
                    <p className="text-lg font-black text-orange-500 italic mt-2">{departureTime}</p>
                </div>

                {/* Animated Connector */}
                <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4 relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <Navigation className="w-16 h-16 rotate-90 text-slate-400" />
                    </div>
                    <div className="w-full h-px bg-slate-100 dark:bg-slate-800 relative">
                        <motion.div 
                            animate={{ left: ['0%', '100%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500 rounded-full blur-sm"
                        />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-300 rounded-full" />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-300 rounded-full" />
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{duration}</p>
                    </div>
                </div>

                {/* Arrival */}
                <div className="text-right z-10">
                    <p className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white italic tracking-tighter leading-none mb-1">{arrivalCode}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{arrivalCity}</p>
                    <p className="text-lg font-black text-orange-500 italic mt-2">{arrivalTime}</p>
                </div>
            </div>

            {/* Bottom Footer Section */}
            <div className="flex items-center justify-between pt-8 border-t border-slate-50 dark:border-slate-800">
                <div className="flex gap-4">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Places</span>
                        <div className={cn(
                            "flex items-center gap-1 font-black italic",
                            availableSeats > 10 ? "text-emerald-500" : "text-orange-500"
                        )}>
                            <Users size={12} />
                            <span>{availableSeats}</span>
                        </div>
                    </div>
                    <div className="w-px h-8 bg-slate-100 dark:bg-slate-800" />
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Classe</span>
                        <div className="flex items-center gap-1 font-black italic text-slate-700 dark:text-slate-300">
                            <ShieldCheck size={12} />
                            <span>{flightClass || "Standard"}</span>
                        </div>
                    </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.();
                  }}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-500 dark:hover:bg-orange-500 hover:text-white transition-all shadow-xl shadow-slate-900/10 dark:shadow-white/5"
                >
                  Réserver <ArrowRight size={14} className="inline ml-2" />
                </motion.button>
            </div>
        </div>

        {/* Hover Gradient Effect */}
        <div className="absolute inset-0 pointer-events-none border-[3px] border-transparent group-hover:border-orange-500/20 rounded-[2.5rem] transition-all duration-500" />
      </motion.div>
    );
  }
);

FlightCard.displayName = "FlightCard";