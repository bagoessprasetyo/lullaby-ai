// app/dashboard/library/page.tsx
import { Suspense } from "react";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { LibraryHeader } from "@/components/library/library-header";
import { LibraryFilters } from "@/components/library/library-filters";
import { LibraryContent } from "@/components/library/library-content";
import { RecentStoriesSection } from "@/components/library/recent-stories-section";
import { getStoriesWithFilters, getStoryCount } from "@/lib/services/story-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-400">Please sign in to view your library</p>
        </div>
      </div>
    );
  }
  
  // Extract search parameters
  const searchQuery = typeof searchParams.q === 'string' ? searchParams.q : '';
  const currentTab = typeof searchParams.tab === 'string' ? searchParams.tab : 'all';
  const sortBy = typeof searchParams.sort === 'string' ? searchParams.sort : 'newest';
  const filterLanguage = typeof searchParams.language === 'string' ? searchParams.language : null;
  const viewMode = typeof searchParams.view === 'string' ? 
    (searchParams.view === 'list' ? 'list' : 'grid') : 'grid';
  
  // Get total story count for the user
  const totalCount = await getStoryCount(session.user.id);
  
  return (
    <>
      <DashboardNavbar />
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <LibraryHeader totalCount={totalCount} />
        
        <div className="mb-8">
          <LibraryFilters 
            currentTab={currentTab}
            viewMode={viewMode}
            searchQuery={searchQuery}
            filterLanguage={filterLanguage}
            sortBy={sortBy}
          />
          
          <Suspense fallback={<LibraryLoadingSkeleton />}>
            <LibraryContent
              userId={session.user.id}
              currentTab={currentTab}
              viewMode={viewMode}
              searchQuery={searchQuery}
              filterLanguage={filterLanguage}
              sortBy={sortBy}
            />
          </Suspense>
        </div>
        
        {typeof totalCount === 'number' && totalCount > 0 && (
          <Suspense fallback={<RecentStoriesLoadingSkeleton />}>
            <RecentStoriesSection userId={session.user.id} />
          </Suspense>
        )}
      </div>
    </>
  );
}

function LibraryLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-gray-900 rounded-xl p-6 h-64 animate-pulse"
        />
      ))}
    </div>
  );
}

function RecentStoriesLoadingSkeleton() {
  return (
    <div className="mt-12">
      <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
        Recently Played
      </h2>
      <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-6 animate-pulse">
        <div className="h-16"></div>
      </div>
    </div>
  );
}