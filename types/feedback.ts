export interface UserFeedback {
  id: string;
  userId: string;
  storyId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  content?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: string;
  updatedAt: string;
}

export interface AIFeedback {
  id: string;
  storyId: string;
  modelVersion: string;
  promptQuality: number;
  imageQuality: number;
  voiceQuality: number;
  coherence: number;
  ageAppropriateness: number;
  technicalIssues: string[];
}