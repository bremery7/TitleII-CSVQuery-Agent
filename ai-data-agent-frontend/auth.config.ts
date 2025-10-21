import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUserByUsername } from './lib/users';

export default {
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        console.log('Auth attempt:', credentials?.username);
        
        if (!credentials?.username || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        // Get user from database
        const user = await getUserByUsername(credentials.username as string);

        if (!user) {
          console.log('User not found');
          return null;
        }

        // Verify password with bcrypt
        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValidPassword) {
          console.log('Invalid password');
          return null;
        }

        console.log('Auth successful for user:', user.username);
        return {
          id: user.id,
          name: user.username,
          email: user.email || '',
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig;
