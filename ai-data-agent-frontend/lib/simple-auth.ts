import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Simple in-memory users for testing
const users = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123', // In production, this should be hashed
    email: 'admin@example.com',
    role: 'admin' as const,
  },
  {
    id: '2',
    username: 'user',
    password: 'user123',
    email: 'user@example.com',
    role: 'user' as const,
  },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('=== AUTH ATTEMPT ===');
        console.log('Username:', credentials?.username);
        
        if (!credentials?.username || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        const user = users.find(u => u.username === credentials.username);
        
        if (!user) {
          console.log('User not found');
          return null;
        }

        if (user.password !== credentials.password) {
          console.log('Invalid password');
          return null;
        }

        console.log('Auth successful!');
        return {
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
