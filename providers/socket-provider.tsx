'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io as ClientIO, Socket } from 'socket.io-client';

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('[SOCKET-PROVIDER] Connecting with default path');

    const socketInstance: Socket = ClientIO({
      transports: ['polling', 'websocket'], // Default reliable polling upgrade behavior
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: false,
    });

    socketInstance.on('connect', () => {
      console.log('[SOCKET-PROVIDER] ✅ Connected! ID:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('connect_error', (error: Error) => {
      console.error('[SOCKET-PROVIDER] ❌ Connection error:', error.message);
      setIsConnected(false);
    });

    socketInstance.on('reconnect', (attempt: number) => {
      console.log(`[SOCKET-PROVIDER] 🔄 Reconnected after ${attempt} attempt(s)`);
      setIsConnected(true);
    });

    socketInstance.on('reconnect_attempt', (attempt: number) => {
      console.log(`[SOCKET-PROVIDER] Reconnecting... attempt ${attempt}`);
    });

    socketInstance.on('reconnect_error', (error: Error) => {
      console.error('[SOCKET-PROVIDER] Reconnect error:', error.message);
    });

    socketInstance.on('disconnect', (reason: string) => {
      console.log('[SOCKET-PROVIDER] ⚠️ Disconnected:', reason);
      setIsConnected(false);
      // If server forcibly disconnected, reconnect manually
      if (reason === 'io server disconnect') {
        socketInstance.connect();
      }
    });

    setSocket(socketInstance);

    return () => {
      console.log('[SOCKET-PROVIDER] Cleaning up socket');
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
