// app/api/webhooks/lemonsqueezy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('x-signature') as string;

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Verify webhook signature
  const isValid = verifyWebhookSignature(
    body,
    signature,
    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!
  );

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    const event = JSON.parse(body);
    const eventName = event.meta?.event_name;
    const eventData = event.data;

    switch (eventName) {
      case 'subscription_created':
        await handleSubscriptionCreated(eventData);
        break;

      case 'subscription_updated':
        await handleSubscriptionUpdated(eventData);
        break;

      case 'subscription_cancelled':
        await handleSubscriptionCancelled(eventData);
        break;

      case 'subscription_resumed':
        await handleSubscriptionResumed(eventData);
        break;

      case 'subscription_expired':
        await handleSubscriptionExpired(eventData);
        break;
      
      case 'subscription_payment_success':
        await handleSubscriptionPaymentSuccess(eventData);
        break;

      case 'subscription_payment_failed':
        await handleSubscriptionPaymentFailed(eventData);
        break;

      case 'order_created':
        await handleOrderCreated(eventData);
        break;

      default:
        console.log(`Unhandled event type: ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook event:', error);
    return NextResponse.json(
      { error: 'Error handling webhook event' },
      { status: 500 }
    );
  }
}

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signature)
  );
}

async function handleSubscriptionCreated(data: any) {
  const { attributes } = data;
  const { custom_data, user_email, user_name, status, first_payment_date, next_payment_date, ends_at } = attributes;
  const { userId, planId } = custom_data || {};

  if (!userId) {
    console.error('Missing userId in custom_data');
    return;
  }

  // Map LemonSqueezy plan to subscription tier
  let subscriptionTier = 'free';
  if (planId === 'premium') {
    subscriptionTier = 'premium';
  } else if (planId === 'family') {
    subscriptionTier = 'family';
  }

  // Update the user's profile in Supabase
  const { error } = await supabase
    .from('profiles')
    .update({
      lemonsqueezy_customer_id: attributes.customer_id,
      lemonsqueezy_subscription_id: attributes.id,
      subscription_tier: subscriptionTier,
      subscription_status: status,
      subscription_expiry: ends_at || next_payment_date,
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user profile after subscription creation:', error);
    throw error;
  }

  // Log the subscription event
  await supabase
    .from('subscription_events')
    .insert({
      user_id: userId,
      event_type: 'created',
      new_tier: subscriptionTier,
      effective_date: new Date().toISOString()
    });
}

async function handleSubscriptionUpdated(data: any) {
  const { attributes } = data;
  const { custom_data, status, next_payment_date, ends_at } = attributes;
  const { userId, planId } = custom_data || {};

  // If there's no userId in custom_data, try to find the user by subscription ID
  let userIdToUse = userId;
  if (!userIdToUse) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('lemonsqueezy_subscription_id', attributes.id)
      .single();
    
    if (profile) {
      userIdToUse = profile.id;
    } else {
      console.error('Cannot find user for subscription update');
      return;
    }
  }

  // Map LemonSqueezy plan to subscription tier
  let subscriptionTier = 'free';
  if (planId === 'premium') {
    subscriptionTier = 'premium';
  } else if (planId === 'family') {
    subscriptionTier = 'family';
  }

  // Update the user's profile in Supabase
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: status,
      subscription_tier: status === 'active' ? subscriptionTier : 'free',
      subscription_expiry: ends_at || next_payment_date,
    })
    .eq('id', userIdToUse);

  if (error) {
    console.error('Error updating user profile after subscription update:', error);
    throw error;
  }

  // Log the subscription event
  await supabase
    .from('subscription_events')
    .insert({
      user_id: userIdToUse,
      event_type: 'updated',
      new_tier: subscriptionTier,
      effective_date: new Date().toISOString()
    });
}

async function handleSubscriptionCancelled(data: any) {
  const { attributes } = data;
  const { custom_data, status, ends_at } = attributes;
  const { userId } = custom_data || {};

  // If there's no userId in custom_data, try to find the user by subscription ID
  let userIdToUse = userId;
  if (!userIdToUse) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, subscription_tier')
      .eq('lemonsqueezy_subscription_id', attributes.id)
      .single();
    
    if (profile) {
      userIdToUse = profile.id;
    } else {
      console.error('Cannot find user for subscription cancellation');
      return;
    }
  }

  // Update the user's profile in Supabase
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'canceled',
      subscription_expiry: ends_at,
    })
    .eq('id', userIdToUse);

  if (error) {
    console.error('Error updating user profile after subscription cancellation:', error);
    throw error;
  }

  // Log the subscription event
  await supabase
    .from('subscription_events')
    .insert({
      user_id: userIdToUse,
      event_type: 'cancelled',
      effective_date: new Date().toISOString()
    });
}

async function handleSubscriptionResumed(data: any) {
  const { attributes } = data;
  const { custom_data, status, next_payment_date, ends_at } = attributes;
  const { userId, planId } = custom_data || {};

  // If there's no userId in custom_data, try to find the user by subscription ID
  let userIdToUse = userId;
  if (!userIdToUse) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('lemonsqueezy_subscription_id', attributes.id)
      .single();
    
    if (profile) {
      userIdToUse = profile.id;
    } else {
      console.error('Cannot find user for subscription resumption');
      return;
    }
  }

  // Map LemonSqueezy plan to subscription tier
  let subscriptionTier = 'free';
  if (planId === 'premium') {
    subscriptionTier = 'premium';
  } else if (planId === 'family') {
    subscriptionTier = 'family';
  }

  // Update the user's profile in Supabase
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'active',
      subscription_tier: subscriptionTier,
      subscription_expiry: ends_at || next_payment_date,
    })
    .eq('id', userIdToUse);

  if (error) {
    console.error('Error updating user profile after subscription resumption:', error);
    throw error;
  }

  // Log the subscription event
  await supabase
    .from('subscription_events')
    .insert({
      user_id: userIdToUse,
      event_type: 'renewed',
      new_tier: subscriptionTier,
      effective_date: new Date().toISOString()
    });
}

async function handleSubscriptionExpired(data: any) {
  const { attributes } = data;
  const { custom_data } = attributes;
  const { userId } = custom_data || {};

  // If there's no userId in custom_data, try to find the user by subscription ID
  let userIdToUse = userId;
  if (!userIdToUse) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('lemonsqueezy_subscription_id', attributes.id)
      .single();
    
    if (profile) {
      userIdToUse = profile.id;
    } else {
      console.error('Cannot find user for subscription expiration');
      return;
    }
  }

  // Update the user's profile in Supabase
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'expired',
      subscription_tier: 'free',
    })
    .eq('id', userIdToUse);

  if (error) {
    console.error('Error updating user profile after subscription expiration:', error);
    throw error;
  }

  // Log the subscription event
  await supabase
    .from('subscription_events')
    .insert({
      user_id: userIdToUse,
      event_type: 'expired',
      effective_date: new Date().toISOString()
    });
}

async function handleSubscriptionPaymentSuccess(data: any) {
  const { attributes } = data;
  const { custom_data, order_id, invoice_url } = attributes;
  const { userId } = custom_data || {};

  // If there's no userId in custom_data, try to find the user by subscription ID
  let userIdToUse = userId;
  if (!userIdToUse) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('lemonsqueezy_subscription_id', attributes.subscription_id)
      .single();
    
    if (profile) {
      userIdToUse = profile.id;
    } else {
      console.error('Cannot find user for payment success');
      return;
    }
  }

  // Fetch order details to get payment amount
  // In a real implementation, you would fetch this from LemonSqueezy API
  const amount = 0; // Placeholder amount
  const currency = 'USD'; // Placeholder currency

  // Log payment history
  await supabase
    .from('payment_history')
    .insert({
      user_id: userIdToUse,
      amount,
      currency,
      payment_method: 'lemonsqueezy',
      status: 'succeeded',
      provider_transaction_id: order_id,
      invoice_url
    });
}

async function handleSubscriptionPaymentFailed(data: any) {
  const { attributes } = data;
  const { custom_data, order_id } = attributes;
  const { userId } = custom_data || {};

  // If there's no userId in custom_data, try to find the user by subscription ID
  let userIdToUse = userId;
  if (!userIdToUse) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('lemonsqueezy_subscription_id', attributes.subscription_id)
      .single();
    
    if (profile) {
      userIdToUse = profile.id;
    } else {
      console.error('Cannot find user for payment failure');
      return;
    }
  }

  // Fetch order details to get payment amount
  // In a real implementation, you would fetch this from LemonSqueezy API
  const amount = 0; // Placeholder amount
  const currency = 'USD'; // Placeholder currency

  // Log payment history
  await supabase
    .from('payment_history')
    .insert({
      user_id: userIdToUse,
      amount,
      currency,
      payment_method: 'lemonsqueezy',
      status: 'failed',
      provider_transaction_id: order_id
    });

  // Update subscription status
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'past_due'
    })
    .eq('id', userIdToUse);

  if (error) {
    console.error('Error updating user profile after payment failure:', error);
    throw error;
  }

  // Log the subscription event
  await supabase
    .from('subscription_events')
    .insert({
      user_id: userIdToUse,
      event_type: 'failed',
      effective_date: new Date().toISOString()
    });
}

async function handleOrderCreated(data: any) {
  // Handle initial order creation
  // This is useful for one-time purchases or initial subscription orders
  const { attributes } = data;
  const { user_email, customer_id, first_order_item, custom_data } = attributes;
  const { userId, planId } = custom_data || {};

  if (!userId) {
    console.error('Missing userId in custom_data');
    return;
  }

  // Log payment history
  await supabase
    .from('payment_history')
    .insert({
      user_id: userId,
      amount: first_order_item.price,
      currency: first_order_item.currency,
      payment_method: 'lemonsqueezy',
      status: 'succeeded',
      provider_transaction_id: attributes.id,
      invoice_url: attributes.receipt_url
    });
}