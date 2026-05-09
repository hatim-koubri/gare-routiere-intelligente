'use client';

import { useState, useEffect } from 'react';
import { abonnementsApi, AbonnementDTO, LigneDisponible } from '@/lib/api/voyageur/abonnements';
import { Calendar, Clock, XCircle, RefreshCw, CreditCard, CheckCircle, AlertCircle, Plus, Building2, Sparkles } from 'lucide-react';

export default function AbonnementsPage() {
  const [abonnements, setAbonnements] = useState<AbonnementDTO[]>([]);
  const [lignesDisponibles, setLignesDisponibles] = useState<LigneDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [souscriptionLoading, setSouscriptionLoading] = useState<number | null>(null);
  const [showDisponibles, setShowDisponibles] = useState(false);

  useEffect(() => {
    Promise.all([loadAbonnements(), loadDisponibles()]);
  }, []);

  const loadAbonnements = async () => {
    try {
      const data = await abonnementsApi.getAll();
      setAbonnements(data);
    } catch (error) {
      console.error('Erreur chargement abonnements:', error);
    }
  };

  const loadDisponibles = async () => {
    try {
      const data = await abonnementsApi.getDisponibles();
      setLignesDisponibles(data);
    } catch (error) {
      console.error('Erreur chargement lignes disponibles:', error);
    } finally {
      setLoading(false);
    }
  };

  const resilier = async (id: number) => {
    if (!confirm('Voulez-vous vraiment résilier cet abonnement ?')) return;
    try {
      await abonnementsApi.resilier(id);
      loadAbonnements();
    } catch (error) {
      console.error('Erreur résiliation:', error);
    }
  };

  const toggleRenouvellement = async (id: number) => {
    try {
      await abonnementsApi.toggleRenouvellementAuto(id);
      loadAbonnements();
    } catch (error) {
      console.error('Erreur toggle renouvellement:', error);
    }
  };

  const souscrire = async (ligneId: number) => {
    setSouscriptionLoading(ligneId);
    try {
      await abonnementsApi.souscrire(ligneId);
      await Promise.all([loadAbonnements(), loadDisponibles()]);
    } catch (error) {
      console.error('Erreur souscription:', error);
      alert('Impossible de souscrire à cet abonnement');
    } finally {
      setSouscriptionLoading(null);
    }
  };

  const joursRestants = (dateFin: string) => {
    const diff = new Date(dateFin).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mes abonnements</h1>
          <p className="text-sm text-gray-500">Abonnements mensuels illimités</p>
        </div>
        {lignesDisponibles.length > 0 && (
          <button
            onClick={() => setShowDisponibles(!showDisponibles)}
            className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700 transition shadow-sm"
          >
            <Plus size={16} />
            Souscrire
          </button>
        )}
      </div>

      {/* Lignes disponibles à souscrire */}
      {showDisponibles && (
        <div className="mb-8 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-violet-600" />
            <h2 className="font-bold text-violet-800">Abonnements disponibles</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lignesDisponibles.map(ligne => (
              <div key={ligne.id} className="bg-white rounded-xl p-5 shadow-sm border border-violet-100 hover:shadow-md transition">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 size={16} className="text-violet-500" />
                  <span className="text-xs font-semibold text-violet-600 uppercase tracking-wide">{ligne.compagnieNom}</span>
                </div>
                <p className="font-bold text-gray-800 mb-1">
                  {ligne.villeDepart} → {ligne.villeArrivee}
                </p>
                <p className="text-2xl font-black text-violet-600 mb-4">
                  {ligne.prixAbonnementMensuel.toFixed(0)} DH<span className="text-sm font-medium text-gray-400">/mois</span>
                </p>
                <button
                  onClick={() => souscrire(ligne.id)}
                  disabled={souscriptionLoading === ligne.id}
                  className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-violet-700 transition disabled:opacity-50"
                >
                  {souscriptionLoading === ligne.id ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Plus size={15} /> Souscrire</>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="bg-white rounded-xl p-6 animate-pulse h-28" />)}
        </div>
      ) : abonnements.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border">
          <RefreshCw size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium mb-2">Aucun abonnement actif</p>
          <p className="text-sm text-gray-400">
            Souscrivez un abonnement mensuel sur une ligne pour voyager en illimité
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {abonnements.map((a) => {
            const actif = a.actif && new Date(a.dateFin) >= new Date();
            const reste = joursRestants(a.dateFin);
            return (
              <div key={a.id} className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${actif ? 'border-l-green-500' : 'border-l-gray-300'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-800 text-lg">
                        {a.villeDepart} → {a.villeArrivee}
                      </h3>
                      {actif ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <CheckCircle size={12} /> Actif
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <AlertCircle size={12} /> Inactif
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xl font-black text-violet-600">{a.prixMensuel.toFixed(0)} DH/mois</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} className="text-gray-400" />
                    <span>Début: {new Date(a.dateDebut).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} className="text-gray-400" />
                    <span>Fin: {new Date(a.dateFin).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CreditCard size={16} className="text-gray-400" />
                    <span>Renouvellement auto: {a.renouvellementAuto ? 'Oui' : 'Non'}</span>
                  </div>
                </div>

                {actif && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-violet-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (30 - reste) / 30 * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{reste} jours restants</span>
                  </div>
                )}

                {actif && (
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                    <button
                      onClick={() => toggleRenouvellement(a.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                        a.renouvellementAuto
                          ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {a.renouvellementAuto ? 'Désactiver renouvellement auto' : 'Activer renouvellement auto'}
                    </button>
                    <button
                      onClick={() => resilier(a.id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 transition"
                    >
                      <XCircle size={14} className="inline mr-1" />
                      Résilier
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
