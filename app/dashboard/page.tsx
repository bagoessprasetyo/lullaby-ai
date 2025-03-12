// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth.config";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { QueryProvider } from "@/lib/providers/query-provider";

export default async function DashboardPage() {
  // Get server-side session
  const session = await getServerSession(authOptions);

  console.log("[DASHBOARD] Session check:", !!session);
  console.log("[DASHBOARD] User in session:", session?.user ? 
    `ID: ${session.user.id}, Name: ${session.user.name}` : "No user");

  // Redirect to home if not authenticated
  if (!session || !session.user || !session.user.id) {
    console.log("[SERVER] No valid session, redirecting to home");
    redirect("/");
  }

  console.log("[SERVER] Dashboard page rendering for user:", session.user.id);

  // Now we're using our API route through React Query
  // We don't need to pass the userId to the component
  return (
    <QueryProvider>
      <DashboardContent 
        userName={session.user.name || ""}
      />
    </QueryProvider>
  );
}