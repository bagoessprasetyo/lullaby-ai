// docs/rendering-strategy.ts
/**
 * LULLABY.AI RENDERING STRATEGY GUIDE
 * 
 * This file documents the recommended rendering strategy for different parts of the application.
 * It provides guidelines on when to use Server Components vs. Client Components,
 * and how to leverage Next.js app router features for optimal performance.
 */

/**
 * COMPONENT TYPES
 * 
 * 1. Server Components (default in Next.js App Router)
 *    - No 'use client' directive
 *    - Can't use hooks, event handlers, or browser APIs
 *    - Render on the server, reducing JS sent to client
 *    - Can directly access backend resources
 * 
 * 2. Client Components
 *    - Start with 'use client' directive
 *    - Can use hooks, event handlers, browser APIs
 *    - Hydrated in the browser
 *    - Should be used only when necessary
 */

/**
 * RECOMMENDED PATTERNS
 * 
 * 1. Server Component Wrapper + Client Component Islands
 *    - Use server components for data fetching and layout
 *    - Use client components for interactive elements
 * 
 * 2. Progressive Enhancement
 *    - Start with server-rendered content
 *    - Enhance with client-side interactivity where needed
 * 
 * 3. Streaming with Suspense
 *    - Use Suspense boundaries to stream in parts of the UI
 *    - Improves perceived performance by showing content incrementally
 */

// Example implementation of a Server Component Wrapper with Client Component Islands
/**
```tsx
// page.tsx (Server Component)
import { Suspense } from 'react';
import { StoryList } from './story-list'; // Server Component
import { StoryListSkeleton } from './story-list-skeleton'; // Server Component
import { StoryFilters } from './story-filters'; // Client Component
import { getStoriesMetadata } from '@/lib/data'; // Server-side function

export default async function StoriesPage() {
  // Fetch minimal metadata on the server
  const metadata = await getStoriesMetadata();
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Your Stories</h1>
      
      {/* Client Component for interactive filters */}
      <StoryFilters initialCount={metadata.count} />
      
      {/* Suspense boundary for the story list */}
      <Suspense fallback={<StoryListSkeleton count={metadata.count} />}>
        <StoryList />
      </Suspense>
    </div>
  );
}
```
*/

/**
 * RENDERING STRATEGY BY SECTION
 * 
 * 1. Public Pages (Home, About, Pricing)
 *    - Server Components
 *    - Static rendering where possible
 *    - Revalidate with ISR for content that changes occasionally
 * 
 * 2. Dashboard Pages
 *    - Server Components for layout and initial data
 *    - Client Components for interactive elements
 *    - Dynamic rendering with authenticated data fetching
 * 
 * 3. Story Creation/Viewing
 *    - Server Components for initial loading and SEO
 *    - Client Components for interactive story creation
 *    - Streaming for story generation progress
 * 
 * 4. Settings & Account Management
 *    - Primarily Client Components due to high interactivity
 *    - Server Actions for data mutations
 */

/**
 * COMPONENT-SPECIFIC RECOMMENDATIONS
 */

/**
 * Dashboard Components
 */

/**
 * DashboardLayout - Server Component
 * - Handles authentication checks
 * - Provides layout structure
 * - Fetches minimal user data needed for all dashboard pages
 */

/**
 * DashboardNavbar - Client Component
 * - Needs interactivity for dropdowns, mobile menu
 * - Uses session data passed from layout
 */

/**
 * DashboardContent - Client Component with Server Data
 * - Interactive elements require client-side rendering
 * - Use React Query for data fetching after initial load
 */

/**
 * Story Components
 */

/**
 * StoryList - Server Component
 * - Fetches and renders list of stories
 * - Minimal interactivity needed
 */

/**
 * StoryCard - Client Component for hover effects and navigation
 * - Interactive cards with hover states
 * - Optimistic updates for favorite toggling
 */

/**
 * StoryPlayer - Client Component
 * - Highly interactive audio playback controls
 * - Progress tracking and user interactions
 */

/**
 * StoryCreator - Client Component with Server Actions
 * - Complex form handling
 * - Image uploads and previews
 * - Uses server actions for final submission
 */

/**
 * Settings Components
 */

/**
 * SettingsForm - Client Component with Server Actions
 * - Form interactions and validation
 * - Server actions for saving changes
 */

/**
 * DATA FETCHING STRATEGY
 * 
 * 1. Initial Page Load
 *    - Use server components to fetch initial data
 *    - Pass minimal data needed for rendering
 * 
 * 2. After Hydration
 *    - Use React Query for client-side data fetching
 *    - Leverage optimistic updates and cache management
 * 
 * 3. Real-time Updates
 *    - Use WebSockets for real-time status (story generation)
 */

/**
 * IMPLEMENTATION CHECKLIST
 * 
 * For each component in your application, ask:
 * 
 * 1. Does this component need interactivity (event handlers, state, effects)?
 *    - If YES -> Client Component
 *    - If NO -> Server Component
 * 
 * 2. If it's a Server Component, can it be statically rendered?
 *    - If YES -> Add appropriate caching headers or ISR
 *    - If NO -> Use dynamic rendering
 * 
 * 3. Can the component be split into server and client parts?
 *    - If YES -> Extract interactive parts into Client Components
 * 
 * 4. Is this component part of a critical path?
 *    - If YES -> Consider streaming with Suspense
 */

/**
 * EXAMPLE REFACTORING: DASHBOARD PAGE
 * 
 * Original: Fully client-rendered dashboard
 * Optimized: Server component for layout and initial data, 
 *            with client component islands for interactive parts
 */

/**
```tsx
// dashboard/page.tsx - Server Component
import { Suspense } from 'react';
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth.config";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell"; // Server Component
import { DashboardStats } from "@/components/dashboard/dashboard-stats"; // Server Component
import { RecentStories } from "@/components/dashboard/recent-stories"; // Server Component
import { DashboardActions } from "@/components/dashboard/dashboard-actions"; // Client Component
import { StatsLoadingSkeleton, RecentStoriesLoadingSkeleton } from "@/components/skeletons";

export default async function DashboardPage() {
  // Authentication check on the server
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.id) {
    redirect("/");
  }
  
  return (
    <DashboardShell userName={session.user.name || ""}>
      {/* Client component for action buttons */}
      <DashboardActions />
      
      {/* Server components with Suspense for stats and recent stories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Suspense fallback={<StatsLoadingSkeleton />}>
          <DashboardStats userId={session.user.id} />
        </Suspense>
        
        <Suspense fallback={<RecentStoriesLoadingSkeleton />}>
          <RecentStories userId={session.user.id} />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
```
*/

// Export component types for documentation
export type ComponentTypes = 'server' | 'client';

// Export rendering strategies for documentation
export type RenderingStrategy = 'static' | 'dynamic' | 'streaming';

// Export data fetching strategies for documentation
export type DataFetchingStrategy = 
  | 'server-fetch' 
  | 'server-action' 
  | 'react-query'
  | 'websocket';

/**
 * To implement these rendering strategies:
 * 
 * 1. Split your components according to the Server/Client recommendations
 * 2. Add Suspense boundaries for streaming content
 * 3. Implement React Query for client-side data fetching
 * 4. Use server actions for form submissions and mutations
 */