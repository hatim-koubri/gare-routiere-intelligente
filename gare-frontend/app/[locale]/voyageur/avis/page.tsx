'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { avisApi, EligibleTrajet } from '@/lib/api/voyageur/avis';
import { AvisResponseDTO } from '@/types';
import { Star, MessageSquareText, Bus, Calendar, Building, ThumbsUp, Clock, MapPin, Send, X, ArrowLeft, Ban, ChevronRight, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

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
                : 'text-slate-200 fill-slate-200 dark:text-zinc-700 dark:fill-zinc-700'
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
      setError(e?.response?.data?.message || e?.message || "Erreur lors de l'envoi de l'avis.");
    }
    finally { setSubmitting(false); }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 dark:text-zinc-500 text-sm">Chargement de vos avis…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <MessageSquareText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Mes avis</h1>
              <p className="text-sm text-white/80">Notez les trajets que vous avez effectués</p>
            </div>
          </div>
          <button onClick={() => router.push('/fr/voyageur/dashboard')}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm border border-white/10">
            <ArrowLeft size={15} />
            Tableau de bord
          </button>
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex gap-1 bg-slate-100 dark:bg-zinc-800 rounded-2xl p-1 w-fit">
        <button onClick={() => setTab('eligibles')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'eligibles'
              ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-sm'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
          }`}>
          À noter
          {eligibles.length > 0 && (
            <span className="ml-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{eligibles.length}</span>
          )}
        </button>
        <button onClick={() => setTab('mesavis')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'mesavis'
              ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-sm'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
          }`}>
          Mes avis
          {mesAvis.length > 0 && (
            <span className="ml-2 bg-slate-300 dark:bg-zinc-600 text-slate-700 dark:text-zinc-300 text-[10px] px-2 py-0.5 rounded-full">{mesAvis.length}</span>
          )}
        </button>
      </motion.div>

      {/* ── Tab: À noter ── */}
      {tab === 'eligibles' && (
        eligibles.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-14 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ThumbsUp size={28} className="text-orange-500" />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-zinc-300 mb-2">Tout est à jour !</h3>
            <p className="text-sm text-slate-400 dark:text-zinc-500 mb-5">Vous avez noté tous vos trajets éligibles.</p>
            {mesAvis.length > 0 && (
              <button onClick={() => setTab('mesavis')}
                className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold text-sm hover:text-orange-700 transition">
                Voir mes avis <ChevronRight size={16} />
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {eligibles.map((t, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-900 hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={14} className="text-orange-500 shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-white">
                      {t.villeDepart} → {t.villeArrivee}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-zinc-400">
                    {t.dateDepart && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} className="text-slate-400 dark:text-zinc-500" />
                        {new Date(t.dateDepart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Building size={11} className="text-slate-400 dark:text-zinc-500" />
                      {t.compagnieNom}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bus size={11} className="text-slate-400 dark:text-zinc-500" />
                      {t.busMatricule}
                    </span>
                  </div>
                </div>
                <button onClick={() => openModal(t)}
                  className="flex items-center gap-2 shrink-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-md shadow-orange-200/50 dark:shadow-none">
                  <MessageSquareText size={15} />
                  Noter
                </button>
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* ── Tab: Mes avis ── */}
      {tab === 'mesavis' && (
        mesAvis.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-14 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <MessageSquareText size={28} className="text-orange-400" />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-zinc-300 mb-2">Aucun avis pour le moment</h3>
            <p className="text-sm text-slate-400 dark:text-zinc-500">Les trajets que vous noterez apparaîtront ici.</p>
            {eligibles.length > 0 && (
              <button onClick={() => setTab('eligibles')}
                className="mt-5 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-md shadow-orange-200/50 dark:shadow-none">
                Noter un trajet <ChevronRight size={16} />
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mesAvis.map((a, idx) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm p-5 hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-900 hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin size={14} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-white text-sm leading-tight">
                      {a.villeDepart} → {a.villeArrivee}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500">
                      {a.dateDepart ? new Date(a.dateDepart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      {a.compagnieNom && ` · ${a.compagnieNom}`}
                    </p>
                  </div>
                  <span className="ml-auto text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">
                    {new Date(a.dateAvis).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mb-1">Ponctualité</p>
                    <StarRating value={a.notePonctualite} readonly size="sm" />
                  </div>
                  <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mb-1">Confort</p>
                    <StarRating value={a.noteConfort} readonly size="sm" />
                  </div>
                  <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mb-1">Chauffeur</p>
                    <StarRating value={a.noteChauffeur} readonly size="sm" />
                  </div>
                </div>

                {a.commentaire && (
                  <div className="bg-slate-50/50 dark:bg-zinc-800/50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 dark:text-zinc-400 italic leading-relaxed">
                      &ldquo;{a.commentaire}&rdquo;
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )
      )}

      {/* ── Modal: Ajouter un avis ── */}
      {showModal && selectedTrajet && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => { if (!submitting) setShowModal(false); }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 text-white relative">
              <button onClick={() => { if (!submitting) setShowModal(false); }}
                className="absolute top-4 right-4 p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition">
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

            <div className="p-6 space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                  <Clock size={15} className="text-orange-500" />
                  Ponctualité
                </label>
                <StarRating value={notePonctualite} onChange={setNotePonctualite} size="lg" />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                  <Bus size={15} className="text-orange-500" />
                  Confort
                </label>
                <StarRating value={noteConfort} onChange={setNoteConfort} size="lg" />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                  <Globe size={15} className="text-orange-500" />
                  Chauffeur
                </label>
                <StarRating value={noteChauffeur} onChange={setNoteChauffeur} size="lg" />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                  <MessageSquareText size={15} className="text-orange-500" />
                  Commentaire
                </label>
                <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Partagez votre expérience…" rows={3} maxLength={500}
                  className="w-full border border-slate-200 dark:border-zinc-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 resize-none bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 text-right">{commentaire.length}/500</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-3">
                  <Ban size={14} className="text-rose-500 shrink-0" />
                  <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
                </div>
              )}

              <button onClick={handleSubmit} disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3.5 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-60 shadow-lg shadow-orange-200/50 dark:shadow-none">
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {submitting ? 'Envoi en cours…' : 'Envoyer mon avis'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
