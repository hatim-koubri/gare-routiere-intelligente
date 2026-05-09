'use client';

import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '@/lib/api/notifications';
import { useAuth } from '@/lib/auth/AuthContext';
import { useWebSocket } from '@/lib/websocket/WebSocketProvider';
import { NotificationDTO } from '@/types';

export function useNotificationSync() {
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const isVoyageur = user?.role === 'VOYAGEUR';

  const sync = useCallback(async () => {
    if (!isVoyageur) return;
    setSyncing(true);
    try {
      const response = await notificationsApi.syncNotifications();
      if (response.notifications?.length) {
        setNotifications(prev => [...response.notifications, ...prev]);
      }
      setPendingCount(0);
    } catch {
      /* silently fail */
    } finally {
      setSyncing(false);
    }
  }, [isVoyageur]);

  const loadHistory = useCallback(async () => {
    if (!isVoyageur) return;
    try {
      const history = await notificationsApi.getHistory();
      setNotifications(history);
      setLoaded(true);
    } catch {
      /* silently fail */
    }
  }, [isVoyageur]);

  useEffect(() => {
    if (!isVoyageur) {
      setNotifications([]);
      setPendingCount(0);
      setLoaded(false);
      return;
    }

    notificationsApi.getPendingCount().then(setPendingCount).catch(() => {});
    loadHistory();
  }, [isVoyageur, loadHistory]);

  useEffect(() => {
    if (lastMessage && isVoyageur) {
      sync();
    }
  }, [lastMessage, isVoyageur, sync]);

  useEffect(() => {
    const handleOnline = () => {
      if (pendingCount > 0) sync();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [pendingCount, sync]);

  return {
    notifications,
    pendingCount,
    syncing,
    loaded,
    sync,
    loadHistory,
  };
}
