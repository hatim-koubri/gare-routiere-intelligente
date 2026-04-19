'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const { user, logout } = useAuth();
  const { locale } = useParams();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push(`/${locale}/auth/login`);
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href={`/${locale}`} className="text-xl font-bold text-blue-600">
          Gare Maroc
        </Link>
        
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          
          {user ? (
            <div className="flex items-center gap-4">
              <Link href={`/${locale}/dashboard`} className="text-gray-700 hover:text-blue-600">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                href={`/${locale}/auth/login`}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Connexion
              </Link>
              <Link
                href={`/${locale}/auth/register`}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Inscription
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}