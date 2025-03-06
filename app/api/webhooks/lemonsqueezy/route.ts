// app/api/webhooks/lemonsqueezy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient, supabase } from '@/lib/supabase';
import crypto from 'crypto';

// Add a GET handler to help with webhook verification
export async function GET(req: NextRequest) {
  console.log('GET request received on webhook endpoint - LemonSqueezy might be verifying the endpoint');
  return NextResponse.json({ status: 'webhook endpoint active' });
}

export async function POST(req: NextRequest) {
  console.log('LemonSqueezy webhook POST received');
  const headersList = Object.fromEntries([...(await headers()).entries()]);
  console.log('Headers received:', JSON.stringify(headersList, null, 2));
  
  let body;
  try {
    body = await req.text();
    console.log('Request body length:', body.length);
    // Log a small preview of the body to avoid overwhelming logs
    console.log('Body preview:', body.substring(0, 200) + (body.length > 200 ? '...' : ''));
    
    const headerStore = await headers();
    const signature = headerStore.get('x-signature');
    
    if (!signature) {
      console.error('Missing signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }
    
    // Check for webhook secret
    if (!process.env.LEMON_SQUEEZY_WEBHOOK_SECRET) {
      console.error('LEMON_SQUEEZY_WEBHOOK_SECRET environment variable is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      body,
      signature,
      process.env.LEMON_SQUEEZY_WEBHOOK_SECRET
    );

    console.log('Signature verification result:', isValid);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('Full webhook event structure:', JSON.stringify(event, null, 2));
    
    const eventName = event.meta?.event_name;
    const eventData = event.data;

    console.log('Webhook event name:', eventName);
    console.log('Event data ID:', eventData?.id);

    // Extract custom data from meta field if available (LemonSqueezy format)
    const metaCustomData = event.meta?.custom_data;
    if (metaCustomData) {
      console.log('Custom data from meta:', JSON.stringify(metaCustomData, null, 2));
    }

    // Also check in attributes for custom_data (backup)
    if (eventData?.attributes?.custom_data) {
      console.log('Custom data from attributes:', JSON.stringify(eventData.attributes.custom_data, null, 2));
    } else {
      console.log('No custom_data found in attributes');
    }

    switch (eventName) {
      case 'subscription_created':
        await handleSubscriptionCreated(eventData, metaCustomData);
        break;

      case 'subscription_updated':
        await handleSubscriptionUpdated(eventData, metaCustomData);
        break;

      case 'subscription_cancelled':
        await handleSubscriptionCancelled(eventData, metaCustomData);
        break;

      case 'subscription_resumed':
        await handleSubscriptionResumed(eventData, metaCustomData);
        break;

      case 'subscription_expired':
        await handleSubscriptionExpired(eventData, metaCustomData);
        break;
      
      case 'subscription_payment_success':
        await handleSubscriptionPaymentSuccess(eventData, metaCustomData);
        break;

      case 'subscription_payment_failed':
        await handleSubscriptionPaymentFailed(eventData, metaCustomData);
        break;

      case 'order_created':
        await handleOrderCreated(eventData, metaCustomData);
        break;

      default:
        console.log(`Unhandled event type: ${eventName}`);
    }

    return NextResponse.json({ received: true, event: eventName });
  } catch (error) {
    console.error('Error handling webhook event:', error);
    return NextResponse.json(
      { error: 'Error handling webhook event' },
      { status: 500 }
    );
  }
}

// Update the signature verification function
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    if (!secret) {
      console.error('Missing webhook secret - cannot verify signature');
      return false;
    }
    
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex');
    
    try {
      return crypto.timingSafeEqual(
        Buffer.from(digest),
        Buffer.from(signature)
      );
    } catch (error) {
      console.error('Error in timingSafeEqual comparison:', error);
      // Fallback to regular comparison if Buffer sizes don't match
      return digest === signature;
    }
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

async function handleSubscriptionPaymentFailed(data: any, metaCustomData?: any) {
  console.log('Processing subscription_payment_failed event');
  
  try {
    const { attributes } = data;
    
    if (!attributes) {
      console.error('Missing attributes in webhook data');
      return;
    }
    
    const { 
      order_id, 
      subscription_id, 
      user_email,
      product_name 
    } = attributes;
    
    console.log('Failed payment attributes:', { order_id, subscription_id });
    
    // Get custom data from meta or attributes
    const custom_data = metaCustomData || attributes.custom_data || {};
    console.log('Custom data used:', custom_data);
    
    const { user_id } = custom_data;

    // If there's no userId in custom_data, try to find the user by subscription ID
    let userIdToUse = user_id;
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    
    if (!userIdToUse && subscription_id) {
      console.log('No userId in custom_data, looking up by subscription ID:', subscription_id);
      
      const { data: profile, error: lookupError } = await client
        .from('profiles')
        .select('id')
        .eq('lemonsqueezy_subscription_id', subscription_id)
        .single();
      
      if (lookupError || !profile) {
        console.error('Cannot find user by subscription ID, trying email lookup');
        
        // If lookup by subscription ID fails, try by email
        if (user_email) {
          const { data: userByEmail, error: emailLookupError } = await client
            .from('profiles')
            .select('id')
            .eq('email', user_email)
            .single();
          
          if (emailLookupError || !userByEmail) {
            console.error('User not found by email:', { email: user_email, error: emailLookupError });
            return;
          }
          
          userIdToUse = userByEmail.id;
          console.log('Found user by email lookup:', userIdToUse);
        } else {
          console.error('No email available for lookup. Cannot update subscription.');
          return;
        }
      } else {
        userIdToUse = profile.id;
        console.log('Found user by subscription ID:', userIdToUse);
      }
    }
    
    if (!userIdToUse) {
      console.error('Could not determine user ID for payment failure');
      return;
    }

    // Placeholder amount and currency
    const amount = 0;
    const currency = 'USD';
    
    console.log('Logging failed payment for user ID:', userIdToUse);

    // Log payment history with failed status
    const { data: paymentRecord, error: paymentError } = await client
      .from('payment_history')
      .insert({
        user_id: userIdToUse,
        amount,
        currency,
        payment_method: 'lemonsqueezy',
        status: 'failed',
        provider_transaction_id: order_id
      })
      .select();

    if (paymentError) {
      console.error('Error logging payment history:', paymentError);
    } else {
      console.log('Failed payment history logged:', paymentRecord);
    }
    
    // Update subscription status to past_due
    const { data: updatedUser, error: updateError } = await client
      .from('profiles')
      .update({
        subscription_status: 'past_due'
      })
      .eq('id', userIdToUse)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating user subscription status to past_due:', updateError);
    } else {
      console.log('User subscription status updated to past_due:', updatedUser);
    }
    
    // Log the subscription event
    const { data: eventData, error: eventError } = await client
      .from('subscription_events')
      .insert({
        user_id: userIdToUse,
        event_type: 'payment_failed',
        effective_date: new Date().toISOString()
      })
      .select();
    
    if (eventError) {
      console.error('Error logging subscription event:', eventError);
    } else {
      console.log('Subscription payment failed event logged:', eventData);
    }
    
  } catch (error) {
    console.error('Error in handleSubscriptionPaymentFailed:', error);
  }
}

async function handleOrderCreated(data: any, metaCustomData?: any) {
  console.log('Processing order_created event');
  
  try {
    const { attributes } = data;
    
    if (!attributes) {
      console.error('Missing attributes in webhook data');
      return;
    }
    
    const { 
      user_email, 
      user_name,
      customer_id,
      product_name,
      identifier,
      first_order_item,
      urls,
      status_formatted
    } = attributes;
    
    console.log('Order attributes:', { 
      identifier, 
      product_name, 
      status: status_formatted,
      email: user_email
    });
    
    // Get custom data from meta or attributes
    const custom_data = metaCustomData || attributes.custom_data || {};
    console.log('Custom data used:', custom_data);
    
    // Extract userId from custom data - this is critical for new orders
    const { userId, user_id } = custom_data;
    const userIdToUse = userId || user_id;
    
    if (!userIdToUse) {
      console.log('No userId in custom_data, trying to lookup by email');
      
      if (!user_email) {
        console.error('No email available for lookup. Cannot process order.');
        return;
      }
      
      // Try to find user by email
      const client = typeof window === 'undefined' ? getAdminClient() : supabase;
      const { data: userByEmail, error: emailLookupError } = await client
        .from('profiles')
        .select('id')
        .eq('email', user_email)
        .single();
        
      if (emailLookupError || !userByEmail) {
        console.error('User not found by email:', { email: user_email, error: emailLookupError });
        console.log('This might be a new user. Consider creating an account.');
        return;
      }
      
      // Process with the found user
      await processOrder(userByEmail.id, attributes, data.id);
    } else {
      // We have a userId from custom data, proceed with it
      console.log('Using user ID from custom data:', userIdToUse);
      await processOrder(userIdToUse, attributes, data.id);
    }
  } catch (error) {
    console.error('Error in handleOrderCreated:', error);
  }
}

// Helper function to process orders
async function processOrder(userId: string, attributes: any, orderId: string) {
  try {
    console.log('Processing order for user ID:', userId);
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    
    // Check if user exists
    const { data: userExists, error: userCheckError } = await client
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single();
      
    if (userCheckError || !userExists) {
      console.error('User not found in database:', { userId, error: userCheckError });
      return;
    }
    
    console.log('User found:', userExists);
    
    // Extract order details
    const { 
      first_order_item,
      total_formatted,
      currency,
      receipt_url,
      user_email
    } = attributes;
    
    // Get price information
    const amount = first_order_item?.price || 0;
    const formattedAmount = first_order_item?.price_formatted || total_formatted || '0.00';
    const currencyCode = currency || 'USD';
    
    console.log('Order details:', {
      amount,
      formattedAmount,
      currency: currencyCode
    });
    
    // Determine if this is a subscription order
    const isSubscription = first_order_item?.is_subscription || false;
    
    // Log payment history
    const { data: paymentRecord, error: paymentError } = await client
      .from('payment_history')
      .insert({
        user_id: userId,
        amount: parseFloat(amount) || 0,
        currency: currencyCode,
        payment_method: 'lemonsqueezy',
        status: 'succeeded',
        provider_transaction_id: orderId,
        invoice_url: receipt_url || '',
        metadata: { is_subscription: isSubscription }
      })
      .select();
      
    if (paymentError) {
      console.error('Error logging payment history:', paymentError);
    } else {
      console.log('Payment record created:', paymentRecord);
    }
    
    // If this is a first order for a user, update their profile with LemonSqueezy customer ID
    if (attributes.customer_id) {
      const { data: updatedUser, error: updateError } = await client
        .from('profiles')
        .update({
          lemonsqueezy_customer_id: attributes.customer_id
        })
        .eq('id', userId)
        .select()
        .single();
        
      if (updateError) {
        console.error('Error updating user profile with customer ID:', updateError);
      } else {
        console.log('User profile updated with LemonSqueezy customer ID:', updatedUser);
      }
    }
    
    // Log order event
    const { data: eventData, error: eventError } = await client
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: 'order_created',
        effective_date: new Date().toISOString(),
        metadata: {
          amount: formattedAmount,
          currency: currencyCode,
          is_subscription: isSubscription
        }
      })
      .select();
      
    if (eventError) {
      console.error('Error logging order event:', eventError);
    } else {
      console.log('Order event logged:', eventData);
    }
    
  } catch (error) {
    console.error('Error processing order:', error);
  }
}

