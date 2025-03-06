"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, CreditCard, Star } from "lucide-react";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createCheckoutAction } from "@/app/actions/subscription-actions";

interface UpgradeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  highlightedFeature?: string;
}

export function UpgradeModal({ 
  isOpen, 
  onOpenChange,
  highlightedFeature
}: UpgradeModalProps) {
  const [isAnnual, setIsAnnual] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<"premium" | "premium_plus">("premium");
  const [isProcessing, setIsProcessing] = useState(false);

  // Updated plans data
  const plans = [
    {
      id: "premium",
      name: "Premium",
      description: "Enhanced features for your bedtime stories",
      price: isAnnual ? 7.99 : 9.99,
      features: [
        "30 AI-generated stories per month",
        "All story lengths (including long)",
        "Premium AI voices",
        "Advanced image analysis",
        "Unlimited story storage",
        "Background music",
        "2 custom voice profiles"
      ]
    },
    {
      id: "premium_plus",
      name: "Premium+",
      description: "Premium features with expanded capacity",
      price: isAnnual ? 12.99 : 14.99,
      features: [
        "100 AI-generated stories per month",
        "Everything in Premium",
        "5 custom voice profiles",
        "Educational story templates",
        "Custom character creation",
        "Story series & collections",
        "Exclusive story themes"
      ]
    }
  ];

  const handleUpgrade = async () => {
    setIsProcessing(true);
    
    try {
      // Call the checkout action
      const billingPeriod = isAnnual ? 'annual' : 'monthly';
      const result = await createCheckoutAction(selectedPlan as any, billingPeriod);
      console.log('result',result)
      if (result.success && result.url) {
        // Redirect to checkout
        window.location.href = result.url;
      } else {
        // Handle error
        console.error('Failed to create checkout session');
        alert('There was an error creating your checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('There was an error processing your upgrade. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            Upgrade Your Experience
          </DialogTitle>
          {highlightedFeature && (
            <DialogDescription asChild>
              <div className="mt-2 bg-indigo-900/30 border border-indigo-800 rounded p-2 text-indigo-300">
                {highlightedFeature}
              </div>
            </DialogDescription>
          )}
        </DialogHeader>
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center space-x-4 mt-2 mb-4">
          <span className={`text-sm ${!isAnnual ? "text-white font-medium" : "text-gray-400"}`}>
            Monthly
          </span>
          <div className="flex items-center">
            <Switch 
              checked={isAnnual} 
              onCheckedChange={setIsAnnual}
            />
          </div>
          <div className="flex items-center">
            <span className={`text-sm ${isAnnual ? "text-white font-medium" : "text-gray-400"}`}>
              Annual
            </span>
            <Badge className="bg-green-900/80 text-green-300 ml-2">
              Save 20%
            </Badge>
          </div>
        </div>
        
        {/* Plan Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onClick={() => setSelectedPlan(plan.id as "premium" | "premium_plus")}
            >
              <div 
                className={cn(
                  "rounded-lg p-4 cursor-pointer transition-all h-full flex flex-col",
                  selectedPlan === plan.id 
                    ? "bg-indigo-900/30 border-2 border-indigo-500" 
                    : "bg-gray-800/50 border border-gray-700 hover:border-gray-600"
                )}
              >
                <div className="mb-2">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    {plan.id === "premium" ? (
                      <Sparkles className="h-4 w-4 text-indigo-400" />
                    ) : (
                      <Star className="h-4 w-4 text-amber-400" />
                    )}
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-400">{plan.description}</p>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-white">
                      ${plan.price.toFixed(2)}
                    </span>
                    <span className="text-gray-400 ml-2">
                      / month
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {isAnnual 
                      ? `Billed annually (${(plan.price * 12).toFixed(2)}/year)` 
                      : "Billed monthly"}
                  </p>
                </div>
                
                <div className="flex-grow mb-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="h-4 w-4 text-green-400 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <Button 
                    className={cn(
                      "w-full",
                      selectedPlan === plan.id 
                        ? "bg-indigo-600 hover:bg-indigo-700"
                        : "bg-gray-700 hover:bg-gray-600"
                    )}
                    onClick={() => setSelectedPlan(plan.id as "premium" | "premium_plus")}
                  >
                    {selectedPlan === plan.id ? "Selected" : "Select Plan"}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-gray-700"
          >
            Maybe Later
          </Button>
          <Button 
            onClick={handleUpgrade}
            disabled={isProcessing}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Upgrade to {selectedPlan === "premium" ? "Premium" : "Premium+"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}