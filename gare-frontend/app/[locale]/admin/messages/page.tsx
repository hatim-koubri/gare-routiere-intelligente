'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { useAuth } from '@/lib/auth/AuthContext';
import { adminMessageApi, ResponsableRecipient } from '@/lib/api/admin/messages';
import { MessageResponse } from '@/types';
import {
  Mail, Search, X, Send, User, Building2, MessageSquare,
  Inbox, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';

const containerVariants = {
  hidden: { opacity: 0 } as const,
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 } as const,
  } as const,
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 } as const,
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring' as const, damping: 22, stiffness: 180 } as const,
  } as const,
};

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'inbox' | 'sent'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [selected, setSelected] = useState<MessageResponse | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [responsables, setResponsables] = useState<ResponsableRecipient[]>([]);
  const [destinataireId, setDestinataireId] = useState<number | ''>('');
  const [newContenu, setNewContenu] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    Promise.all([
      adminMessageApi.getInbox(),
      adminMessageApi.getResponsables(),
    ]).then(([msgs, resps]) => {
      setMessages(Array.isArray(msgs) ? msgs : []);
      setResponsables(Array.isArray(resps) ? resps : []);
    }).catch(() => setError('Impossible de charger les messages'))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    total: messages.length,
    inbox: messages.filter(m => m.destinataireId === currentUserId).length,
    sent: messages.filter(m => m.expediteurId === currentUserId).length,
    unread: messages.filter(m => !m.lu && m.destinataireId === currentUserId).length,
  }), [messages, currentUserId]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return messages.filter(m => {
      const matchSearch = m.contenu.toLowerCase().includes(q)
        || m.expediteurNom.toLowerCase().includes(q)
        || (m.expediteurPrenom?.toLowerCase() || '').includes(q)
        || m.destinataireNom.toLowerCase().includes(q)
        || (m.destinatairePrenom?.toLowerCase() || '').includes(q);
      if (filterMode === 'inbox' && m.destinataireId !== currentUserId) return false;
      if (filterMode === 'sent' && m.expediteurId !== currentUserId) return false;
      if (readFilter === 'read' && !m.lu) return false;
      if (readFilter === 'unread' && m.lu) return false;
      return matchSearch;
    });
  }, [messages, searchQuery, filterMode, readFilter, currentUserId]);

  const openDetail = async (m: MessageResponse) => {
    setSelected(m);
    setShowDetail(true);
    if (!m.lu && m.destinataireId === currentUserId) {
      try {
        const updated = await adminMessageApi.getById(m.id);
        setMessages(prev => prev.map(p => p.id === m.id ? { ...p, lu: true } : p));
        setSelected(updated);
      } catch { /* ignore */ }
    }
  };

  const handleEnvoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContenu.trim() || !destinataireId) return;
    setSending(true);
    try {
      const msg = await adminMessageApi.envoyer({ contenu: newContenu.trim(), destinataireId: destinataireId as number });
      setMessages(prev => [msg, ...prev]);
      setShowNew(false);
      setNewContenu('');
      setDestinataireId('');
    } catch {
      alert("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <AdminLayout>
      <div className="space-y-8 pb-16">

        {/* ═══ HERO HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 160 }}
          className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 p-10 md:p-14"
        >
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-white/30"
              style={{ top: `${10 + Math.random() * 80}%`, left: `${10 + Math.random() * 80}%` }}
              animate={{ opacity: [0, 1, 0], scale: [0, 2, 0] }}
              transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
            />
          ))}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-400/20 rounded-full blur-[100px]" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, type: 'spring', damping: 18 }}
                className="flex items-center gap-3 mb-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Mail size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">
                    Messagerie
                  </h1>
                  <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.4em] mt-1">
                    Communication Interne
                  </p>
                </div>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/60 text-sm mt-4 max-w-lg leading-relaxed"
              >
                Gérez les communications avec les responsables de compagnie en temps réel.
              </motion.p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowNew(true)}
              className="hidden md:flex items-center gap-3 bg-white/15 backdrop-blur-md border border-white/20 text-white px-6 py-3.5 rounded-2xl font-bold text-sm hover:bg-white/25 transition-all shadow-lg"
            >
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                <Send size={16} strokeWidth={3} />
              </div>
              <span>Nouveau message</span>
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex items-center gap-8 flex-wrap"
          >
            {[
              { icon: Mail, label: 'Total', value: stats.total },
              { icon: Inbox, label: 'Reçus', value: stats.inbox },
              { icon: Send, label: 'Envoyés', value: stats.sent },
              { icon: MessageSquare, label: 'Non lus', value: stats.unread },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <s.icon size={14} className="text-emerald-200" />
                </div>
                <div>
                  <span className="text-white font-black text-lg">{s.value}</span>
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider ml-2">{s.label}</span>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNew(true)}
            className="md:hidden absolute bottom-6 right-6 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center"
          >
            <Send size={22} className="text-white" />
          </motion.button>
        </motion.div>

        {/* ═══ STATS KPI ═══ */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-4 gap-4"
        >
          {[
            { label: 'Total messages', value: stats.total, icon: Mail, color: 'emerald' },
            { label: 'Reçus', value: stats.inbox, icon: Inbox, color: 'emerald' },
            { label: 'Envoyés', value: stats.sent, icon: Send, color: 'teal' },
            { label: 'Non lus', value: stats.unread, icon: MessageSquare, color: 'amber' },
          ].map((s) => (
            <motion.div
              key={s.label}
              variants={itemVariants}
              whileHover={{ y: -3, scale: 1.01 }}
              className="relative overflow-hidden rounded-2xl border border-slate-100 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/80 p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <s.icon size={15} className={
                  s.color === 'emerald' ? 'text-emerald-500' :
                  s.color === 'teal' ? 'text-teal-500' : 'text-amber-500'
                } />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{s.label}</span>
              </div>
              <motion.span
                key={s.value}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                className="text-3xl font-bold text-slate-800 dark:text-zinc-100"
              >
                {s.value}
              </motion.span>
            </motion.div>
          ))}
        </motion.div>

        {/* ═══ FILTERS ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="flex flex-wrap gap-4 items-center"
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input type="text" placeholder="Rechercher un message…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/30 focus:border-emerald-500 transition-all dark:text-zinc-100 dark:placeholder:text-zinc-500" />
          </div>
          <div className="flex gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
            {(['all', 'inbox', 'sent'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition',
                  filterMode === mode ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
                )}
              >
                {mode === 'all' ? 'Tous' : mode === 'inbox' ? 'Reçus' : 'Envoyés'}
                {mode === 'inbox' && stats.unread > 0 && (
                  <span className="ml-1.5 bg-emerald-600 dark:bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{stats.unread}</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
            {(['all', 'read', 'unread'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setReadFilter(mode)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition',
                  readFilter === mode ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
                )}
              >
                {mode === 'all' ? 'Tous' : mode === 'read' ? 'Lus' : 'Non lus'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ═══ LOADING / ERROR / EMPTY ═══ */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-4">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 dark:text-zinc-500 text-sm font-medium">Chargement des messages…</p>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-2xl p-8 text-center"
          >
            <AlertCircle size={36} className="text-rose-400 mx-auto mb-3" />
            <p className="text-rose-600 dark:text-rose-400 font-bold text-sm">{error}</p>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-16 text-center"
          >
            <Mail size={44} className="text-slate-200 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">Aucun message trouvé</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-800/60 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden"
          >
            {filtered.map((m, idx) => {
              const isReceived = m.destinataireId === currentUserId;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03, type: 'spring', damping: 25, stiffness: 200 }}
                >
                  <button
                    onClick={() => openDetail(m)}
                    className="w-full flex items-start gap-4 px-5 py-4 border-b border-slate-100 dark:border-zinc-700/30 hover:bg-emerald-50/30 dark:hover:bg-zinc-700/30 transition text-left"
                  >
                    <div className={clsx(
                      'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
                      isReceived ? 'bg-emerald-50 dark:bg-emerald-950/50' : 'bg-slate-50 dark:bg-zinc-800'
                    )}>
                      {isReceived
                        ? <User size={16} className="text-emerald-600 dark:text-emerald-400" />
                        : <Send size={16} className="text-slate-500 dark:text-zinc-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={clsx('text-sm', !m.lu && isReceived ? 'font-bold text-slate-800 dark:text-zinc-100' : 'font-semibold text-slate-600 dark:text-zinc-300')}>
                          {isReceived
                            ? (m.expediteurPrenom ? `${m.expediteurPrenom} ${m.expediteurNom}` : m.expediteurNom)
                            : `À ${m.destinatairePrenom ? `${m.destinatairePrenom} ${m.destinataireNom}` : m.destinataireNom}`}
                        </span>
                        {!m.lu && isReceived && <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />}
                      </div>
                      <p className={clsx('text-sm mt-0.5 truncate', !m.lu && isReceived ? 'font-semibold text-slate-700 dark:text-zinc-200' : 'text-slate-500 dark:text-zinc-400')}>{m.contenu}</p>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium shrink-0 mt-0.5">{formatDate(m.dateEnvoi)}</span>
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ═══ DETAIL MODAL ═══ */}
        <AnimatePresence>
          {showDetail && selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
              onClick={() => setShowDetail(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-slate-100 dark:border-zinc-800 rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                {/* Orbs */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl"
                />
                <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-gradient-to-br from-cyan-400/10 to-emerald-500/10 rounded-full blur-3xl" />

                {/* Header */}
                <div className="relative z-10 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 p-8 text-white shrink-0">
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 }}
                    className="flex items-center gap-1.5 mb-3"
                  >
                    {"RIHLA".split("").map((letter, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ y: 0 }}
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: idx * 0.08, ease: 'easeInOut' }}
                        className="text-lg font-black tracking-tighter select-none"
                      >
                        {letter}
                      </motion.span>
                    ))}
                  </motion.div>
                  <div className="flex justify-between items-start">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 }}
                    >
                      <h2 className="text-2xl font-black italic tracking-tighter uppercase">Message</h2>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Détails & Contenu</p>
                    </motion.div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowDetail(false)}
                      className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                    >
                      <X size={20} />
                    </motion.button>
                  </div>
                  <Mail size={110} className="absolute -right-8 -bottom-8 text-white/5 rotate-12" />
                </div>

                {/* Body */}
                <div className="relative z-10 p-8 overflow-y-auto space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-emerald-50/50 dark:bg-zinc-800/60 rounded-xl p-3.5"
                    >
                      <p className="text-[10px] font-bold text-emerald-700/50 dark:text-emerald-400/50 uppercase tracking-wider mb-1">De</p>
                      <p className="font-bold text-emerald-950 dark:text-zinc-100">
                        {selected.expediteurPrenom ? `${selected.expediteurPrenom} ${selected.expediteurNom}` : selected.expediteurNom}
                      </p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.13 }}
                      className="bg-emerald-50/50 dark:bg-zinc-800/60 rounded-xl p-3.5"
                    >
                      <p className="text-[10px] font-bold text-emerald-700/50 dark:text-emerald-400/50 uppercase tracking-wider mb-1">À</p>
                      <p className="font-bold text-emerald-950 dark:text-zinc-100">
                        {selected.destinatairePrenom ? `${selected.destinatairePrenom} ${selected.destinataireNom}` : selected.destinataireNom}
                      </p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.16 }}
                      className="bg-emerald-50/50 dark:bg-zinc-800/60 rounded-xl p-3.5"
                    >
                      <p className="text-[10px] font-bold text-emerald-700/50 dark:text-emerald-400/50 uppercase tracking-wider mb-1">Date</p>
                      <p className="font-bold text-emerald-950 dark:text-zinc-100">{new Date(selected.dateEnvoi).toLocaleString('fr-FR')}</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.19 }}
                      className="bg-emerald-50/50 dark:bg-zinc-800/60 rounded-xl p-3.5"
                    >
                      <p className="text-[10px] font-bold text-emerald-700/50 dark:text-emerald-400/50 uppercase tracking-wider mb-1">Statut</p>
                      <p className={clsx('font-bold', selected.lu ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                        {selected.lu ? 'Lu' : 'Non lu'}
                      </p>
                    </motion.div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                  >
                    <p className="text-[10px] font-bold text-emerald-700/50 dark:text-emerald-400/50 uppercase tracking-wider mb-2.5">Contenu</p>
                    <div className="bg-emerald-50/50 dark:bg-zinc-800/60 rounded-xl p-4 text-sm text-emerald-950 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed">
                      {selected.contenu}
                    </div>
                  </motion.div>
                </div>

                {/* Footer */}
                <div className="relative z-10 p-6 border-t border-slate-100 dark:border-zinc-800 bg-emerald-50/30 dark:bg-zinc-900/50 flex gap-3 shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setShowDetail(false);
                      setDestinataireId(selected.expediteurId);
                      setShowNew(true);
                    }}
                    className="flex-1 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white py-3 rounded-2xl font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Send size={15} /> Répondre
                  </motion.button>
                  <button onClick={() => setShowDetail(false)}
                    className="px-6 py-3 rounded-2xl font-bold text-sm text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-zinc-800 transition-all">
                    Fermer
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ NEW MESSAGE MODAL ═══ */}
        <AnimatePresence>
          {showNew && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
              onClick={() => setShowNew(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-slate-100 dark:border-zinc-800 rounded-[3rem] shadow-2xl overflow-hidden"
              >
                {/* Orbs */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl"
                />
                <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-gradient-to-br from-cyan-400/10 to-emerald-500/10 rounded-full blur-3xl" />

                {/* Header */}
                <div className="relative z-10 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 p-8 text-white">
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 }}
                    className="flex items-center gap-1.5 mb-3"
                  >
                    {"RIHLA".split("").map((letter, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ y: 0 }}
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: idx * 0.08, ease: 'easeInOut' }}
                        className="text-lg font-black tracking-tighter select-none"
                      >
                        {letter}
                      </motion.span>
                    ))}
                  </motion.div>
                  <div className="flex justify-between items-start">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 }}
                    >
                      <h2 className="text-2xl font-black italic tracking-tighter uppercase">Nouveau Message</h2>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Communication & Envoi</p>
                    </motion.div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowNew(false)}
                      className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                    >
                      <X size={20} />
                    </motion.button>
                  </div>
                  <Send size={110} className="absolute -right-8 -bottom-8 text-white/5 rotate-12" />
                </div>

                {/* Form */}
                <form onSubmit={handleEnvoyer} className="relative z-10 p-8 space-y-5">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-900/40 dark:text-emerald-400/50 ml-1">
                      Destinataire <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={destinataireId}
                      onChange={e => setDestinataireId(Number(e.target.value) || '')}
                      className="w-full bg-emerald-50/50 dark:bg-zinc-800/80 border border-emerald-900/10 dark:border-zinc-700 rounded-2xl py-3.5 px-4 text-sm font-semibold text-emerald-950 dark:text-zinc-100 focus:ring-4 focus:ring-emerald-950/10 dark:focus:ring-emerald-400/20 focus:border-emerald-600/30 outline-none transition-all"
                    >
                      <option value="">Sélectionner un responsable</option>
                      {responsables.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.prenom} {r.nom} — {r.email}
                        </option>
                      ))}
                    </select>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.13 }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-900/40 dark:text-emerald-400/50 ml-1">
                      Message <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Écrivez votre message..."
                      value={newContenu}
                      onChange={e => setNewContenu(e.target.value)}
                      className="w-full bg-emerald-50/50 dark:bg-zinc-800/80 border border-emerald-900/10 dark:border-zinc-700 rounded-2xl py-3.5 px-4 text-sm font-semibold text-emerald-950 dark:text-zinc-100 focus:ring-4 focus:ring-emerald-950/10 dark:focus:ring-emerald-400/20 focus:border-emerald-600/30 outline-none transition-all resize-none placeholder:text-emerald-900/20 dark:placeholder:text-zinc-500"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.16 }}
                    className="flex gap-3 pt-2"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      disabled={sending || !newContenu.trim() || !destinataireId}
                      className="flex-1 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-[0_15px_35px_rgba(6,78,59,0.25)] hover:shadow-[0_20px_40px_rgba(6,78,59,0.35)] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={18} />
                      {sending ? 'Envoi...' : 'Envoyer le message'}
                    </motion.button>
                    <button type="button" onClick={() => setShowNew(false)}
                      className="px-8 bg-emerald-50 dark:bg-zinc-800 text-emerald-800/40 dark:text-zinc-400 font-bold py-4 rounded-2xl hover:bg-emerald-100/50 dark:hover:bg-zinc-700 hover:text-emerald-900 dark:hover:text-zinc-200 transition-all text-sm">
                      Annuler
                    </button>
                  </motion.div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
}
