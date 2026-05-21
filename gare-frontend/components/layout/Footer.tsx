'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export default function Footer() {

    return (
        <footer className="bg-background text-foreground border-t border-border pt-32 pb-12 overflow-hidden relative transition-colors duration-500">
            {/* Background Decorative Gradients */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10 w-full mb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Left Brand Column */}
                    <div className="lg:col-span-5">
                        <a href="/" className="relative group flex items-center shrink-0 cursor-pointer outline-none mb-8">
                            <motion.div
                                initial="initial"
                                whileHover="hover"
                                className="flex items-center"
                            >
                                {"RIHLA".split("").map((letter, index) => (
                                    <motion.span
                                        key={index}
                                        variants={{
                                            initial: { y: 0, filter: "blur(0px)" },
                                            hover: {
                                                y: -3,
                                                filter: "blur(0.2px)",
                                                transition: {
                                                    type: "spring",
                                                    stiffness: 400,
                                                    damping: 10,
                                                    delay: index * 0.03
                                                }
                                            }
                                        }}
                                        className={cn(
                                            "text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-orange-500 via-orange-600 to-red-600",
                                            "drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)] select-none"
                                        )}
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </motion.div>
                            <motion.div
                                className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-500/0 via-orange-500 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            />
                            <div className="absolute -inset-x-4 -inset-y-2 bg-orange-500/0 group-hover:bg-orange-500/[0.03] rounded-2xl transition-all duration-500 blur-xl -z-10" />
                        </a>
                        <p className="text-muted-foreground text-lg leading-relaxed max-w-sm mb-10">
                            La première plateforme intelligente du Maroc dédiée à la gestion des gares routières et à l'expérience passager.
                        </p>
                        
                        <div className="flex gap-4">
                            <button className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-white hover:bg-primary hover:border-primary transition-all">
                                <FacebookIcon />
                            </button>
                            <button className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-white hover:bg-primary hover:border-primary transition-all">
                                <TwitterIcon />
                            </button>
                            <button className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-white hover:bg-primary hover:border-primary transition-all">
                                <InstagramIcon />
                            </button>
                            <button className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-white hover:bg-primary hover:border-primary transition-all">
                                <LinkedinIcon />
                            </button>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="lg:col-span-2">
                        <h4 className="font-bold text-foreground uppercase tracking-wider mb-6 text-sm">Découvrir</h4>
                        <ul className="space-y-4">
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">À propos <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">Carrières <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">Presse & Medias <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">Contactez-nous <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a></li>
                        </ul>
                    </div>

                    <div className="lg:col-span-2">
                        <h4 className="font-bold text-foreground uppercase tracking-wider mb-6 text-sm">Services</h4>
                        <ul className="space-y-4">
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">Réservation Express <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">Suivi en direct <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">Cartes Abonnement <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a></li>
                            <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">Espace Chauffeur <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a></li>
                        </ul>
                    </div>

                    <div className="lg:col-span-3 bg-secondary/30 dark:bg-card p-6 rounded-2xl border border-border shadow-sm">
                        <h4 className="font-bold text-foreground mb-4">Abonnez-vous à la newsletter</h4>
                        <p className="text-muted-foreground text-sm mb-6">Recevez les meilleures offres de voyage et les mises à jour du réseau.</p>
                        <form className="flex gap-2">
                            <input 
                                type="email" 
                                placeholder="Votre email..." 
                                className="bg-background border border-border text-foreground placeholder-muted-foreground rounded-lg px-4 py-3 w-full focus:outline-none focus:border-primary transition-colors"
                            />
                            <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold shrink-0 shadow-md border-0">
                                S'abonner
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Huge WOW text */}
            <div className="w-full overflow-hidden select-none mb-12 flex justify-center opacity-[0.03] dark:opacity-[0.05] cursor-default">
                <h1 className="text-[clamp(100px,15vw,250px)] font-extrabold leading-none tracking-tighter text-foreground whitespace-nowrap">
                    PRÊT <span className="text-primary opacity-50">&</span> PARTIR ?
                </h1>
            </div>

            {/* Bottom bar */}
            <div className="max-w-7xl mx-auto px-6 border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-muted-foreground text-sm font-medium">
                    &copy; 2030 Gare Routière 4.0. Tous droits réservés.
                </p>
                <div className="flex gap-6 text-sm text-muted-foreground">
                    <a href="#" className="hover:text-primary transition-colors">Politique de confidentialité</a>
                    <a href="#" className="hover:text-primary transition-colors">Conditions générales</a>
                    <a href="#" className="hover:text-primary transition-colors">Mentions Légales</a>
                </div>
            </div>
        </footer>
    );
}

// Inline SVGs for brand icons removed from lucide
const FacebookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);
const TwitterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);
const InstagramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);
const LinkedinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);