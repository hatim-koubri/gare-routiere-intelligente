// app/[locale]/reservation/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { reservationApi } from '@/lib/api/voyageur/reservation';
import { apiClient } from '@/lib/api/client';
import { storage } from '@/lib/utils/storage';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { UserPlus, UserMinus, AlertCircle, ArrowLeft, Briefcase, Plus, X } from 'lucide-react';
import { BagageRequest } from '@/types';
interface TrajetDTO {
  id: number;
  dateDepart: string;
  dateArriveePrevue: string;
  villeDepart: string;
  villeArrivee: string;
  prixBase: number;
  compagnieNom: string;
  busMarque: string;
  busMatricule: string;
  nbSieges: number;
  nbReservations: number;
  quaiNumero: number;
}

interface MembreForm {
  nomManuel: string;
  prenomManuel: string;
  sexe: string;
  age: number | '';
  categorieTarifaire: string;
  lienOrganisateur: string;
  enfantSurGenoux: boolean;
}

const defaultMembre = (): MembreForm => ({
  nomManuel: '',
  prenomManuel: '',
  sexe: 'HOMME',
  age: 25,
  categorieTarifaire: 'NORMAL',
  lienOrganisateur: 'AMI',
  enfantSurGenoux: false,
});

export default function ReservationPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = 'fr';
  const trajetId = searchParams.get('trajetId');

  const [trajet, setTrajet] = useState<TrajetDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [typeGroupe, setTypeGroupe] = useState<'MOI_SEUL' | 'MOI_PLUS_ACCOMPAGNANTS' | 'AUTRE_PERSONNE'>('MOI_SEUL');
  const [membres, setMembres] = useState<MembreForm[]>([]);
  const [bagages, setBagages] = useState<BagageRequest[]>([]);
  const [showBagages, setShowBagages] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      const returnUrl = `/fr/reservation?trajetId=${trajetId}`;
      router.push(`/fr/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (trajetId) {
      loadTrajet();
    }
  }, [trajetId, user]);

  const loadTrajet = async () => {
    try {
      const token = storage.getToken();
      const response = await apiClient.get(`/voyageur/trajets/${trajetId}`);
      setTrajet(response.data);
    } catch (error: any) {
      console.error('Erreur loadTrajet:', error);
      setError('Trajet introuvable');
    } finally {
      setLoading(false);
    }
  };

  const ajouterMembre = () => setMembres([...membres, defaultMembre()]);
  const supprimerMembre = (index: number) => setMembres(membres.filter((_, i) => i !== index));
  const updateMembre = (index: number, field: keyof MembreForm, value: any) => {
    const updated = [...membres];
    updated[index] = { ...updated[index], [field]: value };
    setMembres(updated);
  };

  // ----- Gestion des bagages -----
  const defaultBagage = (): BagageRequest => ({
    poidsKg: 10,
    dimensionCm: '60x40x30',
  });

  const ajouterBagage = () => setBagages([...bagages, defaultBagage()]);
  const supprimerBagage = (index: number) => setBagages(bagages.filter((_, i) => i !== index));
  const updateBagage = (index: number, field: keyof BagageRequest, value: any) => {
    const updated = [...bagages];
    updated[index] = { ...updated[index], [field]: value };
    setBagages(updated);
  };

  const calculerSurplusEstime = (bagage: BagageRequest) => {
    if (!bagage.poidsKg || !bagage.dimensionCm) return 0;
    
    let surplusPoids = 0;
    if (bagage.poidsKg > 40) surplusPoids = 150;
    else if (bagage.poidsKg > 30) surplusPoids = 100;
    else if (bagage.poidsKg > 20) surplusPoids = 75;
    else if (bagage.poidsKg > 15) surplusPoids = 50;

    let volume = 0;
    const parts = bagage.dimensionCm.split('x');
    if (parts.length === 3) {
      const l = parseFloat(parts[0]) || 0;
      const w = parseFloat(parts[1]) || 0;
      const h = parseFloat(parts[2]) || 0;
      volume = l * w * h;
    }
    
    let surplusVolume = 0;
    if (volume > 300000) surplusVolume = 150;
    else if (volume > 200000) surplusVolume = 100;
    else if (volume > 120000) surplusVolume = 75;
    else if (volume > 60000) surplusVolume = 50;

    return Math.max(surplusPoids, surplusVolume);
  };

  const getSurplusTotalBagages = () => {
    if (!showBagages) return 0;
    return bagages.reduce((total, b) => total + calculerSurplusEstime(b), 0);
  };
  // ---------------------------------

  const getNbPassagers = () => {
    if (typeGroupe === 'MOI_SEUL') return 1;
    if (typeGroupe === 'MOI_PLUS_ACCOMPAGNANTS') return 1 + membres.length;
    return membres.length;
  };

  const getPrixTotal = () => {
    if (!trajet) return 0;
    return (trajet.prixBase * getNbPassagers()).toFixed(0);
  };

  const handleContinue = async () => {
    if (!trajet || !user) return;
    setError('');

    let membresData: any[] = [];

    if (typeGroupe === 'MOI_SEUL') {
      membresData = [{
        nomManuel: user.nom,
        prenomManuel: user.prenom,
        sexe: 'HOMME',
        age: 25,
        categorieTarifaire: 'NORMAL',
        lienOrganisateur: 'MOI',
        enfantSurGenoux: false,
      }];
    } else if (typeGroupe === 'MOI_PLUS_ACCOMPAGNANTS') {
      if (membres.length === 0) {
        setError('Ajoutez au moins un accompagnant');
        return;
      }
      membresData = [
        {
          nomManuel: user.nom,
          prenomManuel: user.prenom,
          sexe: 'HOMME',
          age: 25,
          categorieTarifaire: 'NORMAL',
          lienOrganisateur: 'MOI',
          enfantSurGenoux: false,
        },
        ...membres,
      ];
    } else {
      if (membres.length === 0) {
        setError('Ajoutez au moins un passager');
        return;
      }
      membresData = membres;
    }

    const invalid = membresData.some(m => !m.nomManuel || !m.prenomManuel);
    if (invalid) {
      setError('Veuillez remplir le nom et prénom de tous les passagers');
      return;
    }

    setSubmitting(true);
    try {
      const reservation = await reservationApi.creer({
        trajetId: trajet.id,
        typeGroupe,
        membres: membresData,
      });

      // Si des bagages sont déclarés, on les ajoute
      let surplusBagagesFinal = 0;
      if (showBagages && bagages.length > 0) {
        const bagagesResponse = await reservationApi.ajouterBagages(reservation.id, bagages);
        surplusBagagesFinal = bagagesResponse.reduce((sum, b) => sum + (b.surplusPrix || 0), 0);
      }

      // Stocker les infos complètes du trajet
      sessionStorage.setItem('reservation_temp', JSON.stringify({
        reservationId: reservation.id,
        trajetId: trajet.id,
        typeGroupe,
        membres: membresData,
        nbPassagers: membresData.length,
        prixTotal: reservation.prixTotal + surplusBagagesFinal,
        villeDepart: trajet.villeDepart,
        villeArrivee: trajet.villeArrivee,
        dateDepart: trajet.dateDepart,
        compagnieNom: trajet.compagnieNom,
        busMatricule: trajet.busMatricule,
        quaiNumero: trajet.quaiNumero,
        selectedSieges: [],
      }));

      router.push(`/fr/plan-bus?trajetId=${trajet.id}&reservationId=${reservation.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  const formatHeure = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const formatDuree = (d: string, a: string) => {
    const diff = new Date(a).getTime() - new Date(d).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m}min`;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
        </div>
        <Footer />
      </>
    );
  }

  if (!trajet || error === 'Trajet introuvable') {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Trajet non trouvé</p>
            <button onClick={() => router.push(`/fr/recherche`)} className="mt-4 text-orange-500 hover:underline text-sm">
              ← Retour à la recherche
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 space-y-6">

          {/* Bouton retour */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-gray-500 hover:text-orange-600 text-sm transition"
          >
            <ArrowLeft size={16} /> Retour
          </button>

          {/* Étapes */}
          <div className="flex items-center gap-2 text-sm">
            <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span className="font-medium text-orange-600">Passagers</span>
            <div className="h-px bg-gray-300 flex-1" />
            <span className="bg-gray-200 text-gray-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span className="text-gray-400">Sièges</span>
            <div className="h-px bg-gray-300 flex-1" />
            <span className="bg-gray-200 text-gray-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span className="text-gray-400">Paiement</span>
          </div>

          {/* Résumé trajet */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Votre trajet</p>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-center">
                <p className="text-2xl font-black text-gray-800">{formatHeure(trajet.dateDepart)}</p>
                <p className="text-xs text-gray-500">{trajet.villeDepart}</p>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-center w-full gap-2">
                  <div className="h-px bg-gray-300 flex-1" />
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDuree(trajet.dateDepart, trajet.dateArriveePrevue)}
                  </span>
                  <div className="h-px bg-gray-300 flex-1" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-gray-800">{formatHeure(trajet.dateArriveePrevue)}</p>
                <p className="text-xs text-gray-500">{trajet.villeArrivee}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 pt-3 border-t border-gray-100">
              <span>📅 {formatDate(trajet.dateDepart)}</span>
              <span>🏢 {trajet.compagnieNom}</span>
              <span>🚌 {trajet.busMarque || trajet.busMatricule}</span>
              {trajet.quaiNumero && <span>🅿️ Quai {trajet.quaiNumero}</span>}
            </div>
          </div>

          {/* Type de groupe */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4">👥 Qui voyage ?</h2>
            <div className="space-y-3">
              {[
                { value: 'MOI_SEUL', label: 'Moi seul(e)', desc: 'Un seul passager', emoji: '🙋' },
                { value: 'MOI_PLUS_ACCOMPAGNANTS', label: 'Moi + accompagnants', desc: "Je réserve pour moi et d'autres", emoji: '👨‍👩‍👧' },
                { value: 'AUTRE_PERSONNE', label: 'Une autre personne', desc: "Je réserve pour quelqu'un d'autre", emoji: '👤' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition
                    ${typeGroupe === option.value ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="typeGroupe"
                    value={option.value}
                    checked={typeGroupe === option.value as any}
                    onChange={() => {
                      setTypeGroupe(option.value as any);
                      setMembres([]);
                    }}
                    className="hidden"
                  />
                  <span className="text-2xl">{option.emoji}</span>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{option.label}</p>
                    <p className="text-xs text-gray-500">{option.desc}</p>
                  </div>
                  {typeGroupe === option.value && (
                    <div className="ml-auto w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Passagers */}
          {(typeGroupe === 'MOI_PLUS_ACCOMPAGNANTS' || typeGroupe === 'AUTRE_PERSONNE') && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-gray-800">
                  {typeGroupe === 'MOI_PLUS_ACCOMPAGNANTS' ? '👥 Accompagnants' : '👤 Passagers'}
                </h2>
                <button
                  onClick={ajouterMembre}
                  className="flex items-center gap-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 px-3 py-1.5 rounded-lg text-sm font-medium transition"
                >
                  <UserPlus size={15} /> Ajouter
                </button>
              </div>

              {membres.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                  Cliquez sur "Ajouter" pour ajouter un passager
                </div>
              )}

              <div className="space-y-4">
                {membres.map((membre, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-sm text-gray-700">
                        {typeGroupe === 'MOI_PLUS_ACCOMPAGNANTS' ? `Accompagnant ${index + 1}` : `Passager ${index + 1}`}
                      </h3>
                      <button
                        onClick={() => supprimerMembre(index)}
                        className="text-red-400 hover:text-red-600 text-xs flex items-center gap-1"
                      >
                        <UserMinus size={13} /> Supprimer
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Nom *"
                        value={membre.nomManuel}
                        onChange={(e) => updateMembre(index, 'nomManuel', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                      />
                      <input
                        type="text"
                        placeholder="Prénom *"
                        value={membre.prenomManuel}
                        onChange={(e) => updateMembre(index, 'prenomManuel', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                      />
                      <select
                        value={membre.sexe}
                        onChange={(e) => updateMembre(index, 'sexe', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                      >
                        <option value="HOMME">👨 Homme</option>
                        <option value="FEMME">👩 Femme</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Âge"
                        value={membre.age}
                        min={0}
                        max={120}
                        onChange={(e) => updateMembre(index, 'age', parseInt(e.target.value) || '')}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                      />
                      <select
                        value={membre.categorieTarifaire}
                        onChange={(e) => updateMembre(index, 'categorieTarifaire', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                      >
                        <option value="NORMAL">Normal</option>
                        <option value="ETUDIANT">Étudiant (-25%)</option>
                        <option value="ENFANT">Enfant (-50%)</option>
                        <option value="SENIOR">Senior (-20%)</option>
                      </select>
                      <select
                        value={membre.lienOrganisateur}
                        onChange={(e) => updateMembre(index, 'lienOrganisateur', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                      >
                        <option value="AMI">Ami(e)</option>
                        <option value="FAMILLE">Famille</option>
                        <option value="CONJOINT">Conjoint(e)</option>
                        <option value="COLLEGUE">Collègue</option>
                      </select>
                      <label className="col-span-2 flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={membre.enfantSurGenoux}
                          onChange={(e) => updateMembre(index, 'enfantSurGenoux', e.target.checked)}
                          className="rounded"
                        />
                        Enfant sur les genoux (&lt;5 ans, gratuit)
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bagages */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-800">Bagages spéciaux / soute</h2>
                  <p className="text-xs text-gray-500">Ajoutez vos bagages encombrants (gratuit jusqu'à 15kg)</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={showBagages}
                  onChange={(e) => {
                    setShowBagages(e.target.checked);
                    if (!e.target.checked) setBagages([]);
                    else if (bagages.length === 0) ajouterBagage();
                  }}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            {showBagages && (
              <div className="mt-6 space-y-4">
                {bagages.map((bagage, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4 relative bg-gray-50/50">
                    <button
                      onClick={() => supprimerBagage(index)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"
                    >
                      <X size={16} />
                    </button>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                      <Briefcase size={14} className="text-gray-400" /> Bagage {index + 1}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Poids estimé (kg)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            step="0.5"
                            value={bagage.poidsKg}
                            onChange={(e) => updateBagage(index, 'poidsKg', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400 pr-8"
                          />
                          <span className="absolute right-3 top-2 text-gray-400 text-sm">kg</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Dimensions L×l×H (cm)</label>
                        <select
                          value={bagage.dimensionCm}
                          onChange={(e) => updateBagage(index, 'dimensionCm', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                        >
                          <option value="50x35x25">Cabine (50×35×25) - ~45L</option>
                          <option value="60x40x30">Moyen (60×40×30) - ~70L</option>
                          <option value="70x50x40">Grand (70×50×40) - ~140L</option>
                          <option value="80x60x50">Très grand (80×60×50) - ~240L</option>
                          <option value="90x70x50">Surdimensionné (&gt;250L)</option>
                        </select>
                      </div>
                    </div>

                    {calculerSurplusEstime(bagage) > 0 && (
                      <div className="mt-3 text-xs flex items-center justify-between bg-orange-50 text-orange-700 p-2 rounded-lg">
                        <span>⚠️ Ce bagage générera un surplus (estimé)</span>
                        <span className="font-bold">+{calculerSurplusEstime(bagage)} DH</span>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={ajouterBagage}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Ajouter un autre bagage
                </button>
              </div>
            )}
          </div>

          {/* Récapitulatif prix */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-bold text-gray-800 mb-3">💰 Récapitulatif</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Prix unitaire</span>
                <span>{trajet.prixBase} DH</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Nombre de passagers</span>
                <span>{getNbPassagers()}</span>
              </div>
              {showBagages && bagages.length > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Surplus bagages estimé</span>
                  <span>{getSurplusTotalBagages() > 0 ? `+${getSurplusTotalBagages()} DH` : 'Gratuit'}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-800 pt-2 border-t border-gray-100 text-base">
                <span>Total estimé</span>
                <span className="text-orange-500">
                  {parseInt(getPrixTotal().toString()) + getSurplusTotalBagages()} DH
                </span>
              </div>
            </div>
          </div>

          {/* Erreur */}
          {error && error !== 'Trajet introuvable' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Bouton continuer */}
          <button
            onClick={handleContinue}
            disabled={submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold text-base transition shadow-lg shadow-orange-100"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Création de la réservation...
              </span>
            ) : 'Continuer → Choisir mes sièges'}
          </button>

          <button
            onClick={() => router.back()}
            className="w-full text-gray-500 text-sm hover:text-gray-700 py-2"
          >
            ← Retour
          </button>

        </div>
      </main>
      <Footer />
    </>
  );
}