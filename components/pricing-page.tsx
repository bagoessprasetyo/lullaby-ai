"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Sparkles, Home, Star, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { AuthModal } from "@/components/auth/auth-modal";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Simulate user's current plan
  const [userPlan, setUserPlan] = useState("free");

  // Define pricing plans
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
        { name: "Ad-free experience", included: false },
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
        { name: "Unlimited AI-generated stories", included: true },
        { name: "All story lengths (including long)", included: true },
        { name: "Premium AI voices", included: true },
        { name: "Advanced image analysis", included: true },
        { name: "Unlimited story storage", included: true },
        { name: "Background music", included: true },
        { name: "3 custom voice profiles", included: true },
        { name: "Ad-free experience", included: true },
        { name: "Priority support", included: true },
      ],
      cta: "Upgrade to Premium",
      highlight: true,
      badge: "Most Popular",
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      id: "family",
      name: "Family",
      description: "Perfect for families with multiple children",
      price: {
        monthly: 14.99,
        annually: 12.99,
      },
      features: [
        { name: "Everything in Premium", included: true },
        { name: "Up to 10 custom voice profiles", included: true },
        { name: "Family sharing (up to 5 members)", included: true },
        { name: "Advanced customization options", included: true },
        { name: "Educational story templates", included: true },
        { name: "Custom character creation", included: true },
        { name: "Story series & collections", included: true },
        { name: "Exclusive story themes", included: true },
        { name: "Premium support", included: true },
      ],
      cta: "Get Family Plan",
      highlight: false,
      icon: <Users className="h-5 w-5" />,
    },
  ];

  const handlePlanSelection = (planId: string) => {
    // For demo purposes, we're just updating the state
    if (status === "authenticated") {
      setUserPlan(planId);
      if (planId !== "free") {
        // This would be where you'd redirect to a payment page
        console.log(`Selected plan: ${planId}`);
        // Simulate success feedback
        alert(`You've successfully upgraded to the ${planId} plan!`);
      }
    } else {
      // If not logged in, show auth modal
      setIsAuthModalOpen(true);
    }
  };

  return (
    <div className="bg-black min-h-screen">
      {/* Hero section */}
      <div className="container max-w-7xl mx-auto px-4 pt-24 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* <div className="inline-flex items-center justify-center mb-6">
            <Link href="/" className="text-gray-400 hover:text-white mr-4">
              <Home className="h-5 w-5" />
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-300 ml-4">Pricing</span>
          </div> */}

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your bedtime story needs.
            Upgrade anytime as your family's needs grow.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
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
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <Card 
                className={cn(
                  "h-full flex flex-col relative overflow-hidden border-gray-800 bg-gray-900",
                  plan.highlight && "border-indigo-500/50 bg-gradient-to-b from-gray-900 to-indigo-900/20",
                  userPlan === plan.id && "ring-2 ring-indigo-500"
                )}
              >
                {plan.badge && (
                  <div className="absolute top-0 right-0">
                    <Badge className="bg-indigo-500 text-white rounded-tl-none rounded-br-none text-xs px-3 py-1">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-2 rounded-full",
                        plan.highlight ? "bg-indigo-900/50 text-indigo-300" : "bg-gray-800 text-gray-400"
                      )}>
                        {plan.icon}
                      </div>
                      <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                    </div>
                    {userPlan === plan.id && (
                      <Badge className="bg-indigo-900/50 text-indigo-300">
                        Current Plan
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-gray-400">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-3 flex-grow">
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
                </CardContent>

                <CardFooter>
                  <Button 
                    className={cn(
                      "w-full",
                      plan.highlight 
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                        : "bg-gray-800 text-white hover:bg-gray-700",
                      userPlan === plan.id && !plan.highlight && "border border-indigo-500"
                    )}
                    disabled={userPlan === plan.id}
                    onClick={() => handlePlanSelection(plan.id)}
                  >
                    {userPlan === plan.id ? "Current Plan" : plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            What Parents Are Saying
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "My daughter looks forward to our Lullaby.ai stories every night. The custom voice feature where she hears my voice is her favorite!",
                author: "Sarah M., Mother of 2",
                rating: 5
              },
              {
                quote: "Worth every penny! The premium voices and background music create such a magical atmosphere. My son gets so excited for story time now.",
                author: "Michael T., Father of 1",
                rating: 5
              },
              {
                quote: "The family plan has been amazing for us. Each of our three kids gets personalized stories with their own voice profiles. Highly recommend!",
                author: "Jessica L., Mother of 3",
                rating: 5
              }
            ].map((testimonial, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + (0.1 * i) }}
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-6"
              >
                <div className="flex mb-3">
                  {Array(testimonial.rating).fill(0).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">"{testimonial.quote}"</p>
                <p className="text-sm text-gray-500">{testimonial.author}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            {[
              {
                question: "Can I switch between plans?",
                answer: "Yes, you can upgrade or downgrade your plan at any time. If you upgrade, the new features will be immediately available. If you downgrade, you'll maintain your current plan until the end of your billing period."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, PayPal, and Apple Pay. All payments are securely processed and encrypted."
              },
              {
                question: "Is there a free trial for premium features?",
                answer: "New users can try premium features for 7 days at no cost. You'll need to enter payment details, but we'll remind you before the trial ends."
              },
              {
                question: "How many custom voice profiles can I create?",
                answer: "The Premium plan allows for 3 custom voice profiles, while the Family plan supports up to 10 profiles, perfect for larger families or including grandparents."
              },
              {
                question: "Can I cancel my subscription anytime?",
                answer: "Absolutely. You can cancel your subscription at any time from your account settings. There are no cancellation fees or hidden charges."
              }
            ].map((faq, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + (0.1 * i) }}
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-6"
              >
                <h3 className="text-lg font-medium text-white mb-2">{faq.question}</h3>
                <p className="text-gray-400">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-800/50 rounded-xl p-10 max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Start Creating Magical Bedtime Stories Today
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Transform your family photos into enchanted tales that will
              create lasting memories with your children.
            </p>
            <Button 
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
              onClick={() => status === "authenticated" ? router.push("/dashboard") : setIsAuthModalOpen(true)}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Get Started
            </Button>
          </motion.div>
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
      />
    </div>
  );
}