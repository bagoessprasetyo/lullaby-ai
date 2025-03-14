// components/skeletons/dashboard-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";

interface DashboardSkeletonProps {
  userName: string;
}

export function DashboardSkeleton({ userName }: DashboardSkeletonProps) {
  return (
    <>
      {/* Navbar is not in the skeleton since it's likely part of the layout */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Hello, {userName.split(" ")[0] || "there"}!
            </h1>
            <p className="text-gray-400">
              Your personal story library and creation dashboard
            </p>
          </div>
          <Skeleton className="h-9 w-24" />
        </header>
        
        {/* Quick Actions Skeleton */}
        <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 rounded-xl p-4 mb-8">
          <h3 className="text-lg font-medium text-white mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
        
        {/* Recently Played Skeleton */}
        <Card className="bg-gray-900/80 border-gray-800 mb-8">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-semibold text-white flex items-center">
              <Skeleton className="h-5 w-5 mr-2 rounded-full" />
              Continue Listening
            </CardTitle>
            <Skeleton className="h-9 w-24" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div 
                  key={i}
                  className="flex items-start space-x-4 p-3 rounded-lg"
                >
                  <Skeleton className="h-16 w-16 rounded-md" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-3 w-1/3 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-9 w-9 rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Main Content Tabs Skeleton */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Your Library</h2>
            <Skeleton className="h-10 w-64" />
          </div>
          
          {/* Stories Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-900/80 rounded-xl p-5 border border-gray-800 overflow-hidden"
              >
                <div className="h-36 relative mb-4">
                  <Skeleton className="h-full w-full rounded" />
                </div>
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Insights Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Streak Card */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Skeleton className="h-5 w-5 mr-2 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Skeleton className="h-10 w-16 mx-auto mb-2" />
                <Skeleton className="h-4 w-32 mx-auto mb-4" />
                
                {/* Weekly streak visualization */}
                <div className="flex justify-center space-x-1 mb-4">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="w-8 h-8 rounded-full" />
                  ))}
                </div>
                
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            </CardContent>
          </Card>
          
          {/* Listening Time */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Skeleton className="h-5 w-5 mr-2 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-24 rounded-lg" />
                  <Skeleton className="h-24 rounded-lg" />
                </div>
                
                {/* Chart skeleton */}
                <Skeleton className="h-28 w-full" />
              </div>
            </CardContent>
          </Card>
          
          {/* Listening Patterns */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Skeleton className="h-5 w-5 mr-2 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-3 w-full" />
                
                <Skeleton className="h-4 w-32 mt-3 mb-2" />
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-12 h-12 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}