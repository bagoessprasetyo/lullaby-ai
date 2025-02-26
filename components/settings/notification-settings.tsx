"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Bell, MessageCircle, Mail, Gift, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [newStoryNotifications, setNewStoryNotifications] = useState(true);
  const [promotionalNotifications, setPromotionalNotifications] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState("weekly");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSuccessMessage("Notification preferences saved successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Notifications</h2>
        <p className="text-gray-400">
          Manage how and when you receive notifications
        </p>
      </div>
      
      <Separator className="bg-gray-800" />
      
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-400" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  Email Notifications
                </Label>
                <p className="text-xs text-gray-500">
                  Receive notifications via email
                </p>
              </div>
              <Switch 
                id="email-notifications" 
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-gray-400" />
                  Push Notifications
                </Label>
                <p className="text-xs text-gray-500">
                  Receive notifications on your device
                </p>
              </div>
              <Switch 
                id="push-notifications" 
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-indigo-400" />
            Notification Types
          </CardTitle>
          <CardDescription>
            Control what types of notifications you receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="story-notifications">New Story Reminders</Label>
                <p className="text-xs text-gray-500">
                  Remind you to create new bedtime stories
                </p>
              </div>
              <Switch 
                id="story-notifications" 
                checked={newStoryNotifications}
                onCheckedChange={setNewStoryNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="promotional-notifications" className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-gray-400" />
                  Promotional Content
                </Label>
                <p className="text-xs text-gray-500">
                  Receive updates about new features and offers
                </p>
              </div>
              <Switch 
                id="promotional-notifications" 
                checked={promotionalNotifications}
                onCheckedChange={setPromotionalNotifications}
              />
            </div>
            
            {newStoryNotifications && (
              <div className="space-y-3 pt-4 border-t border-gray-800">
                <Label>Reminder Frequency</Label>
                <RadioGroup 
                  defaultValue={reminderFrequency} 
                  onValueChange={setReminderFrequency}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="daily" id="daily" />
                    <Label htmlFor="daily">Daily</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weekly" id="weekly" />
                    <Label htmlFor="weekly">Weekly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly">Monthly</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
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
          <Button 
            variant="outline" 
            className="border-gray-700"
            onClick={() => {
              setEmailNotifications(true);
              setPushNotifications(true);
              setNewStoryNotifications(true);
              setPromotionalNotifications(false);
              setReminderFrequency("weekly");
            }}
          >
            Reset to Defaults
          </Button>
          <Button 
            onClick={handleSaveNotifications}
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