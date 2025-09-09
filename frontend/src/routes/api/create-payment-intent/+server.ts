import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { adminDb } from '$lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
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

    const { amount, memorialId, customerInfo, formData } = await request.json();

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

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        memorialId,
        userId: locals.user.uid,
        customerEmail: customerInfo?.email || locals.user.email || '',
        lovedOneName: memorial?.lovedOneName || ''
      },
      description: `TributeStream service for ${memorial?.lovedOneName || 'Memorial Service'}`
    });

    // Save payment intent to memorial
    await memorialRef.update({
      'paymentHistory': FieldValue.arrayUnion({
        paymentIntentId: paymentIntent.id,
        status: 'pending',
        amount: amount,
        createdAt: Timestamp.now(),
        createdBy: userId
      }),
      'calculatorConfig.status': 'pending_payment',
      'calculatorConfig.paymentIntentId': paymentIntent.id,
      'calculatorConfig.lastModified': Timestamp.now()
    });

    console.log('✅ Payment intent created successfully:', paymentIntent.id);

    return json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount
    });

  } catch (error) {
    console.error('Failed to create payment intent:', error);
    return json(
      { error: 'Failed to create payment intent', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};
