// app/[locale]/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRouterPage() {
  const router = useRouter();
  const locale = 'fr';
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = () => {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      
      if (!token || !userStr) {
        router.push(`/fr/auth/login`);
        return;
      }
      
      try {
        const user = JSON.parse(userStr);
        
        // Rediriger selon le rôle
        switch (user.role) {
          case 'ADMIN':
            router.push(`/fr/admin/dashboard`);
            break;
          case 'CHAUFFEUR':
            router.push(`/fr/chauffeur/dashboard`);
            break;
          case 'VOYAGEUR':
            router.push(`/fr/voyageur/dashboard`);
            break;
          case 'RESPONSABLE_COMPAGNIE':
            router.push(`/fr/responsable`);
            break;
          default:
            router.push(`/fr/auth/login`);
        }
      } catch (error) {
        console.error('Erreur de redirection:', error);
        router.push(`/fr/auth/login`);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthAndRedirect();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return null;
}