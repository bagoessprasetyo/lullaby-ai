"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Mic, 
  User,
  Play, 
  Pause, 
  VolumeX, 
  Check, 
  Plus, 
  Trash2, 
  Edit2, 
  Lock, 
  AlertCircle 
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

// Mock voice profiles for demo purposes
const initialVoiceProfiles = [
  { 
    id: 'voice-1', 
    name: 'Mom', 
    createdAt: new Date('2023-10-15'), 
    lastUsed: new Date('2023-11-20'),
    duration: 37, // seconds
    audioUrl: '/voice-samples/mom.mp3'
  },
  { 
    id: 'voice-2', 
    name: 'Dad', 
    createdAt: new Date('2023-09-05'), 
    lastUsed: new Date('2023-11-15'),
    duration: 42, // seconds
    audioUrl: '/voice-samples/dad.mp3'
  }
];

export function VoiceProfilesSettings({ isSubscriber = true, subscriptionTier = "premium" }) {
  const [voiceProfiles, setVoiceProfiles] = useState(initialVoiceProfiles);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [newVoiceName, setNewVoiceName] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStep, setRecordingStep] = useState(1);
  const [sampleText, setSampleText] = useState("The quick brown fox jumps over the lazy dog. Hello, this is my voice for bedtime stories.");
  
  // Maximum allowed voice profiles based on subscription tier
  const getMaxVoiceProfiles = () => {
    if (!isSubscriber) return 0;
    if (subscriptionTier === "premium") return 3;
    if (subscriptionTier === "family") return 10;
    return 0;
  };
  
  const maxVoiceProfiles = getMaxVoiceProfiles();
  const canAddMore = voiceProfiles.length < maxVoiceProfiles;
  
  const togglePlayVoice = (id: string) => {
    if (currentlyPlaying === id) {
      setCurrentlyPlaying(null);
      // Stop playback
    } else {
      setCurrentlyPlaying(id);
      // Start playback
    }
  };
  
  const handleDeleteVoice = (id: string) => {
    setVoiceProfiles(voiceProfiles.filter(profile => profile.id !== id));
  };
  
  const startRecording = () => {
    setIsRecording(true);
    // In a real implementation, would start audio recording here
    setTimeout(() => {
      setIsRecording(false);
      setRecordingStep(2);
    }, 3000);
  };
  
  const saveNewVoice = () => {
    // In a real app, would save the recording to the server
    const newVoice = {
      id: `voice-${Date.now()}`,
      name: newVoiceName || "New Voice",
      createdAt: new Date(),
      lastUsed: new Date(),
      duration: 40, // seconds
      audioUrl: '/voice-samples/new.mp3'
    };
    
    setVoiceProfiles([...voiceProfiles, newVoice]);
    setIsDialogOpen(false);
    setNewVoiceName("");
    setRecordingStep(1);
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
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
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 text-center">
          <div className="bg-amber-900/20 rounded-full p-3 inline-flex mb-4">
            <Lock className="h-7 w-7 text-amber-400" />
          </div>
          <h4 className="text-lg font-medium text-white mb-2">
            Custom Voice Profiles are a Premium Feature
          </h4>
          <p className="text-gray-400 mb-4 max-w-md mx-auto">
            Upgrade to Premium to record your own voice for story narration.
            Your child will love hearing bedtime stories in your voice!
          </p>
          <Button className="bg-amber-600 hover:bg-amber-700">
            Upgrade to Premium
          </Button>
        </div>
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
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={!canAddMore}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Voice Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-white">Create Voice Profile</DialogTitle>
                  <DialogDescription>
                    Record a sample of your voice for story narration
                  </DialogDescription>
                </DialogHeader>
                
                {recordingStep === 1 ? (
                  <>
                    <div className="space-y-4 py-4">
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
                      
                      <div className="space-y-2">
                        <Label>Sample Text</Label>
                        <div className="bg-gray-800 border border-gray-700 rounded-md p-3 text-gray-300">
                          {sampleText}
                        </div>
                      </div>
                      
                      <Alert className="bg-gray-800 border-gray-700">
                        <Mic className="h-4 w-4 text-gray-400" />
                        <AlertDescription className="text-gray-300">
                          Read the sample text aloud when recording. Make sure you're in a quiet environment.
                        </AlertDescription>
                      </Alert>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                        className="border-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={startRecording}
                        className={`${isRecording ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
                      >
                        {isRecording ? (
                          <>
                            <div className="h-2 w-2 rounded-full bg-white mr-2 animate-pulse" />
                            Recording...
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4 mr-2" />
                            Start Recording
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <div className="space-y-4 py-4">
                      <div className="flex items-center justify-center mb-2">
                        <div className="bg-green-900/30 rounded-full p-3">
                          <Check className="h-6 w-6 text-green-400" />
                        </div>
                      </div>
                      <h3 className="text-center text-white font-medium">Voice Recorded Successfully</h3>
                      <p className="text-center text-sm text-gray-400">
                        Your voice profile is ready to use for story narration
                      </p>
                      
                      <div className="flex justify-center mt-4">
                        <Button 
                          variant="outline"
                          className="border-gray-700 flex items-center gap-2"
                        >
                          <Play className="h-4 w-4" />
                          Preview Voice
                        </Button>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setRecordingStep(1)}
                        className="border-gray-700"
                      >
                        Re-record
                      </Button>
                      <Button 
                        onClick={saveNewVoice}
                        className="bg-indigo-600 hover:bg-indigo-700"
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
                          Created {formatDate(profile.createdAt)}
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
                    <span>Last used {formatDate(profile.lastUsed)}</span>
                    <span>{Math.floor(profile.duration / 60)}:{(profile.duration % 60).toString().padStart(2, '0')}</span>
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
        </>
      )}
      
      {/* Tips for premium users */}
      {isSubscriber && (
        <div className="bg-gray-800/50 rounded-lg p-4 mt-6">
          <h4 className="font-medium text-gray-300 mb-2">Voice Recording Tips:</h4>
          <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm">
            <li>Record in a quiet environment with minimal background noise</li>
            <li>Speak clearly and at a consistent pace</li>
            <li>Use a warm, engaging tone for bedtime stories</li>
            <li>Position your microphone about 6-12 inches from your mouth</li>
            <li>Test your recording before saving to ensure good quality</li>
          </ul>
        </div>
      )}
    </div>
  );
}