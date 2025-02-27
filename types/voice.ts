export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  language: string;
  accent?: string;
  isPremium: boolean;
  previewUrl: string;
  tags: string[];
}

export interface CustomVoice extends VoiceProfile {
  userId: string;
  createdAt: string;
  samples: VoiceSample[];
  status: 'training' | 'ready' | 'failed';
}

export interface VoiceSample {
  id: string;
  url: string;
  duration: number;
  quality: 'good' | 'poor' | 'unusable';
}