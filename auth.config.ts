/* eslint-disable @typescript-eslint/no-unused-vars */
// auth.config.ts
import { NextAuthOptions, User as NextAuthUser } from "next-auth";
import { Session } from "next-auth";
import Google from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import { findUserByOAuthId, syncUserWithSupabase } from '@/lib/auth';

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
    signIn: "/",
    // Optional: customize other pages
    // error: '/auth/error',
    // signOut: '/auth/signout'
  },

  // Enable debug logs only in development
  debug: process.env.NODE_ENV === "development",

  // Callbacks for customizing authentication behavior
  callbacks: {
    // Modify token during initial sign-in or subsequent visits
    async jwt({ token, user, account }): Promise<JWT> {
      // Initial sign in - add user details to token
      if (account && user) {
        console.log('Initial sign in detected');
        // Use the OAuth provider's unique ID
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        
        // Add provider info to token for Supabase sync
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
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
        
        // Only sync if we have an ID and Supabase URL is configured
        if (oauthId && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          try {
            // First, try to find by OAuth ID
            let profile = await findUserByOAuthId(oauthId);
            
            if (profile) {
              profile = await syncUserWithSupabase({
                id: oauthId,
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
                id: profile.id, // Use the UUID from Supabase as the session user ID
                oauthId: oauthId, // Store the original OAuth ID
                subscriptionTier: profile.subscription_tier,
                storyCredits: profile.story_credits,
                voiceCredits: profile.voice_credits
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
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    },
  },

  // Optional: Add events for logging
  events: {
    async signIn(message) {
      console.log('User signed in:', message.user.email);
    },
    async signOut(message) {
      console.log('User signed out:', message.session?.user?.email);
    }
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
