import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth-config"

console.log('🔐 NextAuth route handler loaded');
console.log('Environment check:', {
  hasSecret: !!process.env.NEXTAUTH_SECRET,
  nextAuthUrl: process.env.NEXTAUTH_URL,
  nodeEnv: process.env.NODE_ENV
});

export const runtime = 'nodejs';

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
