// lib/services/user-service.ts
import { getAdminClient, supabase } from '@/lib/supabase';

/**
 * Get user preferences from the database
 */
export async function getUserPreferences(userId: string) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    
    // Get preferences from the user_preferences table
    const { data, error } = await client
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    console.log('PREFERENCEEESSS ', data)
    if (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
    
    // Calculate dashboard usage patterns if we have user data
    // This would be enhanced with real usage analytics in production
    if (data) {
      // Analyze listening history to determine most used feature
      // This is a placeholder - you would implement real logic based on your data
      const { data: playHistory, error: historyError } = await client
        .from('play_history')
        .select('count(*)')
        .eq('user_id', userId);
        
      const { data: creationHistory, error: creationError } = await client
        .from('stories')
        .select('count(*)')
        .eq('user_id', userId);
        
      const playCount = playHistory?.length || 0;
      const creationCount = creationHistory?.length || 0;
      
      // Determine most used feature
      const mostUsedFeature = playCount > creationCount * 2 ? 'listening' : 
                            creationCount > playCount * 2 ? 'creation' : 'browsing';
      
      return {
        ...data,
        mostUsedFeature,
        // Enhance with derived preferences
        voiceCustomization: data.default_voice_profile_id !== null,
        statsInterest: data.email_notifications || false, // Assumption: users who want email notifications care about stats
      };
    }
    
    // If no preferences are found, return default values
    return {
      theme_mode: 'dark',
      default_language: 'english',
      email_notifications: true,
      mostUsedFeature: 'listening', // Default assumption
      statsInterest: true, // Default assumption
      dashboard_layout: 'default',
      voiceCustomization: false
    };
  } catch (error) {
    console.error('Error in getUserPreferences:', error);
    throw error;
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(userId: string, preferences: Record<string, any>) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    
    // Update preferences in the user_preferences table
    const { data, error } = await client
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateUserPreferences:', error);
    throw error;
  }
}

/**
 * Track user interaction with dashboard features
 * This would be used to identify preferences and build the personalized experience
 */
export async function trackDashboardInteraction(userId: string, feature: string) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    
    // In a production environment, this would insert into a user_interactions table
    // Here we'll just update a counter in user_preferences
    const { data: preferences } = await client
      .from('user_preferences')
      .select('feature_interactions')
      .eq('user_id', userId)
      .maybeSingle();
      
    const interactions = preferences?.feature_interactions || {};
    interactions[feature] = (interactions[feature] || 0) + 1;
    
    const { error } = await client
      .from('user_preferences')
      .upsert({
        user_id: userId,
        feature_interactions: interactions,
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error tracking dashboard interaction:', error);
    }
  } catch (error) {
    console.error('Error in trackDashboardInteraction:', error);
    // Don't throw - this is a background tracking function
  }
}