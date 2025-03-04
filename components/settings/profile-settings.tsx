"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Trash2, Check } from "lucide-react";
import { updateProfileSettingsAction } from "@/app/actions/settings-actions";

interface ProfileSettingsProps {
  user: any;
  profile: any;
}

export function ProfileSettings({ user, profile }: ProfileSettingsProps) {
  const [name, setName] = useState(profile?.name || user?.name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [isSaving, setIsSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.image || profile?.avatar_url || null);
  const [successMessage, setSuccessMessage] = useState("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    
    try {
      // Call server action to update profile
      await updateProfileSettingsAction({
        name,
        bio
      });
      
      // Show success message
      setSuccessMessage("Profile updated successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      // Here you could add error handling
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Rest of component remains the same */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Profile</h2>
        <p className="text-gray-400">
          Manage your profile information
        </p>
      </div>
      
      <Separator className="bg-gray-800 " />
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>
              This will be displayed on your profile and in stories you create
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-gray-800">
                  {photoPreview ? (
                    <AvatarImage src={photoPreview} alt="Profile" />
                  ) : (
                    <AvatarFallback className="text-2xl bg-indigo-900 text-indigo-200">
                      {name ? name.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                {photoPreview && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    onClick={handleRemovePhoto}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="flex flex-col items-center gap-2 w-full">
                <Label
                  htmlFor="profile-picture"
                  className="cursor-pointer w-full"
                >
                  <div className="flex items-center justify-center gap-2 p-2 border border-dashed border-gray-700 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                    <Upload className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Upload new photo</span>
                  </div>
                  <input
                    id="profile-picture"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </Label>
                <p className="text-xs text-gray-500">
                  JPG, PNG or GIF. Maximum size of 2MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a little about yourself, so we can personalize your experience."
                  className="flex min-h-[100px] w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-gray-500">
                  {bio.length}/160 characters
                </p>
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
            Cancel
          </Button>
          <Button 
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}