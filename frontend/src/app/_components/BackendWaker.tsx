'use client';

import { useEffect } from 'react';
import { pingBackend } from '@/lib/api';

export default function BackendWaker() {
  useEffect(() => {
    pingBackend();
  }, []);

  return null;
}
