// Simple Express server to test webhook functionality
const express = require('express');
const app = express();
const port = 3001;

// Middleware
app.use(express.json());

// Mock Firebase functions (for testing)
const mockStreams = new Map();
mockStreams.set('2a7c068e087eb9ee6a54fe45c7a17a2d', {
  id: 'jYwvJd8mUWbBmjWATz5U',
  title: 'test2',
  status: 'ready',
  memorialId: 'aZKDvOHoAkF38rUgi4qq',
  recordingSessions: []
});

// Webhook endpoint
app.post('/api/webhooks/cloudflare/stream-status', async (req, res) => {
  try {
    const webhookData = req.body;
    console.log('🔔 [WEBHOOK] Received:', JSON.stringify(webhookData, null, 2));

    const { 
      uid: cloudflareStreamId, 
      status, 
      eventType,
      liveInput,
      duration,
      playbackUrl,
      hlsUrl,
      dashUrl
    } = webhookData;

    if (!cloudflareStreamId) {
      console.warn('⚠️ [WEBHOOK] No stream ID in webhook data');
      return res.status(400).json({ error: 'Missing stream ID' });
    }

    // Find stream by Cloudflare ID (mock lookup)
    let foundStream = null;
    for (const [cfId, stream] of mockStreams.entries()) {
      if (cfId === cloudflareStreamId || cfId === liveInput?.uid) {
        foundStream = stream;
        break;
      }
    }

    if (!foundStream) {
      console.warn('⚠️ [WEBHOOK] Stream not found:', cloudflareStreamId);
      return res.status(404).json({ error: 'Stream not found' });
    }

    console.log('🎯 [WEBHOOK] Found stream:', foundStream.title);

    // Handle different events
    switch (eventType) {
      case 'stream.live':
        console.log('🔴 [WEBHOOK] Stream went live');
        foundStream.status = 'live';
        foundStream.actualStartTime = new Date();
        break;
      
      case 'stream.disconnected':
      case 'stream.ended':
        console.log('⏹️ [WEBHOOK] Stream ended');
        foundStream.status = 'ready';
        foundStream.endTime = new Date();
        
        // Create recording session
        const recordingSession = {
          sessionId: `${foundStream.id}_${Date.now()}`,
          cloudflareStreamId: cloudflareStreamId,
          startTime: foundStream.actualStartTime || new Date(),
          endTime: new Date(),
          duration: duration || null,
          status: 'processing',
          recordingReady: false,
          recordingUrl: null,
          playbackUrl: null,
          createdAt: new Date()
        };
        
        foundStream.recordingSessions.push(recordingSession);
        console.log('📹 [WEBHOOK] Recording session created:', recordingSession.sessionId);
        break;
      
      case 'video.ready':
        console.log('✅ [WEBHOOK] Recording ready');
        
        // Find the most recent recording session and update it
        if (foundStream.recordingSessions.length > 0) {
          const latestSession = foundStream.recordingSessions[foundStream.recordingSessions.length - 1];
          latestSession.recordingReady = true;
          latestSession.recordingUrl = hlsUrl || playbackUrl;
          latestSession.playbackUrl = dashUrl || playbackUrl;
          latestSession.status = 'ready';
          latestSession.duration = duration;
          latestSession.updatedAt = new Date();
          
          console.log('🎬 [WEBHOOK] Recording session updated:', latestSession.sessionId);
        }
        break;
      
      default:
        console.log('📝 [WEBHOOK] Unhandled event:', eventType);
    }

    // Log current stream state
    console.log('📊 [WEBHOOK] Current stream state:', {
      title: foundStream.title,
      status: foundStream.status,
      recordingSessions: foundStream.recordingSessions.length
    });

    res.json({ 
      success: true, 
      streamId: foundStream.id,
      eventType,
      message: `Processed ${eventType} for ${foundStream.title}`
    });

  } catch (error) {
    console.error('❌ [WEBHOOK] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Status endpoint
app.get('/api/debug/webhook-status', (req, res) => {
  const streams = Array.from(mockStreams.values());
  res.json({
    message: 'Webhook server running',
    streams: streams.map(s => ({
      id: s.id,
      title: s.title,
      status: s.status,
      recordingSessions: s.recordingSessions.length
    }))
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Webhook test server running on http://localhost:${port}`);
  console.log(`📡 Webhook endpoint: http://localhost:${port}/api/webhooks/cloudflare/stream-status`);
  console.log(`📊 Status endpoint: http://localhost:${port}/api/debug/webhook-status`);
  console.log('\n🧪 Ready for webhook testing!');
});
