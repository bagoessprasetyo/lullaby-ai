"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { AccountSettings } from "@/components/settings/account-settings";
import { PreferenceSettings } from "@/components/settings/preference-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { StorageSettings } from "@/components/settings/storage-settings";
import { VoiceProfilesSettings } from "@/components/settings/voice-profiles-settings";
import { User, KeyRound, Settings2, BellRing, HardDrive, Mic } from "lucide-react";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSubscriber, setIsSubscriber] = useState(true); // Mock subscription status
  const [subscriptionTier, setSubscriptionTier] = useState("premium"); // "premium" or "family"

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar />
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">
            Manage your account preferences and settings
          </p>
        </div>

        <Tabs
          defaultValue="profile"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-gray-900/70 border border-gray-800 p-1 w-full flex overflow-x-auto">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="account" 
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <KeyRound className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
            <TabsTrigger 
              value="voice-profiles" 
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <Mic className="h-4 w-4 mr-2" />
              Voice Profiles
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <BellRing className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="storage" 
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <HardDrive className="h-4 w-4 mr-2" />
              Storage
            </TabsTrigger>
          </TabsList>

          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <TabsContent value="profile" className="space-y-6">
              <ProfileSettings user={session?.user} />
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <AccountSettings user={session?.user} />
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <PreferenceSettings />
            </TabsContent>
            
            <TabsContent value="voice-profiles" className="space-y-6">
              <VoiceProfilesSettings 
                isSubscriber={isSubscriber} 
                subscriptionTier={subscriptionTier}
              />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <NotificationSettings />
            </TabsContent>

            <TabsContent value="storage" className="space-y-6">
              <StorageSettings />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}