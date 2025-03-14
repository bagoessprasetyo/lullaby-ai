import { createClient } from '@supabase/supabase-js';

export interface BackgroundMusic {
  id: string;
  name: string;
  description?: string;
  storage_path: string;
  duration: number;
  category: string;
  is_premium?: boolean;
  created_at?: string;
}

// Get background music options from Supabase
export async function getBackgroundMusic(): Promise<BackgroundMusic[]> {
  try {
    // Use the admin client for better security
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    const { data, error } = await supabase
      .from('background_music')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching background music:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception fetching background music:', error);
    return [];
  }
}

// Get background music by ID
export async function getBackgroundMusicById(id: string): Promise<BackgroundMusic | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    const { data, error } = await supabase
      .from('background_music')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching background music by ID:', error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    console.error('Exception fetching background music by ID:', error);
    return null;
  }
}

// Function to get URL for streaming from Supabase storage
export function getBackgroundMusicStreamUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return '';
  
  // Construct storage URL
  return `${supabaseUrl}/storage/v1/object/public/background-music/${path}`;
}