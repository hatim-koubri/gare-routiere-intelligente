'use client';

import { useState } from 'react';
import { Bell, X, CheckCircle2, AlertTriangle, Info, AlertCircle,
  Bus, MapPin, Clock, MessageSquare, CreditCard, Zap, ExternalLink, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationSync } from '@/lib/hooks/useNotificationSync';
import { NotificationDTO } from '@/types';
import Link from 'next/link';

const iconMap: Record<string, React.ElementType> = {
  RETARD: AlertTriangle,
  ANNULATION: X,
  CHANGEMENT_QUAI: Info,
  CONFIRMATION_RESERVATION: CheckCircle2,
  RAPPEL_DEPART: Clock,
  INCIDENT: AlertCircle,
  ALERTE_GARE: AlertCircle,
  TRAJET_DEMARRE: Bus,
  TRAJET_TERMINE: CheckCircle2,
  JALON_ARRIVEE: MapPin,
  JALON_DEPART: MapPin,
  TICKET_VALIDE: CheckCircle2,
  RECLAMATION_TRAITEE: MessageSquare,
  REMBOURSEMENT_TRAITE: CreditCard,
  DEMANDE_AVIS: Star,
};

// RIHLA theme: orange/red replaces violet/blue accents, keeps semantic colors for alerts
const colorMap: Record<string, { icon: string; bg: string; border: string; badge: string }> = {
  RETARD:                  { icon: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-500/10',   border: 'border-amber-200 dark:border-amber-500/20',   badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' },
  ANNULATION:              { icon: 'text-rose-600',   bg: 'bg-rose-50 dark:bg-rose-500/10',     border: 'border-rose-200 dark:border-rose-500/20',     badge: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400' },
  CHANGEMENT_QUAI:         { icon: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', badge: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400' },
  CONFIRMATION_RESERVATION:{ icon: 'text-emerald-600',bg: 'bg-emerald-50 dark:bg-emerald-500/10',border: 'border-emerald-200 dark:border-emerald-500/20',badge: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
  RAPPEL_DEPART:           { icon: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', badge: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' },
  TRAJET_DEMARRE:          { icon: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', badge: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400' },
  TRAJET_TERMINE:          { icon: 'text-emerald-600',bg: 'bg-emerald-50 dark:bg-emerald-500/10',border: 'border-emerald-200 dark:border-emerald-500/20',badge: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
  JALON_ARRIVEE:           { icon: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-500/10',       border: 'border-red-200 dark:border-red-500/20',       badge: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' },
  JALON_DEPART:            { icon: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', badge: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' },
  TICKET_VALIDE:           { icon: 'text-emerald-600',bg: 'bg-emerald-50 dark:bg-emerald-500/10',border: 'border-emerald-200 dark:border-emerald-500/20',badge: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
  INCIDENT:                { icon: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-500/10',       border: 'border-red-200 dark:border-red-500/20',       badge: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' },
  ALERTE_GARE:             { icon: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-500/10',       border: 'border-red-200 dark:border-red-500/20',       badge: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' },
  RECLAMATION_TRAITEE:     { icon: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', badge: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400' },
  REMBOURSEMENT_TRAITE:    { icon: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-500/10',   border: 'border-amber-200 dark:border-amber-500/20',   badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' },
  DEMANDE_AVIS:            { icon: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10',  border: 'border-violet-200 dark:border-violet-500/20',  badge: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400' },
};

const defaultColor = { icon: 'text-slate-500', bg: 'bg-slate-50 dark:bg-zinc-800', border: 'border-slate-200 dark:border-zinc-700', badge: 'bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300' };

const typeLabels: Record<string, string> = {
  RETARD: 'Retard', ANNULATION: 'Annulation', CHANGEMENT_QUAI: 'Changement de quai',
  CONFIRMATION_RESERVATION: 'Confirmation', RAPPEL_DEPART: 'Rappel départ',
  TRAJET_DEMARRE: 'Trajet démarré', TRAJET_TERMINE: 'Trajet terminé',
  JALON_ARRIVEE: 'Arrivée', JALON_DEPART: 'Départ', TICKET_VALIDE: 'Ticket validé',
  INCIDENT: 'Incident', ALERTE_GARE: 'Alerte gare',
  RECLAMATION_TRAITEE: 'Réclamation traitée', REMBOURSEMENT_TRAITE: 'Remboursement traité',
  DEMANDE_AVIS: 'Donnez votre avis',
};

function parsePayload(payload: string): Record<string, any> {
  if (!payload) return {};
  try { return JSON.parse(payload); } catch {
    const match = payload.match(/^TRAJET_ID=(\d+)$/);
    if (match) return { trajetId: parseInt(match[1], 10) };
    return {};
  }
}

function formatDate(d: string) {
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return 'À l\'instant';
  if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function NotificationCard({ n, index }: { n: NotificationDTO; index: number }) {
  const Icon = iconMap[n.type] || Bell;
  const c = colorMap[n.type] || defaultColor;
  const info = parsePayload(n.payload);
  const trajetId = info.trajetId as number | undefined;
  const label = typeLabels[n.type] || n.type;

  const fmt = (d: string) => {
    try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch { return d; }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-white dark:bg-zinc-900 rounded-2xl border ${c.border} shadow-sm hover:shadow-md dark:hover:shadow-none transition-all duration-200 overflow-hidden`}
    >
      {/* Color accent top bar */}
      <div className={`h-1 ${c.badge.split(' ').find(cl => cl.startsWith('bg-')) || 'bg-orange-400'}`} />
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${c.bg} border ${c.border}`}>
            <Icon size={20} className={c.icon} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${c.badge}`}>
                {label}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                <Clock size={10} /> {formatDate(n.dateCreation)}
              </span>
            </div>

            {info.villeDepart && info.villeArrivee && (
              <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-3 mb-3 border border-slate-100 dark:border-zinc-700">
                <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-white mb-2">
                  <MapPin size={13} className="text-orange-400" />
                  {info.villeDepart} → {info.villeArrivee}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Clock size={11} className="text-orange-400" />
                    Départ : <span className="font-bold text-slate-700 dark:text-zinc-300 ml-0.5">{info.dateDepart ? fmt(info.dateDepart as string) : '—'}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={11} className="text-orange-400" />
                    Arrivée : <span className="font-bold text-slate-700 dark:text-zinc-300 ml-0.5">{info.dateArriveePrevue ? fmt(info.dateArriveePrevue as string) : '—'}</span>
                  </span>
                  {info.compagnieNom && (
                    <span className="flex items-center gap-1.5">
                      <Bus size={11} className="text-orange-400" />
                      <span className="font-bold text-slate-700 dark:text-zinc-300">{info.compagnieNom as string}</span>
                    </span>
                  )}
                  {info.quaiNumero && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-orange-400" />
                      Quai <span className="font-bold text-slate-700 dark:text-zinc-300 ml-0.5">{info.quaiNumero as number}</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">{n.message}</p>

            <div className="flex flex-wrap gap-2 mt-3">
              {trajetId && (
                <Link
                  href={`/fr/voyageur/reservations?trajet=${trajetId}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 px-3 py-1.5 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-500/20 transition"
                >
                  Voir le trajet <ExternalLink size={11} />
                </Link>
              )}
              {n.type === 'CONFIRMATION_RESERVATION' && (
                <Link
                  href="/fr/conditions"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-700 transition"
                >
                  Règles importantes <ExternalLink size={11} />
                </Link>
              )}
              {n.type === 'DEMANDE_AVIS' && (
                <Link
                  href="/fr/voyageur/avis"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-md shadow-violet-200 dark:shadow-none px-4 py-2 rounded-xl hover:opacity-90 transition"
                >
                  <Star size={12} /> Donner mon avis
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function VoyageurNotificationsPage() {
  const { notifications, pendingCount, syncing, loaded, sync, loadHistory } = useNotificationSync();
  const [showAll, setShowAll] = useState(false);
  const display = showAll ? notifications : notifications.slice(0, 20);

  return (
    <div className="space-y-6 pb-10">

      {/* ── Hero Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 40%, #dc2626 100%)' }}
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-sm" />
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl flex items-center justify-center">
                <Bell size={26} className="text-white" />
              </div>
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-white text-orange-600 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-orange-500 shadow-md animate-bounce">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black leading-tight">Mes Notifications</h1>
              <p className="text-orange-100 text-sm mt-0.5">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''} · mises à jour en temps réel
              </p>
            </div>
          </div>
          <button
            onClick={sync}
            disabled={syncing}
            className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-white/25 transition disabled:opacity-50"
          >
            <Zap size={15} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sync…' : pendingCount > 0 ? `Sync (${pendingCount})` : 'Actualiser'}
          </button>
        </div>
      </motion.div>

      {/* ── Pending banner ── */}
      <AnimatePresence>
        {pendingCount > 0 && !syncing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-center justify-between"
          >
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Bell size={16} className="animate-pulse" />
              {pendingCount} nouvelle{pendingCount > 1 ? 's' : ''} notification{pendingCount > 1 ? 's' : ''} non lue{pendingCount > 1 ? 's' : ''}
            </span>
            <button
              onClick={sync}
              className="text-xs font-black text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 px-4 py-2 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-500/30 transition"
            >
              Voir maintenant
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content ── */}
      {!loaded ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 dark:text-zinc-500 text-sm">Chargement des notifications…</p>
        </div>
      ) : display.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-16 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-emerald-500" />
          </div>
          <h2 className="text-lg font-black text-slate-700 dark:text-zinc-300 mb-2">Tout est à jour</h2>
          <p className="text-sm text-slate-400 dark:text-zinc-500 max-w-xs mx-auto mb-5">
            Aucune notification pour le moment. Vous serez alerté en cas de retard, annulation ou changement.
          </p>
          <button
            onClick={loadHistory}
            className="text-sm font-bold text-orange-500 hover:text-orange-600 underline underline-offset-2 transition"
          >
            Recharger l'historique
          </button>
        </motion.div>
      ) : (
        <>
          <div className="space-y-3">
            {display.map((n, i) => (
              <NotificationCard key={n.id} n={n} index={i} />
            ))}
          </div>

          {notifications.length > 20 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowAll(!showAll)}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-slate-600 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-orange-400 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm hover:border-orange-200 dark:hover:border-orange-900/30 hover:bg-orange-50/30 dark:hover:bg-zinc-800 transition-all"
            >
              {showAll ? '↑ Voir moins' : `↓ Voir tout (${notifications.length})`}
            </motion.button>
          )}
        </>
      )}
    </div>
  );
}