async function handleSubscriptionCreated(data: any, metaCustomData?: any) {
  console.log('Processing subscription_created event');
  
  try {
    const { attributes } = data;
    
    if (!attributes) {
      console.error('Missing attributes in webhook data');
      return;
    }
    
    console.log('Complete subscription attributes:', JSON.stringify(attributes, null, 2));
    
    // Extract the subscription details from the attributes
    const {
      status,
      renews_at,
      ends_at,
      user_email,
      user_name,
      product_name,
      variant_name,
      customer_id,
      product_id,
      variant_id
    } = attributes;
    
    // Get custom data from meta or attributes
    const custom_data = metaCustomData || attributes.custom_data || {};
    console.log('Custom data used:', custom_data);
    
    // Extract the userId and planId from custom data
    const { userId, planId } = custom_data;
    
    if (!userId) {
      console.error('Missing userId in custom_data. Attempting alternative approach...');
      
      // If userId is missing from custom_data, try to find by email
      if (user_email) {
        const client = typeof window === 'undefined' ? getAdminClient() : supabase;
        const { data: userByEmail, error: emailLookupError } = await client
          .from('profiles')
          .select('id')
          .eq('email', user_email)
          .single();
        
        if (emailLookupError || !userByEmail) {
          console.error('User not found by email:', { email: user_email, error: emailLookupError });
          return;
        }
        
        const resolvedUserId = userByEmail.id;
        console.log('Found user by email lookup:', resolvedUserId);
        
        // Continue with the resolved userId
        await updateSubscription(resolvedUserId, data, attributes, product_name);
        return;
      }
      
      console.error('Could not determine userId. Cannot update subscription.');
      return;
    }
    
    console.log('User ID extracted from custom data:', userId);
    
    // Update subscription with the found userId
    await updateSubscription(userId, data, attributes, product_name);
    
  } catch (error) {
    console.error('Error in handleSubscriptionCreated:', error);
  }
}

