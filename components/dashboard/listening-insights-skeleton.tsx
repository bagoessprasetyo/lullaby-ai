"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function ListeningInsightsSkeleton() {
  return (
    <Card className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-32" />
        <div className="flex space-x-2">
          {['7days', '30days', '90days', 'all'].map((range) => (
            <Skeleton key={range} className="h-8 w-16" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>

      <div className="flex justify-end">
        <Skeleton className="h-10 w-24" />
      </div>
    </Card>
  );
}