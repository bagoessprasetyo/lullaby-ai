// types/user.ts
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  oauth_id?: string;
  created_at?: string;
  last_login_at?: string;
  subscription_tier?: 'free' | 'premium' | 'family';
  subscription_status?: 'active' | 'cancelled' | 'expired';
  subscription_expiry?: string;
  voice_credits?: number;
  story_credits?: number;
}