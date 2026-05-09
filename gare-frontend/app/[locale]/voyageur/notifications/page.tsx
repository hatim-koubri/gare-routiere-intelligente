'use client';

import { useState } from 'react';
import { Bell, RefreshCw, AlertTriangle, X, Info, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Clock, Bus, MapPin, ExternalLink, Luggage } from 'lucide-react';
import { clsx } from 'clsx';
import { useNotificationSync } from '@/lib/hooks/useNotificationSync';
import { NotificationDTO } from '@/types';
import Link from 'next/link';

const iconMap: Record<string, React.ElementType> = {
  RETARD: AlertTriangle,
  ANNULATION: X,
  CHANGEMENT_QUAI: Info,
  TRAJET_DEMARRE: Bus,
  TRAJET_TERMINE: CheckCircle2,
  JALON_ARRIVEE: MapPin,
  JALON_DEPART: MapPin,
  TICKET_VALIDE: CheckCircle2,
  INCIDENT: AlertCircle,
  ALERTE_GARE: AlertCircle,
};

const colorMap: Record<string, string> = {
  RETARD: 'text-amber-600 bg-amber-50 border-amber-200',
  ANNULATION: 'text-rose-600 bg-rose-50 border-rose-200',
  CHANGEMENT_QUAI: 'text-blue-600 bg-blue-50 border-blue-200',
  CONFIRMATION_RESERVATION: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  RAPPEL_DEPART: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  TRAJET_DEMARRE: 'text-blue-600 bg-blue-50 border-blue-200',
  TRAJET_TERMINE: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  JALON_ARRIVEE: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  JALON_DEPART: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  TICKET_VALIDE: 'text-green-600 bg-green-50 border-green-200',
  INCIDENT: 'text-red-600 bg-red-50 border-red-200',
  ALERTE_GARE: 'text-red-600 bg-red-50 border-red-200',
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
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return 'À l\'instant';
  if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function NotificationCard({ n }: { n: NotificationDTO }) {
  const Icon = iconMap[n.type] || Bell;
  const colors = colorMap[n.type] || 'text-slate-600 bg-slate-50 border-slate-200';
  const info = parsePayload(n.payload);
  const trajetId = info.trajetId as number | undefined;

  const fmt = (d: string) => {
    try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch { return d; }
  };

  return (
    <div className={clsx('bg-white rounded-2xl border p-5 shadow-sm', colors.split(' ')[2] || 'border-slate-100')}>
      <div className="flex items-start gap-4">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colors.split(' ')[1])}>
          <Icon size={18} className={colors.split(' ')[0]} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className={clsx('text-[10px] font-bold uppercase tracking-widest', colors.split(' ')[0])}>{n.type}</span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock size={10} /> {formatDate(n.dateCreation)}
            </span>
          </div>

          {info.villeDepart && info.villeArrivee && (
            <div className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-100">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                {info.villeDepart} <span className="text-slate-300">→</span> {info.villeArrivee}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock size={12} /> Départ : <span className="font-semibold text-slate-700">{info.dateDepart ? fmt(info.dateDepart as string) : '—'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock size={12} /> Arrivée : <span className="font-semibold text-slate-700">{info.dateArriveePrevue ? fmt(info.dateArriveePrevue as string) : '—'}</span>
                </div>
                {info.compagnieNom && (
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Bus size={12} /> Compagnie : <span className="font-semibold text-slate-700">{info.compagnieNom as string}</span>
                  </div>
                )}
                {info.quaiNumero && (
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin size={12} /> Quai : <span className="font-semibold text-slate-700">{info.quaiNumero as number}</span>
                  </div>
                )}
                {info.busMatricule && (
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Bus size={12} /> Bus : <span className="font-semibold text-slate-700">{info.busMatricule as string}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{n.message}</p>

          {trajetId && (
            <Link
              href={`/fr/voyageur/reservations?trajet=${trajetId}`}
              className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 px-3 py-1.5 rounded-lg hover:bg-violet-100 transition"
            >
              Voir le trajet <ExternalLink size={12} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VoyageurNotificationsPage() {
  const { notifications, pendingCount, syncing, loaded, sync, loadHistory } = useNotificationSync();
  const [showAll, setShowAll] = useState(false);

  const display = showAll ? notifications : notifications.slice(0, 20);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
            <Bell size={18} className="text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
            <p className="text-slate-500 text-sm mt-0.5">Alertes et informations sur vos trajets</p>
          </div>
        </div>
        <button
          onClick={sync}
          disabled={syncing}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-violet-700 transition disabled:opacity-50 shadow-sm"
        >
          <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Sync...' : pendingCount > 0 ? `Sync (${pendingCount})` : 'Synchroniser'}
        </button>
      </div>

      {pendingCount > 0 && !syncing && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-amber-700 flex items-center gap-2">
            <Bell size={16} /> {pendingCount} notification{pendingCount > 1 ? 's' : ''} non lue{pendingCount > 1 ? 's' : ''}
          </span>
          <button onClick={sync} className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition">
            Synchroniser
          </button>
        </div>
      )}

      {!loaded ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : display.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-700 mb-1">Tout est à jour</h2>
          <p className="text-sm text-slate-400">Aucune notification pour le moment. Vous serez alerté en cas de retard, annulation ou changement sur vos trajets.</p>
          <button
            onClick={loadHistory}
            className="mt-4 text-sm font-semibold text-violet-600 hover:text-violet-700 underline underline-offset-2"
          >
            Actualiser
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {display.map(n => (
              <NotificationCard key={n.id} n={n} />
            ))}
          </div>

          {notifications.length > 20 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-violet-600 hover:text-violet-700 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-violet-50 transition"
            >
              {showAll ? (
                <>Voir moins <ChevronUp size={16} /></>
              ) : (
                <>Voir tout ({notifications.length}) <ChevronDown size={16} /></>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