// Helper function to update subscription details
async function updateSubscription(userId: string, data: any, attributes: any, productName: string) {
  try {
    console.log('Attempting to update profile for user ID:', userId);
    
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    
    // Check if the user exists first
    const { data: userExists, error: userCheckError } = await client
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (userCheckError || !userExists) {
      console.error('User not found in database:', { userId, error: userCheckError });
      return;
    }
    
    console.log('User found, proceeding with update');
    
    // Determine subscription tier from product name or product ID
    let subscriptionTier = 'free';
    
    // Check product name for subscription tier
    const productNameLower = productName.toLowerCase();
    if (productNameLower.includes('premium+') || productNameLower.includes('premium plus')) {
      subscriptionTier = 'premium_plus';
    } else if (productNameLower.includes('premium')) {
      subscriptionTier = 'premium';
    } else if (productNameLower.includes('family')) {
      subscriptionTier = 'family';
    }
    
    console.log('Determined subscription tier from product name:', subscriptionTier);
    
    // Update the user's profile in Supabase
    const { data: updatedUser, error } = await client
      .from('profiles')
      .update({
        lemonsqueezy_customer_id: attributes.customer_id,
        lemonsqueezy_subscription_id: data.id,
        subscription_tier: subscriptionTier,
        subscription_status: attributes.status,
        subscription_expiry: attributes.ends_at || attributes.renews_at,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile after subscription creation:', error);
      throw error;
    }
    
    console.log('Profile updated successfully:', updatedUser);

    // Log the subscription event
    const { data: eventData, error: eventError } = await client
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: 'created',
        new_tier: subscriptionTier,
        effective_date: new Date().toISOString()
      })
      .select();
    
    if (eventError) {
      console.error('Error logging subscription event:', eventError);
    } else {
      console.log('Subscription event logged:', eventData);
    }
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionUpdated(data: any, metaCustomData?: any) {
  console.log('Processing subscription_updated event');
  
  try {
    const { attributes } = data;
    
    if (!attributes) {
      console.error('Missing attributes in webhook data');
      return;
    }

    console.log('Complete subscription update attributes:', JSON.stringify(attributes, null, 2));
    
    const {
      status,
      renews_at,
      ends_at,
      user_email,
      user_name,
      product_name,
      customer_id,
      product_id,
      variant_id
    } = attributes;
    
    // Get custom data from meta or attributes
    const custom_data = metaCustomData || attributes.custom_data || {};
    console.log('Custom data used:', custom_data);
    
    const { userId } = custom_data;
    
    // If there's no userId in custom_data, try to find the user by subscription ID
    let userIdToUse = userId;
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    
    if (!userIdToUse) {
      console.log('No userId in custom_data, looking up by subscription ID:', data.id);
      
      const { data: profile, error: lookupError } = await client
        .from('profiles')
        .select('id')
        .eq('lemonsqueezy_subscription_id', data.id)
        .single();
      
      if (lookupError || !profile) {
        console.error('Cannot find user by subscription ID, trying email lookup');
        
        // If lookup by subscription ID fails, try by email
        if (user_email) {
          const { data: userByEmail, error: emailLookupError } = await client
            .from('profiles')
            .select('id')
            .eq('email', user_email)
            .single();
          
          if (emailLookupError || !userByEmail) {
            console.error('User not found by email:', { email: user_email, error: emailLookupError });
            return;
          }
          
          userIdToUse = userByEmail.id;
          console.log('Found user by email lookup:', userIdToUse);
        } else {
          console.error('No email available for lookup. Cannot update subscription.');
          return;
        }
      } else {
        userIdToUse = profile.id;
        console.log('Found user by subscription ID:', userIdToUse);
      }
    }

    // Determine subscription tier from product name
    let subscriptionTier = 'free';
    const productNameLower = product_name.toLowerCase();
    
    if (productNameLower.includes('premium+') || productNameLower.includes('premium plus')) {
      subscriptionTier = 'premium_plus';
    } else if (productNameLower.includes('premium')) {
      subscriptionTier = 'premium';
    } else if (productNameLower.includes('family')) {
      subscriptionTier = 'family';
    }
    
    console.log('Using subscription tier:', subscriptionTier);
    console.log('Attempting to update profile for user ID:', userIdToUse);

    // Update the user's profile in Supabase
    const { data: updatedUser, error } = await client
      .from('profiles')
      .update({
        subscription_status: status,
        subscription_tier: status === 'active' ? subscriptionTier : 'free',
        subscription_expiry: ends_at || renews_at,
        lemonsqueezy_customer_id: customer_id,
      })
      .eq('id', userIdToUse)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile after subscription update:', error);
      throw error;
    }
    
    console.log('Profile updated successfully:', updatedUser);

    // Log the subscription event
    const { data: eventData, error: eventError } = await client
      .from('subscription_events')
      .insert({
        user_id: userIdToUse,
        event_type: 'updated',
        new_tier: subscriptionTier,
        effective_date: new Date().toISOString()
      })
      .select();
    
    if (eventError) {
      console.error('Error logging subscription event:', eventError);
    } else {
      console.log('Subscription event logged:', eventData);
    }
  } catch (error) {
    console.error('Error in handleSubscriptionUpdated:', error);
  }
}

