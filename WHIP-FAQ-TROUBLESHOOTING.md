# WHIP + Mux - FAQ & Troubleshooting Guide

**Quick Reference:** Common questions and solutions

---

## 🤔 Frequently Asked Questions

### General Questions

#### Q: What is WHIP?
**A:** WHIP (WebRTC-HTTP Ingestion Protocol) is a standard protocol for streaming from browsers to servers using WebRTC. It allows users to stream directly from their phone or computer without installing software like OBS.

#### Q: Why use both Cloudflare and Mux?
**A:** Cloudflare handles live streaming and primary recording. Mux provides a backup recording in case Cloudflare's recording fails. This dual-recording approach ensures 99.9% reliability for critical memorial services.

#### Q: Is Mux required?
**A:** No! Mux is optional. The system works perfectly with Cloudflare-only recording. Mux backup is recommended for enterprise customers who need maximum reliability.

#### Q: Can I use OBS with Mux backup?
**A:** Yes! Both OBS (RTMP) and browser (WHIP) streaming support optional Mux backup recording.

#### Q: What's the cost difference?
**A:** Mux backup adds ~$1.80 per 2-hour stream. Cloudflare-only costs ~$0.72 per 2-hour stream.

---

### Technical Questions

#### Q: How does simulcast to Mux work?
**A:** Cloudflare's Live Input has an "outputs" feature. We configure an output pointing to Mux's RTMPS endpoint. Cloudflare automatically forwards the stream to Mux while also serving it to viewers and recording it locally.

#### Q: Why not stream directly to Mux?
**A:** Cloudflare provides better global distribution for live viewers and has proven reliability. Mux excels at recording and VOD. Using both gives us the best of both worlds.

#### Q: What happens if Cloudflare recording fails?
**A:** If Mux backup is enabled, we still have the Mux recording. The memorial page will automatically use the Mux recording URL as a fallback.

#### Q: Can users choose which recording to watch?
**A:** Currently, the system automatically prefers Cloudflare (faster, lower cost). If Cloudflare recording is unavailable, it falls back to Mux. Future enhancement could let users choose.

#### Q: What's the latency difference between WHIP and RTMP?
**A:** WHIP typically has 2-5 seconds latency. RTMP (OBS) typically has 5-10 seconds. Both are acceptable for memorial services.

---

### Implementation Questions

#### Q: Do I need to modify the existing OBS flow?
**A:** No! OBS streaming continues to work exactly as it does now. WHIP is a new option alongside OBS.

#### Q: What if I don't have Mux credentials?
**A:** The system will log a warning and continue without Mux backup. All features work with Cloudflare-only mode.

#### Q: Can I test without Mux?
**A:** Absolutely! Just leave the MUX_* environment variables empty or set `enableMuxBackup: false` when creating streams.

#### Q: How do I get Mux credentials?
**A:** Sign up at https://mux.com, go to Settings → Access Tokens, create a token with "Mux Video (Full Access)" permission.

---

## 🔧 Troubleshooting Guide

### Issue: "Mux credentials not configured"

**Symptoms:**
- Console warning: "⚠️ [MUX] Credentials not configured"
- Streams created without `muxLiveStreamId`

**Cause:** Missing environment variables

**Solution:**
```bash
# Check if variables are set
echo $MUX_TOKEN_ID
echo $MUX_TOKEN_SECRET

# If empty, add to .env:
MUX_TOKEN_ID=your_token_id
MUX_TOKEN_SECRET=your_token_secret
MUX_WEBHOOK_SECRET=your_webhook_secret

# Restart dev server
npm run dev
```

**Verify Fix:**
```typescript
import { isMuxConfigured } from '$lib/server/mux';
console.log('Mux configured:', isMuxConfigured()); // Should return true
```

---

### Issue: "WHIP connection failed"

**Symptoms:**
- Browser shows "Connection failed"
- Console error: "WHIP endpoint returned 404/500"
- Video preview shows but stream doesn't start

