export interface UserSettings {
  id: string;
  userId: string;
  preferences: UserPreferences;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  autoplay: boolean;
  defaultDuration: 'short' | 'medium' | 'long';
  defaultVoiceId?: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  storyComplete: boolean;
  creditUpdates: boolean;
  newFeatures: boolean;
}

export interface PrivacySettings {
  shareListeningActivity: boolean;
  allowDataCollection: boolean;
  showProfilePublicly: boolean;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  captionsEnabled: boolean;
}