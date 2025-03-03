"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface LibraryHeaderProps {
  totalCount: number | any;
}

export function LibraryHeader({ totalCount }: LibraryHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Your Stories</h1>
        <p className="text-gray-400">
          Browse, play, and manage your bedtime stories
          {typeof totalCount === 'number' && totalCount > 0 && ` (${totalCount} ${totalCount === 1 ? 'story' : 'stories'})`}
        </p>
      </div>

      <Button
        onClick={() => router.push("/dashboard/create")}
        className="bg-indigo-600 hover:bg-indigo-700 flex-shrink-0 text-white"
      >
        <Plus className="mr-2 h-4 w-4 text-white" />
        Create New Story
      </Button>
    </div>
  );
}