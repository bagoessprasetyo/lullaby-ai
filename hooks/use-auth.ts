"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // First check localStorage for performance (if we've already stored it)
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
      setIsLoading(false);
      return;
    }

    // Otherwise fetch from Supabase
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.id) {
          setUserId(session.user.id);
          localStorage.setItem('userId', session.user.id);
        }
      } catch (error) {
        console.error('Error getting auth user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.id) {
          setUserId(session.user.id);
          localStorage.setItem('userId', session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUserId(null);
          localStorage.removeItem('userId');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { userId, isLoading };
}