async function handleSubscriptionCancelled(data: any, metaCustomData?: any) {
  console.log('Processing subscription_cancelled event');
  
  try {
    const { attributes } = data;
    
    if (!attributes) {
      console.error('Missing attributes in webhook data');
      return;
    }
    
    const { status, ends_at, user_email } = attributes;
    console.log('Subscription attributes:', { status, ends_at });
    
    // Get custom data from meta or attributes
    const custom_data = metaCustomData || attributes.custom_data || {};
    console.log('Custom data used:', custom_data);
    
    const { userId } = custom_data;

    // If there's no userId in custom_data, try to find the user by subscription ID
    let userIdToUse = userId;
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    
    if (!userIdToUse) {
      console.log('No userId in custom_data, looking up by subscription ID:', data.id);
      
      const { data: profile, error: lookupError } = await client
        .from('profiles')
        .select('id, subscription_tier')
        .eq('lemonsqueezy_subscription_id', data.id)
        .single();
      
      if (lookupError || !profile) {
        console.error('Cannot find user by subscription ID, trying email lookup');
        
        // If lookup by subscription ID fails, try by email
        if (user_email) {
          const { data: userByEmail, error: emailLookupError } = await client
            .from('profiles')
            .select('id')
            .eq('email', user_email)
            .single();
          
          if (emailLookupError || !userByEmail) {
            console.error('User not found by email:', { email: user_email, error: emailLookupError });
            return;
          }
          
          userIdToUse = userByEmail.id;
          console.log('Found user by email lookup:', userIdToUse);
        } else {
          console.error('No email available for lookup. Cannot update subscription.');
          return;
        }
      } else {
        userIdToUse = profile.id;
        console.log('Found user by subscription ID:', userIdToUse);
      }
    }
    
    console.log('Attempting to update profile for user ID:', userIdToUse);

    // Update the user's profile in Supabase
    const { data: updatedUser, error } = await client
      .from('profiles')
      .update({
        subscription_status: 'canceled',
        subscription_expiry: ends_at,
      })
      .eq('id', userIdToUse)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile after subscription cancellation:', error);
      throw error;
    }
    
    console.log('Profile updated successfully:', updatedUser);

    // Log the subscription event
    const { data: eventData, error: eventError } = await client
      .from('subscription_events')
      .insert({
        user_id: userIdToUse,
        event_type: 'cancelled',
        effective_date: new Date().toISOString()
      })
      .select();
    
    if (eventError) {
      console.error('Error logging subscription event:', eventError);
    } else {
      console.log('Subscription event logged:', eventData);
    }
  } catch (error) {
    console.error('Error in handleSubscriptionCancelled:', error);
  }
}

