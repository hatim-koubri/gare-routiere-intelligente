'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { rechercheApi } from '@/lib/api/voyageur/recherche';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Calendar, Clock, MapPin, Filter, ChevronRight, Bus, Users, ArrowRight } from 'lucide-react';

interface TrajetDTO {
  id: number;
  dateDepart: string;
  dateArriveePrevue: string;
  statut: string;
  retardMinutes: number;
  nbReservations: number;
  ligneId: number;
  villeDepart: string;
  villeArrivee: string;
  prixBase: number;
  busId: number;
  busMatricule: string;
  busMarque: string;
  nbSieges: number;
  chauffeurId: number;
  chauffeurNom: string;
  chauffeurPrenom: string;
  quaiId: number;
  quaiNumero: number;
  compagnieId: number;
  compagnieNom: string;
}

export default function RecherchePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string ?? 'fr';

  const [loading, setLoading] = useState(false);
  const [trajets, setTrajets] = useState<TrajetDTO[]>([]);
  const [correspondances, setCorrespondances] = useState<TrajetDTO[][]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<'directs' | 'correspondances'>('directs');

  const [formData, setFormData] = useState({
    villeDepart: '',
    villeArrivee: '',
    date: new Date().toISOString().split('T')[0],
    prixMin: 0,
    prixMax: 500,
    heureDepartMin: 0,
    heureDepartMax: 23,
    nbArretsMax: 10,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(false);
    try {
      const [directsData, correspondancesData] = await Promise.all([
        rechercheApi.rechercherDirects(formData).catch(() => []),
        rechercheApi.rechercherCorrespondances(formData).catch(() => []),
      ]);
      setTrajets(directsData as TrajetDTO[]);
      setCorrespondances(correspondancesData as TrajetDTO[][]);
      setSearched(true);
    } catch (error) {
      console.error('Erreur recherche', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReserver = (trajetId: number) => {
    router.push(`/${locale}/reservation?trajetId=${trajetId}`);
  };

  const formatHeure = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuree = (depart: string, arrivee: string) => {
    if (!depart || !arrivee) return 'N/A';
    const diff = new Date(arrivee).getTime() - new Date(depart).getTime();
    const heures = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return heures > 0 ? `${heures}h${minutes > 0 ? minutes + 'min' : ''}` : `${minutes}min`;
  };

  const getSiegesDisponibles = (trajet: TrajetDTO) => {
    return Math.max(0, (trajet.nbSieges || 0) - (trajet.nbReservations || 0));
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">

        {/* ── Hero Search ── */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-black text-white text-center mb-2">
              🚌 Trouvez votre trajet
            </h1>
            <p className="text-orange-100 text-center mb-8 text-sm">
              Recherchez parmi des centaines de destinations au Maroc
            </p>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                {/* Champs principaux */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      🏙️ Ville de départ
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Casablanca"
                      value={formData.villeDepart}
                      onChange={(e) => setFormData({ ...formData, villeDepart: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      📍 Ville d'arrivée
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Marrakech"
                      value={formData.villeArrivee}
                      onChange={(e) => setFormData({ ...formData, villeArrivee: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      📅 Date de départ
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition font-medium"
                    />
                  </div>
                </div>

                {/* Filtres avancés */}
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-sm text-orange-600 font-medium hover:text-orange-700 transition"
                >
                  <Filter size={16} />
                  {showFilters ? 'Masquer les filtres' : 'Filtres avancés'}
                </button>

                {showFilters && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Prix min (DH)</label>
                      <input
                        type="number"
                        value={formData.prixMin}
                        min={0}
                        onChange={(e) => setFormData({ ...formData, prixMin: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Prix max (DH)</label>
                      <input
                        type="number"
                        value={formData.prixMax}
                        min={0}
                        onChange={(e) => setFormData({ ...formData, prixMax: parseInt(e.target.value) || 500 })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Heure départ min</label>
                      <input
                        type="number"
                        min={0} max={23}
                        value={formData.heureDepartMin}
                        onChange={(e) => setFormData({ ...formData, heureDepartMin: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Heure départ max</label>
                      <input
                        type="number"
                        min={0} max={23}
                        value={formData.heureDepartMax}
                        onChange={(e) => setFormData({ ...formData, heureDepartMax: parseInt(e.target.value) || 23 })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold text-base transition shadow-lg shadow-orange-200"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Recherche en cours...
                    </span>
                  ) : '🔍 Rechercher des trajets'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── Résultats ── */}
        <div className="max-w-4xl mx-auto px-4 py-8">

          {searched && (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab('directs')}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition ${activeTab === 'directs' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
                >
                  Trajets directs ({trajets.length})
                </button>
                <button
                  onClick={() => setActiveTab('correspondances')}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition ${activeTab === 'correspondances' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
                >
                  Avec correspondances ({correspondances.length})
                </button>
              </div>

              {/* ── Trajets directs ── */}
              {activeTab === 'directs' && (
                <div className="space-y-4">
                  {trajets.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm border">
                      <p className="text-4xl mb-3">🔍</p>
                      <p className="text-gray-500 font-medium">Aucun trajet direct trouvé</p>
                      <p className="text-sm text-gray-400 mt-1">Essayez les trajets avec correspondances</p>
                    </div>
                  ) : (
                    trajets.map((trajet) => (
                      <TrajetCard
                        key={trajet.id}
                        trajet={trajet}
                        formatHeure={formatHeure}
                        formatDuree={formatDuree}
                        getSiegesDisponibles={getSiegesDisponibles}
                        onReserver={() => handleReserver(trajet.id)}
                      />
                    ))
                  )}
                </div>
              )}

              {/* ── Correspondances ── */}
              {activeTab === 'correspondances' && (
                <div className="space-y-4">
                  {correspondances.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm border">
                      <p className="text-4xl mb-3">🔄</p>
                      <p className="text-gray-500 font-medium">Aucune correspondance trouvée</p>
                    </div>
                  ) : (
                    correspondances.map((groupe, idx) => (
                      <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-blue-50 px-5 py-3 border-b border-blue-100">
                          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                            🔄 Correspondance — {groupe.length} trajet(s)
                          </span>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {groupe.map((trajet, i) => (
                            <div key={trajet.id} className="p-5">
                              {i > 0 && (
                                <div className="flex items-center gap-2 text-xs text-orange-500 font-medium mb-3">
                                  <Clock size={12} />
                                  Correspondance à {trajet.villeDepart}
                                </div>
                              )}
                              <TrajetCard
                                trajet={trajet}
                                formatHeure={formatHeure}
                                formatDuree={formatDuree}
                                getSiegesDisponibles={getSiegesDisponibles}
                                onReserver={() => handleReserver(trajet.id)}
                                compact
                              />
                            </div>
                          ))}
                        </div>
                        <div className="px-5 py-3 bg-gray-50 border-t flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            Prix total estimé : <strong className="text-gray-800">
                              {groupe.reduce((sum, t) => sum + (t.prixBase || 0), 0).toFixed(0)} DH
                            </strong>
                          </span>
                          <button
                            onClick={() => handleReserver(groupe[0].id)}
                            className="bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-orange-600 transition"
                          >
                            Réserver cette combinaison
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}

          {/* État initial */}
          {!searched && !loading && (
            <div className="text-center py-16">
              <p className="text-6xl mb-4">🚌</p>
              <p className="text-gray-400 font-medium">Entrez votre destination et recherchez</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

// ── Composant carte trajet ──
function TrajetCard({
  trajet,
  formatHeure,
  formatDuree,
  getSiegesDisponibles,
  onReserver,
  compact = false,
}: {
  trajet: any;
  formatHeure: (d: string) => string;
  formatDuree: (d: string, a: string) => string;
  getSiegesDisponibles: (t: any) => number;
  onReserver: () => void;
  compact?: boolean;
}) {
  const sieges = getSiegesDisponibles(trajet);
  const siegeColor = sieges > 10 ? 'text-green-600' : sieges > 3 ? 'text-orange-500' : 'text-red-500';

  return (
    <div className={`${compact ? '' : 'bg-white rounded-2xl shadow-sm border border-gray-100'} hover:shadow-md transition`}>
      <div className={`${compact ? '' : 'p-5'} flex flex-wrap justify-between items-center gap-4`}>

        {/* Infos trajet */}
        <div className="flex-1 min-w-0">
          {/* Horaires */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-black text-gray-800">{formatHeure(trajet.dateDepart)}</span>
            <div className="flex items-center gap-2 flex-1">
              <div className="h-px bg-gray-300 flex-1" />
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {formatDuree(trajet.dateDepart, trajet.dateArriveePrevue)}
              </span>
              <div className="h-px bg-gray-300 flex-1" />
            </div>
            <span className="text-2xl font-black text-gray-800">{formatHeure(trajet.dateArriveePrevue)}</span>
          </div>

          {/* Villes */}
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <MapPin size={14} className="text-orange-500" />
            <span>{trajet.villeDepart}</span>
            <ArrowRight size={14} className="text-gray-400" />
            <span>{trajet.villeArrivee}</span>
          </div>

          {/* Détails */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Bus size={12} /> {trajet.compagnieNom || 'N/A'}
            </span>
            <span className="flex items-center gap-1">
              🚌 {trajet.busMarque || trajet.busMatricule || 'N/A'}
            </span>
            {trajet.quaiNumero && (
              <span className="flex items-center gap-1">
                🅿️ Quai {trajet.quaiNumero}
              </span>
            )}
            <span className={`flex items-center gap-1 font-medium ${siegeColor}`}>
              <Users size={12} /> {sieges} siège(s)
            </span>
          </div>
        </div>

        {/* Prix + bouton */}
        <div className="text-right">
          <div className="text-2xl font-black text-orange-500">{trajet.prixBase} DH</div>
          <div className="text-xs text-gray-400 mb-2">par personne</div>
          <button
            onClick={onReserver}
            disabled={sieges === 0}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl text-sm font-bold transition shadow-sm"
          >
            {sieges === 0 ? 'Complet' : 'Choisir →'}
          </button>
        </div>
      </div>
    </div>
  );
}