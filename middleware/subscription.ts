// middleware/subscription.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function checkSubscription(userId: string, requiredTier: 'premium' | 'family' | null = null) {
  try {
    // Get user's subscription info
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status, subscription_expiry')
      .eq('id', userId)
      .single();
    
    if (error || !profile) {
      return false;
    }
    
    // Check if subscription is active
    const isActive = ['active', 'trialing'].includes(profile.subscription_status || '');
    
    // If subscription is not active, access is denied
    if (!isActive) {
      return false;
    }
    
    // If no specific tier is required, any active subscription is enough
    if (!requiredTier) {
      return true;
    }
    
    // Check if user has the required tier
    if (requiredTier === 'premium') {
      return ['premium', 'family'].includes(profile.subscription_tier || '');
    } else if (requiredTier === 'family') {
      return profile.subscription_tier === 'family';
    }
    
    return false;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

export async function requireSubscription(request: NextRequest, requiredTier: 'premium' | 'family' | null = null) {
  // Extract user ID from session cookie or auth header
  // This is a placeholder - you would need to implement your own logic
  const userId = getAuthenticatedUserId(request);
  
  if (!userId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  const hasAccess = await checkSubscription(userId, requiredTier);
  
  if (!hasAccess) {
    return NextResponse.redirect(new URL('/dashboard/subscription', request.url));
  }
  
  return NextResponse.next();
}

// This is a placeholder function - you would need to implement your own logic
function getAuthenticatedUserId(request: NextRequest): string | null {
  // In a real implementation, you would:
  // 1. Get the session cookie or auth header
  // 2. Verify the session
  // 3. Return the user ID
  
  return null;
}