async function handleSubscriptionResumed(data: any, metaCustomData?: any) {
  console.log('Processing subscription_resumed event');
  
  try {
    const { attributes } = data;
    
    if (!attributes) {
      console.error('Missing attributes in webhook data');
      return;
    }
    
    const {
      status,
      renews_at,
      ends_at,
      user_email,
      product_name
    } = attributes;
    
    console.log('Subscription attributes:', { status, renews_at, ends_at });
    
    // Get custom data from meta or attributes
    const custom_data = metaCustomData || attributes.custom_data || {};
    console.log('Custom data used:', custom_data);
    
    const { userId } = custom_data;

    // If there's no userId in custom_data, try to find the user by subscription ID
    let userIdToUse = userId;
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    
    if (!userIdToUse) {
      console.log('No userId in custom_data, looking up by subscription ID:', data.id);
      
      const { data: profile, error: lookupError } = await client
        .from('profiles')
        .select('id')
        .eq('lemonsqueezy_subscription_id', data.id)
        .single();
      
      if (lookupError || !profile) {
        console.error('Cannot find user by subscription ID, trying email lookup');
        
        // If lookup by subscription ID fails, try by email
        if (user_email) {
          const { data: userByEmail, error: emailLookupError } = await client
            .from('profiles')
            .select('id')
            .eq('email', user_email)
            .single();
          
          if (emailLookupError || !userByEmail) {
            console.error('User not found by email:', { email: user_email, error: emailLookupError });
            return;
          }
          
          userIdToUse = userByEmail.id;
          console.log('Found user by email lookup:', userIdToUse);
        } else {
          console.error('No email available for lookup. Cannot update subscription.');
          return;
        }
      } else {
        userIdToUse = profile.id;
        console.log('Found user by subscription ID:', userIdToUse);
      }
    }

    // Determine subscription tier from product name
    let subscriptionTier = 'free';
    const productNameLower = product_name.toLowerCase();
    
    if (productNameLower.includes('premium+') || productNameLower.includes('premium plus')) {
      subscriptionTier = 'premium_plus';
    } else if (productNameLower.includes('premium')) {
      subscriptionTier = 'premium';
    } else if (productNameLower.includes('family')) {
      subscriptionTier = 'family';
    }
    
    console.log('Using subscription tier:', subscriptionTier);
    console.log('Attempting to update profile for user ID:', userIdToUse);

    // Update the user's profile in Supabase
    const { data: updatedUser, error } = await client
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_tier: subscriptionTier,
        subscription_expiry: ends_at || renews_at,
      })
      .eq('id', userIdToUse)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile after subscription resumption:', error);
      throw error;
    }
    
    console.log('Profile updated successfully:', updatedUser);

    // Log the subscription event
    const { data: eventData, error: eventError } = await client
      .from('subscription_events')
      .insert({
        user_id: userIdToUse,
        event_type: 'renewed',
        new_tier: subscriptionTier,
        effective_date: new Date().toISOString()
      })
      .select();
    
    if (eventError) {
      console.error('Error logging subscription event:', eventError);
    } else {
      console.log('Subscription event logged:', eventData);
    }
  } catch (error) {
    console.error('Error in handleSubscriptionResumed:', error);
  }
}

