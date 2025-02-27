export interface ListeningStreak {
  currentStreak: number;
  longestStreak: number;
  lastListenedDate: string | null;
  streakHistory: boolean[];
}

export interface UserAnalytics {
  totalListeningTime: number;
  storiesGenerated: number;
  favoriteStories: number;
  completionRate: number;
  streak: ListeningStreak;
  monthlyActivity: MonthlyActivity[];
}

export interface MonthlyActivity {
  date: string;
  count: number;
  duration: number;
}