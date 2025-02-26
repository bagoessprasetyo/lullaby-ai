"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, LanguagesIcon, Ear, Monitor, Moon, Sun, Sparkles } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PreferenceSettings() {
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState("english");
  const [voiceGender, setVoiceGender] = useState("female");
  const [voiceSpeed, setVoiceSpeed] = useState("normal");
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [visualEffects, setVisualEffects] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSavePreferences = async () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSuccessMessage("Preferences saved successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Preferences</h2>
        <p className="text-gray-400">
          Customize your experience with Lullaby.ai
        </p>
      </div>
      
      <Separator className="bg-gray-800" />
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-indigo-400" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how Lullaby.ai looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <RadioGroup 
                defaultValue={theme} 
                onValueChange={setTheme}
                className="grid grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem 
                    value="light" 
                    id="theme-light" 
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="theme-light"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-gray-800 bg-gray-800/50 p-4 hover:bg-gray-800 hover:text-white peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:text-indigo-300 cursor-pointer transition-all"
                  >
                    <Sun className="mb-3 h-6 w-6" />
                    Light
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem 
                    value="dark" 
                    id="theme-dark" 
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="theme-dark"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-gray-800 bg-gray-800/50 p-4 hover:bg-gray-800 hover:text-white peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:text-indigo-300 cursor-pointer transition-all"
                  >
                    <Moon className="mb-3 h-6 w-6" />
                    Dark
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem 
                    value="system" 
                    id="theme-system" 
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="theme-system"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-gray-800 bg-gray-800/50 p-4 hover:bg-gray-800 hover:text-white peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:text-indigo-300 cursor-pointer transition-all"
                  >
                    <Monitor className="mb-3 h-6 w-6" />
                    System
                  </Label>
                </div>
              </RadioGroup>
              
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="visual-effects">Visual Effects</Label>
                    <p className="text-xs text-gray-500">
                      Enable animations and visual effects
                    </p>
                  </div>
                  <Switch 
                    id="visual-effects" 
                    checked={visualEffects}
                    onCheckedChange={setVisualEffects}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LanguagesIcon className="h-5 w-5 text-indigo-400" />
              Language & Voice
            </CardTitle>
            <CardDescription>
              Customize language and voice preferences for story generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="language">Default Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language" className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="japanese">Japanese</SelectItem>
                    <SelectItem value="indonesian">Indonesian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Voice Type</Label>
                <RadioGroup 
                  defaultValue={voiceGender} 
                  onValueChange={setVoiceGender}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem 
                      value="female" 
                      id="voice-female" 
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="voice-female"
                      className="flex items-center justify-center gap-2 rounded-md border-2 border-gray-800 bg-gray-800/50 p-3 hover:bg-gray-800 hover:text-white peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:text-indigo-300 cursor-pointer transition-all"
                    >
                      Female Voice
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem 
                      value="male" 
                      id="voice-male" 
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="voice-male"
                      className="flex items-center justify-center gap-2 rounded-md border-2 border-gray-800 bg-gray-800/50 p-3 hover:bg-gray-800 hover:text-white peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:text-indigo-300 cursor-pointer transition-all"
                    >
                      Male Voice
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="voice-speed">Voice Speed</Label>
                <Select value={voiceSpeed} onValueChange={setVoiceSpeed}>
                  <SelectTrigger id="voice-speed" className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select speed" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="slow">Slow</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="fast">Fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="music-enabled">Background Music</Label>
                  <p className="text-xs text-gray-500">
                    Play music during story narration
                  </p>
                </div>
                <Switch 
                  id="music-enabled" 
                  checked={musicEnabled}
                  onCheckedChange={setMusicEnabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex items-center justify-between">
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-green-500"
          >
            <Check className="h-4 w-4" />
            <span>{successMessage}</span>
          </motion.div>
        )}
        
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" className="border-gray-700">
            Reset to Defaults
          </Button>
          <Button 
            onClick={handleSavePreferences}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : "Save Preferences"}
          </Button>
        </div>
      </div>
    </div>
  );
}