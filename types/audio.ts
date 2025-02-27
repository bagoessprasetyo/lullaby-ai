export interface AudioPlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  isRepeat: boolean;
  isShuffle: boolean;
  volume: number;
  progress: number;
  currentTime: number;
  duration: number;
}

export interface AudioTrack {
  id: string;
  url: string;
  duration: number;
  title: string;
  thumbnail?: string;
}

export interface BackgroundMusic {
  id: string;
  name: string;
  category: 'calm' | 'adventure' | 'fantasy' | 'lullaby';
  url: string;
  previewUrl: string;
  duration: number;
}