async function handleSubscriptionExpired(data: any, metaCustomData?: any) {
  console.log('Processing subscription_expired event');
  
  try {
    const { attributes } = data;
    
    if (!attributes) {
      console.error('Missing attributes in webhook data');
      return;
    }
    
    const { user_email } = attributes;
    console.log('Subscription attributes received');
    
    // Get custom data from meta or attributes
    const custom_data = metaCustomData || attributes.custom_data || {};
    console.log('Custom data used:', custom_data);
    
    const { userId } = custom_data;

    // If there's no userId in custom_data, try to find the user by subscription ID
    let userIdToUse = userId;
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    
    if (!userIdToUse) {
      console.log('No userId in custom_data, looking up by subscription ID:', data.id);
      
      const { data: profile, error: lookupError } = await client
        .from('profiles')
        .select('id')
        .eq('lemonsqueezy_subscription_id', data.id)
        .single();
      
      if (lookupError || !profile) {
        console.error('Cannot find user by subscription ID, trying email lookup');
        
        // If lookup by subscription ID fails, try by email
        if (user_email) {
          const { data: userByEmail, error: emailLookupError } = await client
            .from('profiles')
            .select('id')
            .eq('email', user_email)
            .single();
          
          if (emailLookupError || !userByEmail) {
            console.error('User not found by email:', { email: user_email, error: emailLookupError });
            return;
          }
          
          userIdToUse = userByEmail.id;
          console.log('Found user by email lookup:', userIdToUse);
        } else {
          console.error('No email available for lookup. Cannot update subscription.');
          return;
        }
      } else {
        userIdToUse = profile.id;
        console.log('Found user by subscription ID:', userIdToUse);
      }
    }
    
    console.log('Attempting to update profile for user ID:', userIdToUse);

    // Update the user's profile in Supabase
    const { data: updatedUser, error } = await client
      .from('profiles')
      .update({
        subscription_status: 'expired',
        subscription_tier: 'free',
      })
      .eq('id', userIdToUse)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile after subscription expiration:', error);
      throw error;
    }
    
    console.log('Profile updated successfully:', updatedUser);

    // Log the subscription event
    const { data: eventData, error: eventError } = await client
      .from('subscription_events')
      .insert({
        user_id: userIdToUse,
        event_type: 'expired',
        effective_date: new Date().toISOString()
      })
      .select();
    
    if (eventError) {
      console.error('Error logging subscription event:', eventError);
    } else {
      console.log('Subscription event logged:', eventData);
    }
  } catch (error) {
    console.error('Error in handleSubscriptionExpired:', error);
  }
}

