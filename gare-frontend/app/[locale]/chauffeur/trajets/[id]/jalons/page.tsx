'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { chauffeurJalonApi } from '@/lib/api/chauffeur/jalons';
import { chauffeurTrajetApi } from '@/lib/api/chauffeur/trajets';
import { apiClient } from '@/lib/api/client';
import { Role, Arret } from '@/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default function JalonsPage() {
  const { id } = useParams();
  const locale = 'fr';
  const router = useRouter();
  const [trajet, setTrajet] = useState<any>(null);
  const [arrets, setArrets] = useState<Arret[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<number | null>(null);

  useEffect(() => {
    loadTrajetEtArrets();
  }, [id]);

  const loadTrajetEtArrets = async () => {
    setLoading(true);
    try {
      // 1. Récupérer les détails du trajet
      const trajetsData = await chauffeurTrajetApi.getTrajetsJour();
      const found = trajetsData.find((t: any) => t.id === Number(id));
      setTrajet(found || null);
      
      if (found) {
        // 2. Récupérer les arrêts via le nouvel endpoint chauffeur
        try {
          const arretsResponse = await apiClient.get(`/chauffeur/trajets/${id}/arrets`);
          console.log('Arrêts récupérés:', arretsResponse.data);
          setArrets(Array.isArray(arretsResponse.data) ? arretsResponse.data : []);
        } catch (error) {
          console.error('Erreur récupération arrêts:', error);
          setArrets([]);
        }
      } else {
        setArrets([]);
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
      loadTrajetEtArrets();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setValidating(null);
    }
  };

  // Calcul des temps de passage estimés
  const getHeurePassage = (arret: Arret) => {
    if (!trajet?.dateDepart) return 'N/A';
    const dateDepart = new Date(trajet.dateDepart);
    if (arret.heurePrevueOffsetMinutes) {
      dateDepart.setMinutes(dateDepart.getMinutes() + arret.heurePrevueOffsetMinutes);
      return dateDepart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return dateDepart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-6">
            <Link href={`/fr/chauffeur/dashboard`} className="text-blue-600 hover:underline">
              ← Retour
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-2">Jalons du trajet</h1>
            <p className="text-gray-600 mb-4">
              {trajet?.villeDepart || '?'} → {trajet?.villeArrivee || '?'}
            </p>
            
            {trajet?.dateDepart && (
              <p className="text-sm text-gray-500 mb-4">
                Départ: {new Date(trajet.dateDepart).toLocaleString()}
              </p>
            )}

            <div className="space-y-3">
              {arrets.length > 0 ? (
                arrets.map((arret, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                        {arret.ordre}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{arret.ville}</p>
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>⏰ Heure: {getHeurePassage(arret)}</span>
                          {arret.dureePauseMinutes && arret.dureePauseMinutes > 0 ? (
                            <span>⏸️ Pause: {arret.dureePauseMinutes} min</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleValiderJalon(arret)}
                      disabled={validating === arret.ordre}
                      className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
                    >
                      {validating === arret.ordre ? 'Validation...' : '✅ Valider'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-2">📌 Aucun arrêt programmé pour ce trajet</p>
                  <p className="text-sm">Ajoutez des arrêts à la ligne dans l'interface admin.</p>
                </div>
              )}
            </div>

            {/* Ligne de progression */}
            {arrets.length > 0 && (
              <div className="mt-8 pt-4 border-t">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>🏁 Départ</span>
                  <span>📍 Progression</span>
                  <span>🏁 Arrivée</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: '0%' }}
                  />
                </div>
                <div className="flex justify-between mt-3">
                  {arrets.map((arret, idx) => (
                    <div key={idx} className="text-center text-xs text-gray-400">
                      {arret.ville}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </ProtectedRoute>
  );
}