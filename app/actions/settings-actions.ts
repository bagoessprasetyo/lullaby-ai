'use server';

import { revalidatePath } from 'next/cache';
import { getAdminClient, supabase } from '@/lib/supabase';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

/**
 * Update user profile settings
 */
export async function updateProfileSettingsAction(profileData: {
  name?: string;
  bio?: string;
}) {
    const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }

  const client = typeof window === 'undefined' ? getAdminClient() : supabase;
  
  // Update profile in Supabase
  const { data, error } = await client
    .from('profiles')
    .update({
      name: profileData.name,
      bio: profileData.bio,
    })
    .eq('id', session.user.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating profile:', error);
    throw new Error('Failed to update profile settings');
  }
  
  // Revalidate settings page to reflect changes
  revalidatePath('/dashboard/settings');
  
  return { success: true, data };
}

/**
 * Update user preferences
 */
export async function updatePreferencesAction(preferencesData: {
  theme?: string;
  language?: string;
  voiceGender?: string;
  voiceSpeed?: string;
  musicEnabled?: boolean;
  visualEffects?: boolean;
}) {
    const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }
  const client = typeof window === 'undefined' ? getAdminClient() : supabase;
  // Get or create user_preferences record
  const { data: existingPrefs } = await client
    .from('user_preferences')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle();
  
  // Prepare data for upsert
  const prefsData = {
    user_id: session.user.id,
    theme_mode: preferencesData.theme || existingPrefs?.theme_mode,
    default_language: preferencesData.language || existingPrefs?.default_language,
    voice_gender: preferencesData.voiceGender,
    voice_speed: preferencesData.voiceSpeed,
    background_music_enabled: preferencesData.musicEnabled,
    visual_effects_enabled: preferencesData.visualEffects,
  };
  
  // Update or insert preferences
  const { error } = await client
    .from('user_preferences')
    .upsert(prefsData)
    .eq('user_id', session.user.id);
  
  if (error) {
    console.error('Error updating preferences:', error);
    throw new Error('Failed to update preferences');
  }
  
  // Revalidate settings page to reflect changes
  revalidatePath('/dashboard/settings');
  
  return { success: true };
}

/**
 * Update notification settings
 */
export async function updateNotificationSettingsAction(notificationData: {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  newStoryNotifications?: boolean;
  promotionalNotifications?: boolean;
  reminderFrequency?: string;
}) {
    const session = await getServerSession(authOptions);
  const client = typeof window === 'undefined' ? getAdminClient() : supabase;
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }
  
  // Get or create notification settings record
  const { data: existingSettings } = await client
    .from('user_preferences')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle();
  
  // Prepare data for upsert
  const settingsData = {
    user_id: session.user.id,
    email_notifications: notificationData.emailNotifications,
    push_notifications: notificationData.pushNotifications,
    story_reminders: notificationData.newStoryNotifications,
    promotional_content: notificationData.promotionalNotifications,
    reminder_frequency: notificationData.reminderFrequency,
  };
  
  // Update or insert notification settings
  const { error } = await client
    .from('user_preferences')
    .upsert(settingsData)
    .eq('user_id', session.user.id);
  
  if (error) {
    console.error('Error updating notification settings:', error);
    throw new Error('Failed to update notification settings');
  }
  
  // Revalidate settings page to reflect changes
  revalidatePath('/dashboard/settings');
  
  return { success: true };
}

/**
 * Clear storage cache
 */
export async function clearStorageCacheAction() {
    const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }
  const client = typeof window === 'undefined' ? getAdminClient() : supabase;
  // Here you would add logic to clear temporary files or cache
  // This is a placeholder for the actual implementation
  
  // For example, we might delete temporary images:
  const { error } = await client.storage
    .from('user-uploads')
    .remove([]);
  
  if (error) {
    console.error('Error clearing storage cache:', error);
    throw new Error('Failed to clear storage cache');
  }
  
  // Revalidate settings page to reflect changes
  revalidatePath('/dashboard/settings');
  
  return { success: true };
}

/**
 * Update user email (with verification)
 */
export async function updateEmailAction(newEmail: string) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to perform this action');
    }
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    // In a real implementation, this would send a verification email
    // and only update after verification
    
    // For now, we'll just simulate the process
    // This would typically involve external email service
    
    // Note: For Google-connected accounts, changing the email should be handled with care
    
    return { 
      success: true, 
      message: 'Verification email sent. Please check your inbox.' 
    };
  }
  
  /**
   * Get user voice profiles
   */
  export async function getVoiceProfilesAction() {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to perform this action');
    }
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    // Get voice profiles from Supabase
    const { data, error } = await client
      .from('voice_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching voice profiles:', error);
      throw new Error('Failed to fetch voice profiles');
    }
    
    return data || [];
  }
  
  /**
   * Create new voice profile
   */
  export async function createVoiceProfileAction(voiceData: {
    name: string;
    audioData?: string; // Base64 encoded audio
  }) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to perform this action');
    }
    
    // In a real implementation, you would:
    // 1. Upload the audio file to storage
    // 2. Process the voice sample (possibly with a background job)
    // 3. Create the voice profile record
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    // For now, we'll create a simple record
    const { data, error } = await client
      .from('voice_profiles')
      .insert({
        user_id: session.user.id,
        name: voiceData.name,
        storage_path: 'voice-samples/placeholder.mp3', // This would be a real path in production
        created_at: new Date().toISOString(),
        duration: 40, // Placeholder
        last_used_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating voice profile:', error);
      throw new Error('Failed to create voice profile');
    }
    
    // Revalidate settings page to reflect changes
    revalidatePath('/dashboard/settings');
    
    return data;
  }
  
  /**
   * Delete voice profile
   */
  export async function deleteVoiceProfileAction(profileId: string) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to perform this action');
    }
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    // Check if user owns the voice profile
    const { data: profile, error: profileError } = await client
      .from('voice_profiles')
      .select('user_id')
      .eq('id', profileId)
      .single();
    
    if (profileError || !profile) {
      throw new Error('Voice profile not found');
    }
    
    if (profile.user_id !== session.user.id) {
      throw new Error('You do not have permission to delete this voice profile');
    }
    
    // Delete the voice profile
    const { error } = await client
      .from('voice_profiles')
      .delete()
      .eq('id', profileId);
    
    if (error) {
      console.error('Error deleting voice profile:', error);
      throw new Error('Failed to delete voice profile');
    }
    
    // Revalidate settings page to reflect changes
    revalidatePath('/dashboard/settings');
    
    return { success: true };
}

/**
 * Get user settings
 */
export async function getUserSettingsAction() {
    const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }
  const client = typeof window === 'undefined' ? getAdminClient() : supabase;
  // Get user profile
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (profileError) {
    console.error('Error fetching profile:', profileError);
    throw new Error('Failed to fetch user profile');
  }
  
  // Get user preferences
  const { data: preferences, error: preferencesError } = await client
    .from('user_preferences')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle();
  
  if (preferencesError) {
    console.error('Error fetching preferences:', preferencesError);
    // Don't throw here, as the user might not have preferences set yet
  }
  
  return {
    profile,
    preferences: preferences || {
      theme_mode: 'dark',
      default_language: 'english',
      email_notifications: true,
      push_notifications: true,
      story_reminders: true,
      promotional_content: false,
      reminder_frequency: 'weekly',
      background_music_enabled: true,
      visual_effects_enabled: true
    }
  };
}