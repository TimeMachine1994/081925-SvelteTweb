import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

/**
 * Cloudflare Live Input Webhook Handler
 * Receives instant notifications when streams start/stop
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    console.log('🔴 [LIVE_INPUT_WEBHOOK] Received Cloudflare live input webhook');
    
    const webhook = await request.json();
    console.log('📡 [LIVE_INPUT_WEBHOOK] Webhook payload:', {
      eventType: webhook.eventType,
      eventTime: webhook.eventTime,
      liveInputUid: webhook.liveInput?.uid,
      status: webhook.liveInput?.status
    });

    // Validate webhook structure
    if (!webhook.eventType || !webhook.liveInput?.uid) {
      console.error('❌ [LIVE_INPUT_WEBHOOK] Invalid webhook payload');
      return json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    const { eventType, liveInput } = webhook;
    const cloudflareId = liveInput.uid;

    // Find stream by Cloudflare ID
    console.log('🔍 [LIVE_INPUT_WEBHOOK] Looking for stream with cloudflareId:', cloudflareId);
    const streamsQuery = adminDb.collection('streams').where('cloudflareId', '==', cloudflareId);
    const snapshot = await streamsQuery.get();

    if (snapshot.empty) {
      console.log('⚠️ [LIVE_INPUT_WEBHOOK] No stream found for cloudflareId:', cloudflareId);
      return json({ message: 'Stream not found, ignoring webhook' }, { status: 200 });
    }

    const streamDoc = snapshot.docs[0];
    const streamData = streamDoc.data();
    const streamId = streamDoc.id;

    console.log('✅ [LIVE_INPUT_WEBHOOK] Found stream:', {
      streamId,
      title: streamData.title,
      currentStatus: streamData.status,
      memorialId: streamData.memorialId
    });

    // Handle different webhook events
    let updateData: any = {
      updatedAt: new Date()
    };

    switch (eventType) {
      case 'live-input.connected':
        console.log('🔴 [LIVE_INPUT_WEBHOOK] Stream STARTED - updating status to live');
        updateData = {
          ...updateData,
          status: 'live',
          actualStartTime: new Date(),
          // Store webhook metadata
          lastWebhookEvent: eventType,
          lastWebhookTime: new Date(webhook.eventTime)
        };
        break;

      case 'live-input.disconnected':
        console.log('⏹️ [LIVE_INPUT_WEBHOOK] Stream STOPPED - updating status to completed');
        updateData = {
          ...updateData,
          status: 'completed',
          endTime: new Date(),
          // Store webhook metadata
          lastWebhookEvent: eventType,
          lastWebhookTime: new Date(webhook.eventTime)
        };
        break;

      case 'live-input.recording.ready':
        console.log('📹 [LIVE_INPUT_WEBHOOK] Recording ready - updating recording status');
        updateData = {
          ...updateData,
          recordingReady: true,
          recordingUrl: webhook.recording?.playback?.hls || null,
          recordingDuration: webhook.recording?.duration || null,
          // Store webhook metadata
          lastWebhookEvent: eventType,
          lastWebhookTime: new Date(webhook.eventTime)
        };
        break;

      default:
        console.log('ℹ️ [LIVE_INPUT_WEBHOOK] Unhandled event type:', eventType);
        return json({ message: 'Event type not handled' }, { status: 200 });
    }

    // Update stream in database
    await streamDoc.ref.update(updateData);

    console.log('✅ [LIVE_INPUT_WEBHOOK] Stream updated successfully:', {
      streamId,
      eventType,
      newStatus: updateData.status,
      timestamp: new Date().toISOString()
    });

    // Log for audit trail
    console.log('📊 [LIVE_INPUT_WEBHOOK] Webhook processed:', {
      eventType,
      streamId,
      memorialId: streamData.memorialId,
      cloudflareId,
      processingTime: Date.now(),
      success: true
    });

    return json({ 
      success: true, 
      streamId,
      eventType,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('❌ [LIVE_INPUT_WEBHOOK] Error processing webhook:', error);
    console.error('❌ [LIVE_INPUT_WEBHOOK] Error details:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return json({ 
      error: 'Failed to process webhook',
      details: error.message 
    }, { status: 500 });
  }
};

// Handle GET requests for webhook verification (if needed)
export const GET: RequestHandler = async () => {
  return json({ 
    message: 'Cloudflare Live Input Webhook Endpoint',
    status: 'active',
    timestamp: new Date().toISOString()
  });
};
