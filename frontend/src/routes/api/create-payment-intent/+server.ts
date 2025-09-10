import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { adminDb } from '$lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { STRIPE_SECRET_KEY } from '$env/static/private';

// Initialize Stripe with your secret key
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const { memorialId, customerInfo, bookingData } = await request.json();
    const { bookingItems, total: amount } = bookingData;

    if (!amount || !memorialId) {
      return json({ error: 'Missing required data' }, { status: 400 });
    }

    console.log('💳 Creating payment intent:', { amount, memorialId, userId: locals.user.uid });

    // Verify memorial exists and user has permission
    const memorialRef = adminDb.collection('memorials').doc(memorialId);
    const memorialDoc = await memorialRef.get();
    
    if (!memorialDoc.exists) {
      return json({ error: 'Memorial not found' }, { status: 404 });
    }

    const memorial = memorialDoc.data();
    const userRole = locals.user.role;
    const userId = locals.user.uid;
    
    const hasPermission = 
      userRole === 'admin' ||
      memorial?.ownerUid === userId ||
      memorial?.createdByUserId === userId ||
      memorial?.funeralDirectorUid === userId ||
      (userRole === 'family_member' && memorial?.familyMemberUids?.includes(userId));

    if (!hasPermission) {
      return json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: bookingItems.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/schedule/${memorialId}`,
      metadata: {
        memorialId,
        userId: locals.user.uid,
        customerEmail: customerInfo?.email || locals.user.email || '',
        lovedOneName: memorial?.lovedOneName || ''
      },
      customer_email: customerInfo?.email || locals.user.email || ''
    });

    // Save checkout session info to memorial
    await memorialRef.update({
      'calculatorConfig.status': 'pending_payment',
      'calculatorConfig.checkoutSessionId': session.id,
      'calculatorConfig.lastModified': Timestamp.now()
    });

    console.log('✅ Checkout session created successfully:', session.id);

    return json({
      url: session.url
    });

  } catch (error) {
    console.error('Failed to create payment intent:', error);
    return json(
      { error: 'Failed to create payment intent', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};
