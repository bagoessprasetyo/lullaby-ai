// lib/providers/query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import DevTools with no SSR to reduce bundle size
const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then(mod => mod.ReactQueryDevtools),
  { ssr: false }
);

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a client with optimized settings
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Improve default behavior for all queries
        refetchOnWindowFocus: false, // Don't refetch when window regains focus (reduces unnecessary requests)
        staleTime: 5 * 60 * 1000, // Data remains fresh for 5 minutes
        gcTime: 15 * 60 * 1000, // Keep unused data in cache for 15 minutes
        retry: 1, // Only retry failed queries once
        refetchOnMount: true, // Refresh data when components mount if stale
        refetchOnReconnect: true, // Refresh when internet reconnects
        // Implement smarter error handling
      },
      mutations: {
        // Add default mutation options
        retry: 1, // Only retry failed mutations once
        onError: (error) => {
          console.error('Mutation error:', error);
          // Could show a toast notification here
        },
      },
    },
  }));

  // Only show devtools in development
  const [showDevtools, setShowDevtools] = useState(false);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Delay loading to avoid impact on initial page load
      const timer = setTimeout(() => setShowDevtools(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {showDevtools && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}