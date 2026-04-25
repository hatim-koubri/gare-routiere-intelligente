'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { chauffeurTrajetApi } from '@/lib/api/chauffeur/trajets';
import { apiClient } from '@/lib/api/client';
import { Role, Arret } from '@/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default function ManifestePage() {
  const { id, locale } = useParams();
  const router = useRouter();
  const [manifeste, setManifeste] = useState<any>(null);
  const [arrets, setArrets] = useState<Arret[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [prochainArret, setProchainArret] = useState<Arret | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadManifeste();
    loadArrets();
    loadIncidents();
  }, [id]);

  const loadManifeste = async () => {
    try {
      const data = await chauffeurTrajetApi.getManifeste(Number(id));
      setManifeste(data);
    } catch (error: any) {
      console.error('Erreur chargement manifeste', error);
      setError(error.response?.data?.message || 'Erreur de chargement');
    }
  };

  const loadArrets = async () => {
    try {
      const response = await apiClient.get(`/chauffeur/trajets/${id}/arrets`);
      const arretsData = Array.isArray(response.data) ? response.data : [];
      setArrets(arretsData);
      
      if (arretsData.length > 0) {
        setProchainArret(arretsData[0]);
      }
    } catch (error) {
      console.error('Erreur chargement arrêts', error);
    }
  };

  // ✅ CORRECTION ICI - Utiliser l'endpoint chauffeur
  const loadIncidents = async () => {
    try {
      const response = await apiClient.get(`/chauffeur/trajets/${id}/incidents`);
      setIncidents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erreur chargement incidents', error);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const getNombreEmbarques = () => {
    if (!manifeste?.passagers) return 0;
    return manifeste.passagers.filter((p: any) => p.statut === 'UTILISE').length;
  };

  const total = manifeste?.nbPassagers || 0;
  const embarques = getNombreEmbarques();
  const enAttente = total - embarques;
  const tauxEmbarquement = total > 0 ? Math.round((embarques / total) * 100) : 0;

  const embarquesAngle = (embarques / total) * 360;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const embarquesDash = (embarquesAngle / 360) * circumference;

  const PieChart = () => (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="20" />
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#10B981" strokeWidth="20" 
          strokeDasharray={`${embarquesDash} ${circumference}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-800">{tauxEmbarquement}%</span>
        <span className="text-xs text-gray-500">embarquement</span>
      </div>
    </div>
  );

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      PANNE: 'bg-red-100 text-red-800',
      RETARD: 'bg-yellow-100 text-yellow-800',
      ACCIDENT: 'bg-orange-100 text-orange-800',
      AUTRE: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
            <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>
          ) : manifeste ? (
            <>
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h1 className="text-2xl font-bold mb-2">Manifeste de voyage</h1>
                <p className="text-gray-600">{manifeste.ligne}</p>
                <p className="text-gray-600">Départ: {new Date(manifeste.dateDepart).toLocaleString()}</p>
              </div>

              {/* Prochain arrêt */}
              {prochainArret && (
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 mb-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80 mb-1">📍 PROCHAIN ARRÊT</p>
                      <p className="text-2xl font-bold">{prochainArret.ville}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-80">Heure estimée</p>
                      <p className="text-xl font-bold">À déterminer</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Section graphique */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4 text-center">Taux d'embarquement</h3>
                  <PieChart />
                  <div className="flex justify-center gap-6 mt-6">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span className="text-sm">Embarqués ({embarques})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                      <span className="text-sm">En attente ({enAttente})</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg shadow-md p-4 text-center">
                    <p className="text-sm text-gray-500">Total passagers</p>
                    <p className="text-3xl font-bold text-blue-600">{total}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4 text-center">
                    <p className="text-sm text-gray-500">Embarqués</p>
                    <p className="text-3xl font-bold text-green-600">{embarques}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4 text-center">
                    <p className="text-sm text-gray-500">En attente</p>
                    <p className="text-3xl font-bold text-yellow-600">{enAttente}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4 text-center">
                    <p className="text-sm text-gray-500">Taux d'embarquement</p>
                    <p className="text-3xl font-bold text-purple-600">{tauxEmbarquement}%</p>
                  </div>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span>Progression d'embarquement</span>
                  <span>{tauxEmbarquement}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div className="bg-green-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${tauxEmbarquement}%` }} />
                </div>
              </div>

              {/* Section Incidents */}
              {incidents.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-red-500">⚠️</span> Incidents signalés
                  </h3>
                  <div className="space-y-3">
                    {incidents.map((incident) => (
                      <div key={incident.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeBadge(incident.type)}`}>
                              {incident.type}
                            </span>
                            <p className="mt-2 text-gray-700">{incident.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {new Date(incident.dateIncident).toLocaleString()}
                            </p>
                            <span className={`inline-block mt-1 text-xs ${incident.resolu ? 'text-green-600' : 'text-red-600'}`}>
                              {incident.resolu ? '✓ Résolu' : '⏳ En cours'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parcours */}
              {arrets.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">📍 Parcours</h3>
                  <div className="flex justify-between items-center">
                    {arrets.map((arret, idx) => (
                      <div key={idx} className="text-center flex-1">
                        <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                          idx === 0 ? 'bg-green-500 ring-4 ring-green-200' : 'bg-gray-300'
                        }`} />
                        <p className="text-xs font-medium">{arret.ville}</p>
                        {idx === 0 && (
                          <span className="text-[10px] text-green-600">🚌 Prochain</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tableau des passagers */}
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
                            {passager.statut === 'UTILISE' ? '✅ Embarqué' : '⏳ En attente'}
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
            <div className="text-center py-12 text-gray-500">Aucun manifeste trouvé</div>
          )}
        </div>
      </div>
      <Footer />
    </ProtectedRoute>
  );
}