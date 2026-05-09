'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { responsableMessageApi } from '@/lib/api/responsable/messages';
import { MessageResponse } from '@/types';
import {
  Mail, Search, X, Send, User
} from 'lucide-react';
import { clsx } from 'clsx';

export default function ResponsableMessagesPage() {
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
  const [newContenu, setNewContenu] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await responsableMessageApi.getInbox();
        setMessages(Array.isArray(data) ? data : []);
      } catch {
        setError('Impossible de charger les messages');
      } finally {
        setLoading(false);
      }
    };
    load();
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
        || (m.expediteurPrenom?.toLowerCase() || '').includes(q);
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
    if (!m.lu) {
      try {
        const updated = await responsableMessageApi.getById(m.id);
        setMessages(prev => prev.map(p => p.id === m.id ? { ...p, lu: true } : p));
        setSelected(updated);
      } catch { /* ignore */ }
    }
  };

  const handleEnvoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContenu.trim()) return;
    setSending(true);
    try {
      const msg = await responsableMessageApi.envoyer({ contenu: newContenu.trim() });
      setMessages(prev => [msg, ...prev]);
      setShowNew(false);
      setNewContenu('');
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
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-500 text-sm mt-0.5">Boîte de réception et échanges avec l&apos;administration</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition"
        >
          <Send size={15} /> Nouveau message
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex gap-1 bg-slate-50 rounded-xl p-1 border border-slate-200">
          {(['all', 'inbox', 'sent'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition',
                filterMode === mode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {mode === 'all' ? 'Tous' : mode === 'inbox' ? 'Reçus' : 'Envoyés'}
              {mode === 'inbox' && unreadCount > 0 && (
                <span className="ml-1.5 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-50 rounded-xl p-1 border border-slate-200">
          {(['all', 'read', 'unread'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setReadFilter(mode)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition',
                readFilter === mode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {mode === 'all' ? 'Tous' : mode === 'read' ? 'Lus' : 'Non lus'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
          <Mail size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Aucun message trouvé.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {filtered.map(m => {
            const isReceived = m.destinataireId === currentUserId;
            return (
              <button
                key={m.id}
                onClick={() => openDetail(m)}
                className="w-full flex items-start gap-4 px-5 py-4 border-b border-slate-50 hover:bg-slate-50 transition text-left"
              >
                <div className={clsx(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                  isReceived ? 'bg-indigo-50' : 'bg-slate-100'
                )}>
                  {isReceived ? <User size={15} className="text-indigo-600" /> : <Send size={15} className="text-slate-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={clsx('font-semibold text-sm', !m.lu && isReceived ? 'text-slate-900' : 'text-slate-600')}>
                      {isReceived ? (m.expediteurPrenom ? `${m.expediteurPrenom} ${m.expediteurNom}` : m.expediteurNom) : `À ${m.destinatairePrenom ? `${m.destinatairePrenom} ${m.destinataireNom}` : m.destinataireNom}`}
                    </span>
                    {!m.lu && isReceived && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                  </div>
                  <p className={clsx('text-sm mt-0.5 truncate', !m.lu && isReceived ? 'font-semibold text-slate-800' : 'text-slate-500')}>{m.contenu}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0 mt-1">{formatDate(m.dateEnvoi)}</span>
              </button>
            );
          })}
        </div>
      )}

      {showDetail && selected && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Mail size={16} className="text-indigo-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Message</h2>
              </div>
              <button onClick={() => setShowDetail(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">De</p>
                  <p className="font-semibold text-slate-700">
                    {selected.expediteurPrenom ? `${selected.expediteurPrenom} ${selected.expediteurNom}` : selected.expediteurNom}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">À</p>
                  <p className="font-semibold text-slate-700">
                    {selected.destinatairePrenom ? `${selected.destinatairePrenom} ${selected.destinataireNom}` : selected.destinataireNom}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                  <p className="font-semibold text-slate-700">{new Date(selected.dateEnvoi).toLocaleString('fr-FR')}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Statut</p>
                  <p className={clsx('font-semibold', selected.lu ? 'text-emerald-600' : 'text-amber-600')}>
                    {selected.lu ? 'Lu' : 'Non lu'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Contenu</p>
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap">
                  {selected.contenu}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Send size={16} className="text-indigo-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Nouveau message à l&apos;administration</h2>
              </div>
              <button onClick={() => setShowNew(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"><X size={18} /></button>
            </div>
            <form onSubmit={handleEnvoyer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Message</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Écrivez votre message à l'administration..."
                  value={newContenu}
                  onChange={e => setNewContenu(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={sending || !newContenu.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  <Send size={15} />
                  {sending ? 'Envoi...' : 'Envoyer'}
                </button>
                <button type="button" onClick={() => setShowNew(false)} className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-100 transition">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
