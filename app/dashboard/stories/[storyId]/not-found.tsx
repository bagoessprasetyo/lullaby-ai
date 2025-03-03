import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { DashboardNavbar } from "@/components/dashboard/navbar";

export default function StoryNotFound() {
  return (
    <>
      <DashboardNavbar />
      <div className="container max-w-md mx-auto px-4 py-16 text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-amber-900/20 p-4 rounded-full">
            <FileQuestion className="h-12 w-12 text-amber-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          Story Not Found
        </h1>
        
        <p className="text-gray-400 mb-8">
          The story you're looking for doesn't exist or may have been deleted.
          Please check the URL or return to your story library.
        </p>
        
        <div className="flex justify-center">
          <Button asChild>
            <Link href="/dashboard/stories">
              Go to Library
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}