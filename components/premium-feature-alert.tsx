"use client";

import { AlertCircle, Lock, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";


interface PremiumFeatureAlertProps {
  message?: string;
  featureName?: string;
  className?: string;
  variant?: "default" | "small" | "inline" | "banner";
}

export function PremiumFeatureAlert({
  message = "This is a premium feature. Upgrade to access.",
  featureName,
  className,
  variant = "default"
}: PremiumFeatureAlertProps) {
  const { openModal } = useUpgradeModal();
  
  const handleUpgrade = () => {
    openModal(featureName);
  };
  
  // Small inline variant (e.g. for component headers)
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge className="bg-amber-900/60 text-amber-300">
          <Lock className="h-3 w-3 mr-1" />
          Premium
        </Badge>
        <Button 
          variant="link" 
          size="sm" 
          onClick={handleUpgrade}
          className="p-0 h-auto text-amber-400 hover:text-amber-300"
        >
          Upgrade
        </Button>
      </div>
    );
  }
  
  // Small container variant (e.g. for tips)
  if (variant === "small") {
    return (
      <div className={cn("bg-amber-900/20 border border-amber-800 rounded-md p-2 flex items-center justify-between", className)}>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-400" />
          <span className="text-sm text-amber-300">
            {featureName ? `${featureName} is a premium feature` : "Premium feature"}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleUpgrade}
          className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-300 border-amber-800 text-xs px-2 h-7"
        >
          Upgrade
        </Button>
      </div>
    );
  }
  
  // Full banner variant
  if (variant === "banner") {
    return (
      <div className={cn("bg-gradient-to-r from-amber-900/30 to-indigo-900/30 border border-amber-800 rounded-lg p-6 text-center", className)}>
        <div className="bg-amber-900/20 rounded-full p-3 inline-flex mb-4">
          <Sparkles className="h-7 w-7 text-amber-400" />
        </div>
        <h4 className="text-lg font-medium text-white mb-2">
          {featureName ? `${featureName} is a Premium Feature` : "Premium Feature"}
        </h4>
        <p className="text-gray-300 mb-4 max-w-md mx-auto">
          {message}
        </p>
        <Button 
          onClick={handleUpgrade}
          className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Upgrade to Premium
        </Button>
      </div>
    );
  }
  
  // Default alert variant
  return (
    <Alert className={cn("bg-amber-900/20 border-amber-800", className)}>
      <AlertCircle className="h-4 w-4 text-amber-400" />
      <AlertDescription className="flex justify-between items-center w-full">
        <span className="text-amber-300">{message}</span>
        <Button 
          variant="link" 
          onClick={handleUpgrade}
          className="text-amber-400 hover:text-amber-300"
        >
          Upgrade to Premium
        </Button>
      </AlertDescription>
    </Alert>
  );
}