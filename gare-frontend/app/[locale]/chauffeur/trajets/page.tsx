'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { chauffeurTrajetApi } from '@/lib/api/chauffeur/trajets';
import { Trajet } from '@/types';
import Link from 'next/link';

export default function ChauffeurTrajetsPage() {
  const { user } = useAuth();
  const { locale } = useParams();
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrajets();
  }, []);

  const loadTrajets = async () => {
    setLoading(true);
    try {
      const data = await chauffeurTrajetApi.getTrajetsJour();
      console.log('=== TRAJETS PAGE ===');
      console.log('Données reçues:', data);
      setTrajets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement trajets', error);
      setTrajets([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      PLANIFIE: 'bg-blue-100 text-blue-800',
      EN_COURS: 'bg-green-100 text-green-800',
      TERMINE: 'bg-gray-100 text-gray-800',
      ANNULE: 'bg-red-100 text-red-800',
      RETARDE: 'bg-yellow-100 text-yellow-800',
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  const getVilleDepart = (trajet: Trajet) => {
    const anyTrajet = trajet as any;
    return anyTrajet.villeDepart || anyTrajet.ligne?.villeDepart || '?';
  };

  const getVilleArrivee = (trajet: Trajet) => {
    const anyTrajet = trajet as any;
    return anyTrajet.villeArrivee || anyTrajet.ligne?.villeArrivee || '?';
  };

  const getCompagnieNom = (trajet: Trajet) => {
    const anyTrajet = trajet as any;
    return anyTrajet.compagnieNom || anyTrajet.ligne?.compagnie?.nom || 'N/A';
  };

  const getBusMatricule = (trajet: Trajet) => {
    const anyTrajet = trajet as any;
    return anyTrajet.busMatricule || anyTrajet.bus?.matricule || 'N/A';
  };

  const getNbSieges = (trajet: Trajet) => {
    const anyTrajet = trajet as any;
    return anyTrajet.nbSieges || anyTrajet.bus?.nbSieges || 0;
  };

  const getQuaiNumero = (trajet: Trajet) => {
    const anyTrajet = trajet as any;
    return anyTrajet.quaiNumero || anyTrajet.quai?.numero || 'N/A';
  };

  const getDateDepart = (trajet: Trajet) => {
    if (trajet.dateDepart) {
      return new Date(trajet.dateDepart).toLocaleString();
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (trajets.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Mes trajets</h1>
          <p className="text-gray-600 mt-1">
            Bonjour {user?.prenom} {user?.nom}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          Aucun trajet prévu pour aujourd'hui
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mes trajets</h1>
        <p className="text-gray-600 mt-1">
          Bonjour {user?.prenom} {user?.nom}
        </p>
      </div>

      <div className="grid gap-6">
        {trajets.map((trajet) => (
          <div key={trajet.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    {getVilleDepart(trajet)} → {getVilleArrivee(trajet)}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {getCompagnieNom(trajet)} • Bus {getBusMatricule(trajet)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {getDateDepart(trajet)}
                  </div>
                  <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${getStatutColor(trajet.statut)}`}>
                    {trajet.statut}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                <div>
                  <span className="text-gray-500">Sièges:</span>
                  <span className="font-semibold ml-2">{getNbSieges(trajet)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Réservations:</span>
                  <span className="font-semibold ml-2">{trajet.nbReservations || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Quai:</span>
                  <span className="font-semibold ml-2">{getQuaiNumero(trajet)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Retard:</span>
                  <span className="font-semibold ml-2">{trajet.retardMinutes || 0} min</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/chauffeur/trajets/${trajet.id}/manifeste`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  📋 Manifeste
                </Link>
                <Link
                  href={`/${locale}/chauffeur/scanner/ticket?trajetId=${trajet.id}`}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                >
                  🎫 Scanner ticket
                </Link>
                <Link
                  href={`/${locale}/chauffeur/scanner/bagage?trajetId=${trajet.id}`}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm"
                >
                  🧳 Scanner bagage
                </Link>
                <Link
                  href={`/${locale}/chauffeur/trajets/${trajet.id}/jalons`}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm"
                >
                  📍 Jalons
                </Link>
                <Link
                  href={`/${locale}/chauffeur/incidents?trajetId=${trajet.id}`}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                >
                  ⚠️ Incident
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}