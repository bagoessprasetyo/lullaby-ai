"use client";

import { SubscriptionPlan, SubscriptionState, BillingPeriod } from '@/types/subscription';
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, CreditCard } from "lucide-react";
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

const defaultPlans: SubscriptionPlan[] = [
  {
    id: "premium",
    name: "Premium",
    description: "Perfect for individual use",
    price: 9.99,
    period: 'monthly',
    features: [
      "Unlimited AI-generated stories",
      "All story lengths (including long)",
      "Background music library",
      "3 custom voice profiles",
      "Premium AI voices",
      "Ad-free experience"
    ]
  },
  {
    id: "family",
    name: "Family",
    description: "Best for families with multiple children",
    price: 14.99,
    period: 'annual',
    features: [
      "Everything in Premium",
      "Up to 10 custom voice profiles",
      "Family sharing (up to 5 members)",
      "Educational story templates",
      "Story series & collections",
      "Premium support"
    ]
  }
];

export function UpgradeModal({ 
  isOpen, 
  onOpenChange,
  highlightedFeature
}: UpgradeModalProps) {
  const [isAnnual, setIsAnnual] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<"premium" | "family">("premium");
  const [isProcessing, setIsProcessing] = useState(false);
  const [state, setState] = useState<SubscriptionState>({
    isProcessing: false,
    selectedPlan: 'premium',
    billingPeriod: 'annual'
  });
  // Plans data
  const plans = useMemo(() => {
    return defaultPlans.map(plan => ({
      ...plan,
      price: state.billingPeriod === 'annual' ? 
        Math.round(plan.price * 0.8 * 100) / 100 : // Round to 2 decimal places
        plan.price
    }));
  }, [state.billingPeriod]);

  const handleUpgrade = async () => {
    setIsProcessing(true);
    
    try {
      // Call the LemonSqueezy checkout action
      const billingPeriod = isAnnual ? 'annual' : 'monthly';
      const result = await createCheckoutAction(selectedPlan, billingPeriod);
      
      if (result.success && result.url) {
        // Redirect to LemonSqueezy checkout
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
          <DialogDescription asChild>
            <div className="mt-2 bg-indigo-900/30 border border-indigo-800 rounded p-2 text-indigo-300">
              {highlightedFeature}
            </div>
          </DialogDescription>
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
              onClick={() => setSelectedPlan(plan.id as "premium" | "family")}
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
                  <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                  <p className="text-sm text-gray-400">{plan.description}</p>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-white">
                      ${plan.price.toFixed(2)}
                    </span>
                    <span className="text-gray-400 ml-2">
                      /{isAnnual ? 'year' : 'month'}
                    </span>
                  </div>
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
                    onClick={() => setSelectedPlan(plan.id as "premium" | "family")}
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
                Upgrade to {selectedPlan === "premium" ? "Premium" : "Family"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}