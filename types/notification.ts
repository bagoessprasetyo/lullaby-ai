export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  action?: NotificationAction;
}

export type NotificationType = 
  | 'story_complete'
  | 'credit_update'
  | 'subscription'
  | 'feature_update'
  | 'system';

export interface NotificationAction {
  type: 'link' | 'button';
  label: string;
  url?: string;
  action?: () => void;
}