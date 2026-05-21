'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Client, Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '@/lib/auth/AuthContext';

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: any;
  sendMessage: (destination: string, body: any) => void;
  subscribe: (destination: string, callback: (message: any) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // URL du WebSocket - utilise la variable d'environnement (définie dans .env ou docker-compose)
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080';

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      reconnectDelay: 5000,
      debug: (str) => console.log('[WebSocket]', str),
    });

    stompClient.onConnect = () => {
      console.log('[WebSocket] Connecté');
      setIsConnected(true);
      
      // S'abonner au topic en fonction du rôle
      if (user.role === 'ADMIN' || user.role === 'RESPONSABLE_COMPAGNIE') {
        stompClient.subscribe('/topic/admin', (message) => {
          setLastMessage(JSON.parse(message.body));
        });
        stompClient.subscribe('/topic/ocr', (message) => {
          setLastMessage(JSON.parse(message.body));
        });
      }
      if (user.role === 'CHAUFFEUR') {
        stompClient.subscribe(`/queue/chauffeur/${user.id}`, (message) => {
          setLastMessage(JSON.parse(message.body));
        });
      }
      if (user.role === 'VOYAGEUR') {
        stompClient.subscribe(`/queue/voyageur/${user.email}`, (message) => {
          setLastMessage(JSON.parse(message.body));
        });
      }
      if (user.role === 'RESPONSABLE_COMPAGNIE') {
        stompClient.subscribe(`/queue/responsable/${user.email}`, (message) => {
          setLastMessage(JSON.parse(message.body));
        });
        if (user.compagnieId) {
          stompClient.subscribe(`/topic/responsable/${user.compagnieId}`, (message) => {
            setLastMessage(JSON.parse(message.body));
          });
        }
      }
    };

    stompClient.onStompError = (frame) => {
      console.error('[WebSocket] Erreur:', frame);
    };

    stompClient.activate();
    setClient(stompClient);

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, [user]);

  const sendMessage = (destination: string, body: any) => {
    if (client && isConnected) {
      client.publish({
        destination,
        body: JSON.stringify(body),
      });
    }
  };

  const subscribe = (destination: string, callback: (message: any) => void) => {
    if (client && isConnected) {
      client.subscribe(destination, (message) => {
        callback(JSON.parse(message.body));
      });
    }
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, sendMessage, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};