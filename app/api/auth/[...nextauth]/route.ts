// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/auth.config";

// Handle the edge case if Supabase is not configured
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn("Supabase credentials are missing. Authentication will work but user profiles won't be synced.");
}

// Create the handler
const handler = NextAuth(authOptions);

// Export handler for GET and POST requests
export { handler as GET, handler as POST };