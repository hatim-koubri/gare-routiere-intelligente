// components/ui/compagnie-card.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, ExternalLink, Bus } from "lucide-react";
import { cn } from "@/lib/utils";

// Pool d'images Unsplash thème transport / bus / voyage
const BG_IMAGES = [
  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=800&auto=format&fit=crop", // bus highway
  "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=800&auto=format&fit=crop", // bus station
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop", // road travel
  "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?q=80&w=800&auto=format&fit=crop", // highway landscape
  "https://images.unsplash.com/photo-1495364141860-b0d03eccd065?q=80&w=800&auto=format&fit=crop", // coach bus
  "https://images.unsplash.com/photo-1527786356703-4b100091cd2c?q=80&w=800&auto=format&fit=crop", // travel road
];

const ACCENT_COLORS = [
  { from: "from-emerald-600", to: "to-teal-700", badge: "bg-emerald-500/20 text-emerald-100 border-emerald-400/30" },
  { from: "from-cyan-600", to: "to-blue-700", badge: "bg-cyan-500/20 text-cyan-100 border-cyan-400/30" },
  { from: "from-violet-600", to: "to-purple-700", badge: "bg-violet-500/20 text-violet-100 border-violet-400/30" },
  { from: "from-amber-500", to: "to-orange-600", badge: "bg-amber-500/20 text-amber-100 border-amber-400/30" },
  { from: "from-rose-500", to: "to-pink-700", badge: "bg-rose-500/20 text-rose-100 border-rose-400/30" },
  { from: "from-indigo-600", to: "to-blue-800", badge: "bg-indigo-500/20 text-indigo-100 border-indigo-400/30" },
];

interface StatItemProps { label: string; value: string | number }
const StatItem = ({ label, value }: StatItemProps) => (
  <div className="flex flex-col items-center">
    <span className="text-lg font-bold text-slate-800">{value}</span>
    <span className="text-[11px] text-slate-500 font-medium">{label}</span>
  </div>
);

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

export function CompagnieCard({
  compagnieId, nom, code, email, telephone,
  description, actif, nbBus = 0, index = 0, className,
}: CompagnieCardProps) {
  const imgUrl = BG_IMAGES[index % BG_IMAGES.length];
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const initials = nom.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <motion.div
      className={cn(
        "w-full overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 cursor-default select-none",
        className
      )}
      whileHover={{ y: -6, scale: 1.015, boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
        {/* ── Top : Image + overlay + infos ── */}
        <div className="relative h-44 w-full overflow-hidden">
          <motion.img
            src={imgUrl}
            alt={nom}
            className="h-full w-full object-cover"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t ${accent.from} ${accent.to} opacity-60`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Statut badge */}
          <div className="absolute top-3 right-3">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${
              actif
                ? "bg-emerald-500/25 text-emerald-100 border-emerald-400/40"
                : "bg-black/30 text-white/70 border-white/20"
            }`}>
              {actif ? "● Active" : "○ Inactive"}
            </span>
          </div>

          {/* Avatar initiales */}
          <div className="absolute top-3 left-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <span className="text-white font-black text-sm">{initials}</span>
            </div>
          </div>

          {/* Titre bas de carte */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-white font-bold text-base leading-tight drop-shadow">{nom}</h3>
                <p className="text-white/80 text-xs mt-0.5">ID #{compagnieId}</p>
              </div>
              {/* Badge code */}
              <motion.span
                className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border backdrop-blur-sm ${accent.badge}`}
                whileHover={{ scale: 1.05 }}
              >
                {code}
              </motion.span>
            </div>
          </div>
        </div>

        {/* ── Bottom : Détails ── */}
        <div className="p-4">
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <Mail size={13} className="text-slate-400 flex-shrink-0" />
              <span className="text-sm text-slate-600 truncate">{email || 'Email non renseigné'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={13} className="text-slate-400 flex-shrink-0" />
              <span className="text-sm text-slate-600">{telephone || 'Téléphone non renseigné'}</span>
            </div>
          </div>
          {description && (
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4 pb-3 border-b border-slate-100">
              {description}
            </p>
          )}
          {!description && <div className="border-t border-slate-100 mb-4" />}
          <div className="flex justify-around">
            <StatItem label="Bus" value={nbBus} />
            <div className="w-px bg-slate-100" />
            <StatItem label="Statut" value={actif ? '✓ Actif' : '✗'} />
            <div className="w-px bg-slate-100" />
            <StatItem label="Code" value={code} />
          </div>
        </div>
    </motion.div>
  );
}

CompagnieCard.displayName = 'CompagnieCard';
