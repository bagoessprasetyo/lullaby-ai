// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getRecentStories, getStoryCount } from "@/lib/services/story-service";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  // Get server-side session - make sure getServerSession awaits cookies/headers internally
  const session = await getServerSession(authOptions);

  // Redirect to home if not authenticated
  if (!session || !session.user || !session.user.id) {
    console.log("[SERVER] No valid session, redirecting to home");
    redirect("/");
  }

  console.log("[SERVER] Dashboard page rendering for user:", session.user.id);

  try {
    // Fetch initial data server-side
    const recentStoriesPromise = getRecentStories(session.user.id);
    const storyCountPromise = getStoryCount(session.user.id);

    // Wait for both to complete
    const [recentStories, storyCount] = await Promise.all([
      recentStoriesPromise,
      storyCountPromise
    ]);

    console.log("[SERVER] Fetched initial data:", {
      userId: session.user.id,
      storiesCount: recentStories?.length,
      storyCount,
    });

    // Ensure we have valid data before rendering component
    return (
      <DashboardContent 
        initialStories={recentStories || []} 
        initialStoryCount={typeof storyCount === 'number' ? storyCount : 0}
        userName={session.user.name || ""}
        userId={session.user.id}
      />
    );
  } catch (error) {
    console.error("[SERVER] Error fetching dashboard data:", error);
    
    // Return component with empty initial data
    return (
      <DashboardContent 
        initialStories={[]}
        initialStoryCount={0}
        userName={session.user.name || ""}
        userId={session.user.id}
      />
    );
  }
}