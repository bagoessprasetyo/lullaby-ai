"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Mic, 
  Play, 
  Pause,
  Check, 
  Plus, 
  Trash2, 
  Edit2, 
  Lock, 
  AlertCircle,
  StopCircle,
  RefreshCw,
  Volume2,
  VolumeX,
  Info
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  getVoiceProfilesAction, 
  createVoiceProfileAction, 
  deleteVoiceProfileAction 
} from "@/app/actions/settings-actions";
import { PremiumFeatureAlert } from "@/components/premium-feature-alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload } from "lucide-react";

interface VoiceProfilesSettingsProps {
  isSubscriber?: boolean;
  subscriptionTier?: string;
}

interface VoiceProfile {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string;
  duration?: number;
}

export function VoiceProfilesSettings({ isSubscriber = true, subscriptionTier = "premium" }: VoiceProfilesSettingsProps) {
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [newVoiceName, setNewVoiceName] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStep, setRecordingStep] = useState(1);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingMethod, setRecordingMethod] = useState<"record" | "upload">("record");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isLivePlayback, setIsLivePlayback] = useState(false);
  const [microphoneVolume, setMicrophoneVolume] = useState<number[]>([]);
  
  // References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  
  // Sample texts for voice recording
  const sampleTexts = [
    "The quick brown fox jumps over the lazy dog. Hello, this is my voice for bedtime stories.",
    "Once upon a time, in a land far away, there lived a brave little girl who loved adventures.",
    "Stars twinkle brightly in the night sky, guiding dreamers through magical journeys.",
    "The gentle ocean waves dance along the sandy shore, whispering stories of distant lands."
  ];
  const [selectedSampleText, setSelectedSampleText] = useState(0);
  
  // Fetch voice profiles on component mount
  useEffect(() => {
    async function fetchVoiceProfiles() {
      try {
        const profiles = await getVoiceProfilesAction();
        setVoiceProfiles(profiles);
      } catch (error) {
        console.error("Error fetching voice profiles:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchVoiceProfiles();
    
    // Create audio context for volume meter
    if (typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      setAudioContext(new AudioContext());
    }
    
    // Create audio element for playback
    audioElement.current = new Audio();
    audioElement.current.addEventListener('ended', () => {
      setIsPlaying(false);
    });
    
    // Cleanup
    return () => {
      if (audioElement.current) {
        audioElement.current.pause();
        audioElement.current.src = '';
      }
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Maximum allowed voice profiles based on subscription tier
  const getMaxVoiceProfiles = () => {
    if (!isSubscriber) return 0;
    if (subscriptionTier === "premium") return 1;
    if (subscriptionTier === "family") return 3;
    return 0;
  };
  
  const maxVoiceProfiles = getMaxVoiceProfiles();
  const canAddMore = voiceProfiles.length < maxVoiceProfiles;
  
  const togglePlayVoice = (id: string) => {
    if (currentlyPlaying === id) {
      setCurrentlyPlaying(null);
      if (audioElement.current) {
        audioElement.current.pause();
      }
    } else {
      setCurrentlyPlaying(id);
      
      // In a real implementation, you'd load the audio file from the server
      // For now, we'll just use an empty audio to demonstrate the UI
      if (audioElement.current) {
        audioElement.current.src = '/path/to/sample.mp3';
        audioElement.current.play().catch(e => console.error("Error playing audio:", e));
      }
    }
  };
  
  const handleDeleteVoice = async (id: string) => {
    try {
      await deleteVoiceProfileAction(id);
      // Update the UI
      setVoiceProfiles(voiceProfiles.filter(profile => profile.id !== id));
    } catch (error) {
      console.error("Error deleting voice profile:", error);
      // Handle error
    }
  };
  
  const startRecording = async () => {
    if (!audioContext) return;
    
    try {
      // Reset previous recordings
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setAudioBlob(null);
      audioChunksRef.current = [];
      setRecordingTime(0);
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      
      // Set up analyzer for volume visualization
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;
      
      // Start volume visualization
      const updateVolume = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        
        const average = sum / bufferLength;
        setMicrophoneVolume(prev => [...prev.slice(-19), average]);
        
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      animationFrameRef.current = requestAnimationFrame(updateVolume);
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up recording handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Create audio blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        
        setAudioBlob(audioBlob);
        setAudioUrl(url);
        setIsRecording(false);
        
        // Stop the stream tracks
        stream.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
        
        // Cancel animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        // Move to review step
        setRecordingStep(2);
        
        // Create audio element to get duration
        const audio = new Audio(url);
        audio.addEventListener('loadedmetadata', () => {
          setAudioDuration(audio.duration);
        });
      };
      
      // Start recording
      mediaRecorder.start(100);
      setIsRecording(true);
      
      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };
  
  const stopRecording = () => {
    // Stop timer
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is audio
      if (!file.type.startsWith('audio/')) {
        alert('Please upload an audio file');
        return;
      }
      
      setUploadedFile(file);
      
      // Create URL for the file
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      
      // Create audio element to get duration
      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => {
        setAudioDuration(audio.duration);
        
        // Check if file is at least 30 seconds
        if (audio.duration < 30) {
          alert('Audio recording should be at least 30 seconds long for optimal voice cloning.');
        }
        
        // Move to review step
        setRecordingStep(2);
      });
    }
  };
  
  const togglePlayback = () => {
    if (!audioUrl || !audioElement.current) return;
    
    if (isPlaying) {
      audioElement.current.pause();
      setIsPlaying(false);
    } else {
      audioElement.current.src = audioUrl;
      audioElement.current.play().catch(e => console.error("Error playing audio:", e));
      setIsPlaying(true);
    }
  };
  
  const saveNewVoice = async () => {
    try {
      // In a real implementation, you would upload the audio file
      // and send it to the ElevenLabs API for voice cloning
      
      // For now, we'll just create a voice profile record
      const newVoice = await createVoiceProfileAction({
        name: newVoiceName || "New Voice"
      }) as VoiceProfile;
      
      // Update the UI
      setVoiceProfiles([...voiceProfiles, newVoice]);
      
      // Close the dialog and reset state
      setIsDialogOpen(false);
      resetRecordingState();
    } catch (error) {
      console.error("Error creating voice profile:", error);
      // Handle error
    }
  };
  
  const resetRecordingState = () => {
    // Clear audio resources
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    // Reset all state
    setNewVoiceName("");
    setRecordingStep(1);
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setUploadedFile(null);
    setRecordingMethod("record");
    setAudioDuration(0);
    setMicrophoneVolume([]);
    
    // Stop any active streams
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    
    // Cancel animation frames
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  
  const nextSampleText = () => {
    setSelectedSampleText((prev) => (prev + 1) % sampleTexts.length);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Voice Profiles</h3>
        <p className="text-gray-400">
          Manage voice profiles for story narration
        </p>
      </div>
      
      <Separator className="bg-gray-800" />
      
      {!isSubscriber ? (
        // Non-subscriber view
        <PremiumFeatureAlert 
          variant="banner" 
          featureName="Custom Voice Profiles"
          message="Upgrade to Premium to record your own voice for story narration. Your child will love hearing bedtime stories in your voice!"
        />
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-900/50 text-indigo-300 font-normal">
                {voiceProfiles.length} of {maxVoiceProfiles} Voice Profiles
              </Badge>
              
              {subscriptionTier === "premium" && (
                <Badge className="bg-gray-800 text-gray-300 font-normal">
                  Premium
                </Badge>
              )}
              
              {subscriptionTier === "family" && (
                <Badge className="bg-purple-900/50 text-purple-300 font-normal">
                  Family Plan
                </Badge>
              )}
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              if (!open) {
                resetRecordingState();
              }
              setIsDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={!canAddMore}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Voice Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Create Voice Profile</DialogTitle>
                  <DialogDescription>
                    {recordingStep === 1 ? (
                      <>Record or upload your voice for AI voice cloning</>
                    ) : (
                      <>Review your voice recording before saving</>
                    )}
                  </DialogDescription>
                </DialogHeader>
                
                {recordingStep === 1 ? (
                  <>
                    <div className="space-y-6 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="voice-name">Profile Name</Label>
                        <Input
                          id="voice-name"
                          placeholder="Mom, Dad, Grandpa..."
                          value={newVoiceName}
                          onChange={(e) => setNewVoiceName(e.target.value)}
                          className="bg-gray-800 border-gray-700"
                        />
                      </div>
                      
                      <Tabs defaultValue="record" onValueChange={(val) => setRecordingMethod(val as "record" | "upload")}>
                        <TabsList className="bg-gray-800 border border-gray-700">
                          <TabsTrigger value="record" className="data-[state=active]:bg-indigo-900/50">
                            <Mic className="h-4 w-4 mr-2" />
                            Record Voice
                          </TabsTrigger>
                          <TabsTrigger value="upload" className="data-[state=active]:bg-indigo-900/50">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Audio
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="record" className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Sample Text</Label>
                              <Button variant="ghost" size="sm" onClick={nextSampleText} className="text-gray-400 hover:text-white">
                                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                New Sample
                              </Button>
                            </div>
                            <div className="bg-gray-800 border border-gray-700 rounded-md p-4 text-gray-300">
                              {sampleTexts[selectedSampleText]}
                            </div>
                          </div>
                          
                          <Alert className="bg-gray-800 border-gray-700">
                            <Info className="h-4 w-4 text-indigo-400" />
                            <AlertDescription className="text-gray-300">
                              For optimal voice cloning quality, please record at least 30 seconds of clear audio in a quiet environment.
                            </AlertDescription>
                          </Alert>
                          
                          {isRecording && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                                  <span className="text-white font-medium">Recording</span>
                                </div>
                                <span className="text-white font-mono">{formatTime(recordingTime)}</span>
                              </div>
                              
                              <div className="bg-gray-800 border border-gray-700 rounded-md p-2 h-16 flex items-end justify-center">
                                {microphoneVolume.map((value, index) => (
                                  <div 
                                    key={index}
                                    className="w-1.5 bg-indigo-500 rounded-t mx-0.5 transition-all duration-75"
                                    style={{ height: `${Math.min(100, value / 2)}%` }}
                                  />
                                ))}
                              </div>
                              
                              {recordingTime >= 30 ? (
                                <Alert className="bg-green-900/20 border-green-800">
                                  <Check className="h-4 w-4 text-green-400" />
                                  <AlertDescription className="text-green-300">
                                    You've reached the recommended 30-second minimum for optimal voice cloning quality!
                                  </AlertDescription>
                                </Alert>
                              ) : (
                                <Progress 
                                  value={(recordingTime / 30) * 100} 
                                  className="h-2"
                                />
                              )}
                              
                              <div className="flex justify-center">
                                <Button 
                                  variant="destructive" 
                                  onClick={stopRecording}
                                  className="flex items-center"
                                >
                                  <StopCircle className="h-4 w-4 mr-2" />
                                  Stop Recording
                                </Button>
                              </div>
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="upload" className="space-y-4 pt-4">
                          <div className="space-y-4">
                            <Alert className="bg-gray-800 border-gray-700">
                              <Info className="h-4 w-4 text-indigo-400" />
                              <AlertDescription className="text-gray-300">
                                Upload an audio file of your voice. For best results, upload at least 30 seconds of clear speech without background noise.
                              </AlertDescription>
                            </Alert>
                            
                            <Label
                              htmlFor="voice-file"
                              className="cursor-pointer w-full"
                            >
                              <div className="flex flex-col items-center gap-4 p-6 border border-dashed border-gray-700 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                                <div className="rounded-full bg-indigo-900/30 p-4">
                                  <Upload className="h-8 w-8 text-indigo-400" />
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-medium text-white mb-1">
                                    {uploadedFile ? uploadedFile.name : "Click to upload audio"}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    WAV, MP3, or M4A • 30 seconds minimum recommended
                                  </p>
                                </div>
                              </div>
                              <input
                                id="voice-file"
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={handleFileUpload}
                              />
                            </Label>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                        className="border-gray-700"
                      >
                        Cancel
                      </Button>
                      {recordingMethod === "record" && !isRecording && (
                        <Button 
                          onClick={startRecording}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Mic className="h-4 w-4 mr-2" />
                          Start Recording
                        </Button>
                      )}
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <div className="space-y-6 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-green-500" />
                          <h3 className="text-white font-medium">Voice Recording Ready</h3>
                        </div>
                        <Badge className={audioUrl && audioDuration >= 30 ? "bg-green-900/50 text-green-400" : "bg-amber-900/50 text-amber-400"}>
                          {formatTime(audioDuration)} {audioUrl && audioDuration < 30 && "(below recommended)"}
                        </Badge>
                      </div>
                      
                      {audioUrl && audioDuration < 30 && (
                        <Alert className="bg-amber-900/20 border-amber-800 mb-4">
                          <AlertCircle className="h-4 w-4 text-amber-400" />
                          <AlertDescription className="text-amber-300">
                            Your recording is less than the recommended 30 seconds for optimal voice cloning. For best results, consider recording a longer sample.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-4 mb-4">
                          <Button
                            variant="outline"
                            size="icon"
                            className={`h-10 w-10 rounded-full ${
                              isPlaying 
                                ? "bg-indigo-900/50 text-indigo-400 border-indigo-700" 
                                : "border-gray-700"
                            }`}
                            onClick={togglePlayback}
                          >
                            {isPlaying ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5" />
                            )}
                          </Button>
                          
                          <div className="relative flex-grow">
                            <Progress 
                              value={isPlaying && audioElement.current ? (audioElement.current.currentTime / audioElement.current.duration) * 100 : 0} 
                              className="h-2"
                            />
                          </div>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-400 hover:text-gray-300"
                                  onClick={() => setIsLivePlayback(!isLivePlayback)}
                                >
                                  {isLivePlayback ? (
                                    <Volume2 className="h-4 w-4" />
                                  ) : (
                                    <VolumeX className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{isLivePlayback ? "Mute" : "Unmute"} live preview</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <p>Listen to your recording to ensure it's clear and has minimal background noise.</p>
                        </div>
                      </div>
                      
                      <div className="bg-indigo-900/20 border border-indigo-800/50 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                          <Info className="h-4 w-4 text-indigo-400" />
                          ElevenLabs Voice Cloning Quality Tips
                        </h4>
                        <ul className="text-sm text-gray-300 space-y-1 list-disc pl-5">
                          <li>Clear speech with consistent tone and pace works best</li>
                          <li>Avoid background noise, echoes, or music</li>
                          <li>30-60 seconds of audio is good, 1-2 minutes is excellent</li>
                          <li>Reading story passages produces better results than casual conversation</li>
                          <li>Using higher quality microphones improves voice cloning accuracy</li>
                        </ul>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setRecordingStep(1)}
                        className="border-gray-700"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Record Again
                      </Button>
                      <Button 
                        onClick={saveNewVoice}
                        className="bg-indigo-600 hover:bg-indigo-700"
                        disabled={!audioUrl}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Save Voice Profile
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
          
          {!canAddMore && (
            <Alert className="mb-6 bg-amber-900/20 border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-300">
                {subscriptionTier === "premium" ? (
                  <>
                    You've reached the maximum of {maxVoiceProfiles} voice profiles on your Premium plan.
                    <Button variant="link" className="text-amber-400 h-auto p-0 ml-1">
                      Upgrade to Family
                    </Button>
                    for up to 10 voice profiles.
                  </>
                ) : (
                  <>
                    You've reached the maximum of {maxVoiceProfiles} voice profiles on your Family plan.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i} className="bg-gray-900/70 border-gray-800/70 animate-pulse">
                  <div className="h-[208px]"></div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {voiceProfiles.map((profile) => (
                <Card key={profile.id} className="bg-gray-900 border-gray-800">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 bg-indigo-900/50 text-indigo-400">
                          <AvatarFallback>
                            {profile.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-white text-lg">{profile.name}</CardTitle>
                          <CardDescription>
                            Created {formatDate(profile.created_at)}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                        onClick={() => handleDeleteVoice(profile.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                      <span>Last used {formatDate(profile.last_used_at)}</span>
                      <span>{Math.floor((profile.duration || 0) / 60)}:{((profile.duration || 0) % 60).toString().padStart(2, '0')}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className={`h-8 w-8 ${
                          currentlyPlaying === profile.id 
                            ? "bg-indigo-900/20 text-indigo-400 border-indigo-800" 
                            : "border-gray-700"
                        }`}
                        onClick={() => togglePlayVoice(profile.id)}
                      >
                        {currentlyPlaying === profile.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Progress 
                        value={currentlyPlaying === profile.id ? 45 : 0} 
                        className="h-1.5 flex-grow"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 ml-auto"
                      onClick={() => {
                        setNewVoiceName(profile.name);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                      Update Voice
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              
              {/* Empty slots for premium subscribers */}
              {isSubscriber && voiceProfiles.length < maxVoiceProfiles && (
                Array.from({ length: maxVoiceProfiles - voiceProfiles.length }).map((_, i) => (
                  <Card key={`empty-${i}`} className="bg-gray-900/50 border border-dashed border-gray-800">
                    <CardContent className="flex flex-col items-center justify-center h-[208px] text-center">
                      <div className="bg-gray-800/70 rounded-full p-3 mb-3">
                        <Mic className="h-5 w-5 text-gray-400" />
                      </div>
                      <h4 className="text-gray-300 font-medium mb-1">Add Voice Profile</h4>
                      <p className="text-sm text-gray-500 mb-4 max-w-[200px]">
                        Record your voice for story narration
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-700"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Record Voice
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}
      
      {/* About ElevenLabs API */}
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-4">
          <Badge className="bg-blue-900/50 text-blue-300 capitalize">Powered by ElevenLabs</Badge>
          <h4 className="text-white font-medium">Advanced Voice Cloning Technology</h4>
        </div>
        
        <Card className="bg-gray-900/50 border border-gray-800">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h5 className="text-indigo-400 font-medium">High-Quality Voice Cloning</h5>
                <p className="text-sm text-gray-300">Our voice profiles use ElevenLabs' advanced AI technology to create natural-sounding voice clones that capture the unique qualities of your voice.</p>
              </div>
              
              <div className="space-y-2">
                <h5 className="text-indigo-400 font-medium">Personalized Story Narration</h5>
                <p className="text-sm text-gray-300">Create bedtime stories narrated in your own voice, even when you can't be there in person. Children love hearing familiar voices.</p>
              </div>
              
              <div className="space-y-2">
                <h5 className="text-indigo-400 font-medium">Privacy & Security</h5>
                <p className="text-sm text-gray-300">Your voice recordings are securely processed. Voice profiles are only accessible to your account and are never shared with other users.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}