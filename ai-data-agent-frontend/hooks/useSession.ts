import { useState, useEffect } from 'react';
import { SessionData, defaultSession } from '@/lib/session';

export function useSession() {
  const [session, setSession] = useState<SessionData>(defaultSession);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    fetch('/api/session')
      .then(res => res.json())
      .then(data => {
        setSession(data);
        setStatus(data.isLoggedIn ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => {
        setStatus('unauthenticated');
      });
  }, []);

  const logout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setSession(defaultSession);
    setStatus('unauthenticated');
  };

  return {
    session,
    status,
    logout,
  };
}
