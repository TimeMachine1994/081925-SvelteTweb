# MUX Environment Setup

## Required Environment Variables

Add these environment variables to your `.env` file:

```bash
# MUX API Credentials
MUX_TOKEN_ID=your_mux_token_id_here
MUX_TOKEN_SECRET=your_mux_token_secret_here
```

## How to Get MUX Credentials

1. **Sign up for MUX Account**
   - Go to https://mux.com/
   - Create an account or log in

2. **Create API Access Token**
   - Navigate to Settings → Access Tokens
   - Click "Generate new token"
   - Select permissions: `Video` (for live streams and assets)
   - Copy the Token ID and Token Secret

3. **Add to Environment**
   - Add the credentials to your `.env` file
   - Restart your development server
   - The MUX Bridge Test Component will now work

## Testing MUX Integration

1. **Go to Stream Management Page**
   - Navigate to `/memorials/[id]/streams`
   - You should see the "MUX Bridge Test Component" at the top (admin/funeral director only)

2. **Run Bridge Test**
   - Enter a Cloudflare Stream ID (from an active stream)
   - Click "Start Test"
   - Watch the console output for detailed logging

3. **Expected Test Flow**
   ```
   ✅ Cloudflare stream validation
   ✅ MUX live stream creation
   ✅ Bridge server connection
   ✅ MUX ingestion monitoring
   ✅ Recording verification
   ```

## Troubleshooting

### "MUX credentials not configured"
- Check that `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` are set in `.env`
- Restart your development server after adding environment variables

### "MUX API error: Unauthorized"
- Verify your MUX credentials are correct
- Check that the API token has `Video` permissions

### "Bridge API error: Not found"
- The bridge server endpoints are placeholders for now
- They simulate the bridge functionality for testing purposes
- Real implementation would use FFmpeg to bridge Cloudflare → MUX

## Next Steps

1. **Implement Real Bridge Server**
   - Replace placeholder bridge endpoints with actual FFmpeg processes
   - Add process management and monitoring
   - Handle connection failures and reconnection

2. **Production Deployment**
   - Set up MUX credentials in production environment
   - Configure bridge server infrastructure
   - Add monitoring and alerting for bridge health

3. **Integration Testing**
   - Test with real phone streams to Cloudflare
   - Verify MUX recording quality and availability
   - Measure end-to-end latency and reliability
