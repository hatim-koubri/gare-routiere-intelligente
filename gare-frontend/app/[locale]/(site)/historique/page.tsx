'use client';

import { motion } from 'framer-motion';
import { History, Milestone, Calendar, Award, Building2 } from 'lucide-react';

export default function HistoriquePage() {
  const events = [
    { year: "2010", title: "Fondation de la Gare", desc: "Inauguration de la structure principale pour centraliser les flux de transport régionaux.", icon: <Building2 /> },
    { year: "2015", title: "Expansion Nationale", desc: "Doublement du nombre de quais et accueil de 20 nouvelles compagnies partenaires.", icon: <Milestone /> },
    { year: "2020", title: "Certification Qualité", desc: "Obtention des labels de sécurité et confort pour l'ensemble des services voyageurs.", icon: <Award /> },
    { year: "2024", title: "Gare Routière Intelligente", desc: "Lancement de la plateforme digitale et automatisation complète des réservations.", icon: <Calendar /> },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 selection:bg-orange-500/30">
      
      {/* ── Hero Section WOW ── */}
      <section className="relative pt-20 pb-40 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.15),transparent_70%)]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 backdrop-blur-md px-4 py-2 rounded-full mb-6">
              <History className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 text-xs font-black uppercase tracking-[0.2em]">Notre Parcours</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 uppercase tracking-tighter italic leading-none">
              Notre <span className="text-orange-500">Histoire</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
              Une décennie de dévouement pour transformer la mobilité au Maroc.
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-24 bg-[#f8fafc] dark:bg-slate-950" style={{ clipPath: 'ellipse(70% 100% at 50% 100%)' }} />
      </section>

      <main className="max-w-4xl mx-auto px-6 -mt-24 relative z-20 pb-32">
        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-6 md:ml-12 pl-8 md:pl-16 space-y-16">
            {events.map((e, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative"
                >
                    {/* Circle Indicator */}
                    <div className="absolute -left-[57px] md:-left-[89px] top-0 w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                        {e.icon}
                    </div>
                    
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
                        <span className="text-5xl font-black text-orange-500/10 dark:text-orange-500/5 absolute top-4 right-8">{e.year}</span>
                        <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-3 text-slate-800 dark:text-white leading-tight">
                            {e.title}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            {e.desc}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
      </main>
    </div>
  );
}
