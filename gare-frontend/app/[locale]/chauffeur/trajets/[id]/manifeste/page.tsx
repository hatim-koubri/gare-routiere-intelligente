'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { chauffeurTrajetApi } from '@/lib/api/chauffeur/trajets';
import { Role } from '@/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default function ManifestePage() {
  const { id, locale } = useParams();
  const router = useRouter();
  const [manifeste, setManifeste] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadManifeste();
  }, [id]);

  const loadManifeste = async () => {
    setLoading(true);
    try {
      const data = await chauffeurTrajetApi.getManifeste(Number(id));
      setManifeste(data);
    } catch (error: any) {
      console.error('Erreur chargement manifeste', error);
      setError(error.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
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
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Link href={`/${locale}/chauffeur/dashboard`} className="text-blue-600 hover:underline">
              ← Retour au tableau de bord
            </Link>
          </div>

          {error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          ) : manifeste ? (
            <>
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h1 className="text-2xl font-bold mb-2">Manifeste de voyage</h1>
                <p className="text-gray-600">{manifeste.ligne}</p>
                <p className="text-gray-600">Départ: {new Date(manifeste.dateDepart).toLocaleString()}</p>
                <p className="text-gray-600">Nombre de passagers: {manifeste.nbPassagers}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prénom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Siège</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enfant genoux</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {manifeste.passagers.map((passager: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4">{passager.nom}</td>
                        <td className="px-6 py-4">{passager.prenom}</td>
                        <td className="px-6 py-4">{passager.siege}</td>
                        <td className="px-6 py-4">{passager.categorie}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            passager.statut === 'UTILISE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {passager.statut === 'UTILISE' ? 'Embarqué' : 'En attente'}
                          </span>
                        </td>
                        <td className="px-6 py-4">{passager.enfantSurGenoux ? 'Oui' : 'Non'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Aucun manifeste trouvé
            </div>
          )}
        </div>
      </div>
      <Footer />
    </ProtectedRoute>
  );
}