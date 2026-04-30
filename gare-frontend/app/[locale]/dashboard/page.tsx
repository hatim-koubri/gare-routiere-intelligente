// app/[locale]/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function DashboardRouterPage() {
  const router = useRouter();
  const { locale } = useParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        router.push(`/${locale}/auth/login`);
        return;
      }
      
      try {
        const user = JSON.parse(userStr);
        
        // Rediriger selon le rôle
        switch (user.role) {
          case 'ADMIN':
            router.push(`/${locale}/admin/dashboard`);
            break;
          case 'CHAUFFEUR':
            router.push(`/${locale}/chauffeur/dashboard`);
            break;
          case 'VOYAGEUR':
            router.push(`/${locale}/voyageur/dashboard`);
            break;
          case 'RESPONSABLE_COMPAGNIE':
            router.push(`/${locale}/responsable/dashboard`);
            break;
          default:
            router.push(`/${locale}/auth/login`);
        }
      } catch (error) {
        console.error('Erreur de redirection:', error);
        router.push(`/${locale}/auth/login`);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthAndRedirect();
  }, [router, locale]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return null;
}