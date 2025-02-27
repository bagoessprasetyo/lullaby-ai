export interface StoryMetrics {
  id: string;
  storyId: string;
  totalPlays: number;
  uniqueListeners: number;
  averageCompletionRate: number;
  favoriteCount: number;
  shareCount: number;
  ratings: RatingMetrics;
  timeListened: number;
}

export interface RatingMetrics {
  average: number;
  total: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface UserMetrics {
  totalStoriesCreated: number;
  totalListeningTime: number;
  averageSessionDuration: number;
  deviceUsage: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  peakListeningHours: number[];
}