**Possible Causes:**

#### Cause 1: Invalid WHIP URL
```typescript
// Check stream document
const stream = await adminDb.collection('streams').doc(streamId).get();
const data = stream.data();
console.log('WHIP URL:', data.whipUrl);

// Should look like:
// "https://customer-XXX.cloudflarestream.com/YYY/webRTC/publish"
```

**Solution:** Verify Cloudflare Live Input was created correctly. Check `cloudflareInputId` exists.

#### Cause 2: Cloudflare credentials missing
```typescript
// Check environment variables
console.log('CF Account ID:', process.env.CLOUDFLARE_ACCOUNT_ID?.substring(0, 5) + '...');
console.log('CF Token:', process.env.CLOUDFLARE_API_TOKEN ? 'Set' : 'Missing');
```

**Solution:** Add Cloudflare credentials to environment variables.

#### Cause 3: Network/CORS issues
```typescript
// Enable detailed logging in whip-client.ts
fetch(this.options.whipUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/sdp' },
  body: offer.sdp
}).then(response => {
  console.log('Response status:', response.status);
  console.log('Response headers:', response.headers);
  return response.text();
}).then(console.log);
```

**Solution:** Check browser console for CORS errors. Verify HTTPS is used (or localhost for dev).

---

### Issue: "Camera permission denied"

**Symptoms:**
- Error: "NotAllowedError: Permission denied"
- No camera preview shown
- Status stuck on "Requesting camera access"

**Cause:** User denied camera/microphone permissions

**Solutions:**

#### Desktop Chrome/Edge:
1. Click 🔒 icon in address bar
2. Camera/Microphone → Allow
3. Reload page

#### Desktop Safari:
1. Safari → Settings → Websites → Camera
2. Find your site → Allow
3. Reload page

#### iOS Safari:
1. Settings → Safari → Camera
2. Enable "Ask" or "Allow"
3. Reload page in Safari

#### Android Chrome:
1. Settings → Apps → Chrome → Permissions
2. Enable Camera and Microphone
3. Reload page

**Prevention:** Add clear instructions before starting stream.

---

### Issue: "Simulcast to Mux not working"

**Symptoms:**
- Stream has `muxLiveStreamId` but `simulcastEnabled: false`
- No `cloudflareOutputId` in stream document
- Mux dashboard shows no incoming stream

**Diagnosis:**
```typescript
// Check stream document
const stream = await adminDb.collection('streams').doc(streamId).get();
const data = stream.data();

console.log('Mux Live Stream ID:', data.muxLiveStreamId);
console.log('Cloudflare Output ID:', data.cloudflareOutputId);
console.log('Simulcast Enabled:', data.simulcastEnabled);

// Check Cloudflare output
const cfInput = await getLiveInput(data.cloudflareInputId);
// Make API call to list outputs
```

**Common Causes:**

#### Cause 1: Output creation failed
```typescript
// Check server logs for:
// "❌ [CLOUDFLARE] Output API error:"
```

**Solution:** Verify Cloudflare API token has permission for outputs. Check error response.

#### Cause 2: Wrong Mux RTMPS URL or key
```typescript
// Verify Mux stream key in output
// Should match: mux.stream_key
```

**Solution:** Double-check Mux live stream creation returned correct `streamKey`.

#### Cause 3: Cloudflare plan limitations
Some Cloudflare plans don't support outputs.

**Solution:** Check your Cloudflare Stream plan. Contact support if needed.

---

### Issue: "Mux webhook not received"

**Symptoms:**
- Stream completed but `muxAssetReady: false`
- No `muxAssetId` in stream document
- Recordings available in Mux dashboard but not in app

