export interface StoryEvent {
  id: string;
  storyId: string;
  userId: string;
  type: StoryEventType;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export type StoryEventType = 
  | 'story_started'
  | 'story_completed'
  | 'story_paused'
  | 'story_favorited'
  | 'story_shared';

export interface UserEvent {
  id: string;
  userId: string;
  type: UserEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

export type UserEventType =
  | 'login'
  | 'logout'
  | 'subscription_changed'
  | 'credits_updated'
  | 'settings_updated';