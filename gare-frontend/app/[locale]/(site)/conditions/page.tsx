// app/[locale]/(site)/conditions/page.tsx
'use client';

import React from 'react';
import Plan, { Task } from '@/components/ui/agent-plan';
import { motion } from 'framer-motion';
import { ShieldCheck, Scale, AlertTriangle, FileText, Gavel, HelpCircle, Sparkles } from 'lucide-react';

const conditionsTasks: Task[] = [
  {
    id: "1",
    title: "1. Réservations et Billetterie",
    description: "Conditions relatives à l'achat et à la validité des titres de transport",
    status: "validé",
    priority: "high",
    level: 0,
    dependencies: [],
    subtasks: [
      {
        id: "1.1",
        title: "Validité du billet",
        description: "Le billet est strictement personnel et non transmissible. Il doit être présenté sous format numérique ou imprimé lors de l'embarquement. Toute altération du billet entraîne sa nullité immédiate.",
        status: "completed",
        priority: "high"
      },
      {
        id: "1.2",
        title: "Tarification et Promotions",
        description: "Les tarifs sont fixés par les compagnies de transport. Les codes promotionnels ne sont valables que pour la compagnie émettrice et durant la période de validité spécifiée. Les tarifs enfants et séniors nécessitent un justificatif.",
        status: "completed",
        priority: "medium"
      },
      {
        id: "1.3",
        title: "Modification et Annulation",
        description: "Toute modification doit être effectuée au moins 24h avant le départ. Des frais de dossier peuvent s'appliquer. En cas d'annulation moins de 12h avant le départ, aucun remboursement ne sera effectué.",
        status: "completed",
        priority: "high"
      }
    ],
  },
  {
    id: "2",
    title: "2. Transport des Bagages",
    description: "Règles de sécurité et de poids pour vos effets personnels",
    status: "validé",
    priority: "high",
    level: 0,
    dependencies: [],
    subtasks: [
      {
        id: "2.1",
        title: "Franchise bagages",
        description: "Chaque passager a droit à un bagage à main (max 5kg) et une valise en soute (max 20kg). Tout excédent sera facturé selon le barème en vigueur de la compagnie.",
        status: "completed",
        priority: "high"
      },
      {
        id: "2.2",
        title: "Objets interdits",
        description: "Le transport de matières inflammables, explosives, toxiques ou de produits illicites est strictement interdit. La compagnie se réserve le droit d'inspecter les bagages en cas de doute.",
        status: "completed",
        priority: "high"
      },
      {
        id: "2.3",
        title: "Responsabilité",
        description: "La compagnie décline toute responsabilité pour la perte d'objets de valeur, bijoux ou argent liquide non déclarés. Les bagages doivent être correctement étiquetés avec les coordonnées du passager.",
        status: "completed",
        priority: "medium"
      }
    ],
  },
  {
    id: "3",
    title: "3. Comportement à Bord",
    description: "Normes de conduite pour un voyage serein et sécurisé",
    status: "obligatoire",
    priority: "high",
    level: 0,
    dependencies: [],
    subtasks: [
      {
        id: "3.1",
        title: "Respect des horaires",
        description: "L'embarquement débute 30 minutes avant le départ. Les passagers se présentant après la fermeture des portes (10 min avant le départ) ne pourront prétendre à aucun remboursement.",
        status: "completed",
        priority: "high"
      },
      {
        id: "3.2",
        title: "Hygiène et Tabac",
        description: "Il est strictement interdit de fumer ou de vapoter à bord du véhicule. La consommation d'alcool est prohibée. Les passagers doivent maintenir leur siège dans un état de propreté décent.",
        status: "completed",
        priority: "medium"
      },
      {
        id: "3.3",
        title: "Sécurité du trajet",
        description: "Le port de la ceinture de sécurité est obligatoire durant tout le trajet. Les passagers ne doivent pas distraire le chauffeur ou circuler dans l'allée centrale pendant le mouvement du bus.",
        status: "completed",
        priority: "high"
      }
    ],
  },
  {
    id: "4",
    title: "4. Données Personnelles (RGPD)",
    description: "Gestion et protection de vos informations confidentielles",
    status: "protégé",
    priority: "medium",
    level: 0,
    dependencies: [],
    subtasks: [
      {
        id: "4.1",
        title: "Collecte des données",
        description: "Vos données (nom, prénom, téléphone) sont collectées uniquement pour la gestion des réservations et la sécurité des transports. Elles ne sont jamais revendues à des tiers.",
        status: "completed",
        priority: "medium"
      },
      {
        id: "4.2",
        title: "Droit d'accès",
        description: "Conformément à la loi, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles via votre espace client ou par demande écrite.",
        status: "completed",
        priority: "low"
      }
    ],
  },
  {
    id: "5",
    title: "5. Litiges et Réclamations",
    description: "Procédures de résolution en cas de désaccord",
    status: "juridique",
    priority: "low",
    level: 0,
    dependencies: [],
    subtasks: [
      {
        id: "5.1",
        title: "Délai de réclamation",
        description: "Toute réclamation doit être formulée par écrit dans un délai de 7 jours ouvrables suivant la date du voyage, accompagnée du billet original et des justificatifs nécessaires.",
        status: "completed",
        priority: "medium"
      },
      {
        id: "5.2",
        title: "Médiation",
        description: "En cas d'échec de la réclamation directe, le client peut saisir le médiateur du transport. À défaut d'accord, le tribunal compétent sera celui du siège social de la compagnie.",
        status: "completed",
        priority: "low"
      }
    ],
  },
];

export default function ConditionsPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 selection:bg-orange-500/30 overflow-x-hidden">
      <main className="pb-32">
        {/* ── Header Cinématique WOW (Centré comme Annonces/Compagnies) ── */}
        <section className="relative pt-20 pb-32 overflow-hidden bg-slate-900">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.15),transparent_70%)]" />
                
                {/* Floating Particles like Annonces */}
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
                        <ShieldCheck className="w-4 h-4 text-orange-400 animate-pulse" />
                        <span className="text-orange-400 text-xs font-black uppercase tracking-[0.2em]">Cadre Juridique Officiel</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 uppercase tracking-tighter italic">
                        Conditions <span className="text-orange-500">Générales</span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                        Consultez l'ensemble des règles et engagements régissant votre expérience sur notre plateforme de transport intelligente.
                    </p>
                </motion.div>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full h-24 bg-[#f8fafc] dark:bg-slate-950" style={{ clipPath: 'ellipse(70% 100% at 50% 100%)' }} />
        </section>

        {/* ── Contenu Principal ── */}
        <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-20">
            <div className="grid grid-cols-1 gap-12">
                <Plan 
                  tasks={conditionsTasks} 
                  title="Contrat de Transport" 
                  description="Cliquez sur chaque section pour explorer les détails des conditions d'utilisation et de transport." 
                />

                {/* FAQ / Support footer */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8"
                >
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center rounded-2xl">
                            <HelpCircle className="text-orange-500" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Besoin de clarification ?</h3>
                        <p className="text-slate-400 text-sm max-w-md">
                            Notre équipe juridique et notre support client sont à votre disposition pour toute question relative à ces conditions.
                        </p>
                    </div>
                    <button className="bg-orange-500 text-white px-10 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:scale-[1.05] transition-all">
                        Contacter le support
                    </button>
                </motion.div>
            </div>
        </div>
      </main>
    </div>
  );
}
