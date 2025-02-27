export interface StoryTheme {
  id: string;
  name: string;
  description: string;
  category: ThemeCategory;
  ageRange: AgeRange;
  isPremium: boolean;
  imageUrl: string;
}

export type ThemeCategory = 
  | 'adventure'
  | 'fantasy'
  | 'educational'
  | 'bedtime'
  | 'moral'
  | 'nature'
  | 'science'
  | 'cultural';

export interface AgeRange {
  min: number;
  max: number;
}