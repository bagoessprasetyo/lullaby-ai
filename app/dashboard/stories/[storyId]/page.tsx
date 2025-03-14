// app/dashboard/stories/[storyId]/page.tsx
import { notFound } from "next/navigation";
import { getStoryById } from "@/lib/services/story-service";
import { auth } from "@/auth";
import { DashboardNavbar } from "@/components/dashboard/navbar";
// import StoryViewer from "./story-viewer"; 
import { Suspense } from "react";
import { StorySkeletonLoader } from "@/components/story-playback/story-skeleton";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth.config";
import StoryViewer from "@/components/story-playback/story-viewer";

export default async function StoryPage({
  params,
}: {
  params: { storyId: string };
}) {
  // Get the story ID from the route parameters
  const { storyId } = params;
  
  // Get the current user session
  const session = await getServerSession(authOptions);
  
  if (!storyId || !session?.user?.id) {
    notFound();
  }
  
  // Fetch the story data from the database
  const story = await getStoryById(storyId);
  
  // If the story doesn't exist or doesn't belong to the current user, show 404
  if (!story || story.user_id !== session.user.id) {
    console.log(
      `Story not found or unauthorized. StoryID: ${storyId}, User: ${session.user.id}`
    );
    notFound();
  }
  
  return (
    <>
      <DashboardNavbar />
      <Suspense fallback={<StorySkeletonLoader />}>
        <StoryViewer initialStory={story} />
      </Suspense>
    </>
  );
}