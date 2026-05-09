'use client';

import { motion } from 'framer-motion';
import { Sparkles, Bus, Users, ShieldCheck, MapPin, Globe, Clock, Ticket } from 'lucide-react';

export default function AproposPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 selection:bg-orange-500/30">
      
      {/* ── Hero Section WOW ── */}
      <section className="relative pt-20 pb-40 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.15),transparent_70%)]" />
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-24 h-24 bg-orange-500/10 rounded-full blur-3xl"
              animate={{ x: [0, 100, -50, 0], y: [0, -80, 40, 0] }}
              transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "linear" }}
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 backdrop-blur-md px-4 py-2 rounded-full mb-6">
              <Bus className="w-4 h-4 text-orange-400 animate-pulse" />
              <span className="text-orange-400 text-xs font-black uppercase tracking-[0.2em]">Votre Partenaire de Voyage</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 uppercase tracking-tighter italic leading-none">
              Notre <span className="text-orange-500">Compagnie</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
              Connecter les villes, rapprocher les gens. Une mission portée par l'excellence opérationnelle et le confort de nos voyageurs.
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-24 bg-[#f8fafc] dark:bg-slate-950" style={{ clipPath: 'ellipse(70% 100% at 50% 100%)' }} />
      </section>

      <main className="max-w-7xl mx-auto px-6 -mt-24 relative z-20 pb-32">
        
        {/* ── Core Role Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
            {[
                { icon: <Globe />, title: "Couverture Nationale", desc: "Un réseau de lignes reliant les principales villes du Maroc quotidiennement." },
                { icon: <ShieldCheck />, title: "Sécurité Maximale", desc: "Maintenance rigoureuse et chauffeurs expérimentés pour votre sérénité." },
                { icon: <Clock />, title: "Ponctualité", desc: "Le respect des horaires est le socle de notre engagement envers vous." },
                { icon: <Ticket />, title: "Service Premium", desc: "Des bus modernes équipés pour un voyage confortable et connecté." }
            ].map((v, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl group hover:bg-orange-500 transition-all duration-500"
                >
                    <div className="w-14 h-14 bg-orange-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:text-white transition-all text-orange-500">
                        {v.icon}
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter mb-2 text-slate-800 dark:text-white italic group-hover:text-white">{v.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed group-hover:text-white/80">{v.desc}</p>
                </motion.div>
            ))}
        </div>

        {/* ── Detailed Story ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                <h2 className="text-4xl font-black uppercase tracking-tighter italic mb-8 text-slate-900 dark:text-white leading-tight">
                    L'excellence au service du <br/><span className="text-orange-500">Transport Routier</span>
                </h2>
                <div className="space-y-6 text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    <p>
                        Depuis notre création, nous nous efforçons de redéfinir les standards du voyage en bus au Maroc. Notre rôle ne se limite pas à transporter des passagers d'un point A à un point B ; nous créons des liens durables entre les régions.
                    </p>
                    <p>
                        Notre flotte est composée de bus de dernière génération, offrant un confort inégalé : sièges ergonomiques, Wi-Fi embarqué, et systèmes de sécurité avancés. Chaque trajet est une promesse de qualité.
                    </p>
                    <div className="pt-6 grid grid-cols-2 gap-10">
                        <div>
                            <p className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter">150+</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Villes Desservies</p>
                        </div>
                        <div>
                            <p className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter">500k+</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Voyageurs Annuels</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative">
                <div className="absolute -inset-10 bg-orange-500/10 rounded-full blur-3xl" />
                <div className="relative aspect-square rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white dark:border-slate-800">
                    <img 
                        src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1000&auto=format&fit=crop" 
                        alt="Modern Bus Fleet"
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                    />
                </div>
            </motion.div>
        </div>

      </main>
    </div>
  );
}