**Diagnosis:**
```bash
# Check webhook configuration in Mux dashboard
# Settings → Webhooks

# Test webhook manually
curl -X POST https://yourdomain.com/api/webhooks/mux \
  -H "Content-Type: application/json" \
  -d '{
    "type": "video.asset.ready",
    "object": { "id": "your_mux_stream_id" },
    "data": {
      "id": "test_asset_id",
      "playback_ids": [{ "id": "test_playback_id" }],
      "duration": 120
    }
  }'
```

**Common Causes:**

#### Cause 1: Webhook URL not configured
**Solution:** Add webhook URL in Mux dashboard: `https://yourdomain.com/api/webhooks/mux`

#### Cause 2: Webhook signature validation failing
```typescript
// Check server logs for:
// "❌ [MUX_WEBHOOK] Invalid signature"
```

**Solution:** Verify `MUX_WEBHOOK_SECRET` matches Mux dashboard secret.

#### Cause 3: Webhook endpoint not deployed
```bash
# Verify endpoint exists
curl https://yourdomain.com/api/webhooks/mux
# Should return 405 Method Not Allowed (GET not supported)
# If 404, endpoint not deployed
```

**Solution:** Deploy latest code with webhook handler.

---

### Issue: "Recording playback not working"

**Symptoms:**
- Video player shows loading spinner forever
- Console error: "Failed to load manifest"
- Recording marked as available but won't play

**Diagnosis:**
```typescript
// Check recording sources
const stream = await adminDb.collection('streams').doc(streamId).get();
const data = stream.data();

console.log('Recording Sources:', data.recordingSources);
console.log('Preferred Source:', data.preferredRecordingSource);

// Test URLs directly
console.log('Cloudflare URL:', data.recordingSources?.cloudflare?.playbackUrl);
console.log('Mux URL:', data.recordingSources?.mux?.playbackUrl);

// Try loading in video element
const video = document.createElement('video');
video.src = data.recordingSources.cloudflare.playbackUrl;
video.play().catch(console.error);
```

**Common Causes:**

#### Cause 1: HLS not supported in browser
**Solution:** Use HLS.js library for broader compatibility.

#### Cause 2: CORS issues
```typescript
// Check response headers
fetch(playbackUrl, { method: 'HEAD' })
  .then(r => console.log('CORS headers:', r.headers.get('access-control-allow-origin')))
```

**Solution:** Cloudflare should handle CORS. If issues, check Cloudflare Stream settings.

#### Cause 3: Recording not actually ready
```bash
# Check Cloudflare Stream API
curl https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/{video_id} \
  -H "Authorization: Bearer {token}"

# Look for: readyToStream: true
```

**Solution:** Wait for recording processing to complete (5-10 minutes).

---

### Issue: "Mobile streaming quality poor"

**Symptoms:**
- Choppy video on mobile
- High latency
- Stream keeps disconnecting

**Diagnosis:**
```typescript
// Check connection quality
if (peerConnection) {
  peerConnection.getStats().then(stats => {
    stats.forEach(report => {
      if (report.type === 'outbound-rtp' && report.kind === 'video') {
        console.log('Bitrate:', report.bitrate);
        console.log('Packets lost:', report.packetsLost);
        console.log('Frame rate:', report.framesPerSecond);
      }
    });
  });
}
```

**Solutions:**

#### Solution 1: Lower resolution
```typescript
// In whip-client.ts, modify getUserMedia constraints
video: {
  width: { ideal: 960 },   // Lower from 1280
  height: { ideal: 540 },  // Lower from 720
  frameRate: { ideal: 24 }  // Lower from 30
}
```

#### Solution 2: Check network
```bash
# Test upload speed on mobile
speedtest.net

# Recommended: 2-5 Mbps upload for 720p
```

#### Solution 3: Use WiFi instead of cellular
Mobile data may have high latency or bandwidth limits.

---

### Issue: "Stream stuck in 'connecting' state"

**Symptoms:**
- Video preview shows camera
- Status says "Connecting..." forever
- No error message

