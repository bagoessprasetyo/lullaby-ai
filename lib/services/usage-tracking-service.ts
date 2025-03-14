// lib/services/usage-tracking-service.ts
import { getAdminClient, supabase } from '@/lib/supabase';

/**
 * Track user interaction with the dashboard for personalization
 */
export async function trackDashboardInteraction(
  userId: string,
  action: string,
  metadata: Record<string, any> = {}
) {
  if (!userId) {
    console.warn('No user ID provided for tracking interaction');
    return null;
  }

  try {
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    
    // Record the interaction
    const { data, error } = await client
      .from('user_interactions')
      .insert({
        user_id: userId,
        action_type: action,
        page: 'dashboard',
        metadata,
        created_at: new Date().toISOString()
      })
      .select();
      
    if (error) {
      console.error('Error tracking dashboard interaction:', error);
      return null;
    }
    
    // Also update user_preferences with a counter for this interaction type
    // This helps build a profile of user behavior without needing to constantly query interactions
    try {
      // Get current preferences first
      const { data: preferences, error: prefsError } = await client
        .from('user_preferences')
        .select('interaction_counts, dashboard_preferences')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (prefsError) {
        console.error('Error fetching user preferences:', prefsError);
      } else {
        // Update the interaction counts
        const interactionCounts = preferences?.interaction_counts || {};
        interactionCounts[action] = (interactionCounts[action] || 0) + 1;
        
        // Based on interactions, attempt to derive personalization preferences
        let dashboardPreferences = preferences?.dashboard_preferences || {};
        
        // Personalization logic - derive preferences from behavior
        if (action === 'view_favorites' || action === 'toggle_favorite') {
          dashboardPreferences.favoritesFocus = true;
        }
        
        if (action === 'continue_story' || action === 'view_history') {
          dashboardPreferences.historyFocus = true;
        }
        
        if (action === 'view_insights' || action === 'change_timerange') {
          dashboardPreferences.insightsFocus = true;
        }
        
        if (action === 'create_story') {
          dashboardPreferences.creationFocus = true;
        }
        
        if (action === 'theme_editor' || action === 'view_themes') {
          dashboardPreferences.themesFocus = true;
        }
        
        if (action === 'voice_settings') {
          dashboardPreferences.voiceFocus = true;
        }
        
        // Calculate most used feature
        const actionCounts = {
          listening: (interactionCounts['continue_story'] || 0) + 
                     (interactionCounts['view_history'] || 0),
          creation: (interactionCounts['create_story'] || 0) + 
                    (interactionCounts['theme_editor'] || 0),
          browsing: (interactionCounts['view_favorites'] || 0) + 
                   (interactionCounts['view_themes'] || 0),
          settings: (interactionCounts['voice_settings'] || 0) + 
                   (interactionCounts['settings'] || 0)
        };
        
        const mostUsedFeature = Object.entries(actionCounts)
          .sort((a, b) => b[1] - a[1])[0][0];
        
        dashboardPreferences.mostUsedFeature = mostUsedFeature;
        
        // Update preferences
        const { error: updateError } = await client
          .from('user_preferences')
          .upsert({
            user_id: userId,
            interaction_counts: interactionCounts,
            dashboard_preferences: dashboardPreferences,
            updated_at: new Date().toISOString()
          });
          
        if (updateError) {
          console.error('Error updating preferences with interaction data:', updateError);
        }
      }
    } catch (prefsException) {
      console.error('Exception in preferences update:', prefsException);
    }
    
    return data;
  } catch (error) {
    console.error('Exception in trackDashboardInteraction:', error);
    return null;
  }
}

/**
 * Get personalized dashboard layout for user based on their interactions
 */
