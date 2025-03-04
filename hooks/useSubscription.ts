// hooks/useSubscription.ts
"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getSubscriptionFeatures } from '@/app/actions/subscriptions';
import { SubscriptionFeatures } from '@/types/subscription';


export function useSubscription() {
  const { data: session, status } = useSession();
  const [features, setFeatures] = useState<SubscriptionFeatures | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchFeatures = async () => {
      if (status !== 'authenticated') return;
      
      try {
        const featuresData = await getSubscriptionFeatures();
        console.log('feature data',featuresData)
        if (isMounted) {
          setFeatures(featuresData);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching subscription data:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchFeatures();
    
    return () => {
      isMounted = false;
    };
  }, [status, session?.user?.id]);
  
  return {
    features,
    isSubscriber: features?.subscription_tier !== 'free',
    isLoading,
    error
  };
}