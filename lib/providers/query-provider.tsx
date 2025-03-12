// lib/providers/query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode, useEffect } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a client for each user session
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // General defaults for all queries
        refetchOnWindowFocus: false, // Disable automatic refetch on window focus
        staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
        retry: 1, // Only retry failed queries once
        refetchOnMount: true, // Refetch when component mounts if data is stale
      },
    },
  }));

  // Dynamically import React Query DevTools only in development
  // This avoids any version mismatch errors at startup
  const [showDevtools, setShowDevtools] = useState(false);
  
  useEffect(() => {
    // Only load DevTools in development and on client-side
    if (process.env.NODE_ENV === 'development') {
      // Wait a bit to avoid hydration issues
      const timer = setTimeout(() => setShowDevtools(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
    </QueryClientProvider>
  );
}

// Component that lazy-loads DevTools only when needed
function ReactQueryDevtoolsProduction() {
  const [DevToolsComponent, setDevToolsComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues and version conflicts
    import('@tanstack/react-query-devtools').then((module) => {
      setDevToolsComponent(() => module.ReactQueryDevtools);
    }).catch(err => {
      console.error('Could not load React Query Devtools:', err);
    });
  }, []);

  return DevToolsComponent ? <DevToolsComponent /> : null;
}