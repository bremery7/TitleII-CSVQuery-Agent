import { useSession as useNextAuthSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useSession() {
  const { data: nextAuthSession, status: nextAuthStatus } = useNextAuthSession();
  const router = useRouter();

  // Map NextAuth session to app session format
  const session = nextAuthSession?.user ? {
    isLoggedIn: true,
    username: nextAuthSession.user.name || '',
    email: nextAuthSession.user.email || '',
    role: (nextAuthSession.user as any).role || 'user',
    id: (nextAuthSession.user as any).id || '',
    isSuperAdmin: (nextAuthSession.user as any).isSuperAdmin || false,
  } : {
    isLoggedIn: false,
    username: '',
    email: '',
    role: 'user' as const,
    id: '',
    isSuperAdmin: false,
  };

  const logout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return {
    session,
    status: nextAuthStatus,
    logout,
  };
}
