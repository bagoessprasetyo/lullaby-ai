// types/user.ts
export interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_login_at: string;
  subscription_tier: 'free' | 'premium' | 'family';
  subscription_status: 'active' | 'cancelled' | 'expired';
  subscription_expiry: string | null;
  voice_credits: number;
  story_credits: number;
}