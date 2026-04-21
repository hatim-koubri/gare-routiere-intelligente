'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Role } from '@/types';
import AdminSidebar from './AdminSidebar';
import Header from '@/components/layout/Header';
import { motion } from 'framer-motion';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { locale } = useParams();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== Role.ADMIN)) {
      router.push(`/${locale}/dashboard`);
    }
  }, [user, isLoading, router, locale]);

  if (!user || user.role !== Role.ADMIN) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-indigo-500/30 relative overflow-hidden transition-colors duration-700">
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-emerald-500/10 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-600/5 blur-[130px] rounded-full animate-pulse" 
               style={{ animationDelay: '2s' }} />
      </div>
      
      {/* Noise Overlay for texture */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

      <div className="flex flex-row flex-nowrap h-screen w-full overflow-hidden relative z-10">
        <AdminSidebar />
        <main className="flex-1 flex flex-col min-w-0 h-full bg-transparent overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8"
          >
            <div className="max-w-[1700px] mx-auto">
                {children}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}