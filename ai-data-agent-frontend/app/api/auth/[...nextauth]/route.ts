import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

// Simple in-memory users
const users = [
  {
    id: "1",
    username: "admin",
    password: "admin123",
    email: "admin@example.com",
    role: "admin",
  },
  {
    id: "2",
    username: "user",
    password: "user123",
    email: "user@example.com",
    role: "user",
  },
]

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const user = users.find(u => u.username === credentials.username)
        
        if (!user || user.password !== credentials.password) {
          return null
        }

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.role as "admin" | "user",
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        const user = session.user as any
        user.id = token.id as string
        user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
