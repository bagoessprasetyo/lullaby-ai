// lib/lemonsqueezy.ts
import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

// Check for required environment variables
if (!process.env.LEMON_SQUEEZY_API_KEY) {
    throw new Error('Missing LEMON_SQUEEZY_API_KEY environment variable');
  }
  
  if (!process.env.LEMON_SQUEEZY_STORE_ID) {
    throw new Error('Missing LEMON_SQUEEZY_STORE_ID environment variable');
  }
  
  // Initialize LemonSqueezy
  const lemonSqueezy = lemonSqueezySetup({
    apiKey: process.env.LEMON_SQUEEZY_API_KEY,
    onError: (error) => console.error("Error!", error),
  });
  
  export default lemonSqueezy;
  
  // Helper function to create checkout options
  export function createCheckoutOptions(options: {
    variantId: number;
    customerEmail?: string;
    customerName?: string;
    userId: string;
    planId: string;
    billingPeriod: string;
  }) {
    return {
      checkoutOptions: {
        embedOptions: {
          checkout: {
            buttonColor: '#5046e5', // Indigo color to match our UI
            enabledBranding: false,
          },
        },
        custom: {
          userId: options.userId,
          planId: options.planId,
          billingPeriod: options.billingPeriod,
        },
        variantId: options.variantId,
        productOptions: {
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?success=true`,
          receiptThankYouNote: 'Thank you for subscribing! Your account has been upgraded.',
        },
        checkoutData: {
          email: options.customerEmail,
          name: options.customerName,
        },
      },
    };
  }