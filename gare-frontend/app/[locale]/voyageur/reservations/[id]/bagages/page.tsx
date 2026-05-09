// app/[locale]/voyageur/reservations/[id]/bagages/page.tsx
'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import { AcheterBagageForm } from '@/components/voyageur/AcheterBagageForm';

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
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/fr/voyageur/reservations/${reservationId}`}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Acheter un bagage supplémentaire</h1>
          <p className="text-sm text-gray-500 mt-1">
            Avant le départ, depuis l'application
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <Package className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-1">Achetez des bagages supplémentaires</p>
          <p>Augmentez votre franchise de bagages et voyagez sans souci avec vos affaires supplémentaires.</p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <AcheterBagageForm
          reservationId={reservationId}
          onSuccess={() => router.push(`/fr/voyageur/reservations/${reservationId}`)}
        />
      </div>
    </div>
  );
}
