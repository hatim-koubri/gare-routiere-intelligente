// app/recherche/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';  // ← Enlever useParams
import { rechercheApi } from '@/lib/api/voyageur/recherche';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Calendar, Clock, MapPin, Filter, ArrowRight, Users, Building } from 'lucide-react';
import { FlightCard } from '@/components/ui/flight-card';

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

interface Compagnie {
  id: number;
  nom: string;
}

export default function RecherchePage() {
  const router = useRouter();
  // Enlever useParams et locale

  const [loading, setLoading] = useState(false);
  const [allTrajets, setAllTrajets] = useState<TrajetDTO[]>([]);
  const [allCorrespondances, setAllCorrespondances] = useState<TrajetDTO[][]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<'directs' | 'correspondances'>('directs');
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);

  const [formData, setFormData] = useState({
    villeDepart: '',
    villeArrivee: '',
    date: new Date().toISOString().split('T')[0],
    prixMin: 0,
    prixMax: 1000,
    heureDepartMin: 0,
    heureDepartMax: 23,
    nbArretsMax: 10,
    compagnieId: null as number | null,
  });

  const extractCompagnies = (trajets: TrajetDTO[]) => {
    const uniqueCompagnies = new Map<number, Compagnie>();
    trajets.forEach(t => {
      if (!uniqueCompagnies.has(t.compagnieId)) {
        uniqueCompagnies.set(t.compagnieId, {
          id: t.compagnieId,
          nom: t.compagnieNom
        });
      }
    });
    setCompagnies(Array.from(uniqueCompagnies.values()));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(false);
    try {
      const searchData = {
        villeDepart: formData.villeDepart,
        villeArrivee: formData.villeArrivee,
        date: formData.date,
      };
      
      const [directsData, correspondancesData] = await Promise.all([
        rechercheApi.rechercherDirects(searchData).catch(() => []),
        rechercheApi.rechercherCorrespondances(searchData).catch(() => []),
      ]);
      
      setAllTrajets(directsData as TrajetDTO[]);
      setAllCorrespondances(correspondancesData as TrajetDTO[][]);
      extractCompagnies(directsData as TrajetDTO[]);
      setSearched(true);
    } catch (error) {
      console.error('Erreur recherche', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTrajets = () => {
    let filtered = [...allTrajets];
    filtered = filtered.filter(t => t.prixBase >= formData.prixMin && t.prixBase <= formData.prixMax);
    filtered = filtered.filter(t => {
      const heure = new Date(t.dateDepart).getHours();
      return heure >= formData.heureDepartMin && heure <= formData.heureDepartMax;
    });
    if (formData.compagnieId) {
      filtered = filtered.filter(t => t.compagnieId === formData.compagnieId);
    }
    return filtered;
  };

  const getFilteredCorrespondances = () => {
    let filtered = [...allCorrespondances];
    filtered = filtered.filter(groupe => {
      return groupe.some(t => {
        const prixOk = t.prixBase >= formData.prixMin && t.prixBase <= formData.prixMax;
        const heureOk = new Date(t.dateDepart).getHours() >= formData.heureDepartMin && 
                        new Date(t.dateDepart).getHours() <= formData.heureDepartMax;
        const compagnieOk = !formData.compagnieId || t.compagnieId === formData.compagnieId;
        return prixOk && heureOk && compagnieOk;
      });
    });
    return filtered;
  };

  const filteredTrajets = getFilteredTrajets();
  const filteredCorrespondances = getFilteredCorrespondances();

  const handleReserver = (trajetId: number) => {
    router.push(`/fr/reservation?trajetId=${trajetId}`);
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

  const resetFilters = () => {
    setFormData(prev => ({
      ...prev,
      prixMin: 0,
      prixMax: 1000,
      heureDepartMin: 0,
      heureDepartMax: 23,
      compagnieId: null,
    }));
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">

        {/* Hero Search */}
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

                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-sm text-orange-600 font-medium hover:text-orange-700 transition"
                >
                  <Filter size={16} />
                  {showFilters ? 'Masquer les filtres' : 'Filtres avancés'}
                </button>

                {showFilters && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-gray-100">
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
                        onChange={(e) => setFormData({ ...formData, prixMax: parseInt(e.target.value) || 1000 })}
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
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Compagnie</label>
                      <select
                        value={formData.compagnieId || ''}
                        onChange={(e) => setFormData({ ...formData, compagnieId: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
                      >
                        <option value="">Toutes</option>
                        {compagnies.map(comp => (
                          <option key={comp.id} value={comp.id}>{comp.nom}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold text-base transition shadow-lg shadow-orange-200"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Recherche en cours...
                      </span>
                    ) : '🔍 Rechercher des trajets'}
                  </button>
                  
                  {searched && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition text-sm font-medium"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="max-w-6xl mx-auto px-4 py-8">

          {searched && (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab('directs')}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition ${activeTab === 'directs' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
                >
                  Trajets directs ({filteredTrajets.length})
                </button>
                <button
                  onClick={() => setActiveTab('correspondances')}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition ${activeTab === 'correspondances' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
                >
                  Avec correspondances ({filteredCorrespondances.length})
                </button>
              </div>

              {/* Filtres actifs */}
              {(formData.prixMin > 0 || formData.prixMax < 1000 || formData.heureDepartMin > 0 || formData.heureDepartMax < 23 || formData.compagnieId) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs text-gray-500">Filtres actifs :</span>
                  {formData.prixMin > 0 && <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">Prix ≥ {formData.prixMin} DH</span>}
                  {formData.prixMax < 1000 && <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">Prix ≤ {formData.prixMax} DH</span>}
                  {formData.heureDepartMin > 0 && <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">Départ après {formData.heureDepartMin}h</span>}
                  {formData.heureDepartMax < 23 && <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">Départ avant {formData.heureDepartMax}h</span>}
                  {formData.compagnieId && compagnies.find(c => c.id === formData.compagnieId) && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {compagnies.find(c => c.id === formData.compagnieId)?.nom}
                    </span>
                  )}
                </div>
              )}

              {/* Trajets directs */}
              {activeTab === 'directs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTrajets.length === 0 ? (
                    <div className="col-span-full bg-white rounded-2xl p-12 text-center shadow-sm border">
                      <p className="text-4xl mb-3">🔍</p>
                      <p className="text-gray-500 font-medium">Aucun trajet ne correspond aux filtres</p>
                      <button onClick={resetFilters} className="mt-4 text-orange-500 text-sm hover:underline">
                        Réinitialiser les filtres
                      </button>
                    </div>
                  ) : (
                    filteredTrajets.map((trajet) => (
                      <FlightCard
                        key={trajet.id}
                        airline={trajet.compagnieNom}
                        flightCode={`BUS-${trajet.busMatricule?.slice(-4) || trajet.id}`}
                        flightClass="Standard"
                        departureCode={trajet.villeDepart.slice(0, 3).toUpperCase()}
                        departureCity={trajet.villeDepart}
                        departureTime={formatHeure(trajet.dateDepart)}
                        arrivalCode={trajet.villeArrivee.slice(0, 3).toUpperCase()}
                        arrivalCity={trajet.villeArrivee}
                        arrivalTime={formatHeure(trajet.dateArriveePrevue)}
                        duration={formatDuree(trajet.dateDepart, trajet.dateArriveePrevue)}
                        price={trajet.prixBase}
                        availableSeats={getSiegesDisponibles(trajet)}
                        onSelect={() => handleReserver(trajet.id)}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Correspondances */}
              {activeTab === 'correspondances' && (
                <div className="space-y-4">
                  {filteredCorrespondances.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm border">
                      <p className="text-4xl mb-3">🔄</p>
                      <p className="text-gray-500 font-medium">Aucune correspondance trouvée</p>
                    </div>
                  ) : (
                    filteredCorrespondances.map((groupe, idx) => (
                      <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-blue-50 px-5 py-3 border-b border-blue-100">
                          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                            🔄 Correspondance — {groupe.length} trajet(s)
                          </span>
                        </div>
                        <div className="p-5 space-y-4">
                          {groupe.map((trajet, i) => (
                            <div key={trajet.id}>
                              {i > 0 && (
                                <div className="flex items-center gap-2 text-xs text-orange-500 font-medium mb-3">
                                  <Clock size={12} />
                                  Correspondance à {trajet.villeDepart}
                                </div>
                              )}
                              <FlightCard
                                airline={trajet.compagnieNom}
                                flightCode={`BUS-${trajet.busMatricule?.slice(-4) || trajet.id}`}
                                flightClass="Standard"
                                departureCode={trajet.villeDepart.slice(0, 3).toUpperCase()}
                                departureCity={trajet.villeDepart}
                                departureTime={formatHeure(trajet.dateDepart)}
                                arrivalCode={trajet.villeArrivee.slice(0, 3).toUpperCase()}
                                arrivalCity={trajet.villeArrivee}
                                arrivalTime={formatHeure(trajet.dateArriveePrevue)}
                                duration={formatDuree(trajet.dateDepart, trajet.dateArriveePrevue)}
                                price={trajet.prixBase}
                                availableSeats={getSiegesDisponibles(trajet)}
                                onSelect={() => handleReserver(trajet.id)}
                              />
                            </div>
                          ))}
                          <div className="pt-3 border-t flex justify-between items-center">
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