// app/[locale]/plan-bus/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { reservationApi } from '@/lib/api/voyageur/reservation';
import { SiegePlanDTO } from '@/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ChevronLeft, Info } from 'lucide-react';

export default function PlanBusPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = 'fr';
  const trajetId = searchParams.get('trajetId');
  const reservationId = searchParams.get('reservationId');

  const [sieges, setSieges] = useState<SiegePlanDTO[]>([]);
  const [selectedSieges, setSelectedSieges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reservationTemp, setReservationTemp] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [prixUnitaire, setPrixUnitaire] = useState<number>(0);
  const [trajetInfo, setTrajetInfo] = useState<any>(null);
  const [nbPassagers, setNbPassagers] = useState<number>(1);

  useEffect(() => {
    if (trajetId) {
      loadPlanBus();
      loadReservationTemp();
      loadTrajetInfo();
    }
  }, [trajetId]);

  const loadReservationTemp = () => {
    const temp = sessionStorage.getItem('reservation_temp');
    if (temp) {
      const parsed = JSON.parse(temp);
      setReservationTemp(parsed);
      
      // Utiliser le nombre de passagers stocké
      const nb = parsed.nbPassagers || 1;
      setNbPassagers(nb);
      
      console.log('Réservation temp chargée:', parsed);
      console.log('Nombre de passagers:', nb);
    } else {
      router.push(`/fr/recherche`);
    }
  };

  const loadTrajetInfo = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8080/api/voyageur/trajets/${trajetId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPrixUnitaire(data.prixBase || 0);
      setTrajetInfo(data);
    } catch (error) {
      console.error('Erreur chargement trajet:', error);
    }
  };

  const loadPlanBus = async () => {
    try {
      const data = await reservationApi.getPlanBus(parseInt(trajetId!));
      setSieges(data);
    } catch (error) {
      console.error('Erreur chargement plan bus', error);
      setError('Impossible de charger le plan du bus');
    } finally {
      setLoading(false);
    }
  };

  const getSiegeColor = (siege: SiegePlanDTO) => {
    if (selectedSieges.includes(siege.numeroSiege)) {
      return 'bg-yellow-500 text-white border-yellow-600 ring-2 ring-yellow-300 shadow-md';
    }
    if (siege.occupe) {
      return 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400 line-through';
    }
    if (siege.bloque) {
      return 'bg-red-300 text-red-500 cursor-not-allowed border-red-400';
    }
    if (siege.verrouilleTemporaire) {
      return 'bg-orange-300 text-orange-500 cursor-not-allowed border-orange-400';
    }
    return 'bg-green-500 text-white hover:bg-green-600 cursor-pointer border-green-600 hover:scale-105 transition-all duration-200 shadow-sm';
  };

  const handleSiegeClick = (siege: SiegePlanDTO) => {
    if (siege.occupe || siege.bloque || siege.verrouilleTemporaire) return;

    if (selectedSieges.includes(siege.numeroSiege)) {
      setSelectedSieges(selectedSieges.filter(s => s !== siege.numeroSiege));
    } else {
      if (selectedSieges.length < nbPassagers) {
        setSelectedSieges([...selectedSieges, siege.numeroSiege]);
      } else {
        setError(`Vous ne pouvez sélectionner que ${nbPassagers} siège(s)`);
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleConfirmerReservation = async () => {
    if (selectedSieges.length === 0) {
      setError('Veuillez sélectionner au moins un siège');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (selectedSieges.length !== nbPassagers) {
      setError(`Vous devez sélectionner ${nbPassagers} siège(s) pour ${nbPassagers} passager(s)`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const finalReservationId = reservationId || reservationTemp?.reservationId;
      
      if (!finalReservationId) {
        throw new Error('ID de réservation non trouvé');
      }

      console.log('Verrouillage des sièges...');
      await reservationApi.verrouillerSieges(
        parseInt(finalReservationId),
        parseInt(trajetId!),
        selectedSieges
      );
      console.log('Sièges verrouillés:', selectedSieges);

      const prixTotal = reservationTemp?.prixTotal || (prixUnitaire * nbPassagers);
      
      // STOCKER TOUTES LES INFOS POUR LA CONFIRMATION
      const trajetFullInfo = {
        reservationId: finalReservationId,
        trajetId: parseInt(trajetId!),
        selectedSieges: selectedSieges,
        nbPassagers: nbPassagers,
        prixUnitaire: prixUnitaire,
        prixTotal: prixTotal,
        // Infos trajet
        villeDepart: reservationTemp?.villeDepart || trajetInfo?.villeDepart,
        villeArrivee: reservationTemp?.villeArrivee || trajetInfo?.villeArrivee,
        dateDepart: reservationTemp?.dateDepart || trajetInfo?.dateDepart,
        compagnieNom: reservationTemp?.compagnieNom || trajetInfo?.compagnieNom,
        busMatricule: reservationTemp?.busMatricule || trajetInfo?.busMatricule,
        quaiNumero: reservationTemp?.quaiNumero || trajetInfo?.quaiNumero,
        duree: trajetInfo?.duree || 'Direct',
        // Infos passagers
        membres: reservationTemp?.membres || [],
        organisateur: {
          nom: user?.nom,
          prenom: user?.prenom,
          email: user?.email
        }
      };
      
      // Sauvegarder dans sessionStorage
      sessionStorage.setItem('prix_total', prixTotal.toString());
      sessionStorage.setItem('prix_unitaire', prixUnitaire.toString());
      sessionStorage.setItem('nb_passagers', nbPassagers.toString());
      sessionStorage.setItem('reservation_id', finalReservationId);
      sessionStorage.setItem('trajet_info', JSON.stringify(trajetFullInfo));
      sessionStorage.setItem('selected_sieges', JSON.stringify(selectedSieges));
      sessionStorage.setItem('reservation_data_backup', JSON.stringify(trajetFullInfo));
      
      // Nettoyer
      sessionStorage.removeItem('reservation_temp');

      router.push(`/fr/paiement?reservationId=${finalReservationId}`);

    } catch (err: any) {
      console.error('Erreur:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la réservation';
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
      setIsProcessing(false);
    }
  };

  const totalEstime = prixUnitaire * nbPassagers;

  // Organisation des sièges en rangées (6 par rangée)
  const rows: SiegePlanDTO[][] = [];
  for (let i = 0; i < sieges.length; i += 6) {
    rows.push(sieges.slice(i, i + 6));
  }

  if (loading && sieges.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">

          {/* Bouton retour */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-gray-500 hover:text-orange-600 mb-4 text-sm transition"
          >
            <ChevronLeft size={18} /> Retour
          </button>

          {/* Étapes */}
          <div className="flex items-center gap-2 text-sm mb-6">
            <span className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
            <span className="text-green-600 font-medium">Passagers</span>
            <div className="h-px bg-green-300 flex-1" />
            <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span className="text-orange-600 font-medium">Sièges</span>
            <div className="h-px bg-gray-300 flex-1" />
            <span className="bg-gray-200 text-gray-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span className="text-gray-400">Paiement</span>
          </div>

          {/* Récapitulatif des prix */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">💰 Récapitulatif</h2>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Prix unitaire</span>
              <span className="font-semibold text-gray-800">{prixUnitaire} DH</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Nombre de passagers</span>
              <span className="font-semibold text-gray-800">{nbPassagers}</span>
            </div>
            <div className="flex justify-between items-center py-2 pt-3">
              <span className="font-bold text-gray-800">Total estimé</span>
              <span className="text-xl font-black text-orange-500">{totalEstime} DH</span>
            </div>
          </div>

          {/* Plan du bus */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
              <h1 className="text-white font-bold text-lg">🚌 Choisissez vos sièges</h1>
              <p className="text-white/80 text-sm mt-1">Sélectionnez {nbPassagers} siège(s) pour votre voyage</p>
            </div>

            <div className="p-6">
              {/* Légende */}
              <div className="flex flex-wrap justify-center gap-4 mb-6 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-500 rounded-lg shadow-sm"></div>
                  <span className="text-xs text-gray-600">Libre</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-yellow-500 rounded-lg shadow-sm"></div>
                  <span className="text-xs text-gray-600">Sélectionné</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-300 rounded-lg"></div>
                  <span className="text-xs text-gray-600">Occupé</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-red-300 rounded-lg"></div>
                  <span className="text-xs text-gray-600">Bloqué</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-orange-300 rounded-lg"></div>
                  <span className="text-xs text-gray-600">Verrouillé</span>
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm">
                  <Info size={18} /> {error}
                </div>
              )}

              {/* Grille des sièges */}
              <div className="overflow-x-auto py-4">
                <div className="min-w-[500px]">
                  <div className="text-center mb-4">
                    <div className="inline-block px-6 py-2 bg-gray-100 rounded-full text-sm font-semibold text-gray-600">
                      🚍 AVANT DU BUS
                    </div>
                  </div>
                  
                  {rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex justify-center gap-3 mb-3">
                      {row.map((siege) => (
                        <button
                          key={siege.numeroSiege}
                          onClick={() => handleSiegeClick(siege)}
                          disabled={siege.occupe || siege.bloque || siege.verrouilleTemporaire}
                          className={`w-14 h-14 rounded-xl font-bold text-sm transition-all duration-200 border-2 ${getSiegeColor(siege)}`}
                        >
                          {siege.numeroSiege}
                        </button>
                      ))}
                    </div>
                  ))}
                  
                  <div className="text-center mt-4">
                    <div className="inline-block px-6 py-2 bg-gray-100 rounded-full text-sm font-semibold text-gray-600">
                      🚍 ARRIÈRE DU BUS
                    </div>
                  </div>
                </div>
              </div>

              {/* Résumé */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600 font-medium">Sièges sélectionnés :</span>
                  <span className="font-bold text-orange-600 text-lg">
                    {selectedSieges.length > 0 ? selectedSieges.join(', ') : 'Aucun'}
                  </span>
                </div>

                <button
                  onClick={handleConfirmerReservation}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-300 text-white py-3 rounded-xl font-bold text-base transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      Traitement en cours...
                    </>
                  ) : (
                    `✅ Confirmer et payer (${totalEstime} DH)`
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Information supplémentaire */}
          <div className="mt-4 text-center text-xs text-gray-400">
            <p>💡 Les sièges verts sont disponibles. Cliquez pour sélectionner.</p>
            <p className="mt-1">🔒 Une fois confirmés, vos sièges seront verrouillés pour 10 minutes le temps du paiement.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}