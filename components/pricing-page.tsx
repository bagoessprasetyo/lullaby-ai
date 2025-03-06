"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Sparkles, Home, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { useSession } from "next-auth/react";
import { AuthModal } from "@/components/auth/auth-modal";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";

export default function PricingSection() {
  const { data: session } = useSession();
  const [isAnnual, setIsAnnual] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { openModal } = useUpgradeModal();

  // Define pricing plans with updated features
  const plans = [
    {
      id: "free",
      name: "Free",
      description: "Basic features for bedtime story creation",
      price: {
        monthly: 0,
        annually: 0,
      },
      features: [
        { name: "5 AI-generated stories per month", included: true },
        { name: "Short & medium story lengths", included: true },
        { name: "Basic AI voices", included: true },
        { name: "Standard image analysis", included: true },
        { name: "Store up to 10 stories", included: true },
        { name: "Background music", included: false },
        { name: "Custom voice profiles", included: false },
        { name: "Long stories (5+ minutes)", included: false },
      ],
      cta: "Get Started",
      highlight: false,
      icon: <Home className="h-5 w-5" />,
    },
    {
      id: "premium",
      name: "Premium",
      description: "Enhanced features for the perfect bedtime experience",
      price: {
        monthly: 9.99,
        annually: 7.99,
      },
      features: [
        { name: "30 AI-generated stories per month", included: true },
        { name: "All story lengths (including long)", included: true },
        { name: "Premium AI voices", included: true },
        { name: "Advanced image analysis", included: true },
        { name: "Unlimited story storage", included: true },
        { name: "Background music", included: true },
        { name: "2 custom voice profiles", included: true },
      ],
      cta: "Upgrade to Premium",
      highlight: true,
      badge: "Most Popular",
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      id: "premium_plus",
      name: "Premium+",
      description: "Premium features with expanded capacity for families",
      price: {
        monthly: 14.99,
        annually: 12.99,
      },
      features: [
        { name: "100 AI-generated stories per month", included: true },
        { name: "Everything in Premium", included: true },
        { name: "5 custom voice profiles", included: true },
        { name: "Educational story templates", included: true },
        { name: "Custom character creation", included: true },
        { name: "Story series & collections", included: true },
        { name: "Exclusive story themes", included: true },
      ],
      cta: "Get Premium+",
      highlight: false,
      icon: <Star className="h-5 w-5" />,
    },
  ];

  const handlePlanSelection = (planId: string) => {
    if (session) {
      if (planId !== "free") {
        openModal();
      }
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <section id="pricing" className="py-24 bg-black">
      <div className="container max-w-7xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your bedtime story needs.
            Upgrade anytime as your storytelling needs grow.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center space-x-4 mb-6">
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
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              viewport={{ once: true }}
            >
              <div 
                className={cn(
                  "h-full flex flex-col relative overflow-hidden rounded-xl border-gray-800 bg-gray-900",
                  plan.highlight && "border-indigo-500/50 bg-gradient-to-b from-gray-900 to-indigo-900/20"
                )}
              >
                {plan.badge && (
                  <div className="absolute top-0 right-0">
                    <Badge className="bg-indigo-500 text-white rounded-tl-none rounded-br-none text-xs px-3 py-1">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <div className="p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <div className={cn(
                      "p-2 rounded-full",
                      plan.highlight ? "bg-indigo-900/50 text-indigo-300" : "bg-gray-800 text-gray-400"
                    )}>
                      {plan.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    {plan.description}
                  </p>

                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-white">
                        ${isAnnual ? plan.price.annually : plan.price.monthly}
                      </span>
                      {plan.price.monthly > 0 && (
                        <span className="text-gray-400 ml-2">
                          / month
                        </span>
                      )}
                    </div>
                    {plan.price.monthly > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        {isAnnual 
                          ? `Billed annually (${plan.price.annually * 12}/year)` 
                          : "Billed monthly"}
                      </p>
                    )}
                  </div>

                  <div className="flex-grow mb-6">
                    <ul className="space-y-3 text-sm">
                      {plan.features.map((feature, i) => (
                        <li 
                          key={i} 
                          className="flex items-start"
                        >
                          <div className="mr-3 mt-0.5">
                            {feature.included ? (
                              <Check className="h-5 w-5 text-green-400" />
                            ) : (
                              <X className="h-5 w-5 text-gray-600" />
                            )}
                          </div>
                          <span className={feature.included ? "text-gray-300" : "text-gray-500"}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    className={cn(
                      "w-full",
                      plan.highlight 
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                        : "bg-gray-800 text-white hover:bg-gray-700"
                    )}
                    onClick={() => handlePlanSelection(plan.id)}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      <AuthModal 
        isOpen={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
      />
    </section>
  );
}