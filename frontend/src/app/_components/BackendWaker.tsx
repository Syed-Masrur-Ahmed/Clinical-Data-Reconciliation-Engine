'use client';

import { useEffect } from 'react';
import { pingBackend } from '@/lib/api';

export default function BackendWaker() {
  useEffect(() => {
    pingBackend();
    const interval = setInterval(pingBackend, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
