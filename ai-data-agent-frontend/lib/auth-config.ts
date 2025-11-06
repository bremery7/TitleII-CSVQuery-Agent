import { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import AzureADProvider from "next-auth/providers/azure-ad"
import { loadSSOConfig } from "@/lib/sso-config"
import { findUserByUsername, findUserByEmail, addUser } from "@/lib/user-storage"

console.log('🔐 Auth config loaded');

// Build providers array dynamically based on SSO configuration
function buildProviders() {
  const providers: any[] = [];
  
  let ssoConfig;
  try {
    ssoConfig = loadSSOConfig();
    console.log('SSO Config loaded:', {
      enabled: ssoConfig.enabled,
      provider: ssoConfig.provider,
      localAuthEnabled: ssoConfig.localAuthEnabled
    });
  } catch (error) {
    console.log('SSO Config not found, using defaults (local auth enabled)');
    ssoConfig = {
      enabled: false,
      provider: null,
      localAuthEnabled: true,
    };
  }

  // Add Azure AD provider if configured
  if (ssoConfig.enabled && ssoConfig.provider === 'azure-ad' && ssoConfig.azureAd) {
    console.log('Adding Azure AD provider');
    providers.push(
      AzureADProvider({
        clientId: ssoConfig.azureAd.clientId,
        clientSecret: ssoConfig.azureAd.clientSecret,
        tenantId: ssoConfig.azureAd.tenantId,
      })
    );
  }

  // Add credentials provider if local auth is enabled (default: true)
  if (ssoConfig.localAuthEnabled !== false) {
    console.log('Adding Credentials provider');
    providers.push(
      CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log('=== NextAuth Authorization Start ===');
          console.log('Credentials received:', { 
            username: credentials?.username, 
            hasPassword: !!credentials?.password 
          });
          
          if (!credentials?.username || !credentials?.password) {
            console.log('ERROR: Missing credentials');
            return null
          }

          console.log('Looking up user:', credentials.username);
          const user = findUserByUsername(credentials.username);
          console.log('User found:', user ? `Yes (${user.username})` : 'No');
          
          if (!user) {
            console.log('ERROR: User not found in database');
            return null
          }

          console.log('Comparing passwords...');
          console.log('  Stored password:', JSON.stringify(user.password));
          console.log('  Provided password:', JSON.stringify(credentials.password));
          console.log('  Stored length:', user.password.length);
          console.log('  Provided length:', credentials.password.length);
          const passwordMatch = user.password === credentials.password;
          console.log('Password match:', passwordMatch);
          
          if (!passwordMatch) {
            console.log('ERROR: Invalid password');
            return null
          }

          console.log('SUCCESS: Login successful for:', user.username);

          const returnUser = {
            id: user.id,
            name: user.username,
            email: user.email || `${user.username}@example.com`,
            role: user.role,
            isSuperAdmin: user.isSuperAdmin || false,
          };
          
          console.log('Returning user object:', returnUser);
          console.log('=== NextAuth Authorization End ===');
          
          return returnUser;
        } catch (error) {
          console.error('FATAL ERROR in authorization:', error);
          console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
          return null;
        }
      }
    })
    );
  }

  return providers;
}

export const authOptions: NextAuthOptions = {
  providers: buildProviders(),
  callbacks: {
    async signIn({ user, account }) {
      // Handle Azure AD OAuth sign-in
      if (account?.provider === 'azure-ad') {
        console.log('Azure AD sign-in for:', user.email);
        
        // Check if user exists by email
        let existingUser = user.email ? findUserByEmail(user.email) : null;
        
        if (!existingUser) {
          // Auto-create new user from Azure AD account
          console.log('Creating new user from Azure AD account');
          const newUser = {
            id: Date.now().toString(),
            username: user.email?.split('@')[0] || `user_${Date.now()}`,
            password: '', // No password for OAuth users
            email: user.email || '',
            role: 'user' as const,
            createdAt: new Date().toISOString(),
            isSuperAdmin: false,
          };
          addUser(newUser);
          existingUser = newUser;
        }
        
        // Add user info to the user object for JWT callback
        (user as any).id = existingUser.id;
        (user as any).role = existingUser.role;
        (user as any).isSuperAdmin = existingUser.isSuperAdmin || false;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id || (user as any).id
        token.role = (user as any).role || 'user'
        token.isSuperAdmin = (user as any).isSuperAdmin || false
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        const user = session.user as any
        user.id = token.id as string
        user.role = token.role as string
        user.isSuperAdmin = token.isSuperAdmin as boolean
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug mode to see what's happening
}
