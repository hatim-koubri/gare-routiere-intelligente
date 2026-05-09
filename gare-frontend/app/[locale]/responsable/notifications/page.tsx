'use client';

import { useState, useEffect } from 'react';
import { responsableNotificationApi } from '@/lib/api/responsable/notifications';
import { responsableTrajetApi } from '@/lib/api/responsable/trajets';
import { Trajet, NotificationTrajetRequest, TypeNotification } from '@/types';
import { Bell, Send, Loader2, CheckCircle2, X } from 'lucide-react';
import { clsx } from 'clsx';

const types: { value: TypeNotification; label: string }[] = [
  { value: TypeNotification.RETARD, label: 'Retard' },
  { value: TypeNotification.ANNULATION, label: 'Annulation' },
  { value: TypeNotification.CHANGEMENT_QUAI, label: 'Changement quai' },
];

export default function ResponsableNotificationsPage() {
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [loadingTrajets, setLoadingTrajets] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const [formData, setFormData] = useState<NotificationTrajetRequest>({
    trajetId: 0,
    type: TypeNotification.RETARD,
    message: '',
  });

  useEffect(() => {
    (async () => {
      const data = await responsableTrajetApi.getAll();
      setTrajets(Array.isArray(data) ? data : []);
      setLoadingTrajets(false);
    })();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.trajetId) return;
    setSending(true);
    try {
      await responsableNotificationApi.envoyer(formData);
      showToast('Notifications envoyées avec succès.', 'success');
      setFormData(prev => ({ ...prev, message: '' }));
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erreur lors de l\'envoi.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
          <Bell size={22} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications voyageurs</h1>
          <p className="text-slate-500 text-sm mt-0.5">Envoyez une notification aux voyageurs d&apos;un trajet</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Trajet *</label>
            {loadingTrajets ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-2.5"><Loader2 size={14} className="animate-spin" /> Chargement...</div>
            ) : (
              <select
                required
                value={formData.trajetId}
                onChange={e => setFormData(prev => ({ ...prev, trajetId: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={0} disabled>Sélectionner un trajet...</option>
                {trajets.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.villeDepart ?? t.ligne?.villeDepart ?? '?'} → {t.villeArrivee ?? t.ligne?.villeArrivee ?? '?'} ({new Date(t.dateDepart).toLocaleDateString('fr-FR')})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Type de notification *</label>
            <div className="grid grid-cols-3 gap-3">
              {types.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: t.value }))}
                  className={clsx(
                    'px-4 py-3 rounded-xl text-sm font-semibold border-2 transition text-center',
                    formData.type === t.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Message (optionnel)</label>
            <textarea
              rows={4}
              placeholder="Message à envoyer aux voyageurs..."
              value={formData.message}
              onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={sending || !formData.trajetId}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? 'Envoi en cours...' : 'Envoyer la notification'}
            </button>
          </div>
        </form>
      </div>

      {toast.show && (
        <div
          className={clsx(
            'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-semibold transition-all',
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          )}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
