# 🔧 Test Page Guide

## Quick Access
- **URL**: `http://localhost:5173/testpage`
- **Production**: `https://your-domain.com/testpage`

## Purpose
Minimal diagnostic page to test the Cloudflare Worker bridge and MUX Direct Upload integration.

## Test Sequence

### 1. Test Worker Connection
**Purpose**: Verify the Cloudflare Worker is deployed and accessible
**What it does**: Makes a simple GET request to the Worker URL
**Expected result**: Status 200 and a response message

### 2. Test Direct Upload Creation
**Purpose**: Verify MUX credentials are set correctly in the Worker
**What it does**: Calls the Worker's `/test-upload` endpoint to create a MUX Direct Upload
**Expected result**: Returns an upload ID and upload URL

### 3. Test MUX Credentials
**Purpose**: Verify MUX credentials are set correctly in Vercel
**What it does**: Calls the Vercel API to test MUX authentication
**Expected result**: Confirms credentials work and shows asset count

### 4. Full Bridge Test
**Purpose**: Test the complete flow: Cloudflare → Worker → MUX
**Steps**:
1. Start a WHIP stream from any page (like `/test/bridge`)
2. Copy the Stream ID from the URL or logs
3. Paste it into the "Cloudflare Stream ID" field
4. Click "Start Full Bridge Test"

**What happens**:
- Tests if HLS stream is accessible
- Starts the bridge via Vercel API
- Bridge creates MUX Direct Upload
- Worker starts downloading HLS segments
- Worker uploads segments to MUX
- MUX processes segments into an Asset

**Expected logs**:
```
✅ HLS is accessible
✅ Bridge started via Vercel API
✅ Worker Status: {...muxUploadId...}
```

## Troubleshooting

### Worker Not Accessible
**Symptom**: Test 1 fails with connection error
**Solution**: 
1. Ensure Worker is deployed: `cd workers/mux-bridge && npm run deploy`
2. Check Worker URL is correct: `https://mux-bridge-worker.austinbryanfilm.workers.dev`

### Upload Creation Fails
**Symptom**: Test 2 returns error about credentials
**Solution**:
1. Check Worker secrets: `cd workers/mux-bridge && npx wrangler secret list`
2. Verify both `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` are set
3. Re-set if needed: `npx wrangler secret put MUX_TOKEN_ID` and `npx wrangler secret put MUX_TOKEN_SECRET`

### Vercel MUX Test Fails
**Symptom**: Test 3 returns error about missing credentials
**Solution**:
1. Check Vercel environment variables in dashboard
2. Ensure `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` are set for the correct environment (Production/Preview/Development)
3. Redeploy after adding environment variables

### Bridge Test Shows "Output Connected: false"
**Symptom**: Bridge starts but data doesn't reach MUX
**Check**:
1. Worker logs show segment upload activity: `cd workers/mux-bridge && npx wrangler tail`
2. Look for `[BRIDGE-ALARM] Uploaded segment: X bytes` messages
3. If missing, Worker may not be running the new code - redeploy

## Architecture Flow

```
Phone/Browser
    ↓ (WHIP)
Cloudflare Stream
    ↓ (HLS manifest)
Worker (Durable Object)
    ↓ (Download segments)
Worker (Alarm every 2s)
    ↓ (Upload via Direct Upload API)
MUX Direct Upload
    ↓ (Processing)
MUX Asset (VOD Recording)
```

## Success Indicators

✅ **Test 1**: Worker responds with 200
✅ **Test 2**: Upload URL is created
✅ **Test 3**: MUX credentials valid
✅ **Full Test**: 
  - HLS accessible
  - Bridge starts successfully
  - Worker status shows muxUploadId
  - Segments count increases over time
  - MUX Asset eventually created

## Next Steps After Success

Once all tests pass:
1. Use the bridge from your main application
2. Check MUX dashboard for created Assets
3. Test playback of recorded Assets
4. Monitor Worker logs for any errors during production use
