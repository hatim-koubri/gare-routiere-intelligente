'use client';

import { useState, useEffect } from 'react';
import { notificationsApi } from '@/lib/api/notifications';
import { useAuth } from '@/lib/auth/AuthContext';
import { NotificationDTO } from '@/types';

export default function NotificationSync() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user) {
      loadPendingCount();
    }
  }, [user]);

  const loadPendingCount = async () => {
    try {
      const count = await notificationsApi.getPendingCount();
      setPendingCount(count);
    } catch (err) {
      console.error('Erreur chargement compteur', err);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await notificationsApi.syncNotifications();
      setNotifications(response.notifications);
      setPendingCount(0);
    } catch (err) {
      console.error('Erreur synchronisation', err);
    } finally {
      setSyncing(false);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const history = await notificationsApi.getHistory();
      setNotifications(history);
    } catch (err) {
      console.error('Erreur chargement historique', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Notifications hors ligne</h3>
      
      {pendingCount > 0 && (
        <div className="mb-4 p-3 bg-yellow-100 rounded-lg flex justify-between items-center">
          <span>{pendingCount} notification(s) en attente</span>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            {syncing ? 'Synchronisation...' : 'Synchroniser'}
          </button>
        </div>
      )}
      
      <button
        onClick={loadHistory}
        className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 mb-4"
      >
        {loading ? 'Chargement...' : 'Voir historique'}
      </button>
      
      {notifications.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {notifications.map((notif) => (
            <div key={notif.id} className="p-3 border rounded-lg">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-sm text-blue-600">
                  {notif.type}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(notif.dateCreation).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-700 mt-1">{notif.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}