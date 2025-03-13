// components/skeletons/dashboard-skeleton.tsx

interface DashboardSkeletonProps {
    userName: string;
  }
  
  export function DashboardSkeleton({ userName }: DashboardSkeletonProps) {
    return (
      <>
        {/* Navbar is not in the skeleton since it's likely not part of the Suspense boundary */}
        <div className="container max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">
              Hello, {userName.split(" ")[0] || "there"}!
            </h1>
            <p className="text-gray-400">
              Your personal story library and creation dashboard
            </p>
          </header>
          
          {/* Story grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-900 rounded-xl p-6 border border-gray-800 h-64 animate-pulse"
              >
                <div className="h-6 bg-gray-800 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-800 rounded w-1/4 mb-3"></div>
                <div className="h-4 bg-gray-800 rounded w-1/2 mb-6"></div>
                <div className="h-8 bg-gray-800 rounded w-1/3"></div>
              </div>
            ))}
          </div>
          
          {/* Activity section skeleton */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
              <div className="w-5 h-5 bg-gray-800 rounded-full mr-2"></div>
              Recent Activity
            </h2>
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
              <div className="h-32 bg-gray-800 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </>
    );
  }