'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Sparkles, Luggage } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AcheterBagageForm } from '@/components/voyageur/AcheterBagageForm';

/* ── Floating particles ── */
function PageParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1.5 + Math.random() * 3,
    delay: Math.random() * 6,
    duration: 4 + Math.random() * 6,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-gradient-to-br from-orange-300/20 to-red-400/10 dark:from-orange-500/10 dark:to-red-500/5"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -40 - Math.random() * 30],
            x: [0, (Math.random() - 0.5) * 20],
            opacity: [0, 0.6, 0],
            scale: [0, 1.2, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function AcheterBagagePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const reservationId = params?.id as string;

  if (!authLoading && !user) {
    router.push('/fr/auth/login');
    return null;
  }

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
        <div className="relative">
          <div className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-1 rounded-full border-2 border-orange-200/30 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>
        <p className="text-slate-400 dark:text-zinc-500 text-sm font-bold tracking-wider uppercase">Chargement</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <PageParticles />

      {/* Hero Header - premium glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 shadow-2xl shadow-orange-500/20"
      >
        {/* Decorative gradient orbs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-yellow-300/5 rounded-full blur-3xl" />

        {/* Sparkle particles in header */}
        <div className="absolute inset-0 pointer-events-none">
          {[0, 1, 2, 3, 4].map(i => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full"
              style={{ left: `${15 + i * 20}%`, top: `${10 + (i % 3) * 30}%` }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.7,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        <div className="relative p-8 md:p-10">
          <div className="flex items-center gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={`/fr/voyageur/reservations/${reservationId}`}
                className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm border border-white/10"
              >
                <ArrowLeft size={18} className="text-white" />
              </Link>
            </motion.div>
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 mb-1"
              >
                <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.25em]">RIHLA</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.25em]">Gare Routière</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="text-3xl md:text-4xl font-black text-white tracking-tight"
              >
                Acheter un bagage
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-white/70 mt-1 font-medium"
              >
                Avant le départ, depuis l&apos;application
              </motion.p>
            </div>
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 200 }}
              className="hidden sm:flex w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md items-center justify-center border border-white/10 shadow-lg"
            >
              <Luggage size={30} className="text-white" />
            </motion.div>
          </div>
        </div>

        {/* Decorative bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/5 to-transparent" />
      </motion.div>

      {/* Info banner - premium glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', damping: 20 }}
        className="relative overflow-hidden flex items-start gap-4 p-6 bg-gradient-to-br from-orange-50/90 to-amber-50/90 dark:from-orange-500/10 dark:to-amber-500/5 border border-orange-200/30 dark:border-orange-800/20 rounded-[2rem] backdrop-blur-sm shadow-sm"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-orange-300/10 to-amber-300/10 rounded-full blur-3xl" />
        <motion.div
          whileHover={{ rotate: 10, scale: 1.05 }}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-400/20"
        >
          <Sparkles size={20} className="text-white" />
        </motion.div>
        <div className="relative">
          <p className="text-base font-black text-slate-900 dark:text-white mb-1 tracking-tight">Bagages supplémentaires</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-lg">
            Augmentez votre franchise de bagages et voyagez sans souci avec vos affaires supplémentaires.
            Choisissez le type de bagage et ajustez le poids selon vos besoins.
          </p>
        </div>
      </motion.div>

      {/* Formulaire - premium card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: 'spring', damping: 20 }}
        className="bg-white dark:bg-zinc-900/95 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-lg shadow-slate-200/50 dark:shadow-black/20 backdrop-blur-sm p-6 md:p-8"
      >
        <AcheterBagageForm
          reservationId={reservationId}
          onSuccess={() => router.push(`/fr/voyageur/reservations/${reservationId}`)}
        />
      </motion.div>
    </div>
  );
}
