import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { findUserByOAuthId, syncUserWithSupabase } from '@/lib/auth';
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

// Define custom user type
interface CustomUser {
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
interface CustomSession extends Session {
  user: CustomUser & {
    id: string;
    name?: string | null;
    email?: string | null;
    oauthId?: string;
    image?: string | null;
  };
}

console.log('NextAuth route initializing...');

// Create direct route handler
const handler = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        console.log('Initial sign in detected');
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }): Promise<CustomSession> {
      const customSession = session as CustomSession;
      
      if (token && customSession.user) {
        // Add the user ID to the session
        const oauthId = token.sub as string;
        customSession.user.id = oauthId;
        
        // Only sync if we have an ID
        if (oauthId) {
          try {
            // First, try to find by OAuth ID
            let profile = await findUserByOAuthId(oauthId);
            
            // If not found, sync the user
            if (!profile) {
              profile = await syncUserWithSupabase({
                id: oauthId,
                name: customSession.user.name || '',
                email: customSession.user.email || '',
                image: customSession.user.image || ''
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
            console.error("Error syncing with Supabase:", error);
          }
        }
      }
      console.log('Final session user:', customSession.user);
      return customSession;
    }
  },
});

export { handler as GET, handler as POST };