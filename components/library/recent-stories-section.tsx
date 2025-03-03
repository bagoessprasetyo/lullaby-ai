import { Sparkles } from "lucide-react";
import { RecentStories } from "@/components/library/recent-stories";
import { getRecentStories } from "@/lib/services/story-service";

interface RecentStoriesSectionProps {
  userId: string;
}

export async function RecentStoriesSection({ userId }: RecentStoriesSectionProps) {
  const recentStories: any[] = await getRecentStories(userId, 3);
  
  if (!Array.isArray(recentStories) || recentStories.length === 0) {
    return null;
  }
  
  // Format story data
  const formattedStories = recentStories.map((story) => ({
    id: story.id,
    title: story.title,
    thumbnail: story.images && story.images.length > 0 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${story.images[0].storage_path}`
      : "https://via.placeholder.com/100x100?text=No+Image",
    duration: story.duration || 0,
    isFavorite: story.is_favorite,
    language: story.language || "en"
  }));

  return (
    <div className="mt-12">
      <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
        <Sparkles className="mr-2 h-5 w-5 text-indigo-400" />
        Recently Created
      </h2>
      <RecentStories stories={formattedStories} />
    </div>
  );
}