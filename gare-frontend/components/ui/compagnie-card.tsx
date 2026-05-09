"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const BG_IMAGES = [
  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1495364141860-b0d03eccd065?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1527786356703-4b100091cd2c?q=80&w=800&auto=format&fit=crop",
];

const HSL_COLORS = [
  "160 84% 25%", // Emerald
  "190 90% 25%", // Cyan
  "262 83% 30%", // Violet
  "38 92% 30%",  // Amber
  "340 82% 30%", // Rose
  "226 70% 30%", // Indigo
];

export interface CompagnieCardProps {
  compagnieId: number;
  nom: string;
  code: string;
  email?: string;
  telephone?: string;
  description?: string;
  actif: boolean;
  nbBus?: number;
  index?: number;
  className?: string;
}

const CompagnieCard = React.forwardRef<HTMLDivElement, CompagnieCardProps>(
  ({ className, nom, code, nbBus = 0, index = 0, actif, compagnieId, ...props }, ref) => {
    const imageUrl = BG_IMAGES[index % BG_IMAGES.length];
    const themeColor = HSL_COLORS[index % HSL_COLORS.length];

    return (
      <div
        ref={ref}
        style={{
          // @ts-ignore
          "--theme-color": themeColor,
        } as React.CSSProperties}
        className={cn("group w-full h-[400px] relative", className)}
        {...props}
      >
        <div
          className="relative block w-full h-full rounded-[2rem] overflow-hidden shadow-lg 
                     transition-all duration-500 ease-in-out 
                     group-hover:scale-[1.03] group-hover:shadow-[0_0_60px_-15px_hsl(var(--theme-color)/0.6)]"
          style={{
             boxShadow: `0 0 40px -15px hsl(var(--theme-color) / 0.5)`
          }}
        >
          {/* Background Image with Parallax Zoom */}
          <div
            className="absolute inset-0 bg-cover bg-center 
                       transition-transform duration-700 ease-in-out group-hover:scale-110"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />

          {/* Themed Gradient Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, hsl(var(--theme-color) / 0.95), hsl(var(--theme-color) / 0.6) 40%, transparent 80%)`,
            }}
          />
          
          {/* Status Badge */}
          <div className="absolute top-5 right-5 z-10">
            <span className={cn(
              "text-[10px] uppercase font-black px-3.5 py-1.5 rounded-full border backdrop-blur-md transition-all duration-300",
              actif 
                ? "bg-white/20 text-white border-white/40" 
                : "bg-black/40 text-white/60 border-white/10"
            )}>
              {actif ? "● Active" : "○ Inactive"}
            </span>
          </div>

          {/* Content */}
          <div className="relative flex flex-col justify-end h-full p-8 text-white">
            <div className="mb-4">
                <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-3xl font-black tracking-tighter uppercase italic drop-shadow-lg">
                      {nom}
                    </h3>
                    <span className="text-[10px] font-mono font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded border border-white/30 uppercase">
                      {code}
                    </span>
                </div>
                {props.description && (
                    <p className="text-white/70 text-xs line-clamp-2 mt-2 font-medium leading-relaxed max-w-[90%]">
                        {props.description}
                    </p>
                )}
            </div>
            
            <div className="flex items-center gap-6 mt-2 bg-black/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/50 mb-0.5">Flotte</span>
                    <span className="text-xl font-black">{nbBus} <span className="text-sm font-bold text-white/70">BUS</span></span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/50 mb-0.5">Identifiant</span>
                    <span className="text-xl font-black">#{compagnieId}</span>
                </div>
            </div>

            {/* Plus d'information Button */}
            <div className="mt-6 flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 
                           rounded-xl px-4 py-3 
                           transition-all duration-300 
                           group-hover:bg-white/20 group-hover:border-white/40 cursor-pointer">
              <span className="text-xs font-bold uppercase tracking-widest text-white">Plus d'information</span>
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRight className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Bottom Glow bar */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>
      </div>
    );
  }
);
CompagnieCard.displayName = "CompagnieCard";

export { CompagnieCard };
