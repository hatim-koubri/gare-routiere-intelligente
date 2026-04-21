'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Role } from '@/types';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { QrCode, MapPin } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { locale } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(`/${locale}/auth/login`);
      } else if (user.role === Role.ADMIN || user.role === Role.RESPONSABLE) {
        router.push(`/${locale}/admin`);
      }
    }
  }, [user, isLoading, router, locale]);

  if (isLoading || !user) return (
      <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-12 h-12 border-t-[3px] border-indigo-500 rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
      </div>
  );

  // ==========================================
  // VIEW: VOYAGEUR
  // ==========================================
  if (user.role === Role.VOYAGEUR) {
    return (
      <div className="min-h-screen bg-background text-foreground selection:bg-indigo-500/30">
          <Header />
          <main className="pt-32 px-6 md:px-12 max-w-[1500px] mx-auto pb-24 relative">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none" />
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-16"
              >
                  <h1 className="text-5xl font-black tracking-tighter text-foreground italic mb-2 capitalize">Bonjour, {user.prenom || 'Voyageur'}.</h1>
                  <p className="text-muted-foreground font-medium opacity-60 tracking-wide uppercase text-xs">Terminal Access / Passenger Dashboard</p>
              </motion.div>

              {/* Hero Trip Card - CINEMATIC UPGRADE */}
              <motion.div 
                whileHover={{ y: -8 }}
                className="w-full glass-premium rounded-[3rem] p-10 md:p-16 relative overflow-hidden mb-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-12 border-white/10 group transition-all duration-700"
              >
                  <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                  
                  <div className="relative z-10 space-y-8">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          Next Departure Confirmed
                      </div>
                      
                      <h2 className="text-5xl md:text-7xl font-black italic text-white tracking-tighter leading-tight drop-shadow-2xl">
                          Marrakech <br/>
                          <span className="text-indigo-500 opacity-40 mx-2">↠</span> 
                          Casablanca
                      </h2>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-4">
                          <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Boarding Time</span>
                              <span className="text-xl font-bold text-white tracking-tight">14:30 <span className="text-[10px] opacity-40">UTC+1</span></span>
                          </div>
                          <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Terminal Segment</span>
                              <span className="text-xl font-bold text-white tracking-tight">Slot 04</span>
                          </div>
                          <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Seat Allocation</span>
                              <span className="text-xl font-bold text-white tracking-tight">12A <span className="text-[10px] opacity-40">Window</span></span>
                          </div>
                      </div>
                  </div>

                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="relative z-10 bg-white p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex-shrink-0 group/qr"
                  >
                      <div className="absolute inset-0 bg-indigo-500/5 rounded-[2.5rem] group-hover/qr:bg-indigo-500/10 transition-colors" />
                      <QrCode size={160} className="text-black relative z-10" strokeWidth={1.5} />
                      <div className="text-center font-black text-[11px] text-black/40 mt-4 tracking-[0.4em] relative z-10 uppercase">B-9482X</div>
                  </motion.div>
              </motion.div>

              {/* Bento Grid Upgrade */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-[280px]">
                  {/* Status Card */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="md:col-span-4 row-span-2 glass-premium rounded-[2.5rem] p-10 flex flex-col justify-between group"
                  >
                      <div>
                          <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                <Activity size={18} />
                            </div>
                            <h3 className="font-black text-lg text-white uppercase tracking-tighter italic">Live Telemetry</h3>
                          </div>
                          
                          <div className="w-full h-1 bg-white/5 relative mb-10 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: "0%" }}
                                animate={{ width: "65%" }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                                className="absolute top-0 left-0 h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                              />
                          </div>
                          <p className="text-muted-foreground text-[15px] font-medium leading-relaxed opacity-70 italic">
                            The shuttle is currently in preparation phase. Boarding sequence initiates in 35 cycles.
                          </p>
                      </div>
                      <button className="w-full bg-indigo-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.03] transition-all">
                        Locate Asset
                      </button>
                  </motion.div>

                  {/* History Card */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="md:col-span-8 row-span-1 glass-premium rounded-[2.5rem] p-10 relative overflow-hidden group cursor-pointer border-indigo-500/10"
                  >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                      <div className="relative z-10 flex justify-between items-center h-full">
                          <div>
                              <h3 className="text-3xl font-black mb-1 italic uppercase tracking-tighter text-white">Log History</h3>
                              <p className="text-muted-foreground text-sm font-medium opacity-60">Review your 12 previous network traversals.</p>
                          </div>
                          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 group-hover:rotate-45">
                              <ChevronRight size={24} />
                          </div>
                      </div>
                  </motion.div>

                  {/* VIP Service Card */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="md:col-span-8 row-span-1 bg-indigo-600 rounded-[2.5rem] p-10 flex justify-between items-center relative overflow-hidden shadow-2xl shadow-indigo-500/20"
                  >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="relative z-10">
                          <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Priority Support</h3>
                          <p className="text-white/70 text-sm font-medium max-w-sm">Direct encrypted channel to our dispatch team. Response guaranteed in &lt; 5m.</p>
                      </div>
                      <button className="relative z-10 bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                        Open Channel
                      </button>
                  </motion.div>
              </div>
          </main>
      </div>
    );
  }

  // ==========================================
  // VIEW: CHAUFFEUR
  // ==========================================
  if (user.role === Role.CHAUFFEUR) {
      return (
          <div className="min-h-screen bg-background text-foreground selection:bg-indigo-500/30 overflow-hidden">
              <Header />
              <main className="pt-32 px-6 max-w-[900px] mx-auto h-[100svh] flex flex-col justify-between pb-12 relative">
                  <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none" />
                  
                  <div className="space-y-12 relative z-10">
                      <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[11px] font-black uppercase tracking-[0.4em]"
                      >
                            STATUS: IN PREPARATION
                      </motion.div>
                      
                      <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter italic"
                      >
                          Marrakech <br/> 
                          <span className="text-indigo-500 opacity-30">↠</span> Agadir
                      </motion.h1>

                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="glass-premium rounded-[3rem] p-10 flex flex-col sm:flex-row items-center justify-between gap-10 border-white/5"
                      >
                          <div className="flex flex-col items-center sm:items-start">
                              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Boarding Segment</div>
                              <div className="text-[120px] leading-[0.75] font-black text-white italic drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                  04
                              </div>
                          </div>
                          <div className="h-20 w-[1px] bg-white/10 hidden sm:block" />
                          <div className="flex flex-col items-center sm:items-end">
                              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Passenger Load</div>
                              <div className="text-[64px] leading-[0.8] font-black text-white italic">
                                  42<span className="text-2xl text-white/30 ml-2 font-light">/48</span>
                              </div>
                          </div>
                      </motion.div>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12"
                  >
                      <button className="w-full bg-indigo-500 text-white h-[90px] text-xl font-black uppercase tracking-[0.3em] rounded-[2.5rem] shadow-2xl shadow-indigo-500/40 hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden relative">
                           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                           INITIATE TRANSIT
                      </button>
                  </motion.div>
              </main>
          </div>
      );
  }

  return null;
}