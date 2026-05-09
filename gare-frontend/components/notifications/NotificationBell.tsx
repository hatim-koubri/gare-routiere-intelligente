'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCircle2, AlertTriangle, Info, AlertCircle, Bus, MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import { useNotificationSync } from '@/lib/hooks/useNotificationSync';
import { NotificationDTO } from '@/types';

const iconMap: Record<string, React.ElementType> = {
  RETARD: AlertTriangle,
  ANNULATION: X,
  CHANGEMENT_QUAI: Info,
  INCIDENT: AlertCircle,
  ALERTE_GARE: AlertCircle,
  TRAJET_DEMARRE: Bus,
  TRAJET_TERMINE: CheckCircle2,
  JALON_ARRIVEE: MapPin,
  JALON_DEPART: MapPin,
  TICKET_VALIDE: CheckCircle2,
};

const colorMap: Record<string, string> = {
  RETARD: 'text-amber-600 bg-amber-50',
  ANNULATION: 'text-rose-600 bg-rose-50',
  CHANGEMENT_QUAI: 'text-blue-600 bg-blue-50',
  CONFIRMATION_RESERVATION: 'text-emerald-600 bg-emerald-50',
  RAPPEL_DEPART: 'text-indigo-600 bg-indigo-50',
  INCIDENT: 'text-red-600 bg-red-50',
  ALERTE_GARE: 'text-red-600 bg-red-50',
  TRAJET_DEMARRE: 'text-blue-600 bg-blue-50',
  TRAJET_TERMINE: 'text-emerald-600 bg-emerald-50',
  JALON_ARRIVEE: 'text-indigo-600 bg-indigo-50',
  JALON_DEPART: 'text-indigo-600 bg-indigo-50',
  TICKET_VALIDE: 'text-green-600 bg-green-50',
};

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'à l\'instant';
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function parsePayload(payload: string): Record<string, unknown> {
  if (!payload) return {};
  try { return JSON.parse(payload); } catch {
    const match = payload.match(/^TRAJET_ID=(\d+)$/);
    if (match) return { trajetId: parseInt(match[1], 10) };
    return {};
  }
}

function NotificationItem({ n, onClose }: { n: NotificationDTO; onClose: () => void }) {
  const Icon = iconMap[n.type] || Bell;
  const color = colorMap[n.type] || 'text-slate-600 bg-slate-50';
  const info = parsePayload(n.payload);
  const route = info.villeDepart && info.villeArrivee
    ? `${info.villeDepart} → ${info.villeArrivee}`
    : null;

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', color.split(' ')[1])}>
        <Icon size={14} className={color.split(' ')[0]} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{n.type}</span>
          <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatTimeAgo(n.dateCreation)}</span>
        </div>
        {route && (
          <p className="text-[11px] font-semibold text-slate-600 truncate">{route}</p>
        )}
        <p className="text-xs text-slate-700 mt-0.5 line-clamp-2">{n.message}</p>
      </div>
      <button onClick={onClose} className="p-0.5 rounded text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition">
        <X size={12} />
      </button>
    </div>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, pendingCount, syncing, sync } = useNotificationSync();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const latest = notifications.slice(0, 5);
  const showBadge = pendingCount > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          'relative p-2 rounded-xl transition',
          open ? 'bg-violet-100 text-violet-700' : 'text-slate-500 hover:bg-slate-100'
        )}
        title="Notifications"
      >
        <Bell size={18} />
        {showBadge && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Notifications</h3>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <button
                  onClick={sync}
                  disabled={syncing}
                  className="text-[10px] font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 px-2 py-1 rounded-lg transition"
                >
                  {syncing ? 'Sync...' : `Sync ${pendingCount}`}
                </button>
              )}
              <span className="text-[10px] text-slate-400">{notifications.length} total</span>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {latest.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle2 size={24} className="text-emerald-400 mb-2" />
                <p className="text-xs text-slate-500 font-medium">Aucune notification</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Vous recevrez ici les alertes de vos trajets</p>
              </div>
            ) : (
              latest.map(n => (
                <NotificationItem key={n.id} n={n} onClose={() => {}} />
              ))
            )}
          </div>

          <div className="border-t border-slate-100 p-3 flex gap-2">
            <a
              href="/fr/voyageur/notifications"
              className="flex-1 text-center text-xs font-semibold text-violet-600 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 transition"
            >
              Voir détails
            </a>
            {pendingCount > 0 && (
              <button
                onClick={sync}
                disabled={syncing}
                className="flex-1 text-center text-xs font-semibold text-amber-600 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 transition disabled:opacity-50"
              >
                {syncing ? 'Sync...' : `Sync ${pendingCount}`}
              </button>
            )}
            {notifications.length === 0 && pendingCount === 0 && (
              <button
                onClick={sync}
                disabled={syncing}
                className="flex-1 text-center text-xs font-semibold text-slate-600 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition disabled:opacity-50"
              >
                {syncing ? 'Synchro...' : 'Synchroniser'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
