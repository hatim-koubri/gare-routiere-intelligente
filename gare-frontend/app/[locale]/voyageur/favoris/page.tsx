'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { favorisApi, FavoriDTO } from '@/lib/api/voyageur/favoris';
import { Heart, Trash2, ArrowRight, Search, Star, Bus } from 'lucide-react';

export default function FavorisPage() {
  const router = useRouter();
  const [favoris, setFavoris] = useState<FavoriDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavoris();
  }, []);

  const loadFavoris = async () => {
    try {
      const data = await favorisApi.getAll();
      setFavoris(data);
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
    } finally {
      setLoading(false);
    }
  };

  const supprimer = async (ligneId: number) => {
    try {
      await favorisApi.supprimer(ligneId);
      setFavoris(prev => prev.filter(f => f.ligneId !== ligneId));
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mes favoris</h1>
          <p className="text-sm text-gray-500">Trajets fréquents sauvegardés</p>
        </div>
        <button
          onClick={() => router.push('/fr/recherche')}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700 transition"
        >
          <Search size={16} />
          Nouvelle recherche
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl p-6 animate-pulse h-24" />)}
        </div>
      ) : favoris.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border">
          <Heart size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium mb-2">Aucun favori</p>
          <p className="text-sm text-gray-400 mb-4">Ajoutez vos trajets fréquents pour y accéder rapidement</p>
          <button
            onClick={() => router.push('/fr/recherche')}
            className="inline-flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition"
          >
            <Search size={16} />
            Rechercher un trajet
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {favoris.map((f) => (
            <div key={f.id} className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Bus size={24} className="text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {f.villeDepart} → {f.villeArrivee}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {f.compagnieNom} • À partir de {f.prixBase} DH
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => supprimer(f.ligneId)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Supprimer des favoris"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => router.push(`/fr/recherche?villeDepart=${f.villeDepart}&villeArrivee=${f.villeArrivee}`)}
                  className="flex items-center gap-1 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-700 transition"
                >
                  Rechercher
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
