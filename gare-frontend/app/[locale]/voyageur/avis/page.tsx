'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { avisApi, EligibleTrajet } from '@/lib/api/voyageur/avis';
import { AvisResponseDTO } from '@/types';
import { Star, MessageSquareText, Bus, Calendar, Building, ThumbsUp, Clock, MapPin, Send, X, ArrowLeft, Ban, ChevronRight, Globe } from 'lucide-react';

function StarRating({ value, onChange, readonly = false, size = 'md' }: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  return (
    <div className={`flex gap-0.5 ${readonly ? '' : 'cursor-pointer'}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${readonly ? '' : 'hover:scale-110'} transition-transform p-0.5`}
        >
          <Star
            className={`${sizeClass} ${
              star <= value
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-200 fill-slate-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function MesAvisPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<'eligibles' | 'mesavis'>('eligibles');
  const [eligibles, setEligibles] = useState<EligibleTrajet[]>([]);
  const [mesAvis, setMesAvis] = useState<AvisResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTrajet, setSelectedTrajet] = useState<EligibleTrajet | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [notePonctualite, setNotePonctualite] = useState(0);
  const [noteConfort, setNoteConfort] = useState(0);
  const [noteChauffeur, setNoteChauffeur] = useState(0);
  const [commentaire, setCommentaire] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/fr/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [e, a] = await Promise.all([
        avisApi.eligibles(),
        avisApi.mesAvis(),
      ]);
      setEligibles(e);
      setMesAvis(a);
    } catch { }
    finally { setLoading(false); }
  };

  const openModal = (t: EligibleTrajet) => {
    setSelectedTrajet(t);
    setNotePonctualite(0);
    setNoteConfort(0);
    setNoteChauffeur(0);
    setCommentaire('');
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedTrajet) return;
    if (notePonctualite === 0 || noteConfort === 0 || noteChauffeur === 0) {
      setError('Veuillez donner une note pour chaque critère.');
      return;
    }
    if (!commentaire.trim()) {
      setError('Veuillez écrire un commentaire.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await avisApi.ajouter({
        trajetId: selectedTrajet.trajetId,
        notePonctualite,
        noteConfort,
        noteChauffeur,
        commentaire: commentaire.trim(),
      });
      setShowModal(false);
      setSelectedTrajet(null);
      loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur lors de l\'envoi de l\'avis.');
    }
    finally { setSubmitting(false); }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Chargement de vos avis…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes avis</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Notez les trajets que vous avez effectués
          </p>
        </div>
        <button
          onClick={() => router.push('/fr/voyageur/dashboard')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium transition"
        >
          <ArrowLeft size={16} />
          Retour au tableau de bord
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 w-fit">
        <button
          onClick={() => setTab('eligibles')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'eligibles'
              ? 'bg-white text-violet-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          À noter
          {eligibles.length > 0 && (
            <span className="ml-2 bg-violet-600 text-white text-[10px] px-2 py-0.5 rounded-full">{eligibles.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab('mesavis')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'mesavis'
              ? 'bg-white text-violet-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Mes avis
          {mesAvis.length > 0 && (
            <span className="ml-2 bg-slate-300 text-slate-700 text-[10px] px-2 py-0.5 rounded-full">{mesAvis.length}</span>
          )}
        </button>
      </div>

      {/* ── Tab: À noter ── */}
      {tab === 'eligibles' && (
        eligibles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ThumbsUp size={28} className="text-emerald-600" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-2">Tout est à jour !</h3>
            <p className="text-sm text-slate-400 mb-5">Vous avez noté tous vos trajets éligibles.</p>
            {mesAvis.length > 0 && (
              <button
                onClick={() => setTab('mesavis')}
                className="inline-flex items-center gap-2 text-violet-600 font-semibold text-sm hover:text-violet-700 transition"
              >
                Voir mes avis <ChevronRight size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {eligibles.map((t, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={14} className="text-violet-500 shrink-0" />
                    <span className="font-bold text-slate-800">
                      {t.villeDepart} → {t.villeArrivee}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    {t.dateDepart && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} className="text-slate-400" />
                        {new Date(t.dateDepart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Building size={11} className="text-slate-400" />
                      {t.compagnieNom}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bus size={11} className="text-slate-400" />
                      {t.busMatricule}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => openModal(t)}
                  className="flex items-center gap-2 shrink-0 bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition shadow-sm"
                >
                  <MessageSquareText size={15} />
                  Noter
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Tab: Mes avis ── */}
      {tab === 'mesavis' && (
        mesAvis.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <MessageSquareText size={28} className="text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-2">Aucun avis pour le moment</h3>
            <p className="text-sm text-slate-400">Les trajets que vous noterez apparaîtront ici.</p>
            {eligibles.length > 0 && (
              <button
                onClick={() => setTab('eligibles')}
                className="mt-5 inline-flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition"
              >
                Noter un trajet <ChevronRight size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mesAvis.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition">
                {/* Header: Route */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin size={14} className="text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm leading-tight">
                      {a.villeDepart} → {a.villeArrivee}
                    </p>
                    <p className="text-xs text-slate-400">
                      {a.dateDepart ? new Date(a.dateDepart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      {a.compagnieNom && ` · ${a.compagnieNom}`}
                    </p>
                  </div>
                  <span className="ml-auto text-[10px] text-slate-400 shrink-0">
                    {new Date(a.dateAvis).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                {/* Ratings */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Ponctualité</p>
                    <StarRating value={a.notePonctualite} readonly size="sm" />
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Confort</p>
                    <StarRating value={a.noteConfort} readonly size="sm" />
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Chauffeur</p>
                    <StarRating value={a.noteChauffeur} readonly size="sm" />
                  </div>
                </div>

                {/* Comment */}
                {a.commentaire && (
                  <div className="bg-slate-50/50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 italic leading-relaxed">
                      &ldquo;{a.commentaire}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Modal: Ajouter un avis ── */}
      {showModal && selectedTrajet && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => { if (!submitting) setShowModal(false); }}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-700 to-purple-700 p-6 text-white relative">
              <button
                onClick={() => { if (!submitting) setShowModal(false); }}
                className="absolute top-4 right-4 p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  <MessageSquareText size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Donner mon avis</h2>
                  <p className="text-white/70 text-sm">
                    {selectedTrajet.villeDepart} → {selectedTrajet.villeArrivee}
                  </p>
                </div>
              </div>
              {selectedTrajet.dateDepart && (
                <div className="flex items-center gap-2 mt-3 text-white/60 text-xs">
                  <Calendar size={11} />
                  {new Date(selectedTrajet.dateDepart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  <span className="mx-1">·</span>
                  <Building size={11} />
                  {selectedTrajet.compagnieNom}
                </div>
              )}
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">

              {/* Ponctualité */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Clock size={15} className="text-violet-500" />
                  Ponctualité
                </label>
                <StarRating value={notePonctualite} onChange={setNotePonctualite} size="lg" />
              </div>

              {/* Confort */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Bus size={15} className="text-violet-500" />
                  Confort
                </label>
                <StarRating value={noteConfort} onChange={setNoteConfort} size="lg" />
              </div>

              {/* Chauffeur */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Globe size={15} className="text-violet-500" />
                  Chauffeur
                </label>
                <StarRating value={noteChauffeur} onChange={setNoteChauffeur} size="lg" />
              </div>

              {/* Commentaire */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <MessageSquareText size={15} className="text-violet-500" />
                  Commentaire
                </label>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Partagez votre expérience…"
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{commentaire.length}/500</p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3">
                  <Ban size={14} className="text-rose-500 shrink-0" />
                  <p className="text-xs text-rose-600">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white py-3.5 rounded-xl font-bold hover:from-violet-700 hover:to-purple-700 transition disabled:opacity-60 shadow-lg shadow-violet-200"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {submitting ? 'Envoi en cours…' : 'Envoyer mon avis'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
