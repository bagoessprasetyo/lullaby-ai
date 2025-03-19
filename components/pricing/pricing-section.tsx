// components/pricing/pricing-section.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Crown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { createCheckoutAction } from "@/app/actions/subscription-actions";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const { data: session } = useSession();
  const { features, isSubscriber } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubscribe = async (plan: 'premium' | 'premium_plus') => {
    if (!session) {
      toast.error("Please sign in to subscribe");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createCheckoutAction(plan, billingPeriod);
      if (result.success && result.url) {
        router.push(result.url);
      } else {
        throw new Error("Failed to create checkout");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Failed to create checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16 px-4 md:py-24 bg-gradient-to-b from-gray-950 to-gray-900" id="pricing">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Choose the plan that works best for you and your family
          </p>
          
          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center bg-gray-900 p-1 rounded-lg border border-gray-800">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                billingPeriod === "monthly"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                billingPeriod === "annual"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              Annual
              <span className="ml-1 text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-1">Free</h3>
              <p className="text-gray-400 text-sm mb-4">Get started with one story</p>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white">$0</span>
                <span className="text-gray-500 ml-1">/forever</span>
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                <Feature included>
                  <span className="font-medium">1 story generation</span>
                  <span className="block text-xs text-gray-500 mt-1">Try before you subscribe</span>
                </Feature>
                <Feature included>3 images per story</Feature>
                <Feature included>Basic theme options</Feature>
                <Feature included={false}>Long stories</Feature>
                <Feature included={false}>Background music</Feature>
                <Feature included={false}>Custom voices</Feature>
                <Feature included={false}>Custom characters</Feature>
                <Feature included={false}>Educational themes</Feature>
              </ul>
              <Button 
                className="w-full mt-6 bg-gray-800 hover:bg-gray-700 text-white" 
                onClick={() => router.push("/dashboard/create")}
              >
                Get Started
              </Button>
            </div>
          </div>

          {/* Premium Tier */}
          <div className="bg-gradient-to-b from-indigo-900/40 to-gray-900 border border-indigo-800 rounded-xl overflow-hidden shadow-xl transform md:scale-105 relative">
            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
              Popular
            </div>
            <div className="p-6 border-b border-indigo-800/50">
              <h3 className="text-xl font-semibold text-white mb-1">Premium</h3>
              <p className="text-indigo-300 text-sm mb-4">Everything you need</p>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white">
                  {billingPeriod === "monthly" ? "$9.99" : "$99.99"}
                </span>
                <span className="text-indigo-400 ml-1">
                  /{billingPeriod === "monthly" ? "month" : "year"}
                </span>
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                <Feature included>
                  <span className="font-medium">30 stories per month</span>
                  <span className="block text-xs text-indigo-400 mt-1">Great for regular use</span>
                </Feature>
                <Feature included>5 images per story</Feature>
                <Feature included>All basic themes</Feature>
                <Feature included>Long stories</Feature>
                <Feature included>Background music</Feature>
                <Feature included>2 custom voices</Feature>
                <Feature included={false}>Custom characters</Feature>
                <Feature included={false}>Educational themes</Feature>
              </ul>
              <Button 
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white" 
                onClick={() => handleSubscribe("premium")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>Processing...
                  </>
                ) : (
                  <>
                    <Crown className="mr-2 h-4 w-4" />
                    Subscribe
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Premium+ Tier */}
          <div className="bg-gradient-to-b from-purple-900/40 to-gray-900 border border-purple-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-purple-800/50">
              <h3 className="text-xl font-semibold text-white mb-1">Premium+</h3>
              <p className="text-purple-300 text-sm mb-4">For power users</p>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white">
                  {billingPeriod === "monthly" ? "$14.99" : "$149.99"}
                </span>
                <span className="text-purple-400 ml-1">
                  /{billingPeriod === "monthly" ? "month" : "year"}
                </span>
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                <Feature included>
                  <span className="font-medium">100 stories per month</span>
                  <span className="block text-xs text-purple-400 mt-1">Ultimate flexibility</span>
                </Feature>
                <Feature included>5 images per story</Feature>
                <Feature included>All themes including exclusive</Feature>
                <Feature included>Extra long stories</Feature>
                <Feature included>Advanced background music mixing</Feature>
                <Feature included>5 custom voices</Feature>
                <Feature included>Custom characters</Feature>
                <Feature included>Educational themes</Feature>
              </ul>
              <Button 
                className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white" 
                onClick={() => handleSubscribe("premium_plus")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>Processing...
                  </>
                ) : (
                  <>
                    <Crown className="mr-2 h-4 w-4" />
                    Subscribe
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-12 text-gray-400 text-sm">
          <p>
            All plans include secure payment processing. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
}

interface FeatureProps {
  included: boolean;
  children: React.ReactNode;
}

function Feature({ included, children }: FeatureProps) {
  return (
    <li className="flex items-start">
      {included ? (
        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mr-3 mt-0.5" />
      ) : (
        <X className="h-5 w-5 text-gray-500 shrink-0 mr-3 mt-0.5" />
      )}
      <span className={cn("text-sm", included ? "text-gray-300" : "text-gray-500")}>
        {children}
      </span>
    </li>
  );
}