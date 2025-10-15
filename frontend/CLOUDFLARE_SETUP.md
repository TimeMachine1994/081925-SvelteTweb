# Cloudflare Stream Setup Guide

This guide explains how to set up Cloudflare Stream integration for Tributestream's livestreaming functionality.

## Overview

Tributestream now uses **real Cloudflare Stream credentials** instead of fake RTMP URLs. This provides:

- ✅ **Real RTMP URLs** from Cloudflare Stream
- ✅ **Automatic recording** with webhook notifications
- ✅ **Live stream monitoring** and status detection
- ✅ **Proper cleanup** when streams are deleted

## Required Environment Variables

Add these to your `.env` file:

```bash
# Cloudflare Stream Configuration
CLOUDFLARE_ACCOUNT_ID="your_cloudflare_account_id"
CLOUDFLARE_API_TOKEN="your_cloudflare_api_token"
CLOUDFLARE_CUSTOMER_CODE="your_customer_code"
```

## Getting Cloudflare Credentials

### 1. Cloudflare Account ID

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Stream** in the sidebar
3. Your Account ID is shown in the right sidebar

### 2. API Token

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use **Custom token** template
4. Configure permissions:
   - **Zone:Zone:Read** (for your domain)
   - **Zone:Stream:Edit** (for livestreaming)
5. Add **Account Resources**: Include your account
6. Click **Continue to summary** → **Create Token**
7. Copy the token (you won't see it again!)

### 3. Customer Code

1. In Cloudflare Dashboard, go to **Stream**
2. Click on any existing video or live input
3. Look at the playback URL: `https://customer-XXXXXXXXX.cloudflarestream.com/`
4. The `XXXXXXXXX` part is your customer code

## Testing the Integration

Run the test script to verify everything works:

```bash
node test-cloudflare-integration.js
```

Expected output:

```
🎬 Testing Cloudflare Stream Integration...

1. Checking Cloudflare configuration...
   Cloudflare configured: ✅ YES

2. Creating test live input...
✅ Live input created successfully!
   Input ID: f1e2d3c4b5a6978899001122
   RTMP URL: rtmps://live.cloudflare.com/live/
   Stream Key: abcd1234...
   Recording: automatic

3. Cleaning up test live input...
✅ Live input deleted successfully!

🎉 All tests passed! Cloudflare Stream integration is working correctly.
```

## What Changed

### Before (Fake Implementation)

```javascript
// ❌ Old way - fake credentials
const streamKey = `${Math.random().toString(36)}...`;
const rtmpUrl = 'rtmp://live.tributestream.com/live'; // Doesn't exist!
```

### After (Real Cloudflare Integration)

```javascript
// ✅ New way - real Cloudflare credentials
const cloudflareInput = await createLiveInput({
	name: `${memorial.lovedOneName} - ${title}`,
	recording: true,
	recordingTimeout: 30
});

const streamKey = cloudflareInput.rtmps.streamKey; // Real key from Cloudflare
const rtmpUrl = cloudflareInput.rtmps.url; // Real RTMP URL
const cloudflareInputId = cloudflareInput.uid; // For tracking
```

## Stream Workflow

1. **Create Stream**: Calls Cloudflare API to create Live Input
2. **Get Credentials**: Extracts real RTMP URL and stream key
3. **Display to User**: Shows actual working credentials in UI
4. **Start Streaming**: User streams to real Cloudflare RTMP endpoint
5. **Automatic Recording**: Cloudflare records stream automatically
6. **Status Detection**: System monitors stream status via webhooks
7. **Cleanup**: Deletes Cloudflare Live Input when stream is deleted

## Fallback Behavior

If Cloudflare is not configured:

- System falls back to development placeholders
- Streams still work in UI but won't actually stream
- Console shows warnings about missing configuration

## Troubleshooting

### "Cloudflare not configured" Warning

- Check that all 3 environment variables are set
- Restart your development server after adding variables

### API Token Errors

- Ensure token has **Stream:Edit** permissions
- Check that Account Resources includes your account
- Verify the token hasn't expired

### Account ID Issues

- Make sure you're using the Account ID, not Zone ID
- Account ID is shown in Stream dashboard sidebar

### Customer Code Problems

- Look for existing Stream videos/inputs to find the code
- Format: `customer-XXXXXXXXX.cloudflarestream.com`
- Use only the `XXXXXXXXX` part

## Production Deployment

For production, ensure:

1. All environment variables are set in your hosting platform
2. Cloudflare webhooks are configured (for recording notifications)
3. API token has appropriate production permissions
4. Test the integration before going live

## Support

If you encounter issues:

1. Run the test script first
2. Check Cloudflare Dashboard for Live Inputs
3. Verify API token permissions
4. Check server logs for detailed error messages
