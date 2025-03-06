// auth.ts
import NextAuth from "next-auth"
import { authOptions } from "./auth.config"

// Export the NextAuth handler with built-in async handling
export const { auth, signIn, signOut } = NextAuth(authOptions)

// Create a separate function to get the session
export async function getSession() {
  const session = await auth()
  return session
}