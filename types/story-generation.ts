export interface StoryGeneration {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  steps: StoryGenerationStep[];
  result?: GeneratedStory;
  error?: string;
}

export interface StoryGenerationStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
}

export interface GeneratedStory {
  id: string;
  title: string;
  content: string;
  summary: string;
  audioUrl: string;
  images: GeneratedImage[];
  metadata: StoryMetadata;
}

export interface GeneratedImage {
  id: string;
  url: string;
  alt: string;
  timestamp: number;
}

export interface StoryMetadata {
  language: string;
  duration: number;
  wordCount: number;
  targetAge: number;
  theme: string;
  aiModel: string;
  generatedAt: string;
}