// components/story-playback/story-skeleton.tsx
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StorySkeletonLoader() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      {/* Back Button */}
      <div className="flex items-center text-gray-400 mb-6">
        <Skeleton className="h-4 w-4 mr-1" />
        <Skeleton className="h-4 w-24" />
      </div>
      
      {/* Story Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-9 w-3/4 mb-2" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-24" />
          <div className="w-1 h-1 rounded-full bg-gray-700" />
          <Skeleton className="h-4 w-16" />
          <div className="w-1 h-1 rounded-full bg-gray-700" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <div className="w-1 h-1 rounded-full bg-gray-700" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
      
      {/* Enhanced Reading Experience - New Button */}
      <Card className="bg-gray-900/60 border-gray-800 mb-8 p-6 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-11/12 max-w-md mt-1" />
            <Skeleton className="h-4 w-3/4 max-w-md mt-1" />
          </div>
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
      </Card>
      
      {/* Story Images */}
      <Card className="bg-gray-900 border-gray-800 mb-8 p-6">
        <div className="rounded-md bg-gray-800 aspect-video w-full max-h-[400px] relative overflow-hidden">
          <Skeleton className="absolute inset-0" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-700"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        <div className="flex justify-center space-x-2 mt-3">
          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          <div className="w-2 h-2 rounded-full bg-gray-700"></div>
          <div className="w-2 h-2 rounded-full bg-gray-700"></div>
        </div>
      </Card>
      
      {/* Audio Player */}
      <Card className="bg-gray-900 border-gray-800 mb-8 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-12 w-12 rounded-full" />
            
            <div className="flex-1 mx-4">
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between mt-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </div>
      </Card>
      
      {/* Characters */}
      <div className="mb-6">
        <Skeleton className="h-7 w-32 mb-3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, index) => (
            <Card key={index} className="bg-gray-800/50 border-gray-800 p-4">
              <Skeleton className="h-5 w-1/3 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-1" />
            </Card>
          ))}
        </div>
      </div>
      
      {/* Story Text */}
      <Card className="bg-gray-900 border-gray-800 p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index}>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12 mt-1" />
              <Skeleton className="h-4 w-4/5 mt-1" />
              {index < 4 && <div className="h-4" />}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}