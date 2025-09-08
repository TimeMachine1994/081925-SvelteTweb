import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { adminDb } from '$lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16',
});

// Your webhook endpoint secret from Stripe Dashboard
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_mock';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return json({ error: 'Missing signature' }, { status: 400 });
    }

    console.log('🔔 Stripe webhook received');

    // Verify webhook signature
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('✅ Webhook signature verified, event type:', event.type);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(failedPayment);
        break;

      case 'payment_intent.requires_action':
        const actionRequired = event.data.object as Stripe.PaymentIntent;
        await handlePaymentActionRequired(actionRequired);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return json({ received: true });

  } catch (error) {
    console.error('Webhook processing failed:', error);
    return json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
};

// Handle successful payment
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('✅ Payment succeeded:', paymentIntent.id);

    const memorialId = paymentIntent.metadata.memorialId;
    const userId = paymentIntent.metadata.userId;

    if (!memorialId) {
      console.error('Missing memorialId in payment intent metadata');
      return;
    }

    // Update memorial with payment success
    const memorialRef = adminDb.collection('memorials').doc(memorialId);
    
    await memorialRef.update({
      'calculatorConfig.status': 'paid',
      'calculatorConfig.paidAt': Timestamp.now(),
      'calculatorConfig.paymentIntentId': paymentIntent.id,
      'calculatorConfig.lastModified': Timestamp.now(),
      'paymentHistory': FieldValue.arrayUnion({
        paymentIntentId: paymentIntent.id,
        status: 'succeeded',
        amount: paymentIntent.amount / 100, // Convert from cents
        paidAt: Timestamp.now(),
        createdBy: userId
      })
    });

    console.log('✅ Memorial payment status updated:', memorialId);

    // Send confirmation email
    await sendConfirmationEmail({
      memorialId,
      paymentIntentId: paymentIntent.id,
      customerEmail: paymentIntent.metadata.customerEmail,
      lovedOneName: paymentIntent.metadata.lovedOneName,
      amount: paymentIntent.amount / 100
    });

  } catch (error) {
    console.error('Failed to handle payment success:', error);
  }
}

// Handle failed payment
async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('❌ Payment failed:', paymentIntent.id);

    const memorialId = paymentIntent.metadata.memorialId;
    const userId = paymentIntent.metadata.userId;

    if (!memorialId) {
      console.error('Missing memorialId in payment intent metadata');
      return;
    }

    // Update memorial with payment failure
    const memorialRef = adminDb.collection('memorials').doc(memorialId);
    
    await memorialRef.update({
      'calculatorConfig.status': 'payment_failed',
      'calculatorConfig.paymentFailedAt': Timestamp.now(),
      'calculatorConfig.paymentIntentId': paymentIntent.id,
      'calculatorConfig.lastModified': Timestamp.now(),
      'paymentHistory': FieldValue.arrayUnion({
        paymentIntentId: paymentIntent.id,
        status: 'failed',
        amount: paymentIntent.amount / 100,
        failedAt: Timestamp.now(),
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
        createdBy: userId
      })
    });

    console.log('❌ Memorial payment failure recorded:', memorialId);

    // Send failure notification email
    await sendPaymentFailureEmail({
      memorialId,
      paymentIntentId: paymentIntent.id,
      customerEmail: paymentIntent.metadata.customerEmail,
      lovedOneName: paymentIntent.metadata.lovedOneName,
      failureReason: paymentIntent.last_payment_error?.message || 'Payment failed'
    });

  } catch (error) {
    console.error('Failed to handle payment failure:', error);
  }
}

// Handle payment requiring additional action
async function handlePaymentActionRequired(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('⚠️ Payment requires action:', paymentIntent.id);

    const memorialId = paymentIntent.metadata.memorialId;
    const userId = paymentIntent.metadata.userId;

    if (!memorialId) {
      console.error('Missing memorialId in payment intent metadata');
      return;
    }

    // Update memorial with action required status
    const memorialRef = adminDb.collection('memorials').doc(memorialId);
    
    await memorialRef.update({
      'calculatorConfig.status': 'action_required',
      'calculatorConfig.actionRequiredAt': Timestamp.now(),
      'calculatorConfig.paymentIntentId': paymentIntent.id,
      'calculatorConfig.lastModified': Timestamp.now(),
      'paymentHistory': FieldValue.arrayUnion({
        paymentIntentId: paymentIntent.id,
        status: 'action_required',
        amount: paymentIntent.amount / 100,
        actionRequiredAt: Timestamp.now(),
        createdBy: userId
      })
    });

    console.log('⚠️ Memorial payment action required recorded:', memorialId);

    // Send action required email
    await sendActionRequiredEmail({
      memorialId,
      paymentIntentId: paymentIntent.id,
      customerEmail: paymentIntent.metadata.customerEmail,
      lovedOneName: paymentIntent.metadata.lovedOneName,
      nextActionUrl: paymentIntent.next_action?.redirect_to_url?.url
    });

  } catch (error) {
    console.error('Failed to handle payment action required:', error);
  }
}

// Email helper functions
async function sendConfirmationEmail(data: {
  memorialId: string;
  paymentIntentId: string;
  customerEmail: string;
  lovedOneName: string;
  amount: number;
}) {
  try {
    console.log('📧 Sending confirmation email to:', data.customerEmail);
    
    // Call email service endpoint
    const response = await fetch('/api/send-confirmation-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Email service failed: ${response.statusText}`);
    }

    console.log('✅ Confirmation email sent successfully');
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
  }
}

async function sendPaymentFailureEmail(data: {
  memorialId: string;
  paymentIntentId: string;
  customerEmail: string;
  lovedOneName: string;
  failureReason: string;
}) {
  try {
    console.log('📧 Sending payment failure email to:', data.customerEmail);
    
    // Call email service endpoint
    const response = await fetch('/api/send-failure-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Email service failed: ${response.statusText}`);
    }

    console.log('✅ Payment failure email sent successfully');
  } catch (error) {
    console.error('Failed to send payment failure email:', error);
  }
}

async function sendActionRequiredEmail(data: {
  memorialId: string;
  paymentIntentId: string;
  customerEmail: string;
  lovedOneName: string;
  nextActionUrl?: string;
}) {
  try {
    console.log('📧 Sending action required email to:', data.customerEmail);
    
    // Call email service endpoint
    const response = await fetch('/api/send-action-required-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Email service failed: ${response.statusText}`);
    }

    console.log('✅ Action required email sent successfully');
  } catch (error) {
    console.error('Failed to send action required email:', error);
  }
}