**Diagnosis:**
```typescript
// Add ICE connection state logging
peerConnection.oniceconnectionstatechange = () => {
  console.log('ICE connection state:', peerConnection.iceConnectionState);
  console.log('Connection state:', peerConnection.connectionState);
  console.log('Signaling state:', peerConnection.signalingState);
};

// Log ICE candidates
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    console.log('ICE candidate:', event.candidate);
  } else {
    console.log('All ICE candidates sent');
  }
};
```

**Common Causes:**

#### Cause 1: Firewall blocking WebRTC
**Solution:** Test on different network. Check corporate firewall settings.

#### Cause 2: STUN server unreachable
```typescript
// Try different STUN servers
new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.l.google.com:19302' }
  ]
});
```

#### Cause 3: SDP negotiation failed
```typescript
// Log SDP offer/answer
console.log('Offer SDP:', offer.sdp);
console.log('Answer SDP:', answer.sdp);
```

**Solution:** Check if answer SDP is valid. Verify WHIP endpoint is working.

---

## 🚨 Emergency Procedures

### Emergency: Production streams failing

**Immediate Actions:**
1. Check status page: https://www.cloudflarestatus.com
2. Check Mux status: https://status.mux.com
3. Review recent deployments (rollback if needed)
4. Check environment variables in Vercel
5. Monitor error logs in Vercel dashboard

**Communication:**
- Alert users via platform notification
- Provide status update on homepage
- Suggest OBS as backup method
- Estimate recovery time

**Recovery:**
```bash
# Rollback deployment
vercel rollback

# Or redeploy last known good commit
git revert HEAD
git push origin main
```

### Emergency: Recordings not being created

**Immediate Actions:**
1. Verify both Cloudflare and Mux are receiving streams
2. Check webhook delivery in Mux dashboard
3. Manually trigger webhook processing for recent streams
4. Contact Cloudflare/Mux support if infrastructure issue

**Manual Recovery:**
```typescript
// Script to manually sync recording status
const streams = await adminDb
  .collection('streams')
  .where('status', '==', 'completed')
  .where('recordingSources.cloudflare.available', '==', false)
  .get();

for (const doc of streams.docs) {
  const streamData = doc.data();
  
  // Check Cloudflare for recording
  const cfVideo = await getCloudflareVideo(streamData.cloudflareInputId);
  if (cfVideo.readyToStream) {
    await doc.ref.update({
      'recordingSources.cloudflare.available': true,
      'recordingSources.cloudflare.playbackUrl': cfVideo.playback.hls
    });
  }
  
  // Check Mux for recording
  if (streamData.muxLiveStreamId) {
    const muxStream = await getMuxLiveStream(streamData.muxLiveStreamId);
    if (muxStream.asset_id) {
      const asset = await getMuxAsset(muxStream.asset_id);
      await doc.ref.update({
        'recordingSources.mux.available': true,
        'recordingSources.mux.playbackUrl': `https://stream.mux.com/${asset.playback_ids[0].id}.m3u8`
      });
    }
  }
}
```

---

## 📞 Support Contacts

### Internal
- **Dev Team Lead:** [Your Name]
- **On-Call Engineer:** [Rotation Schedule]
- **DevOps:** [Contact]

### External
- **Cloudflare Support:** Via dashboard
- **Mux Support:** support@mux.com
- **Emergency Hotline:** [If applicable]

---

## 📚 Additional Resources

### Documentation
- [WHIP Specification](https://datatracker.ietf.org/doc/html/draft-ietf-wish-whip)
- [Cloudflare Stream Docs](https://developers.cloudflare.com/stream/)
- [Mux Video Docs](https://docs.mux.com/)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

### Tools
- WebRTC Internals: `chrome://webrtc-internals/`
- Network Inspector: Browser DevTools → Network
- Mux Dashboard: https://dashboard.mux.com
- Cloudflare Dashboard: https://dash.cloudflare.com

---

**Need more help? Check the implementation guide or contact the dev team!** 🆘
