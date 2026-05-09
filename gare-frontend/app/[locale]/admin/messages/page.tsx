'use client';

import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { useAuth } from '@/lib/auth/AuthContext';
import { adminMessageApi, ResponsableRecipient } from '@/lib/api/admin/messages';
import { MessageResponse } from '@/types';
import {
  Mail, Search, X, Send, User, Building2, MessageSquare
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

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

  const unreadCount = useMemo(() =>
    messages.filter(m => !m.lu && m.destinataireId === currentUserId).length,
    [messages, currentUserId]
  );

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
      <div className="space-y-6 pb-10">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-xl font-bold text-emerald-950 tracking-tight">Messagerie interne</h1>
            <p className="text-emerald-700/50 text-sm mt-0.5 font-medium">Communication avec les responsables de compagnie</p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-emerald-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-800 transition shadow-lg shadow-emerald-900/10"
          >
            <Send size={15} /> Nouveau message
          </button>
        </motion.div>

        {/* ── Filters ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-3xl border border-emerald-900/5"
        >
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700/40" size={16} />
            <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-emerald-50/50 border border-emerald-900/5 rounded-xl text-sm text-emerald-900 placeholder:text-emerald-700/30 focus:outline-none focus:ring-2 focus:ring-emerald-900/10 focus:border-emerald-900/20 transition font-medium" />
          </div>
          <div className="flex gap-1 bg-emerald-50/50 rounded-xl p-1 border border-emerald-900/5">
            {(['all', 'inbox', 'sent'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition',
                  filterMode === mode ? 'bg-white text-emerald-950 shadow-sm border border-emerald-900/5' : 'text-emerald-700/50 hover:text-emerald-900'
                )}
              >
                {mode === 'all' ? 'Tous' : mode === 'inbox' ? 'Reçus' : 'Envoyés'}
                {mode === 'inbox' && unreadCount > 0 && (
                  <span className="ml-1.5 bg-emerald-900 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-emerald-50/50 rounded-xl p-1 border border-emerald-900/5">
            {(['all', 'read', 'unread'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setReadFilter(mode)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition',
                  readFilter === mode ? 'bg-white text-emerald-950 shadow-sm border border-emerald-900/5' : 'text-emerald-700/50 hover:text-emerald-900'
                )}
              >
                {mode === 'all' ? 'Tous' : mode === 'read' ? 'Lus' : 'Non lus'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Loading / Error / Empty ── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-[3px] border-emerald-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200/50 rounded-2xl p-4 text-sm text-rose-700 font-medium">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-emerald-900/10 p-14 text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-emerald-600" />
            </div>
            <p className="text-emerald-700/60 text-sm font-medium">Aucun message trouvé.</p>
          </div>
        ) : (
          /* ── Messages List ── */
          <div className="bg-white rounded-3xl border border-emerald-900/5 overflow-hidden">
            {filtered.map((m, idx) => {
              const isReceived = m.destinataireId === currentUserId;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  <button
                    onClick={() => openDetail(m)}
                    className="w-full flex items-start gap-4 px-5 py-4 border-b border-emerald-900/5 hover:bg-emerald-50/30 transition text-left"
                  >
                    <div className={clsx(
                      'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
                      isReceived ? 'bg-emerald-50' : 'bg-emerald-50/50'
                    )}>
                      {isReceived
                        ? <User size={16} className="text-emerald-600" />
                        : <Send size={16} className="text-emerald-700/50" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={clsx('text-sm', !m.lu && isReceived ? 'font-bold text-emerald-950' : 'font-semibold text-emerald-700')}>
                          {isReceived
                            ? (m.expediteurPrenom ? `${m.expediteurPrenom} ${m.expediteurNom}` : m.expediteurNom)
                            : `À ${m.destinatairePrenom ? `${m.destinatairePrenom} ${m.destinataireNom}` : m.destinataireNom}`}
                        </span>
                        {!m.lu && isReceived && <span className="w-2 h-2 rounded-full bg-emerald-900 shrink-0" />}
                      </div>
                      <p className={clsx('text-sm mt-0.5 truncate', !m.lu && isReceived ? 'font-semibold text-emerald-900' : 'text-emerald-700/50')}>{m.contenu}</p>
                    </div>
                    <span className="text-xs text-emerald-700/40 font-medium shrink-0 mt-0.5">{formatDate(m.dateEnvoi)}</span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Detail Modal ── */}
        {showDetail && selected && (
          <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl shadow-emerald-900/20 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-900/5 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Mail size={16} className="text-emerald-600" />
                  </div>
                  <h2 className="text-base font-bold text-emerald-950">Message</h2>
                </div>
                <button onClick={() => setShowDetail(false)} className="p-1.5 rounded-lg text-emerald-700/40 hover:bg-emerald-50 transition"><X size={18} /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-5">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-emerald-50/50 rounded-xl p-3.5">
                    <p className="text-[10px] font-bold text-emerald-700/50 uppercase tracking-wider mb-1">De</p>
                    <p className="font-bold text-emerald-900">
                      {selected.expediteurPrenom ? `${selected.expediteurPrenom} ${selected.expediteurNom}` : selected.expediteurNom}
                    </p>
                  </div>
                  <div className="bg-emerald-50/50 rounded-xl p-3.5">
                    <p className="text-[10px] font-bold text-emerald-700/50 uppercase tracking-wider mb-1">À</p>
                    <p className="font-bold text-emerald-900">
                      {selected.destinatairePrenom ? `${selected.destinatairePrenom} ${selected.destinataireNom}` : selected.destinataireNom}
                    </p>
                  </div>
                  <div className="bg-emerald-50/50 rounded-xl p-3.5">
                    <p className="text-[10px] font-bold text-emerald-700/50 uppercase tracking-wider mb-1">Date</p>
                    <p className="font-bold text-emerald-900">{new Date(selected.dateEnvoi).toLocaleString('fr-FR')}</p>
                  </div>
                  <div className="bg-emerald-50/50 rounded-xl p-3.5">
                    <p className="text-[10px] font-bold text-emerald-700/50 uppercase tracking-wider mb-1">Statut</p>
                    <p className={clsx('font-bold', selected.lu ? 'text-emerald-600' : 'text-amber-600')}>
                      {selected.lu ? 'Lu' : 'Non lu'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-700/50 uppercase tracking-wider mb-2.5">Contenu</p>
                  <div className="bg-emerald-50/50 rounded-xl p-4 text-sm text-emerald-900 whitespace-pre-wrap leading-relaxed">
                    {selected.contenu}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-emerald-900/5 bg-emerald-50/30 flex gap-3">
                <button
                  onClick={() => {
                    setShowDetail(false);
                    setDestinataireId(selected.expediteurId);
                    setShowNew(true);
                  }}
                  className="flex-1 bg-emerald-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-800 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10"
                >
                  <Send size={15} /> Répondre
                </button>
                <button onClick={() => setShowDetail(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-emerald-700 hover:bg-emerald-50 transition">
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── New Message Modal ── */}
        {showNew && (
          <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl shadow-emerald-900/20 overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-900/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Send size={16} className="text-emerald-600" />
                  </div>
                  <h2 className="text-base font-bold text-emerald-950">Nouveau message</h2>
                </div>
                <button onClick={() => setShowNew(false)} className="p-1.5 rounded-lg text-emerald-700/40 hover:bg-emerald-50 transition"><X size={18} /></button>
              </div>
              <form onSubmit={handleEnvoyer} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-700/50 uppercase tracking-wider mb-2">Destinataire</label>
                  <select
                    required
                    value={destinataireId}
                    onChange={e => setDestinataireId(Number(e.target.value) || '')}
                    className="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-900/10 rounded-xl text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-900/10 focus:border-emerald-900/20 transition font-medium"
                  >
                    <option value="">Sélectionner un responsable</option>
                    {responsables.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.prenom} {r.nom} — {r.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-700/50 uppercase tracking-wider mb-2">Message</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Écrivez votre message..."
                    value={newContenu}
                    onChange={e => setNewContenu(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-900/10 rounded-xl text-sm text-emerald-900 placeholder:text-emerald-700/30 focus:outline-none focus:ring-2 focus:ring-emerald-900/10 focus:border-emerald-900/20 transition font-medium resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={sending || !newContenu.trim() || !destinataireId}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-800 transition disabled:bg-emerald-200 disabled:text-emerald-500 shadow-lg shadow-emerald-900/10"
                  >
                    <Send size={15} />
                    {sending ? 'Envoi...' : 'Envoyer'}
                  </button>
                  <button type="button" onClick={() => setShowNew(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-emerald-700 hover:bg-emerald-50 transition">Annuler</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
