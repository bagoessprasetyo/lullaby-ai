// app/dashboard/page.tsx
import { Suspense } from 'react';
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth.config";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { QueryProvider } from "@/lib/providers/query-provider";
import { getRecentStories, getStoryCount } from "@/lib/services/story-service";
import { getSubscriptionFeatures } from "@/app/actions/subscriptions";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";

export default async function DashboardPage() {
  // Get server-side session
  const session = await getServerSession(authOptions);

  // Redirect to home if not authenticated
  if (!session?.user?.id) {
    redirect("/");
  }

  // Pre-fetch critical data in parallel for initial render
  // This provides data for immediate display while still allowing client components
  // to refresh it as needed
  const [recentStories, storyCount, subscriptionFeatures] = await Promise.all([
    getRecentStories(session.user.id, 3),
    getStoryCount(session.user.id),
    getSubscriptionFeatures()
  ]);

  return (
    <QueryProvider>
      <Suspense fallback={<DashboardSkeleton userName={session.user.name || ""} />}>
        <DashboardContent 
          userName={session.user.name || ""}
          initialStories={recentStories}
          initialStoryCount={storyCount}
          initialSubscriptionFeatures={subscriptionFeatures}
        />
      </Suspense>
    </QueryProvider>
  );
}