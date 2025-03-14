"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, User, Volume2 } from "lucide-react";
// import { ElevenLabsVoiceSelector } from "./elevenlabs-voice-selector"; // Import our new component
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { StoryFormData } from "@/app/dashboard/create/page";
import { ElevenLabsVoiceSelector } from "./elevenlabs-voice-selector";

interface VoiceSelectionStepProps {
  formData: StoryFormData;
  updateFormData: (field: keyof StoryFormData, value: any) => void;
  errors: { [key: string]: string };
  isSubscriber: boolean;
}

export function VoiceSelectionStep({ 
  formData, 
  updateFormData, 
  errors,
  isSubscriber 
}: VoiceSelectionStepProps) {
  const [activeTab, setActiveTab] = useState("ai-voices");
  const { openModal } = useUpgradeModal();

  const [voices, setVoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchVoices() {
      try {
        console.log("Directly fetching voices from VoiceSelectionStep");
        const response = await fetch('/api/voices');
        const data = await response.json();
        console.log("API response:", data);
        
        if (data.success && data.voices) {
          setVoices(data.voices);
        }
      } catch (err) {
        console.error("Error fetching voices:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchVoices();
  }, []);
  
  const handleVoiceChange = (voiceId: string) => {
    // Update form data with the selected voice ID
    updateFormData("voice", voiceId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Choose a Voice</h3>
        <p className="text-gray-400">
          Select the voice that will narrate your story
        </p>
      </div>
      
      <Tabs 
        defaultValue="ai-voices" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="ai-voices" className="flex items-center gap-1.5">
            <Volume2 className="h-4 w-4" />
            <span>AI Voices</span>
          </TabsTrigger>
          <TabsTrigger 
            value="custom-voices" 
            disabled={!isSubscriber}
            className="flex items-center gap-1.5"
          >
            <User className="h-4 w-4" />
            <span>Custom Voices</span>
            {!isSubscriber && <Badge className="ml-1 bg-amber-800 text-amber-200 text-xs">Premium</Badge>}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ai-voices" className="mt-0">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-indigo-400" />
                Professional Narrator Voices
              </CardTitle>
            </CardHeader>
            <Separator className="bg-gray-800" />
            <CardContent className="pt-4">
              {/* Make sure props are passed correctly */}
              <ElevenLabsVoiceSelector
                selectedVoice={formData.voice}
                onVoiceChange={handleVoiceChange}
                error={errors.voice}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="custom-voices" className="mt-0">
          {!isSubscriber ? (
            <Card className="bg-gray-900 border-gray-800 p-6 text-center">
              <h4 className="font-medium text-white mb-4">Unlock Custom Voices</h4>
              <p className="text-gray-400 mb-4">
                With a Premium subscription, you can upload your own voice recordings to narrate stories in your voice or a family member's voice.
              </p>
              <Button 
                onClick={() => openModal("Custom Voice Profiles")}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Upgrade to Premium
              </Button>
            </Card>
          ) : (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4 text-indigo-400" />
                  Your Voice Profiles
                </CardTitle>
              </CardHeader>
              <Separator className="bg-gray-800" />
              <CardContent className="pt-4">
                <div className="text-center p-6">
                  <p className="text-gray-400 mb-4">
                    You haven't created any custom voice profiles yet.
                  </p>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    Create Voice Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}