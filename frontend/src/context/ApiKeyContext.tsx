'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ConnectionStatus } from '@/lib/types';

interface ApiKeyContextValue {
  apiKey: string;
  setApiKey: (key: string) => void;
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (s: ConnectionStatus) => void;
}

const ApiKeyContext = createContext<ApiKeyContextValue | null>(null);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, connectionStatus, setConnectionStatus }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey(): ApiKeyContextValue {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) throw new Error('useApiKey must be used within ApiKeyProvider');
  return ctx;
}