async function handleSubscriptionPaymentSuccess(data: any, metaCustomData?: any) {
  console.log('Processing subscription_payment_success event');
  
  try {
    const { attributes } = data;
    
    if (!attributes) {
      console.error('Missing attributes in webhook data');
      return;
    }
    
    const { 
      order_id, 
      subscription_id, 
      user_email,
      user_name,
      first_subscription_item,
      product_name 
    } = attributes;
    
    console.log('Payment attributes:', { order_id, subscription_id, product_name });
    
    // Get custom data from meta or attributes
    const custom_data = metaCustomData || attributes.custom_data || {};
    console.log('Custom data used:', custom_data);
    
    const { user_id } = custom_data;

    // If there's no userId in custom_data, try to find the user by subscription ID
    let userIdToUse = user_id;
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    
    if (!userIdToUse && data.id) {
      console.log('No userId in custom_data, looking up by subscription ID:', data.id);
      
      const { data: profile, error: lookupError } = await client
        .from('profiles')
        .select('id')
        .eq('lemonsqueezy_subscription_id', data.id)
        .single();
      
      if (lookupError || !profile) {
        // Try looking up by the subscription_id in attributes if available
        if (subscription_id) {
          console.log('Trying lookup by subscription_id attribute:', subscription_id);
          
          const { data: profileBySub, error: subLookupError } = await client
            .from('profiles')
            .select('id')
            .eq('lemonsqueezy_subscription_id', subscription_id)
            .single();
          
          if (subLookupError || !profileBySub) {
            console.error('Cannot find user by subscription ID, trying email lookup');
            
            // If lookup by subscription ID fails, try by email
            if (user_email) {
              const { data: userByEmail, error: emailLookupError } = await client
                .from('profiles')
                .select('id')
                .eq('email', user_email)
                .single();
              
              if (emailLookupError || !userByEmail) {
                console.error('User not found by email:', { email: user_email, error: emailLookupError });
                return;
              }
              
              userIdToUse = userByEmail.id;
              console.log('Found user by email lookup:', userIdToUse);
            } else {
              console.error('No email available for lookup. Cannot update subscription.');
              return;
            }
          } else {
            userIdToUse = profileBySub.id;
            console.log('Found user by subscription_id attribute:', userIdToUse);
          }
        } else {
          // Try email lookup if subscription_id is not available
          if (user_email) {
            const { data: userByEmail, error: emailLookupError } = await client
              .from('profiles')
              .select('id')
              .eq('email', user_email)
              .single();
            
            if (emailLookupError || !userByEmail) {
              console.error('User not found by email:', { email: user_email, error: emailLookupError });
              return;
            }
            
            userIdToUse = userByEmail.id;
            console.log('Found user by email lookup:', userIdToUse);
          } else {
            console.error('No email available for lookup. Cannot update subscription.');
            return;
          }
        }
      } else {
        userIdToUse = profile.id;
        console.log('Found user by subscription ID:', userIdToUse);
      }
    }
    
    if (!userIdToUse) {
      console.error('Could not determine user ID for payment success');
      return;
    }

    // Get payment amount and currency if available
    const amount = 0;
    const currency = 'USD';
    
    // Try to extract payment information
    const invoice_url = attributes.urls?.customer_portal || '';
    
    console.log('Payment details:', { amount, currency, order_id });
    console.log('Logging payment history for user ID:', userIdToUse);

    // Log payment history
    const { data: paymentRecord, error: paymentError } = await client
      .from('payment_history')
      .insert({
        user_id: userIdToUse,
        amount,
        currency,
        payment_method: 'lemonsqueezy',
        status: 'succeeded',
        provider_transaction_id: order_id,
        invoice_url
      })
      .select();

    if (paymentError) {
      console.error('Error logging payment history:', paymentError);
    } else {
      console.log('Payment history logged:', paymentRecord);
    }
    
    // Determine subscription tier from product name
    let subscriptionTier = 'free';
    if (product_name) {
      const productNameLower = product_name.toLowerCase();
      
      if (productNameLower.includes('premium+') || productNameLower.includes('premium plus')) {
        subscriptionTier = 'premium_plus';
      } else if (productNameLower.includes('premium')) {
        subscriptionTier = 'premium';
      } else if (productNameLower.includes('family')) {
        subscriptionTier = 'family';
      }
    }
    
    // Also update the user's subscription status to ensure it's active
    const { data: updatedUser, error: updateError } = await client
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_tier: subscriptionTier
      })
      .eq('id', userIdToUse)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating user subscription status:', updateError);
    } else {
      console.log('User subscription status updated to active:', updatedUser);
    }
    
  } catch (error) {
    console.error('Error in handleSubscriptionPaymentSuccess:', error);
  }
}