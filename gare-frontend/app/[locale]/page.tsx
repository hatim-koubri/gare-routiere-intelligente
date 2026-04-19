'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslations } from '@/lib/hooks/useTranslations';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function HomePage() {
  const { user } = useAuth();
  const { locale } = useParams();
  const t = useTranslations();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            {t.common.welcome}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Votre plateforme de réservation de bus au Maroc
          </p>
          
          {!user ? (
            <div className="flex gap-4 justify-center">
              <Link
                href={`/${locale}/auth/login`}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                {t.common.login}
              </Link>
              <Link
                href={`/${locale}/auth/register`}
                className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition"
              >
                {t.common.register}
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-xl mb-4">
                {t.common.welcome} {user.prenom} {user.nom}
              </p>
              <Link
                href={`/${locale}/dashboard`}
                className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition"
              >
                {t.common.dashboard}
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}