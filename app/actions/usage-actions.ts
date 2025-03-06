// app/actions/usage-actions.ts
'use server';

import { getAdminClient } from '@/lib/supabase';
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth.config";;

export async function incrementStoryUsageAction() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }
  
  // Get the current month in YYYY-MM format
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const client = getAdminClient();
  
  // Try to increment the counter for the current month
  const { data, error } = await client.rpc('increment_story_usage', { 
    p_user_id: session.user.id,
    p_month: currentMonth
  });
  
  if (error) {
    console.error('Error incrementing story usage:', error);
    throw new Error('Failed to update story usage');
  }
  
  return data;
}

export async function getMonthlyUsageAction() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }
  
  // Get the current month in YYYY-MM format
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const client = getAdminClient();
  
  // Get the current month's usage
  const { data, error } = await client
    .from('story_usage')
    .select('story_count')
    .eq('user_id', session.user.id)
    .eq('month', currentMonth)
    .maybeSingle();
  
  if (error) {
    console.error('Error getting story usage:', error);
    throw new Error('Failed to get story usage');
  }
  
  return data?.story_count || 0;
}