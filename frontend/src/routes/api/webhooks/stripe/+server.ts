import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { adminDb } from '$lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return json({ error: 'Invalid signature' }, { status: 400 });
    }

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
        // Unhandled event type
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

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const memorialId = paymentIntent.metadata.memorialId;
    const userId = paymentIntent.metadata.userId;

    if (!memorialId) {
      console.error('Missing memorialId in payment intent metadata');
      return;
    }

    const memorialRef = adminDb.collection('memorials').doc(memorialId);
    
    await memorialRef.update({
      'calculatorConfig.status': 'paid',
      'calculatorConfig.paidAt': Timestamp.now(),
      'calculatorConfig.paymentIntentId': paymentIntent.id,
      'calculatorConfig.lastModified': Timestamp.now(),
      'paymentHistory': FieldValue.arrayUnion({
        paymentIntentId: paymentIntent.id,
        status: 'succeeded',
        amount: paymentIntent.amount / 100,
        paidAt: Timestamp.now(),
        createdBy: userId
      })
    });

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

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    const memorialId = paymentIntent.metadata.memorialId;
    const userId = paymentIntent.metadata.userId;

    if (!memorialId) {
      console.error('Missing memorialId in payment intent metadata');
      return;
    }

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

async function handlePaymentActionRequired(paymentIntent: Stripe.PaymentIntent) {
  try {
    const memorialId = paymentIntent.metadata.memorialId;
    const userId = paymentIntent.metadata.userId;

    if (!memorialId) {
      console.error('Missing memorialId in payment intent metadata');
      return;
    }

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

async function sendConfirmationEmail(data: any) {
  try {
    const response = await fetch('/api/send-confirmation-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Email service failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
  }
}

async function sendPaymentFailureEmail(data: any) {
  try {
    const response = await fetch('/api/send-failure-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Email service failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to send payment failure email:', error);
  }
}

async function sendActionRequiredEmail(data: any) {
  try {
    const response = await fetch('/api/send-action-required-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Email service failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to send action required email:', error);
  }
}
