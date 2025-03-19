/* eslint-disable @typescript-eslint/no-unused-vars */
// auth.config.ts
import { NextAuthOptions, User as NextAuthUser } from "next-auth";
import { Session } from "next-auth";
import Google from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import { findUserByOAuthId, getSafeSupabaseClient, syncUserWithSupabase } from '@/lib/auth';

export interface CustomUser extends NextAuthUser {
    id: string;
    name?: string | null;
    email?: string | null;
    oauthId?: string | null;
    image?: string | null;
    subscriptionTier?: string;
    storyCredits?: number;
    voiceCredits?: number;
}
  
// Define custom session type
export interface CustomSession extends Session {
  user: CustomUser & {
    id: string;
    name?: string | null;
    email?: string | null;
    oauthId?: string;
    image?: string | null;
  };
}
  
// Check if Supabase URL and key are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn("NEXT_PUBLIC_SUPABASE_URL is not set in environment variables.");
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in environment variables.");
}

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Optional: Add additional Google OAuth scopes if needed
      authorization: {
        params: {
          scope: 'openid profile email'
        }
      }
    }),
    // You can add more providers here in the future
  ],
      
  // Customize authentication pages
  pages: {
    signIn: "/", // Explicitly redirect to home page for sign in
    signOut: "/",
    error: "/auth/error", // Use your custom error page
    verifyRequest: "/", // If using email provider
    newUser: "/" // For newly created users
  },

  // Enable debug logs only in development
  debug: process.env.NODE_ENV === "development" || process.env.DEBUG_AUTH === "true",

  // Callbacks for customizing authentication behavior
  callbacks: {
    // Modify token during initial sign-in or subsequent visits
    async jwt({ token, user, account }): Promise<JWT> {
      // Initial sign in - add user details to token
      console.log('token tokeenn ',token)
      console.log('user tokeenn ',user)
      if (account && user) {
        return {
          ...token,
          oauthId: user.id,  // Capture original OAuth ID here
          sub: user.id ,       // Temporarily set sub to OAuth ID until Supabase UUID exists
          name: user.name,
          email: user.email,
          picture: user.image
        };
      }
      return token;
    },

    // Customize session object
    async session({ session, token }): Promise<CustomSession> {
      const customSession = session as CustomSession;
      
      if (token && customSession.user) {
        // Add the user ID to the session (from OAuth provider)
        const oauthId = token.sub as string;
        customSession.user.id = oauthId;
        console.log('tokeeennnn ', token)
        console.log('oauthhhhh', oauthId)
        // Only sync if we have an ID and Supabase URL is configured
        if (oauthId && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          try {
            // First, try to find by OAuth ID
            let profile = await findUserByOAuthId(oauthId);
            
            if (profile) {
              customSession.user.id = profile.id;
              profile = await syncUserWithSupabase({
                id: profile.id,
                name: token.name as string || '',
                email: token.email as string || '',
                image: token.image as string || ''
              });
            } else {
              // If not found, sync the user with both auth and profiles tables
              profile = await syncUserWithSupabase({
                id: oauthId,
                name: token.name as string || '',
                email: token.email as string || '',
                image: token.image as string || ''
              });
            }
            
            if (profile) {
              // Add profile data to session
              customSession.user = {
                ...customSession.user,
                id: profile.id || '',        // Supabase UUID or fallback
                oauthId: (token.oauthId as string) || (token.sub as string) || '',  // Explicit OAuth ID
                name: token.name || '',
                email: token.email || '',
                image: token.picture || '',
                subscriptionTier: (token.subscriptionTier as string) || 'free'
              };
            }
          } catch (error) {
            console.error("[SUPABASE] Error syncing with Supabase:", error);
          }
        } else {
          console.warn("[SUPABASE] Skipping Supabase sync due to missing configuration");
        }
      }
      
      return customSession;
    },

    // Optional: Customize sign-in process
    async signIn({ user, account, profile }) {
      // You can add additional sign-in logic here
      // For example, validate email domain, check user status, etc.
      if (account?.provider === 'google') {
        // Optional email domain validation
        // return profile?.email?.endsWith('@yourdomain.com') || false;
        return true;
      }
      return true;
    }
  },
  cookies: {
    state: {
      name: 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 900 // 15 minutes in seconds
      }
    },
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        domain: ".lullaby-ai.com"
      },
    },
  },
  // trustHost: true,
  // Optional: Add events for logging
  events: {
    async signIn(message) {
      console.log('[AUTH EVENT] User signed in:', {
        email: message.user.email,
        name: message.user.name,
        provider: message.account?.provider,
        timestamp: new Date().toISOString()
      });
    },
    async signOut(message) {
      console.log('[AUTH EVENT] User signed out:', {
        email: message.session?.user?.email,
        timestamp: new Date().toISOString()
      });
    },
    async createUser(message) {
      console.log('[AUTH EVENT] New user created:', {
        id: message.user.id,
        email: message.user.email
      });
    },
    async linkAccount(message) {
      console.log('[AUTH EVENT] Account linked:', {
        provider: message.account.provider,
        userId: message.user.id
      });
    },
    async session(message) {
      // Log basic session information (careful with frequency)
      if (Math.random() < 0.1) { // Only log ~10% of sessions to avoid excessive logs
        console.log('AUUUUTTHHH ',message)
        console.log('[AUTH EVENT] Session accessed:', {
          userId: message.session.user?.id,
          timestamp: new Date().toISOString()
        });
      }
    },
  },
  jwt: {
    // Important: This secret must match NEXTAUTH_SECRET
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Optional: Add additional configuration
  session: {
    // Choose how you want to store the session
    strategy: 'jwt', // JSON Web Token strategy
    maxAge: 30 * 24 * 60 * 60, 
  }
    
} satisfies NextAuthOptions;
