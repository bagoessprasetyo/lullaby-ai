import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Create direct route handler without importing from auth.ts
const handler = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  pages: {
    signIn: "/",  // We're using modal for sign in, so redirect to home
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        // Extend the session.user type to include id
        session.user = {
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            id: token.sub || ""
        } as any; // Type assertion to bypass TypeScript error
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    }
  },
});

// Export route handlers
export { handler as GET, handler as POST };