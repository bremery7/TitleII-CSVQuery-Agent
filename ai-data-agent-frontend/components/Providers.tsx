'use client';

import { SessionProvider } from 'next-auth/react';
import SessionTimeout from './SessionTimeout';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionTimeout />
      {children}
    </SessionProvider>
  );
}
