'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bell, X, CheckCircle2, AlertTriangle, Info, AlertCircle,
  Bus, MapPin, Clock, MessageSquare, CreditCard, Zap, ExternalLink
} from 'lucide-react';
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
  BUS_ARRIVE: Bus,
};

const colorMap: Record<string, { icon: string; bg: string; dot: string }> = {
  RETARD:                   { icon: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-500/10',    dot: 'bg-amber-400' },
  ANNULATION:               { icon: 'text-rose-600',    bg: 'bg-rose-50 dark:bg-rose-500/10',      dot: 'bg-rose-400' },
  CHANGEMENT_QUAI:          { icon: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-500/10',  dot: 'bg-orange-400' },
  CONFIRMATION_RESERVATION: { icon: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10',dot: 'bg-emerald-400' },
  RAPPEL_DEPART:            { icon: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-500/10',  dot: 'bg-orange-400' },
  TRAJET_DEMARRE:           { icon: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-500/10',  dot: 'bg-orange-500' },
  TRAJET_TERMINE:           { icon: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10',dot: 'bg-emerald-400' },
  JALON_ARRIVEE:            { icon: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-500/10',        dot: 'bg-red-400' },
  JALON_DEPART:             { icon: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-500/10',  dot: 'bg-orange-400' },
  TICKET_VALIDE:            { icon: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10',dot: 'bg-emerald-400' },
  INCIDENT:                 { icon: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-500/10',        dot: 'bg-red-500' },
  ALERTE_GARE:              { icon: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-500/10',        dot: 'bg-red-500' },
  RECLAMATION_TRAITEE:      { icon: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-500/10',  dot: 'bg-orange-500' },
  REMBOURSEMENT_TRAITE:     { icon: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-500/10',    dot: 'bg-amber-400' },
  BUS_ARRIVE:               { icon: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10',dot: 'bg-emerald-500' },
};

const typeLabels: Record<string, string> = {
  RETARD: 'Retard', ANNULATION: 'Annulé', CHANGEMENT_QUAI: 'Changement quai',
  CONFIRMATION_RESERVATION: '✓ Confirmé', RAPPEL_DEPART: '⏰ Rappel',
  TRAJET_DEMARRE: '🚌 Démarré', TRAJET_TERMINE: '✓ Terminé',
  JALON_ARRIVEE: 'Arrivée', JALON_DEPART: 'Départ', TICKET_VALIDE: '✓ Ticket',
  INCIDENT: '⚠ Incident', ALERTE_GARE: '⚠ Alerte',
  RECLAMATION_TRAITEE: 'Réclamation', REMBOURSEMENT_TRAITE: 'Remboursement',
  BUS_ARRIVE: '🚌 Arrivée',
};

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'à l\'instant';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}j`;
}

function parsePayload(payload: string): Record<string, unknown> {
  if (!payload) return {};
  try { return JSON.parse(payload); } catch {
    const match = payload.match(/^TRAJET_ID=(\d+)$/);
    if (match) return { trajetId: parseInt(match[1], 10) };
    return {};
  }
}

function NotificationItem({ n, routeIconColor = 'text-orange-400' }: { n: NotificationDTO; routeIconColor?: string }) {
  const Icon = iconMap[n.type] || Bell;
  const c = colorMap[n.type] || { icon: 'text-slate-500', bg: 'bg-slate-50 dark:bg-zinc-800', dot: 'bg-slate-400' };
  const info = parsePayload(n.payload);
  const route = info.villeDepart && info.villeArrivee
    ? `${info.villeDepart} → ${info.villeArrivee}`
    : null;
  const label = typeLabels[n.type] || n.type;

  return (
    <div className="flex items-start gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.bg}`}>
        <Icon size={15} className={c.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <span className={`text-[10px] font-black uppercase tracking-wider ${c.icon}`}>{label}</span>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 whitespace-nowrap flex-shrink-0">
            {formatTimeAgo(n.dateCreation)}
          </span>
        </div>
        {route && (
          <p className="text-[11px] font-bold text-slate-600 dark:text-zinc-300 truncate flex items-center gap-1">
            <Bus size={10} className={routeIconColor} /> {route}
          </p>
        )}
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
      </div>
    </div>
  );
}

export default function NotificationBell({
  notificationsHref = '/fr/voyageur/notifications',
  variant = 'orange'
}: {
  notificationsHref?: string;
  variant?: 'orange' | 'emerald'
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, pendingCount, syncing, sync } = useNotificationSync();

  const isEmerald = variant === 'emerald';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const latest = notifications.slice(0, 6);
  const showBadge = pendingCount > 0;

  const btnClasses = isEmerald
    ? {
        active: 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm',
        idle: 'text-slate-500 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-zinc-800 hover:text-emerald-500',
      }
    : {
        active: 'bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 text-orange-600 dark:text-orange-400 shadow-sm',
        idle: 'text-slate-500 dark:text-zinc-400 hover:bg-orange-50 dark:hover:bg-zinc-800 hover:text-orange-500',
      };

  const badgeClasses = isEmerald
    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-300/50'
    : 'bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-300/50';

  const headerClasses = isEmerald
    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
    : 'bg-gradient-to-r from-orange-500 to-red-500';

  const footerClasses = isEmerald
    ? 'text-emerald-600 dark:text-emerald-400 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border-emerald-100 dark:border-emerald-500/20 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-500/20 dark:hover:to-teal-500/20'
    : 'text-orange-600 dark:text-orange-400 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10 border-orange-100 dark:border-orange-500/20 hover:from-orange-100 hover:to-red-100 dark:hover:from-orange-500/20 dark:hover:to-red-500/20';

  const hoverBg = isEmerald ? 'hover:bg-emerald-50/50 dark:hover:bg-zinc-800/70' : 'hover:bg-orange-50/50 dark:hover:bg-zinc-800/70';
  const routeIconColor = isEmerald ? 'text-emerald-400' : 'text-orange-400';

  return (
    <div ref={ref} className="relative">
      {/* ── Bell Button ── */}
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2.5 rounded-xl transition-all duration-200 ${
          open ? btnClasses.active : btnClasses.idle
        }`}
        title="Notifications"
      >
        <motion.div
          animate={showBadge ? { rotate: [0, -10, 10, -8, 8, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
        >
          <Bell size={18} />
        </motion.div>
        <AnimatePresence>
          {showBadge && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-md border border-white dark:border-zinc-900 ${badgeClasses}`}
            >
              {pendingCount > 9 ? '9+' : pendingCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* ── Dropdown Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full mt-2 w-[340px] bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-2xl shadow-slate-200/60 dark:shadow-none z-50 overflow-hidden"
          >
            {/* Panel Header */}
            <div className={`relative overflow-hidden px-4 py-3.5 ${headerClasses}`}>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={15} className="text-white" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Notifications</h3>
                  {notifications.length > 0 && (
                    <span className="bg-white/20 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                      {notifications.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {pendingCount > 0 && (
                    <button
                      onClick={sync}
                      disabled={syncing}
                      className="flex items-center gap-1 text-[10px] font-black text-white bg-white/20 hover:bg-white/30 px-2.5 py-1.5 rounded-lg transition disabled:opacity-60"
                    >
                      <Zap size={10} className={syncing ? 'animate-spin' : ''} />
                      {syncing ? 'Sync…' : `Sync ${pendingCount}`}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[340px] overflow-y-auto">
              {latest.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center px-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-2xl flex items-center justify-center mb-3">
                    <CheckCircle2 size={22} className="text-emerald-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">Tout est à jour</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">Aucune notification en attente</p>
                </div>
              ) : (
                <div className="p-2 space-y-0.5">
                  {latest.map(n => (
                    <div key={n.id} className={`flex items-start gap-3 px-3 py-3 rounded-xl ${hoverBg} transition-colors group`}>
                      <NotificationItem n={n} routeIconColor={routeIconColor} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 dark:border-zinc-800 p-3 bg-slate-50/50 dark:bg-zinc-900">
              <Link
                href={notificationsHref}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-center gap-2 w-full text-xs font-bold py-2.5 rounded-xl border transition ${footerClasses}`}
              >
                Voir toutes les notifications
                <ExternalLink size={12} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
