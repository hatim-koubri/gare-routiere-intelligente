// app/[locale]/(site)/comment-ca-marche/page.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Ticket, 
  CreditCard, 
  Bus, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2,
  MousePointer2,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const roadmapSteps = [
  {
    title: "1. Recherche Intelligente",
    description: "Indiquez votre départ, votre destination et votre date. Notre algorithme trouve instantanément les meilleurs trajets disponibles parmi toutes nos compagnies partenaires.",
    icon: <Search className="w-8 h-8" />,
    color: "bg-orange-500",
    side: "left"
  },
  {
    title: "2. Choix de la Place",
    description: "Visualisez le plan réel du bus en 3D. Sélectionnez votre siège préféré (fenêtre, couloir ou devant) pour un confort sur mesure.",
    icon: <MousePointer2 className="w-8 h-8" />,
    color: "bg-orange-600",
    side: "right"
  },
  {
    title: "3. Détails & Bagages",
    description: "Ajoutez vos informations passagers et déclarez vos bagages. Bénéficiez de tarifs préférentiels pour les étudiants, enfants et séniors.",
    icon: <Ticket className="w-8 h-8" />,
    color: "bg-orange-500",
    side: "left"
  },
  {
    title: "4. Paiement Sécurisé",
    description: "Réglez vos billets en toute sécurité via CMI, Visa ou Mastercard. Vos transactions sont protégées par les standards de sécurité les plus élevés.",
    icon: <CreditCard className="w-8 h-8" />,
    color: "bg-orange-600",
    side: "right"
  },
  {
    title: "5. Embarquement",
    description: "Recevez votre billet avec QR Code par email et sur votre tableau de bord. Présentez-le au chauffeur lors de l'embarquement et profitez de votre voyage !",
    icon: <Bus className="w-8 h-8" />,
    color: "bg-orange-500",
    side: "left"
  }
];

export default function HowItWorksPage() {
    const router = useRouter();

    return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 selection:bg-orange-500/30 overflow-x-hidden">
      <main className="pb-48">
        
        {/* ── Header Cinématique WOW (Unifié) ── */}
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
                        <Clock className="w-4 h-4 text-orange-400 animate-pulse" />
                        <span className="text-orange-400 text-xs font-black uppercase tracking-[0.2em]">Guide Utilisateur</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 uppercase tracking-tighter italic">
                        Comment ça <span className="text-orange-500 text-glow-orange">Marche</span> ?
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                        Découvrez la simplicité de notre plateforme à travers ce parcours interactif en 5 étapes clés.
                    </p>
                </motion.div>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full h-24 bg-[#f8fafc] dark:bg-slate-950" style={{ clipPath: 'ellipse(70% 100% at 50% 100%)' }} />
        </section>

        {/* ── Roadmap 3D Section ── */}
        <section className="max-w-6xl mx-auto px-6 -mt-12 relative z-20">
            <div className="relative">
                {/* Central Vertical Line (The "Road") */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1.5 bg-slate-200 dark:bg-slate-800 -translate-x-1/2 hidden md:block rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ height: 0 }}
                        whileInView={{ height: '100%' }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="w-full bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                    />
                </div>

                <div className="space-y-24 md:space-y-32">
                    {roadmapSteps.map((step, index) => (
                        <motion.div 
                            key={index}
                            initial={{ opacity: 0, x: step.side === 'left' ? -50 : 50, rotateY: step.side === 'left' ? 10 : -10 }}
                            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, type: "spring", stiffness: 50 }}
                            className={cn(
                                "relative flex flex-col md:flex-row items-center gap-8 md:gap-16",
                                step.side === 'right' ? "md:flex-row-reverse" : ""
                            )}
                            style={{ perspective: "1000px" }}
                        >
                            {/* Card 3D */}
                            <div className="flex-1 w-full">
                                <div className={cn(
                                    "bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative group overflow-hidden transition-all duration-500 hover:shadow-orange-500/10 hover:-translate-y-2",
                                    step.side === 'left' ? "md:text-right" : "md:text-left"
                                )}>
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6",
                                        step.color,
                                        step.side === 'left' ? "md:ml-auto" : "md:mr-auto"
                                    )}>
                                        {step.icon}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4">{step.title}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                                        {step.description}
                                    </p>
                                    
                                    {/* Number Badge BG */}
                                    <span className="absolute -bottom-4 -right-4 text-9xl font-black text-slate-50 dark:text-slate-800/30 select-none pointer-events-none group-hover:text-orange-500/5 transition-colors duration-500">
                                        {index + 1}
                                    </span>
                                </div>
                            </div>

                            {/* Center Point */}
                            <div className="relative z-30">
                                <div className="w-12 h-12 bg-white dark:bg-slate-900 border-4 border-orange-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                                    <div className="w-4 h-4 bg-orange-500 rounded-full animate-ping" />
                                </div>
                            </div>

                            {/* Spacer for alignment */}
                            <div className="flex-1 hidden md:block" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

        {/* ── Call to Action WOW ── */}
        <section className="max-w-4xl mx-auto px-6 mt-32">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-orange-500 rounded-[3rem] p-12 text-center text-white shadow-2xl shadow-orange-500/40 relative overflow-hidden group"
            >
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
                
                <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-6 relative z-10">Prêt à embarquer ?</h2>
                <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto font-medium relative z-10">
                    Rejoignez des milliers de voyageurs et vivez une expérience de transport simplifiée et moderne.
                </p>
                <button 
                  onClick={() => router.push('/fr/recherche')}
                  className="bg-white text-orange-500 px-12 py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all relative z-10 cursor-pointer"
                >
                    Réserver mon premier trajet
                </button>
            </motion.div>
        </section>
      </main>
    </div>
  );
}
