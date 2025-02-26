"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, AlertTriangle, Mail, ShieldAlert, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface AccountSettingsProps {
  user: any;
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const [email, setEmail] = useState(user?.email || "");
  const [newEmail, setNewEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveEmail = async () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSuccessMessage("Verification email sent successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    }, 1500);
  };

  const handleCancelEmailChange = () => {
    setIsChangingEmail(false);
    setNewEmail("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Account</h2>
        <p className="text-gray-400">
          Manage your account settings and security
        </p>
      </div>
      
      <Separator className="bg-gray-800" />
      
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-indigo-400" />
                Email Address
              </CardTitle>
              <CardDescription>
                Your email address is associated with your Google account
              </CardDescription>
            </div>
            <Badge className="bg-indigo-900 text-indigo-200 hover:bg-indigo-900 hover:text-indigo-100">
              Google Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isChangingEmail ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-email">Current Email</Label>
                  <Input
                    id="current-email"
                    value={email}
                    disabled
                    className="bg-gray-800 border-gray-700 opacity-70"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-email">New Email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter your new email address"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                
                <Alert className="bg-amber-900/20 border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertTitle className="text-amber-500">Caution</AlertTitle>
                  <AlertDescription className="text-amber-300/80">
                    Changing your email address will require verification from both addresses
                    and may affect your Google sign-in method.
                  </AlertDescription>
                </Alert>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelEmailChange}
                    className="border-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveEmail}
                    disabled={isSaving || !newEmail}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isSaving ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending Verification...
                      </>
                    ) : "Send Verification"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">{email}</p>
                    <p className="text-xs text-gray-500">
                      This is the email you use to sign in
                    </p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setIsChangingEmail(true)}
                    className="border-gray-700"
                  >
                    Change Email
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-400" />
            Sign-in Method
          </CardTitle>
          <CardDescription>
            Manage the ways you can sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-800 bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Google</p>
                  <p className="text-xs text-gray-500">
                    Sign in with your Google account
                  </p>
                </div>
              </div>
              <Badge className="bg-green-900/60 text-green-300 hover:bg-green-900/60">Connected</Badge>
            </div>
            
            <Alert className="bg-gray-800 border-gray-700">
              <ShieldAlert className="h-4 w-4 text-gray-400" />
              <AlertTitle className="text-white">Security Note</AlertTitle>
              <AlertDescription className="text-gray-400">
                Your account is secured with Google authentication. No password is stored.
              </AlertDescription>
            </Alert>
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
      </div>
    </div>
  );
}