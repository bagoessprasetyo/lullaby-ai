"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDrive, Image, Music, FileAudio, AlertCircle, Check, Download, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { clearStorageCacheAction } from "@/app/actions/settings-actions";

export function StorageSettings() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Mock data
  const storageUsed = 128; // MB
  const storageLimit = 500; // MB
  const storagePercentage = (storageUsed / storageLimit) * 100;
  
  const storageBreakdown = [
    { type: "Images", icon: <Image className="h-4 w-4 text-blue-400" />, size: 85, unit: "MB", count: 46 },
    { type: "Audio", icon: <FileAudio className="h-4 w-4 text-green-400" />, size: 32, unit: "MB", count: 24 },
    { type: "Background Music", icon: <Music className="h-4 w-4 text-purple-400" />, size: 11, unit: "MB", count: 8 }
  ];
  
  const handleDeleteCache = async () => {
    setIsDeleting(true);
    
    try {
      // Call server action to clear cache
      await clearStorageCacheAction();
      
      // Show success message
      setSuccessMessage("Cache cleared successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error clearing cache:", error);
      // Handle errors here
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handlePurgeData = async () => {
    setIsPurging(true);
    
    // Simulate API call - in real implementation, would call a server action
    setTimeout(() => {
      setIsPurging(false);
      setSuccessMessage("All data purged successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    }, 2000);
  };

  // Rest of component remains the same
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Storage</h2>
        <p className="text-gray-400">
          Manage your storage space and downloads
        </p>
      </div>
      
      <Separator className="bg-gray-800" />
      
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-indigo-400" />
                Storage Usage
              </CardTitle>
              <CardDescription>
                Your current storage usage
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{storageUsed} MB of {storageLimit} MB</span>
              <Badge 
                className={`${
                  storagePercentage < 50 
                    ? "bg-green-900/50 text-green-400" 
                    : storagePercentage < 80 
                    ? "bg-amber-900/50 text-amber-400" 
                    : "bg-red-900/50 text-red-400"
                }`}
              >
                {Math.round(storagePercentage)}% Used
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Progress value={storagePercentage} className="h-2" />
            
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storageBreakdown.map((item) => (
                  <TableRow key={item.type} className="border-gray-800 hover:bg-gray-800/50">
                    <TableCell className="font-medium flex items-center gap-2">
                      {item.icon}
                      {item.type}
                    </TableCell>
                    <TableCell>{item.count} files</TableCell>
                    <TableCell className="text-right">{item.size} {item.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                variant="outline" 
                className="border-gray-700 flex items-center gap-2"
                onClick={handleDeleteCache}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4 text-gray-400" />
                )}
                Clear Cache
              </Button>
              
              <Button 
                variant="outline" 
                className="border-gray-700 flex items-center gap-2"
              >
                <Download className="h-4 w-4 text-gray-400" />
                Download All Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-5 w-5 text-red-400" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Actions that cannot be undone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Alert className="bg-red-900/10 border-red-800">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertTitle className="text-red-400">Warning</AlertTitle>
              <AlertDescription className="text-red-300/80">
                Purging all data will permanently delete all your stories, images, and audio files.
                This action cannot be undone.
              </AlertDescription>
            </Alert>
            
            <Button 
              variant="destructive" 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handlePurgeData}
              disabled={isPurging}
            >
              {isPurging ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Purging...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Purge All Data
                </>
              )}
            </Button>
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