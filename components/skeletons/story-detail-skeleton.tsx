"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export function StoryDetailSkeleton() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <Button
        variant="ghost"
        className="mb-6"
        disabled
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Library
      </Button>
      
      {/* Story Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="h-10 w-80 mb-2" />
            <Skeleton className="h-5 w-40" />
          </div>
          
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
        </div>
        
        {/* Tags and metadata */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
      </div>
      
      {/* Main content area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Story image placeholder */}
        <div className="md:col-span-1">
          <Card className="bg-gray-900 border-gray-800 overflow-hidden">
            <div className="aspect-square relative">
              <Skeleton className="w-full h-full" />
            </div>
            
            {/* Thumbnail navigator */}
            <CardFooter className="flex justify-center p-4 gap-2">
              {[1, 2, 3].map((_, index) => (
                <Skeleton key={index} className="w-3 h-3 rounded-full" />
              ))}
            </CardFooter>
          </Card>
        </div>
        
        {/* Story text */}
        <div className="md:col-span-2">
          <Card className="bg-gray-900 border-gray-800 h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Skeleton className="h-6 w-24 mr-2" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Audio player */}
      <Card className="bg-gray-900 border-gray-800 mb-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Progress bar */}
            <Skeleton className="w-full h-2 rounded-full" />
            
            {/* Time display and controls */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-md" />
              </div>
              
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Character information */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((_, index) => (
              <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}