// components/story-creation/voice-recorder.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Mic, 
  StopCircle, 
  Play, 
  Pause, 
  Save, 
  Trash, 
  AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";

interface VoiceRecorderProps {
  onSave: (voiceData: { name: string; audioFile: Blob; }) => void;
  isSubscriber: boolean;
}

export function VoiceRecorder({ onSave, isSubscriber }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [step, setStep] = useState<'record' | 'review' | 'save'>('record');
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // The sample phrases
  const samplePhrases = [
    "Once upon a time in a magical forest...",
    "The stars twinkled brightly in the night sky.",
    "The little rabbit hopped through the meadow.",
    "Can you imagine a world filled with wonder?",
    "Let me tell you about an amazing adventure."
  ];
  
  const [currentPhrase, setCurrentPhrase] = useState(0);
  
  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);
  
  // Start recording
  const startRecording = async () => {
    setError(null);
    try {
      // Reset state for a new recording
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
        setAudioURL(null);
      }
      audioChunksRef.current = [];
      setRecordingTime(0);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // Create audio element for playback
        if (audioRef.current) {
          audioRef.current.src = url;
        }
        
        // Move to the review step
        setStep('review');
        
        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // Stop all tracks on the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start(100);
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check your permissions.');
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };
  
  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      // Pause timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };
  
  // Cancel recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Get the stream and stop all tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
    
    // Reset state
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
      setAudioURL(null);
    }
    
    // Back to record step
    setStep('record');
  };
  
  // Toggle playback
  const togglePlayback = () => {
    if (!audioRef.current || !audioURL) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      
      // Update isPlaying when audio ends
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
  };
  
  // Validate and save
  const handleSave = () => {
    setError(null);
    
    // Validate
    if (!profileName.trim()) {
      setError('Please enter a name for your voice profile');
      return;
    }
    
    if (!audioURL) {
      setError('No recording found. Please record your voice first.');
      return;
    }
    
    // Create file from Blob
    fetch(audioURL)
      .then(res => res.blob())
      .then(blob => {
        // Save the voice profile
        onSave({
          name: profileName,
          audioFile: blob
        });
        
        // Reset state
        setProfileName("");
        if (audioURL) {
          URL.revokeObjectURL(audioURL);
          setAudioURL(null);
        }
        setStep('record');
        setIsOpen(false);
      })
      .catch(err => {
        console.error('Error fetching recording blob:', err);
        setError('Failed to save recording. Please try again.');
      });
  };
  
  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Cycle through sample phrases
  const nextSamplePhrase = () => {
    setCurrentPhrase((currentPhrase + 1) % samplePhrases.length);
  };
  
  // Only premium users can access this feature
  if (!isSubscriber) {
    return null;
  }
  
  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button 
          className="bg-indigo-900/30 text-indigo-300 border-indigo-800 hover:bg-indigo-900/50"
          variant="outline"
        >
          <Mic className="h-4 w-4 mr-2" />
          Record New Voice
        </Button>
      </DrawerTrigger>
      <DrawerContent className="bg-gray-900 border-gray-800 text-white">
        <DrawerHeader>
          <DrawerTitle className="text-lg font-medium">Create Voice Profile</DrawerTitle>
          <DrawerDescription className="text-gray-400">
            Record your voice reading a few phrases to create a custom voice profile.
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="px-4 py-2">
          {/* Hidden audio element for playback */}
          <audio ref={audioRef} className="hidden" />
          
          {/* Error message */}
          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-800">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Recording Step */}
          {step === 'record' && (
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Read Sample Phrases</CardTitle>
                  <CardDescription className="text-gray-400 text-sm">
                    For best results, read each phrase clearly at your normal storytelling pace.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-indigo-900/20 p-4 rounded-md border border-indigo-800/50">
                    <p className="text-indigo-200 italic text-lg font-serif">
                      "{samplePhrases[currentPhrase]}"
                    </p>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={nextSamplePhrase}
                    className="w-full justify-between border border-gray-700"
                    disabled={isRecording}
                  >
                    See next phrase
                    <span className="text-xs text-gray-500">
                      {currentPhrase + 1}/{samplePhrases.length}
                    </span>
                  </Button>
                </CardContent>
              </Card>
              
              <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    isRecording ? "bg-red-600/20 text-red-500 animate-pulse" : "bg-gray-700 text-gray-400"
                  )}>
                    <Mic className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {isRecording ? "Recording in progress..." : "Ready to record"}
                    </span>
                    {isRecording && (
                      <span className="text-xs text-gray-400">
                        {formatTime(recordingTime)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  {!isRecording ? (
                    <Button 
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={startRecording}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      {isPaused ? (
                        <Button 
                          variant="outline" 
                          className="border-amber-700 text-amber-400"
                          onClick={resumeRecording}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="border-amber-700 text-amber-400"
                          onClick={pauseRecording}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                      )}
                      <Button 
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={stopRecording}
                      >
                        <StopCircle className="h-4 w-4 mr-2" />
                        Stop
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-gray-400 space-y-1.5">
                <p>📝 Recording tips:</p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-gray-500">
                  <li>Use a quiet environment with minimal background noise</li>
                  <li>Speak clearly at your normal storytelling pace</li>
                  <li>Try to maintain a consistent tone throughout</li>
                  <li>Record at least 30 seconds of audio for best results</li>
                </ul>
              </div>
            </div>
          )}
          
          {/* Review Step */}
          {step === 'review' && audioURL && (
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Review Your Recording</CardTitle>
                  <CardDescription className="text-gray-400 text-sm">
                    Listen to your recording and decide if you want to keep it or try again.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                          "rounded-full h-10 w-10 border-gray-600",
                          isPlaying ? "bg-indigo-900/30 text-indigo-300 border-indigo-700" : "text-gray-300"
                        )}
                        onClick={togglePlayback}
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>
                      <div>
                        <div className="text-sm font-medium">Voice Recording</div>
                        <div className="text-xs text-gray-400">Duration: {formatTime(recordingTime)}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {format(new Date(), 'MMM d, yyyy')}
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-2">
                      <label htmlFor="profile-name" className="text-sm text-gray-300 block mb-1">
                        Name your voice profile
                      </label>
                      <Input 
                        id="profile-name"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                        placeholder="e.g., Mom's Bedtime Voice"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <Button 
                    variant="outline" 
                    className="border-gray-700 text-gray-300"
                    onClick={cancelRecording}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Discard & Try Again
                  </Button>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleSave}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Voice Profile
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
        
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline" className="border-gray-700">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}