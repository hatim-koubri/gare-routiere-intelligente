'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { MapPin, Search, ShieldCheck, Clock, CheckCircle2, Ticket, Smartphone, Wifi, Coffee, ChevronRight, Wind, Zap, Calendar, ArrowLeftRight } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';

export default function HomePage() {
    const router = useRouter();
    
    // Form State for the Tablet UI
    const [depart, setDepart] = useState('');
    const [arrivee, setArrivee] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [passagers, setPassagers] = useState(1);

    const handleChipClick = (dep: string, arr: string) => {
        setDepart(dep);
        setArrivee(arr);
    };

    const handleSearch = () => {
        if (!depart || !arrivee || !date) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        
        // Rediriger vers la page de recherche avec les paramètres
        const params = new URLSearchParams({
            villeDepart: depart,
            villeArrivee: arrivee,
            date: date,
            passagers: passagers.toString()
        });
        
        router.push(`/fr/recherche?${params.toString()}`);
    };

    const handleSwap = () => {
        setDepart(arrivee);
        setArrivee(depart);
    };

    // TOTAL Hero Section (Static Phase)
    const heroRef = useRef<HTMLDivElement>(null);

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-orange-500/20">
            {/* The header - Fixed for continuous visibility over the cinematic sections */}
            <div className="fixed top-0 left-0 w-full z-[500] pointer-events-none">
                <div className="pointer-events-auto">
                    <Header />
                </div>
            </div>

            <main className="flex flex-col relative w-full bg-background">
                
                {/* 
                  =======================================================
                  ROCK-SOLID UNIFIED HERO
                  =======================================================
                */}
                <section ref={heroRef} className="relative w-full min-h-[90vh] flex flex-col items-center justify-center pt-24">
                    
                    {/* Background Video Layer */}
                    <div className="absolute inset-0 z-0 overflow-hidden">
                        <video 
                            className="absolute inset-0 w-full h-full object-cover"
                            src="/hero/video.mp4"
                            autoPlay muted loop playsInline 
                        />
                        {/* Darkness Vignette overlay */}
                        <div className="absolute inset-0 bg-black/60 z-10 pointer-events-none" />
                    </div>
                    
                    {/* Hero Content */}
                    <div className="relative z-20 w-full max-w-7xl px-6 flex flex-col items-center text-center">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="mb-12"
                        >
                            <h1 
                                className="text-4xl md:text-7xl font-black text-white tracking-tight uppercase drop-shadow-2xl"
                                style={{ textShadow: "0px 10px 30px rgba(0,0,0,0.8)" }}
                            >
                                L'avenir du <span className="text-orange-500">Voyage</span>
                            </h1>
                            <p 
                                className="text-white/90 text-lg md:text-2xl font-light tracking-[0.2em] mt-4 uppercase drop-shadow-lg"
                            >
                                Commence dès la réservation
                            </p>
                        </motion.div>

                        {/* Functional Search Form (Premium Style) */}
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="w-full max-w-5xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-white/20 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-orange-600" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end relative z-10">
                                <div className="md:col-span-3 flex flex-col gap-2 text-left relative">
                                    <label className="text-[10px] uppercase text-slate-400 font-bold tracking-[0.15em] ml-1">Départ</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 transition-transform group-focus-within:scale-110">
                                            <MapPin size={18} />
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="Casablanca"
                                            value={depart}
                                            onChange={(e) => setDepart(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold text-slate-800 dark:text-white outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                                        />
                                    </div>

                                    {/* Swap Button (Desktop) */}
                                    <div className="absolute -right-3 top-[52px] -translate-y-1/2 z-20 hidden md:block">
                                        <button 
                                            onClick={handleSwap}
                                            type="button"
                                            className="w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white transition-all transform hover:rotate-180"
                                        >
                                            <ArrowLeftRight size={14} />
                                        </button>
                                    </div>

                                    {/* Swap Button (Mobile) */}
                                    <div className="flex md:hidden justify-center -mb-2 mt-1 z-20">
                                        <button 
                                            onClick={handleSwap}
                                            type="button"
                                            className="w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white transition-all transform rotate-90"
                                        >
                                            <ArrowLeftRight size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="md:col-span-3 flex flex-col gap-2 text-left">
                                    <label className="text-[10px] uppercase text-slate-400 font-bold tracking-[0.15em] ml-1">Arrivée</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 transition-transform group-focus-within:scale-110">
                                            <MapPin size={18} />
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="Marrakech"
                                            value={arrivee}
                                            onChange={(e) => setArrivee(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold text-slate-800 dark:text-white outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-3 flex flex-col gap-2 text-left">
                                    <label className="text-[10px] uppercase text-slate-400 font-bold tracking-[0.15em] ml-1">Date</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 transition-transform group-focus-within:scale-110">
                                            <Calendar size={18} />
                                        </div>
                                        <input 
                                            type="date" 
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold text-slate-800 dark:text-white outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-3">
                                    <button 
                                        onClick={handleSearch}
                                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl py-4 h-[58px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                                    >
                                        Rechercher <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8 flex flex-wrap gap-3 justify-center items-center relative z-10">
                                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mr-2">Populaire :</span>
                                <button onClick={() => handleChipClick('Casablanca', 'Marrakech')} className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-5 py-2.5 rounded-full hover:bg-orange-500 hover:text-white transition-all transform hover:-translate-y-0.5 border border-transparent hover:border-orange-200">
                                    Casa → Marrakech
                                </button>
                                <button onClick={() => handleChipClick('Rabat', 'Fès')} className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-5 py-2.5 rounded-full hover:bg-orange-500 hover:text-white transition-all transform hover:-translate-y-0.5 border border-transparent hover:border-orange-200">
                                    Rabat → Fès
                                </button>
                                <button onClick={() => handleChipClick('Tanger', 'Casablanca')} className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-5 py-2.5 rounded-full hover:bg-orange-500 hover:text-white transition-all transform hover:-translate-y-0.5 border border-transparent hover:border-orange-200">
                                    Tanger → Casa
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </section>


                {/* Infinite Marquee Premium */}
                <div className="w-full py-6 overflow-hidden border-y border-border relative z-20 bg-background/50 backdrop-blur-xl">
                    <div className="flex w-max animate-infinite-scroll">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-12 mx-6">
                                <span className="text-muted-foreground font-medium text-sm whitespace-nowrap uppercase tracking-[0.2em] flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"/> Réservation Express</span>
                                <span className="text-muted-foreground font-medium text-sm whitespace-nowrap uppercase tracking-[0.2em] flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"/> Paiement Sécurisé</span>
                                <span className="text-muted-foreground font-medium text-sm whitespace-nowrap uppercase tracking-[0.2em] flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"/> 50+ Villes Desservies</span>
                                <span className="text-muted-foreground font-medium text-sm whitespace-nowrap uppercase tracking-[0.2em] flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"/> Support 24/7</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 
                  =======================================================
                  BENTO GRID DESTINATIONS (PREMIUM)
                  =======================================================
                */}
                <section className="py-32 w-full relative z-20 bg-background overflow-hidden">
                    <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-orange-500/10 blur-[150px] rounded-full pointer-events-none" />
                    
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="text-center mb-20"
                        >
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 text-foreground uppercase drop-shadow-sm">Destinations <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Populaires</span></h2>
                            <p className="text-muted-foreground text-xl md:text-2xl font-light max-w-3xl mx-auto">Explorez le Royaume avec un niveau de confort sans précédent. Des trajets mythiques, magnifiquement servis.</p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[650px] font-sans">
                            {/* Large Tile */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, delay: 0.1 }}
                                className="md:col-span-2 md:row-span-2 relative rounded-[2rem] overflow-hidden group cursor-pointer border border-border bg-card"
                            >
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1597212618440-806262de4f6a?q=80&w=2500&auto=format&fit=crop')] bg-cover bg-center brightness-75 dark:brightness-50 group-hover:scale-110 transition-transform duration-[1.5s] ease-out" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90" />
                                
                                <div className="absolute bottom-0 left-0 p-10 w-full flex flex-col justify-end translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <span className="bg-orange-500/20 text-orange-400 text-xs tracking-widest uppercase font-bold border border-orange-500/30 px-4 py-1.5 rounded-full mb-4 inline-block backdrop-blur-md">First Class</span>
                                            <h3 className="text-white text-5xl font-black mb-2 uppercase tracking-tighter">Marrakech</h3>
                                            <p className="text-white/80 text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">La cité ocre, accessible dans un confort ultime.</p>
                                        </div>
                                        <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 group-hover:-rotate-45 shadow-2xl">
                                            <ChevronRight size={24}/>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Top Right Tile */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, delay: 0.2 }}
                                className="md:col-span-2 md:row-span-1 relative rounded-[2rem] overflow-hidden group cursor-pointer border border-border bg-card"
                            >
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center brightness-75 dark:brightness-50 group-hover:scale-110 transition-transform duration-[1.5s] ease-out" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-90" />
                                
                                <div className="absolute bottom-0 left-0 p-8 w-full flex justify-between items-end">
                                    <div className="group-hover:-translate-y-2 transition-transform duration-500">
                                        <h3 className="text-white text-4xl font-black mb-1 uppercase tracking-tighter">Casablanca</h3>
                                        <p className="text-white/80 text-sm tracking-widest uppercase">Énergie & Business</p>
                                    </div>
                                    <span className="text-orange-400 font-bold bg-orange-500/10 border border-orange-500/20 backdrop-blur-md px-5 py-2.5 rounded-2xl text-sm group-hover:bg-orange-500 group-hover:text-white transition-colors duration-500 shadow-lg">Dès 80 DH</span>
                                </div>
                            </motion.div>

                            {/* Bottom Right 1 */}
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, delay: 0.3 }}
                                className="md:col-span-1 md:row-span-1 rounded-[2rem] p-8 flex flex-col justify-between group cursor-pointer bg-card border border-border hover:border-orange-500/30 hover:bg-secondary/50 dark:hover:bg-secondary/20 transition-all duration-500 shadow-sm hover:shadow-xl"
                            >
                                <div>
                                    <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-500">
                                        <MapPin size={24} />
                                    </div>
                                    <h3 className="font-black text-3xl text-foreground uppercase tracking-tighter mb-2">Tanger</h3>
                                    <p className="text-muted-foreground text-sm">La porte de l'Europe.</p>
                                </div>
                                <div className="flex justify-end text-muted-foreground group-hover:text-orange-500 transition-colors duration-500 group-hover:translate-x-2">
                                    <ChevronRight size={24} />
                                </div>
                            </motion.div>

                            {/* Bottom Right 2 */}
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, delay: 0.4 }}
                                className="md:col-span-1 md:row-span-1 rounded-[2rem] p-8 flex flex-col justify-between group cursor-pointer bg-card border border-border hover:border-orange-500/30 hover:bg-secondary/50 dark:hover:bg-secondary/20 transition-all duration-500 shadow-sm hover:shadow-xl"
                            >
                               <div>
                                    <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-500">
                                        <MapPin size={24} />
                                    </div>
                                    <h3 className="font-black text-3xl text-foreground uppercase tracking-tighter mb-2">Agadir</h3>
                                    <p className="text-muted-foreground text-sm">Soleil et Océan.</p>
                                </div>
                                <div className="flex justify-end text-muted-foreground group-hover:text-orange-500 transition-colors duration-500 group-hover:translate-x-2">
                                    <ChevronRight size={24} />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* 
                  =======================================================
                  COMMENT ÇA MARCHE (THEMED TIMELINE)
                  =======================================================
                */}
                <section className="py-32 w-full relative overflow-hidden bg-background border-t border-border">
                    {/* Glowing Orbs in background */}
                    <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-orange-600/5 blur-[150px] rounded-full -translate-y-1/2 pointer-events-none" />
                    <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-orange-400/5 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none" />

                    <div className="max-w-6xl mx-auto px-6 relative z-10">
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-24"
                        >
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-foreground uppercase drop-shadow-sm">Le Voyage <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Simplifié</span></h2>
                            <p className="text-muted-foreground text-xl font-light max-w-2xl mx-auto">Un processus digitalisé pour une expérience sans aucune friction, de la réservation à l'arrivée.</p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
                            {/* Horizontal Line joining them (Desktop) */}
                            <motion.div 
                                initial={{ scaleX: 0 }}
                                whileInView={{ scaleX: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                className="hidden md:block absolute top-[48px] left-[16%] w-[68%] h-[2px] bg-gradient-to-r from-white/5 via-orange-500/50 to-white/5 z-0 origin-left" 
                            />

                            {/* Step 1 */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.7 }}
                                className="relative z-10 flex flex-col items-center text-center group"
                            >
                                <div className="w-24 h-24 bg-card backdrop-blur-md border border-border rounded-[2rem] shadow-xl flex items-center justify-center mb-8 text-muted-foreground group-hover:text-orange-500 group-hover:border-orange-500/50 group-hover:-translate-y-2 transition-all duration-500 relative">
                                    <div className="absolute inset-0 bg-transparent group-hover:bg-orange-500/10 rounded-[2rem] blur-xl transition-all duration-500" />
                                    <Smartphone strokeWidth={1.5} size={36} className="relative z-10" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-foreground uppercase tracking-wider">1. Recherchez</h3>
                                <p className="text-muted-foreground font-light px-4">Indiquez vos dates et choisissez parmi nos trajets optimums.</p>
                            </motion.div>

                            {/* Step 2 */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4, duration: 0.7, type: "spring" }}
                                className="relative z-10 flex flex-col items-center text-center group"
                            >
                                <div className="w-28 h-28 bg-gradient-to-br from-orange-400 to-orange-600 text-white border border-orange-400/20 rounded-[2rem] shadow-[0_0_40px_rgba(249,115,22,0.3)] flex items-center justify-center mb-6 group-hover:-translate-y-3 transition-transform duration-500 relative">
                                     <Ticket strokeWidth={1.5} size={44} />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-foreground uppercase tracking-wider mt-2">2. Réservez</h3>
                                <p className="text-muted-foreground font-light px-4">Validation instantanée et paiement 100% sécurisé.</p>
                            </motion.div>

                            {/* Step 3 */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.6, duration: 0.7 }}
                                className="relative z-10 flex flex-col items-center text-center group"
                            >
                                <div className="w-24 h-24 bg-card backdrop-blur-md border border-border rounded-[2rem] shadow-xl flex items-center justify-center mb-8 text-muted-foreground group-hover:text-orange-500 group-hover:border-orange-500/50 group-hover:-translate-y-2 transition-all duration-500 relative">
                                    <div className="absolute inset-0 bg-transparent group-hover:bg-orange-500/10 rounded-[2rem] blur-xl transition-all duration-500" />
                                    <CheckCircle2 strokeWidth={1.5} size={36} className="relative z-10" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-foreground uppercase tracking-wider">3. Voyagez</h3>
                                <p className="text-muted-foreground font-light px-4">Présentez votre e-ticket en embarquant. C'est tout.</p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* 
                  =======================================================
                  FLOTTE & CONFORT (PREMIUM THEMED)
                  =======================================================
                */}
                <div className="w-full py-6 overflow-hidden border-y border-border relative z-20 bg-secondary/30 backdrop-blur-xl shadow-sm">
                    <div className="flex w-max animate-infinite-scroll-reverse">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-12 mx-6">
                                <span className="text-muted-foreground font-bold text-sm whitespace-nowrap uppercase tracking-[0.3em] flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"/> <Wifi size={16} className="text-orange-500" /> Connectivité Wi-Fi 
                                </span>
                                <span className="text-muted-foreground font-bold text-sm whitespace-nowrap uppercase tracking-[0.3em] flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"/> <Coffee size={16} className="text-orange-500" /> Sièges VIP Inclinables
                                </span>
                                <span className="text-muted-foreground font-bold text-sm whitespace-nowrap uppercase tracking-[0.3em] flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"/> <Wind size={16} className="text-orange-500" /> Climatisation Individuelle
                                </span>
                                <span className="text-muted-foreground font-bold text-sm whitespace-nowrap uppercase tracking-[0.3em] flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"/> <Zap size={16} className="text-orange-500" /> Prises USB & 220V
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <section className="py-32 w-full relative bg-background">
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-orange-600/5 blur-[150px] rounded-full pointer-events-none" />

                    <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Text Content */}
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="order-2 lg:order-1"
                        >
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 leading-tight text-foreground uppercase drop-shadow-sm">Votre confort <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 cursor-default">avant tout.</span></h2>
                            <p className="text-xl text-muted-foreground mb-12 font-light">Nous collaborons uniquement avec des compagnies certifiées premium pour garantir un standard de voyage irréprochable.</p>
                            
                            <ul className="space-y-6">
                                <motion.li whileHover={{ x: 10 }} className="flex items-start gap-6 cursor-default transition-all duration-300 group p-6 rounded-[2rem] border border-border bg-card hover:bg-secondary/50 dark:hover:bg-secondary/20 hover:border-orange-500/20 shadow-sm">
                                    <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mt-1 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-500 shadow-md transform group-hover:rotate-6"><Wifi size={24} /></div>
                                    <div>
                                        <h4 className="font-bold text-2xl mb-2 text-foreground uppercase tracking-wider">Wi-Fi Haut Débit</h4>
                                        <p className="text-muted-foreground font-light">Restez connecté en tout temps avec notre réseau partagé très haut débit, idéal pour le divertissement ou le télétravail.</p>
                                    </div>
                                </motion.li>
                                <motion.li whileHover={{ x: 10 }} className="flex items-start gap-6 cursor-default transition-all duration-300 group p-6 rounded-[2rem] border border-border bg-card hover:bg-secondary/50 dark:hover:bg-secondary/20 hover:border-orange-500/20 shadow-sm">
                                    <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mt-1 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-500 shadow-md transform group-hover:rotate-6"><Coffee size={24} /></div>
                                    <div>
                                        <h4 className="font-bold text-2xl mb-2 text-foreground uppercase tracking-wider">Espace de détente</h4>
                                        <p className="text-muted-foreground font-light">Des sièges ergonomiques extra-larges, inclinables, avec espace dédié pour les jambes.</p>
                                    </div>
                                </motion.li>
                                <motion.li whileHover={{ x: 10 }} className="flex items-start gap-6 cursor-default transition-all duration-300 group p-6 rounded-[2rem] border border-border bg-card hover:bg-secondary/50 dark:hover:bg-secondary/20 hover:border-orange-500/20 shadow-sm">
                                    <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mt-1 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-500 shadow-md transform group-hover:rotate-6"><ShieldCheck size={24} /></div>
                                    <div>
                                        <h4 className="font-bold text-2xl mb-2 text-foreground uppercase tracking-wider">Sécurité Absolue</h4>
                                        <p className="text-muted-foreground font-light">Flotte suivie par GPS 24/7 et chauffeurs relais pour les longues distances.</p>
                                    </div>
                                </motion.li>
                            </ul>
                        </motion.div>

                        {/* Image Parallax */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="order-1 lg:order-2 relative h-[600px] lg:h-[800px] w-full rounded-[3rem] overflow-hidden bg-card border border-border group"
                        >
                             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center brightness-90 dark:brightness-50 group-hover:scale-105 transition-transform duration-[2s] ease-out" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                             
                             <div className="absolute inset-0 flex items-end p-6 md:p-10">
                                <motion.div 
                                    whileHover={{ y: -5 }}
                                    className="bg-card/40 dark:bg-black/40 backdrop-blur-xl p-6 rounded-[2rem] border border-border dark:border-white/10 flex items-center gap-6 w-full text-foreground dark:text-white cursor-default shadow-2xl relative overflow-hidden group/card"
                                >
                                    <div className="absolute inset-0 bg-transparent group-hover/card:bg-orange-500/5 transition-colors duration-500" />
                                    <div className="bg-gradient-to-br from-orange-400 to-orange-600 text-white w-20 h-20 rounded-[1.5rem] flex items-center justify-center font-black text-3xl shadow-[0_0_30px_rgba(249,115,22,0.3)] relative z-10 shrink-0">
                                        4.9
                                    </div>
                                    <div className="relative z-10 font-sans">
                                        <div className="font-black text-xl md:text-2xl uppercase tracking-wider mb-1">Satisfaction Totale</div>
                                        <div className="text-muted-foreground dark:text-white/50 text-sm md:text-base font-light">Plus de 10k voyageurs témoignent</div>
                                    </div>
                                </motion.div>
                             </div>
                        </motion.div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

// Simple watermark decorative component for inside the form
const BusIconHuge = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6v6"/>
        <path d="M15 6v6"/>
        <path d="M2 12h19.6"/>
        <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
        <circle cx="7" cy="18" r="2"/>
        <path d="M9 18h5"/>
        <circle cx="16" cy="18" r="2"/>
    </svg>
)