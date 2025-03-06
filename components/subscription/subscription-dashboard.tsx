// components/subscription/subscription-dashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, CreditCard, Clock, CalendarDays, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PricingPlans } from "@/components/subscription/pricing-plans";
import { cancelSubscriptionAction, createCheckoutAction, updateSubscriptionAction } from "@/app/actions/subscription-actions";

interface SubscriptionDashboardProps {
  subscription: {
    tier: string;
    status: string;
    expiryDate: Date | null;
    isActive: boolean;
  };
  userId: string;
  checkoutSuccess?: boolean;
  checkoutCanceled?: boolean;
  sessionId?: string;
}

export function SubscriptionDashboard({ 
  subscription, 
  userId,
  checkoutSuccess,
  checkoutCanceled,
  sessionId
}: SubscriptionDashboardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [showAlert, setShowAlert] = useState(!!checkoutSuccess || !!checkoutCanceled);
  
  // Clear URL parameters after handling checkout result
  useEffect(() => {
    if (checkoutSuccess || checkoutCanceled) {
      const timer = setTimeout(() => {
        router.replace('/dashboard/subscription');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [checkoutSuccess, checkoutCanceled, router]);
  
  // Hide alert after 5 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showAlert]);
  
  const handleSubscribe = async (planId: string, billingPeriod: string) => {
    setIsLoading(true);
    
    try {
      // Create checkout URL
      const response = await createCheckoutAction(
        planId as 'premium' | 'premium_plus',
        billingPeriod as 'monthly' | 'annual'
      );
      
      if (response.success && response.url) {
        // Redirect to LemonSqueezy Checkout
        window.location.href = response.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      // Show error message
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleManageSubscription = async () => {
    setIsLoading(true);
    
    try {
      // Get customer portal URL
      const response = await updateSubscriptionAction();
      
      if (response.success && response.url) {
        // Redirect to LemonSqueezy Customer Portal
        window.location.href = response.url;
      }
    } catch (error) {
      console.error('Error getting customer portal:', error);
      // Show error message
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancelSubscription = async () => {
    if (!cancelConfirm) {
      setCancelConfirm(true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get customer portal URL for cancellation
      const response = await cancelSubscriptionAction();
      
      if (response.success && response.url) {
        // Redirect to LemonSqueezy Customer Portal
        window.location.href = response.url;
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      // Show error message
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format the expiry date
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  return (
    <>
      <DashboardNavbar />
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">Subscription</h1>
            <p className="text-gray-400">
              Manage your subscription plan and billing
            </p>
          </header>
          
          {/* Checkout result alerts */}
          {showAlert && checkoutSuccess && (
            <Alert className="mb-6 bg-green-900/20 border-green-800">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <AlertTitle className="text-green-500">Success!</AlertTitle>
              <AlertDescription className="text-green-300">
                Your subscription has been successfully processed. Thank you for subscribing!
              </AlertDescription>
            </Alert>
          )}
          
          {showAlert && checkoutCanceled && (
            <Alert className="mb-6 bg-amber-900/20 border-amber-800">
              <XCircle className="h-5 w-5 text-amber-500" />
              <AlertTitle className="text-amber-500">Checkout Canceled</AlertTitle>
              <AlertDescription className="text-amber-300">
                Your subscription checkout was canceled. No charges were made.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Current subscription card */}
          <Card className="bg-gray-900 border-gray-800 mb-10">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl text-white">Current Subscription</CardTitle>
                  <CardDescription>
                    Your active subscription plan and details
                  </CardDescription>
                </div>
                
                <Badge 
                  className={`
                    ${subscription.status === 'active' ? 'bg-green-900/50 text-green-400' : 
                      subscription.status === 'trialing' ? 'bg-blue-900/50 text-blue-400' :
                      subscription.status === 'canceled' ? 'bg-amber-900/50 text-amber-400' :
                      'bg-red-900/50 text-red-400'} 
                    capitalize px-3 py-1 text-sm
                  `}
                >
                  {subscription.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-5 w-5 text-indigo-400" />
                    <span className="text-gray-300 font-medium">Plan</span>
                  </div>
                  <span className="text-2xl font-bold text-white capitalize">{subscription.tier}</span>
                  <p className="text-sm text-gray-400 mt-1">
                    {subscription.tier === 'free' 
                      ? 'Basic features for bedtime story creation' 
                      : subscription.tier === 'premium'
                      ? 'Enhanced features for the perfect bedtime experience'
                      : 'Perfect for families with multiple children'}
                  </p>
                </div>
                
                <div className="flex flex-col p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-indigo-400" />
                    <span className="text-gray-300 font-medium">Status</span>
                  </div>
                  <span className="text-xl font-bold text-white capitalize">
                    {subscription.status === 'active' ? 'Active' :
                     subscription.status === 'trialing' ? 'Trial' :
                     subscription.status === 'canceled' ? 'Canceled' :
                     subscription.status === 'past_due' ? 'Payment Past Due' :
                     'Inactive'}
                  </span>
                  <p className="text-sm text-gray-400 mt-1">
                    {subscription.status === 'canceled' 
                      ? 'Your subscription will end on the expiry date' 
                      : subscription.status === 'past_due'
                      ? 'Please update your payment method to avoid service interruption'
                      : subscription.status === 'active'
                      ? 'Your subscription is active and will renew automatically'
                      : 'Your subscription is not currently active'}
                  </p>
                </div>
                
                <div className="flex flex-col p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="h-5 w-5 text-indigo-400" />
                    <span className="text-gray-300 font-medium">Renewal Date</span>
                  </div>
                  <span className="text-xl font-bold text-white">
                    {subscription.expiryDate ? formatDate(subscription.expiryDate) : 'N/A'}
                  </span>
                  <p className="text-sm text-gray-400 mt-1">
                    {subscription.status === 'canceled' 
                      ? 'Your access ends on this date'
                      : subscription.status === 'active'
                      ? 'Your subscription will automatically renew on this date'
                      : 'No active subscription'}
                  </p>
                </div>
              </div>
              
              {/* Subscription actions */}
              {subscription.tier !== 'free' && (
                <div className="pt-6 border-t border-gray-800">
                  <h3 className="text-lg font-medium text-white mb-4">Manage Subscription</h3>
                  
                  <div className="flex flex-wrap gap-4">
                    {subscription.status === 'active' && (
                      <>
                        <Button
                          className="bg-indigo-600 hover:bg-indigo-700"
                          onClick={handleManageSubscription}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Manage Subscription'
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          className={`border-gray-700 ${cancelConfirm ? 'bg-red-900/20 text-red-400 border-red-800' : ''}`}
                          onClick={handleCancelSubscription}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : cancelConfirm ? (
                            <>
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Confirm Cancellation
                            </>
                          ) : (
                            'Cancel Subscription'
                          )}
                        </Button>
                      </>
                    )}
                    
                    {subscription.status === 'canceled' && (
                      <Button
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => handleSubscribe(subscription.tier, 'monthly')}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Reactivate Subscription'
                        )}
                      </Button>
                    )}
                    
                    {subscription.status === 'past_due' && (
                      <Button
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={handleManageSubscription}
                        disabled={isLoading}
                      >
                        Update Payment Method
                      </Button>
                    )}
                    
                    <Button variant="outline" className="border-gray-700" onClick={() => router.push('/dashboard/billing-history')}>
                      View Billing History
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            
            {subscription.tier === 'free' && (
              <CardFooter className="bg-indigo-900/20 border-t border-indigo-800/50 px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                  <div>
                    <h4 className="text-white font-medium">Upgrade your subscription</h4>
                    <p className="text-gray-400 text-sm">Get access to premium features and enhance your experience</p>
                  </div>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap"
                    onClick={() => document.getElementById('pricing-plans')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    View Plans
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
          
          {/* Pricing plans */}
          <div id="pricing-plans" className="pt-6">
            <h2 className="text-2xl font-bold text-white mb-6">Available Plans</h2>
            <PricingPlans 
              currentPlan={subscription.tier} 
              onSelectPlan={handleSubscribe}
              isLoading={isLoading}
            />
          </div>
        </motion.div>
      </div>
    </>
  );
}