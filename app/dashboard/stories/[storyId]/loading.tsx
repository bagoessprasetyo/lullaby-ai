// app/dashboard/stories/[storyId]/loading.tsx
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { StorySkeletonLoader } from "@/components/story-playback/story-skeleton";

export default function StoryLoading() {
  return (
    <>
      <DashboardNavbar />
      <StorySkeletonLoader />
    </>
  );
}