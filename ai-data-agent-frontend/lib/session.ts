import { SessionOptions } from 'iron-session';

export interface SessionData {
  userId: string;
  username: string;
  role: 'admin' | 'user';
  isLoggedIn: boolean;
  isSuperAdmin?: boolean;
}

export const defaultSession: SessionData = {
  userId: '',
  username: '',
  role: 'user',
  isLoggedIn: false,
  isSuperAdmin: false,
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'ai-data-agent-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

// Simple in-memory user database
export const users = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    email: undefined as string | undefined,
    role: 'admin' as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    username: 'user',
    password: 'user123',
    email: undefined as string | undefined,
    role: 'user' as const,
    createdAt: new Date().toISOString(),
  },
];
