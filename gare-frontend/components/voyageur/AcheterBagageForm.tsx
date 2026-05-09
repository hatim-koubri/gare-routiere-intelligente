'use client';

import { useState } from 'react';
import { reservationApi } from '@/lib/api/voyageur/reservation';
import { Package, Plus, Minus, AlertCircle, CheckCircle, ArrowLeft, Zap } from 'lucide-react';
import Link from 'next/link';

interface AcheterBagageFormProps {
  reservationId: string;
  onSuccess?: () => void;
  isModal?: boolean;
}

export function AcheterBagageForm({ reservationId, onSuccess, isModal = false }: AcheterBagageFormProps) {
  const [bagages, setBagages] = useState([
    { poidsKg: 20, dimensionCm: '60x40x30' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);

  // Formule de calcul du surplus de bagage (à adapter selon la politique tarifaire)
  const calculerSurplus = (poidsKg: number): number => {
    const maxPoids = 20; // Bagage standard: max 20kg
    if (poidsKg <= maxPoids) return 0;
    const surplusKg = poidsKg - maxPoids;
    return surplusKg * 10; // 10 DH par kg de surplus
  };

  const calculerTotal = () => {
    const total = bagages.reduce((sum, b) => sum + calculerSurplus(b.poidsKg), 0);
    setTotalPrice(total);
  };

  const handlePoidChange = (index: number, newPoids: number) => {
    if (newPoids > 0 && newPoids <= 50) {
      const updated = [...bagages];
      updated[index].poidsKg = newPoids;
      setBagages(updated);
      calculerTotal();
    }
  };

  const handleDimensionChange = (index: number, newDimension: string) => {
    const updated = [...bagages];
    updated[index].dimensionCm = newDimension;
    setBagages(updated);
  };

  const ajouterBagage = () => {
    if (bagages.length < 5) {
      setBagages([...bagages, { poidsKg: 20, dimensionCm: '60x40x30' }]);
    }
  };

  const supprimerBagage = (index: number) => {
    if (bagages.length > 1) {
      const updated = bagages.filter((_, i) => i !== index);
      setBagages(updated);
      const newTotal = updated.reduce((sum, b) => sum + calculerSurplus(b.poidsKg), 0);
      setTotalPrice(newTotal);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!bagages.length) {
      setError('Veuillez ajouter au moins un bagage');
      return;
    }

    for (let b of bagages) {
      if (!b.poidsKg || !b.dimensionCm) {
        setError('Veuillez remplir tous les champs de bagage');
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    
    try {
      await reservationApi.ajouterBagages(
        parseInt(reservationId),
        bagages.map(b => ({
          poidsKg: b.poidsKg,
          dimensionCm: b.dimensionCm,
        }))
      );
      
      setSuccess(true);
      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'achat du bagage');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className={`flex flex-col items-center justify-center ${isModal ? 'py-8' : 'min-h-[60vh]'} text-center px-4`}>
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto">
            <CheckCircle size={38} className="text-emerald-600" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Bagages achetés avec succès</h2>
        <p className="text-slate-500 max-w-sm mb-4">
          {bagages.length} bagage{bagages.length > 1 ? 's' : ''} a été ajouté à votre réservation.
        </p>
        <p className="text-lg font-bold text-slate-900 mb-6">{totalPrice} MAD</p>
        {!isModal && (
          <Link
            href={`/fr/voyageur/reservations`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition"
          >
            <ArrowLeft size={16} />
            Retour à mes réservations
          </Link>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800">Erreur</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <Zap className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-1">Comment ça marche</p>
          <p>Déclarez vos bagages avec leur poids et dimensions. Un surplus sera calculé si le poids dépasse 20kg.</p>
        </div>
      </div>

      {/* Liste des bagages */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Mes bagages</h3>
          <span className="text-sm text-gray-500">{bagages.length}/5</span>
        </div>

        {bagages.map((bagage, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
            <div className="flex justify-between items-start">
              <p className="font-semibold text-gray-700">Bagage {index + 1}</p>
              {bagages.length > 1 && (
                <button
                  type="button"
                  onClick={() => supprimerBagage(index)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium transition"
                >
                  Supprimer
                </button>
              )}
            </div>

            {/* Poids */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poids (kg)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                step="0.1"
                value={bagage.poidsKg}
                onChange={(e) => handlePoidChange(index, parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Standard: max 20kg, surplus: 10 DH/kg</p>
            </div>

            {/* Dimensions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dimensions (LxWxH cm)
              </label>
              <input
                type="text"
                value={bagage.dimensionCm}
                onChange={(e) => handleDimensionChange(index, e.target.value)}
                placeholder="Ex: 60x40x30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Format: Longueur x Largeur x Hauteur</p>
            </div>

            {/* Surplus */}
            {calculerSurplus(bagage.poidsKg) > 0 && (
              <div className="p-2 bg-orange-50 rounded border border-orange-200">
                <p className="text-sm text-orange-700">
                  Surplus: <span className="font-bold">{calculerSurplus(bagage.poidsKg)} MAD</span>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bouton ajouter bagage */}
      {bagages.length < 5 && (
        <button
          type="button"
          onClick={ajouterBagage}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter un bagage
        </button>
      )}

      {/* Résumé du prix */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <p className="text-lg font-bold text-gray-900">Total surcharge bagage</p>
          <p className="text-2xl font-bold text-blue-600">{totalPrice} MAD</p>
        </div>
      </div>

      {/* Bouton soumettre */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
      >
        {submitting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Traitement en cours...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Package className="w-4 h-4" />
            Ajouter les bagages pour {totalPrice} MAD
          </div>
        )}
      </button>
    </form>
  );
}