export async function getPersonalizedDashboardLayout(userId: string) {
  if (!userId) {
    return {
      topSection: 'stories',
      showInsights: true,
      suggestedActions: ['create_story', 'view_library']
    };
  }
  
  try {
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    
    // Get user preferences
    const { data: preferences, error } = await client
      .from('user_preferences')
      .select('dashboard_preferences, interaction_counts')
      .eq('user_id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user preferences for personalization:', error);
      return {
        topSection: 'stories',
        showInsights: true,
        suggestedActions: ['create_story', 'view_library']
      };
    }
    
    const dashboardPreferences = preferences?.dashboard_preferences || {};
    const interactionCounts = preferences?.interaction_counts || {};
    
    // Determine top section based on most used feature
    let topSection = 'stories';
    if (dashboardPreferences.mostUsedFeature === 'listening') {
      topSection = 'listening';
    } else if (dashboardPreferences.mostUsedFeature === 'creation') {
      topSection = 'creation';
    }
    
    // Determine if insights should be prominent
    const showInsights = !!dashboardPreferences.insightsFocus;
    
    // Determine suggested actions based on interaction history
    const suggestedActions: string[] = [];
    
    // Default action is always create story
    suggestedActions.push('create_story');
    
    // Add suggestions based on usage patterns
    if (interactionCounts['view_favorites'] > 2) {
      suggestedActions.push('view_favorites');
    }
    
    if (interactionCounts['view_history'] > 2) {
      suggestedActions.push('view_history');
    }
    
    if (interactionCounts['theme_editor'] > 0) {
      suggestedActions.push('theme_editor');
    }
    
    if (interactionCounts['voice_settings'] > 0) {
      suggestedActions.push('voice_settings');
    }
    
    // Limit to 5 suggestions
    const finalSuggestions = suggestedActions.slice(0, 5);
    
    return {
      topSection,
      showInsights,
      suggestedActions: finalSuggestions
    };
  } catch (error) {
    console.error('Error getting personalized dashboard layout:', error);
    return {
      topSection: 'stories',
      showInsights: true,
      suggestedActions: ['create_story', 'view_library']
    };
  }
}

/**
 * Get listening milestones for a user
 */
export async function getUserListeningMilestones(userId: string) {
  if (!userId) {
    return {
      totalStoriesListened: 0,
      totalMinutesListened: 0,
      longestStreak: 0,
      nextMilestone: null
    };
  }
  
  try {
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    
    // Get user's listening stats
    const { data: stats, error } = await client.rpc('get_user_listening_stats', {
      p_user_id: userId
    });
    
    if (error) {
      console.error('Error fetching user listening stats:', error);
      return {
        totalStoriesListened: 0,
        totalMinutesListened: 0,
        longestStreak: 0,
        nextMilestone: null
      };
    }
    
    // Calculate next milestone
    const totalStories = stats.total_stories || 0;
    const totalMinutes = Math.floor((stats.total_duration || 0) / 60);
    const longestStreak = stats.longest_streak || 0;
    
    // Story count milestones
    const storyMilestones = [1, 5, 10, 25, 50, 100, 250, 500, 1000];
    const nextStoryMilestone = storyMilestones.find(m => m > totalStories) || null;
    
    // Minutes milestones
    const minuteMilestones = [10, 30, 60, 120, 300, 600, 1000];
    const nextMinuteMilestone = minuteMilestones.find(m => m > totalMinutes) || null;
    
    // Streak milestones
    const streakMilestones = [3, 7, 14, 30, 60, 100];
    const nextStreakMilestone = streakMilestones.find(m => m > longestStreak) || null;
    
    // Determine which milestone is closest
    let nextMilestone = null;
    
    if (nextStoryMilestone) {
      nextMilestone = {
        type: 'stories',
        current: totalStories,
        target: nextStoryMilestone,
        progress: totalStories / nextStoryMilestone
      };
    }
    
    if (nextMinuteMilestone) {
      const minuteProgress = totalMinutes / nextMinuteMilestone;
      if (!nextMilestone || minuteProgress > nextMilestone.progress) {
        nextMilestone = {
          type: 'minutes',
          current: totalMinutes,
          target: nextMinuteMilestone,
          progress: minuteProgress
        };
      }
    }
    
    if (nextStreakMilestone) {
      const streakProgress = longestStreak / nextStreakMilestone;
      if (!nextMilestone || streakProgress > nextMilestone.progress) {
        nextMilestone = {
          type: 'streak',
          current: longestStreak,
          target: nextStreakMilestone,
          progress: streakProgress
        };
      }
    }
    
    return {
      totalStoriesListened: totalStories,
      totalMinutesListened: totalMinutes,
      longestStreak,
      nextMilestone
    };
  } catch (error) {
    console.error('Error getting user listening milestones:', error);
    return {
      totalStoriesListened: 0,
      totalMinutesListened: 0,
      longestStreak: 0,
      nextMilestone: null
    };
  }
}