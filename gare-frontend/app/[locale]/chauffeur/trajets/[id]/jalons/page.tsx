'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { chauffeurJalonApi } from '@/lib/api/chauffeur/jalons';
import { chauffeurTrajetApi } from '@/lib/api/chauffeur/trajets';
import { Role, Arret } from '@/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

interface TrajetAvecArrets {
  id: number;
  villeDepart?: string;
  villeArrivee?: string;
  arrets?: Arret[];
}

export default function JalonsPage() {
  const { id, locale } = useParams();
  const router = useRouter();
  const [trajet, setTrajet] = useState<TrajetAvecArrets | null>(null);
  const [arrets, setArrets] = useState<Arret[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<number | null>(null);

  useEffect(() => {
    loadTrajet();
  }, [id]);

  const loadTrajet = async () => {
    setLoading(true);
    try {
      const trajetsData = await chauffeurTrajetApi.getTrajetsJour();
      // Utiliser 'as any' pour contourner le typage
      const found = (trajetsData as any[]).find((t) => t.id === Number(id));
      
      if (found) {
        setTrajet(found);
        setArrets(found.arrets || []);
      }
    } catch (error) {
      console.error('Erreur chargement trajet', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValiderJalon = async (arret: Arret) => {
    setValidating(arret.ordre || 0);
    try {
      await chauffeurJalonApi.validerJalon({
        trajetId: Number(id),
        ville: arret.ville,
        ordre: arret.ordre || 0,
      });
      alert(`✅ Jalon "${arret.ville}" validé avec succès !`);
      loadTrajet();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setValidating(null);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[Role.CHAUFFEUR]}>
        <Header />
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[Role.CHAUFFEUR]}>
      <Header />
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="mb-6">
            <Link href={`/${locale}/chauffeur/dashboard`} className="text-blue-600 hover:underline">
              ← Retour
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-2">Jalons du trajet</h1>
            <p className="text-gray-600 mb-4">
              Trajet #{id}
            </p>

            <div className="space-y-3">
              {arrets.length > 0 ? (
                arrets.map((arret, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                        {arret.ordre}
                      </div>
                      <div>
                        <p className="font-semibold">{arret.ville}</p>
                        {arret.dureePauseMinutes ? (
                          <p className="text-sm text-gray-500">Pause: {arret.dureePauseMinutes} min</p>
                        ) : null}
                      </div>
                    </div>
                    <button
                      onClick={() => handleValiderJalon(arret)}
                      disabled={validating === arret.ordre}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm"
                    >
                      {validating === arret.ordre ? 'Validation...' : '✅ Valider'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucun arrêt programmé pour ce trajet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </ProtectedRoute>
  );
}