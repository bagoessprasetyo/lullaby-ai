export interface StoryQueue {
  id: string;
  userId: string;
  items: QueueItem[];
  currentIndex: number;
  repeat: 'none' | 'all' | 'one';
  shuffle: boolean;
}

export interface QueueItem {
  id: string;
  storyId: string;
  addedAt: string;
  playedAt?: string;
  completedAt?: string;
  progress: number;
}

export interface QueueState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
}