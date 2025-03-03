"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

export default function StoryDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Story detail error:", error);
  }, [error]);

  return (
    <div className="container max-w-md mx-auto px-4 py-16 text-center">
      <div className="mb-6 flex justify-center">
        <div className="bg-red-900/20 p-4 rounded-full">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-white mb-4">
        Unable to load story
      </h1>
      
      <p className="text-gray-400 mb-8">
        We encountered an error while trying to load this story. The story may have been deleted or you may not have permission to view it.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          variant="outline" 
          onClick={() => router.push("/dashboard/stories")}
        >
          Go to Library
        </Button>
        
        <Button onClick={() => reset()}>
          Try Again
        </Button>
      </div>
    </div>
  );
}