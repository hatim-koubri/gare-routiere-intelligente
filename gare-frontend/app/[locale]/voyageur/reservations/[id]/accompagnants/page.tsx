'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, AlertCircle, CheckCircle, X, UserPlus, ArmchairIcon, Lock, UserCheck } from 'lucide-react';
import { reservationApi } from '@/lib/api/voyageur/reservation';
import type { MembreGroupeDTO, MembreGroupeRequest } from '@/types';

interface ReservationData {
  id: number;
  trajet: {
    id: number;
    dateDepart: string;
    villeDepart: string;
    villeArrivee: string;
    compagnieNom: string;
    prixBase?: number;
  };
  membres: MembreGroupeDTO[];
  statut: string;
  prixTotal: number;
  nbModif: number;
}

interface FormData {
  nomManuel: string;
  prenomManuel: string;
  sexe: string;
  age: number | '';
  categorieTarifaire: string;
  lienOrganisateur: string;
  enfantSurGenoux: boolean;
}

const EMPTY_FORM: FormData = {
  nomManuel: '',
  prenomManuel: '',
  sexe: '',
  age: '',
  categorieTarifaire: 'NORMAL',
  lienOrganisateur: '',
  enfantSurGenoux: false,
};

export default function AccompagnantsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const locale = 'fr';
  const reservationId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingMembreId, setEditingMembreId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<MembreGroupeDTO | null>(null);
  const [refundInfo, setRefundInfo] = useState<{ montant: number; motif: string } | null>(null);
  const [numeroCarte, setNumeroCarte] = useState('');
  const [dateExpiration, setDateExpiration] = useState('');
  const [cvv, setCvv] = useState('');

  const [busPlan, setBusPlan] = useState<any[]>([]);
  const [selectedSiege, setSelectedSiege] = useState<string>('');
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push(`/fr/auth/login`);
  }, [user, authLoading, router, locale]);

  useEffect(() => {
    if (user && reservationId) loadReservation();
  }, [user, reservationId]);

  const loadReservation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/voyageur/reservations/${reservationId}`);
      const data = res.data;
      if (!data.membres) data.membres = [];
      setReservation(data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingMembreId(null);
    setShowForm(false);
    setNumeroCarte('');
    setDateExpiration('');
    setCvv('');
    setSelectedSiege('');
    setBusPlan([]);
  };

  const openEditForm = (membre: MembreGroupeDTO) => {
    setForm({
      nomManuel: membre.nom || '',
      prenomManuel: membre.prenom || '',
      sexe: membre.sexe || '',
      age: membre.age ?? '',
      categorieTarifaire: membre.categorieTarifaire || 'NORMAL',
      lienOrganisateur: membre.lienOrganisateur || '',
      enfantSurGenoux: membre.enfantSurGenoux,
    });
    setEditingMembreId(membre.id);
    setShowForm(true);
    setError(null);
  };

  const loadBusPlan = async () => {
    if (!reservation?.trajet?.id) return;
    setLoadingPlan(true);
    try {
      const response = await apiClient.get(`/voyageur/reservations/trajets/${reservation.trajet.id}/plan-bus`);
      setBusPlan(response.data || []);
    } catch (e) {
      console.error('Erreur chargement plan bus:', e);
    } finally {
      setLoadingPlan(false);
    }
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
    loadBusPlan();
  };

  const estimerPrixMembre = (): number => {
    if (form.enfantSurGenoux) return 0;
    const prixBase = reservation?.trajet?.prixBase ?? 0;
    let prix = prixBase;
    if (form.categorieTarifaire === 'ETUDIANT') prix *= 0.75;
    else if (form.categorieTarifaire === 'ENFANT') prix *= 0.50;
    else if (form.categorieTarifaire === 'MILITAIRE') prix *= 0.70;
    else if (form.categorieTarifaire === 'SENIOR') prix *= 0.80;
    return prix;
  };

  const handleSubmit = async () => {
    if (!form.prenomManuel.trim() || !form.nomManuel.trim()) {
      setError('Le prénom et le nom sont obligatoires');
      return;
    }

    if (!editingMembreId && !form.enfantSurGenoux && !selectedSiege) {
      setError('Veuillez sélectionner un siège pour ce membre');
      return;
    }

    const besoinPaiement = reservation?.statut === 'CONFIRMEE';
    if (besoinPaiement && !editingMembreId && (!numeroCarte || !dateExpiration || !cvv)) {
      setError('Veuillez remplir les informations de paiement pour le billet du membre');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload: MembreGroupeRequest = {
        nomManuel: form.nomManuel,
        prenomManuel: form.prenomManuel,
        sexe: (form.sexe || undefined) as 'HOMME' | 'FEMME' | undefined,
        age: form.age !== '' ? form.age : undefined,
        categorieTarifaire: form.categorieTarifaire,
        lienOrganisateur: form.lienOrganisateur || undefined,
        enfantSurGenoux: form.enfantSurGenoux,
        numeroSiege: selectedSiege || undefined,
      };

      if (besoinPaiement && !editingMembreId) {
        payload.numeroCarte = numeroCarte;
        payload.dateExpiration = dateExpiration;
        payload.cvv = cvv;
      }

      if (editingMembreId) {
        await reservationApi.modifierMembre(Number(reservationId), editingMembreId, payload);
        setSuccess('Membre modifié avec succès');
      } else {
        await reservationApi.ajouterMembre(Number(reservationId), payload);
        setSuccess('Membre ajouté avec succès');
      }

      resetForm();
      await loadReservation();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (membreId: number) => {
    setDeletingId(membreId);
    setError(null);
    try {
      const response = await reservationApi.supprimerMembre(Number(reservationId), membreId);
      if (response) {
        setRefundInfo({ montant: response.montant, motif: response.motif });
        setSuccess(`Membre supprimé. Demande de remboursement de ${response.montant} MAD créée.`);
      } else {
        setSuccess('Membre supprimé avec succès');
      }
      setShowDeleteConfirm(null);
      await loadReservation();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error && !reservation) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 inline-flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
        <Link href={`/fr/voyageur/reservations`} className="text-blue-600 mt-4 inline-block">Retour à mes réservations</Link>
      </div>
    );
  }

  const isPast = reservation?.trajet.dateDepart && new Date(reservation.trajet.dateDepart) < new Date();
  const isAnnuleeOrRemboursee = reservation?.statut === 'ANNULEE' || reservation?.statut === 'REMBOURSEE';
  const canModify = !isPast && !isAnnuleeOrRemboursee && reservation?.trajet.dateDepart
    && (new Date(reservation.trajet.dateDepart).getTime() - Date.now()) > 24 * 60 * 60 * 1000;
  const membres = reservation?.membres || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href={`/fr/voyageur/reservations/${reservationId}`} className="p-2 rounded-lg hover:bg-gray-100 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Accompagnants</h1>
      </div>

      {reservation && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-700 font-medium">
            {reservation.trajet.villeDepart} → {reservation.trajet.villeArrivee}
          </p>
          <p className="text-xs text-gray-500 mt-1">{reservation.trajet.compagnieNom}</p>
        </div>
      )}

      {!canModify && !isAnnuleeOrRemboursee && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Modifications possibles seulement jusqu'à 24h avant le départ.
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle className="w-4 h-4" />
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {refundInfo && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <p className="font-medium text-amber-800 mb-1">Demande de remboursement créée</p>
          <p className="text-amber-700">{refundInfo.motif}</p>
          <p className="text-amber-700 mt-1">Montant : {refundInfo.montant} MAD — en attente de validation par le responsable.</p>
          <button onClick={() => setRefundInfo(null)} className="mt-2 text-amber-600 underline text-xs">Fermer</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Liste des membres ({membres.length})</h2>
          {canModify && (
            <button
              onClick={openAddForm}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              <UserPlus className="w-4 h-4" /> Ajouter
            </button>
          )}
        </div>

        {membres.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucun membre dans ce groupe</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {membres.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{m.prenom} {m.nom}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                    {m.sexe && <span>{m.sexe === 'HOMME' ? 'Homme' : 'Femme'}</span>}
                    {m.age && <span>{m.age} ans</span>}
                    <span>{m.categorieTarifaire}</span>
                    {m.enfantSurGenoux && <span className="text-amber-600">Sur les genoux</span>}
                    {m.lienOrganisateur && <span>{m.lienOrganisateur}</span>}
                    {m.numeroSiege && <span>Siège {m.numeroSiege}</span>}
                    {m.ticketId && <span className="text-blue-600">Ticket #{m.ticketId}</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{m.prixTicket} MAD</p>
                </div>
                {canModify && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditForm(m)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(m)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Supprimer {showDeleteConfirm.prenom} {showDeleteConfirm.nom} ?</h3>
              <p className="text-sm text-gray-500 mb-1">Ce membre sera retiré du groupe.</p>
              {reservation?.statut === 'CONFIRMEE' && (
                <p className="text-sm text-amber-600 font-medium">
                  Une demande de remboursement sera créée selon le taux en vigueur ({showDeleteConfirm.prixTicket} MAD).
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => { handleDelete(showDeleteConfirm.id); }}
                disabled={deletingId === showDeleteConfirm.id}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingId === showDeleteConfirm.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Supprimer
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !submitting && resetForm()}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editingMembreId ? 'Modifier le membre' : 'Ajouter un membre'}
              </h3>
              <button onClick={resetForm} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    value={form.prenomManuel}
                    onChange={(e) => setForm({ ...form, prenomManuel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    value={form.nomManuel}
                    onChange={(e) => setForm({ ...form, nomManuel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                  <select
                    value={form.sexe}
                    onChange={(e) => setForm({ ...form, sexe: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Non précisé</option>
                    <option value="HOMME">Homme</option>
                    <option value="FEMME">Femme</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Âge</label>
                  <input
                    type="number"
                    min={0}
                    max={150}
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie tarifaire</label>
                <select
                  value={form.categorieTarifaire}
                  onChange={(e) => setForm({ ...form, categorieTarifaire: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="ETUDIANT">Étudiant (-25%)</option>
                  <option value="ENFANT">Enfant (-50%)</option>
                  <option value="MILITAIRE">Militaire (-30%)</option>
                  <option value="SENIOR">Senior (-20%)</option>
                </select>
              </div>

              {/* Sélection du siège */}
              {!editingMembreId && !form.enfantSurGenoux && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Siège pour ce membre
                  </label>
                  {loadingPlan ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    </div>
                  ) : busPlan.length > 0 ? (
                    <>
                      <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                        {busPlan.map((s: any) => {
                          const estOccupe = s.occupe;
                          const estBloque = s.bloque;
                          const estVerrouille = s.verrouilleTemporaire;
                          const estSelectionne = selectedSiege === s.numeroSiege;
                          const membresSieges = reservation?.membres?.map(m => m.numeroSiege) || [];
                          const estDejaPris = membresSieges.includes(s.numeroSiege);
                          const estDispo = !estOccupe && !estBloque && !estVerrouille && !estDejaPris;
                          
                          let btnClass = 'p-2 rounded-lg border text-xs font-medium text-center transition ';
                          if (estSelectionne) {
                            btnClass += 'bg-blue-600 text-white border-blue-600';
                          } else if (estOccupe || estDejaPris) {
                            btnClass += 'bg-red-100 text-red-500 border-red-200 cursor-not-allowed';
                          } else if (estBloque) {
                            btnClass += 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed';
                          } else if (estVerrouille) {
                            btnClass += 'bg-yellow-100 text-yellow-600 border-yellow-300 cursor-not-allowed';
                          } else {
                            btnClass += 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer';
                          }

                          let icon = null;
                          if (estSelectionne) icon = <UserCheck className="w-3 h-3 mx-auto" />;
                          else if (estOccupe || estDejaPris) icon = <UserCheck className="w-3 h-3 mx-auto" />;
                          else if (estBloque || estVerrouille) icon = <Lock className="w-3 h-3 mx-auto" />;

                          return (
                            <button
                              key={s.numeroSiege}
                              type="button"
                              onClick={() => estDispo && setSelectedSiege(s.numeroSiege)}
                              disabled={!estDispo}
                              className={btnClass}
                              title={`Siège ${s.numeroSiege}${estOccupe ? ' - Occupé' : ''}${estBloque ? ' - Bloqué' : ''}${estVerrouille ? ' - Verrouillé' : ''}${estDejaPris ? ' - Déjà attribué' : ''}`}
                            >
                              <div>{icon}</div>
                              <div>{s.numeroSiege}</div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block"></span> Occupé</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 border border-gray-300 inline-block"></span> Bloqué</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300 inline-block"></span> Verrouillé</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white border border-gray-200 inline-block"></span> Libre</span>
                      </div>
                      {selectedSiege && (
                        <p className="text-xs text-blue-600 mt-1">Siège sélectionné: {selectedSiege}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-gray-400">Chargement du plan du bus...</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien avec l'organisateur</label>
                <select
                  value={form.lienOrganisateur}
                  onChange={(e) => setForm({ ...form, lienOrganisateur: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner...</option>
                  <option value="CONJOINT">Conjoint(e)</option>
                  <option value="FAMILLE">Famille</option>
                  <option value="AMI">Ami(e)</option>
                  <option value="COLLEGUE">Collègue</option>
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enfantSurGenoux}
                  onChange={(e) => setForm({ ...form, enfantSurGenoux: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enfant sur les genoux (gratuit, sans siège)</span>
              </label>

              {reservation?.statut === 'CONFIRMEE' && !editingMembreId && (
                <div className="p-4 border border-amber-200 rounded-xl bg-amber-50">
                  <h4 className="text-sm font-semibold text-amber-800 mb-3">
                    Paiement du billet membre ({estimerPrixMembre().toFixed(2)} MAD)
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-amber-700 mb-1">Numéro de carte</label>
                      <input
                        type="text"
                        value={numeroCarte}
                        onChange={(e) => setNumeroCarte(e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-3 py-2 rounded-lg border border-amber-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-amber-700 mb-1">Date d'expiration</label>
                        <input
                          type="text"
                          value={dateExpiration}
                          onChange={(e) => setDateExpiration(e.target.value)}
                          placeholder="MM/AA"
                          className="w-full px-3 py-2 rounded-lg border border-amber-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-amber-700 mb-1">CVV</label>
                        <input
                          type="text"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          placeholder="123"
                          className="w-full px-3 py-2 rounded-lg border border-amber-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {editingMembreId ? 'Enregistrer' : 'Ajouter'}
              </button>
              <button
                onClick={resetForm}
                disabled={submitting}
                className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <Link href={`/fr/voyageur/reservations/${reservationId}`} className="text-gray-600 hover:text-gray-800 text-sm">
          ← Retour à la réservation
        </Link>
      </div>
    </div>
  );
}
