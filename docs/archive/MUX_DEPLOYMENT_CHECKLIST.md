# MUX PLATFORM DEPLOYMENT CHECKLIST

**Date:** January 22, 2026  
**Project:** Mux Streaming Platform Integration  
**Status:** Ready for Deployment

---

## PRE-DEPLOYMENT CHECKLIST

### 1. Environment Setup ⏳

- [ ] **Create Mux Account**
  - Sign up at https://dashboard.mux.com
  - Verify email address
  - Complete account setup

- [ ] **Generate Mux Access Tokens**
  - Navigate to https://dashboard.mux.com/settings/access-tokens
  - Click "Generate new token"
  - Copy Token ID: `_______________________`
  - Copy Token Secret: `_______________________`
  - Save securely (you won't see the secret again)

- [ ] **Configure Mux Webhook**
  - Navigate to https://dashboard.mux.com/settings/webhooks
  - Click "Create new webhook"
  - URL: `https://yourdomain.com/api/webhooks/mux`
  - Select events:
    - [x] `video.live_stream.active`
    - [x] `video.live_stream.idle`
    - [x] `video.live_stream.disconnected`
    - [x] `video.asset.ready`
    - [x] `video.asset.errored`
  - Copy Signing Secret: `_______________________`
  - Save webhook

- [ ] **Update Environment Variables**
  ```env
  # Add to .env file
  MUX_TOKEN_ID=your_token_id_here
  MUX_TOKEN_SECRET=your_token_secret_here
  MUX_WEBHOOK_SECRET=your_webhook_signing_secret_here
  ```

- [ ] **Verify Dependencies Installed**
  ```bash
  npm list @mux/mux-node
  npm list @mux/mux-player
  ```

### 2. Code Review ⏳

- [ ] **Review Mux Service Utility**
  - File: `src/lib/server/mux.ts`
  - Verify all functions present
  - Check error handling
  - Confirm logging statements

- [ ] **Review API Endpoints**
  - [ ] `POST /api/memorials/[id]/streams`
  - [ ] `GET /api/streams/[id]/chat/messages`
  - [ ] `POST /api/streams/[id]/chat/messages`
  - [ ] `DELETE /api/streams/[id]/chat/messages/[id]`
  - [ ] `PATCH /api/streams/[id]/chat/toggle`
  - [ ] `GET /api/streams/[id]/analytics`
  - [ ] `POST /api/webhooks/mux`

- [ ] **Review Components**
  - [ ] `MuxVideoPlayer.svelte`
  - [ ] `LiveChatWidget.svelte`
  - [ ] `StreamAnalyticsDashboard.svelte`
  - [ ] `ChatModerationPanel.svelte`
  - [ ] `StreamCard.svelte` (updated)
  - [ ] `MemorialStreamDisplay.svelte` (updated)

- [ ] **Review TypeScript Types**
  - [ ] `MuxStreamConfig` interface
  - [ ] `MuxChatConfig` interface
  - [ ] `StreamAnalytics` interface
  - [ ] `StreamChatMessage` interface

### 3. Build & Test Locally ⏳

- [ ] **Build Application**
  ```bash
  npm run build
  ```
  - [ ] Build completes without errors
  - [ ] No TypeScript errors
  - [ ] No ESLint warnings

- [ ] **Run Development Server**
  ```bash
  npm run dev
  ```
  - [ ] Server starts successfully
  - [ ] No console errors on startup
  - [ ] Can access application

- [ ] **Test New Stream Creation**
  - [ ] Navigate to admin memorial page
  - [ ] Create new stream
  - [ ] Verify Mux credentials appear (purple box)
  - [ ] Copy RTMP URL and Stream Key
  - [ ] Verify in browser console:
    - `🎬 [STREAMS API - MUX] Creating Mux live stream`
    - `✅ [STREAMS API - MUX] Mux live stream created successfully`
    - `✅ [STREAMS API - MUX] Mux chat space created successfully`

---

## STAGING DEPLOYMENT

### 4. Deploy to Staging ⏳

- [ ] **Push Code to Staging Branch**
  ```bash
  git add .
  git commit -m "feat: Mux streaming platform integration"
  git push origin staging
  ```

- [ ] **Set Staging Environment Variables**
  - [ ] Add `MUX_TOKEN_ID` to staging environment
  - [ ] Add `MUX_TOKEN_SECRET` to staging environment
  - [ ] Add `MUX_WEBHOOK_SECRET` to staging environment

- [ ] **Deploy Staging Application**
  - [ ] Trigger deployment pipeline
  - [ ] Wait for deployment to complete
  - [ ] Verify deployment successful

- [ ] **Update Mux Webhook URL for Staging**
  - Navigate to https://dashboard.mux.com/settings/webhooks
  - Create separate webhook for staging OR update existing
  - URL: `https://staging.yourdomain.com/api/webhooks/mux`

### 5. Staging Testing ⏳

- [ ] **Test Stream Creation**
  - [ ] Create test stream in staging admin
  - [ ] Verify RTMP credentials generated
  - [ ] Check Firestore for stream document
  - [ ] Verify `mux` object populated
  - [ ] Verify `chat` object populated

- [ ] **Test OBS Streaming**
  - [ ] Open OBS Studio
  - [ ] Configure with staging RTMP URL/key
  - [ ] Start streaming
  - [ ] Verify stream goes live
  - [ ] Check webhook logs for `video.live_stream.active`
  - [ ] Verify stream status updated to 'live' in Firestore

- [ ] **Test Live Viewing**
  - [ ] Navigate to memorial page
  - [ ] Verify MuxVideoPlayer displays
  - [ ] Verify video playback works
  - [ ] Check browser console for player logs

- [ ] **Test Chat**
  - [ ] Verify LiveChatWidget displays
  - [ ] Send test message as anonymous user
  - [ ] Verify message appears
  - [ ] Send message as authenticated user
  - [ ] Verify real-time polling works

- [ ] **Test Chat Moderation**
  - [ ] Navigate to admin moderation (if implemented)
  - [ ] View chat messages
  - [ ] Delete a test message
  - [ ] Verify message marked as deleted
  - [ ] Verify deletion appears in UI

- [ ] **Test Analytics**
  - [ ] Navigate to admin analytics (if implemented)
  - [ ] View analytics dashboard
  - [ ] Verify viewer count displays
  - [ ] Wait 10 seconds, verify auto-refresh

- [ ] **Test Recording**
  - [ ] Stop OBS stream
  - [ ] Check webhook logs for `video.live_stream.idle`
  - [ ] Wait for `video.asset.ready` webhook
  - [ ] Verify stream status updated to 'completed'
  - [ ] Verify `mux.recordingReady` = true
  - [ ] Navigate to memorial page
  - [ ] Verify VOD playback works

- [ ] **Test Legacy Streams**
  - [ ] View existing Cloudflare stream
  - [ ] Verify iframe player still works
  - [ ] Verify no errors in console
  - [ ] Confirm green "Legacy" badge in admin

### 6. Migration Testing (OPTIONAL) ⏳

**Note:** Migration is OPTIONAL. New streams automatically use Mux. Existing streams continue working unchanged.

**Only proceed with migration if you want to:**
- Add chat capabilities to existing streams
- Add analytics to existing streams
- Consolidate all streams on single platform

- [ ] **Test Migration Script (Dry Run)**
  ```bash
  npx tsx scripts/migrate-cloudflare-to-mux.ts --dry-run --limit=5
  ```
  - [ ] Script runs without errors
  - [ ] Logs show eligible streams found
  - [ ] Logs show Mux resources would be created
  - [ ] No actual changes made

- [ ] **Test Migration Script (Live - Single Stream)**
  ```bash
  npx tsx scripts/migrate-cloudflare-to-mux.ts --stream-id=TEST_STREAM_ID
  ```
  - [ ] Script completes successfully
  - [ ] Mux live stream created
  - [ ] Mux chat space created
  - [ ] Firestore updated with `mux` config
  - [ ] Legacy Cloudflare ID preserved
  - [ ] Stream still functional

- [ ] **Verify Migrated Stream**
  - [ ] View stream in admin
  - [ ] Verify purple "Mux Platform" badge
  - [ ] Verify RTMP credentials display
  - [ ] Test creating NEW stream after migration
  - [ ] Verify no interference

**Alternative: Skip Migration Entirely**
- [ ] Verify NEW streams use Mux automatically
- [ ] Verify existing streams continue working
- [ ] Document multi-platform support strategy
- [ ] Keep migration script available for future use

---

## PRODUCTION DEPLOYMENT

### 7. Production Preparation ⏳

- [ ] **Final Code Review**
  - [ ] All staging tests passed
  - [ ] No known bugs or issues
  - [ ] All console.log statements appropriate
  - [ ] No hardcoded test data

- [ ] **Create Production Mux Webhook**
  - Navigate to https://dashboard.mux.com/settings/webhooks
  - Create production webhook
  - URL: `https://yourdomain.com/api/webhooks/mux`
  - Copy new signing secret

- [ ] **Documentation Review**
  - [ ] WBS document complete
  - [ ] Implementation summary accurate
  - [ ] Journey document finalized
  - [ ] Admin integration example clear

### 8. Deploy to Production ⏳

- [ ] **Merge to Main Branch**
  ```bash
  git checkout main
  git merge staging
  git push origin main
  ```

- [ ] **Set Production Environment Variables**
  - [ ] Add `MUX_TOKEN_ID` (production)
  - [ ] Add `MUX_TOKEN_SECRET` (production)
  - [ ] Add `MUX_WEBHOOK_SECRET` (production)
  - [ ] Verify existing env vars still set

- [ ] **Deploy Production Application**
  - [ ] Trigger production deployment
  - [ ] Monitor deployment logs
  - [ ] Verify deployment successful
  - [ ] Check application health

### 9. Production Smoke Tests ⏳

- [ ] **Test New Stream Creation**
  - [ ] Create test stream
  - [ ] Verify Mux credentials
  - [ ] Test OBS streaming
  - [ ] Verify live viewing
  - [ ] Test chat functionality
  - [ ] Verify recording creation

- [ ] **Monitor First Production Stream**
  - [ ] Watch server logs during stream
  - [ ] Monitor Mux dashboard
  - [ ] Check webhook delivery
  - [ ] Verify status updates
  - [ ] Confirm recording processed

### 10. Migration to Production (OPTIONAL - SKIP THIS SECTION) ⏳

**IMPORTANT: This section is OPTIONAL and NOT REQUIRED for deployment.**

**Current Strategy:**
- ✅ NEW streams automatically use Mux
- ✅ Existing Cloudflare/Vimeo streams continue working
- ✅ Multi-platform support is permanent
- ✅ No migration needed

**Only proceed with migration IF you specifically want to:**
- Add chat to existing Cloudflare streams
- Add analytics to existing Cloudflare streams
- Unify all streams on single platform

**If skipping migration (recommended):**
- [ ] Verify NEW streams use Mux automatically
- [ ] Verify existing streams continue working
- [ ] Document that system supports multiple platforms
- [ ] DONE - Ready for production

**If proceeding with optional migration:**

- [ ] **Backup Current Database**
  - [ ] Export Firestore streams collection
  - [ ] Save backup locally
  - [ ] Verify backup integrity

- [ ] **Run Production Migration (Small Batch)**
  ```bash
  npx tsx scripts/migrate-cloudflare-to-mux.ts --limit=10
  ```
  - [ ] Migration completes successfully
  - [ ] Verify migrated streams functional
  - [ ] Check for any errors
  - [ ] Monitor for issues

- [ ] **Full Production Migration**
  ```bash
  npx tsx scripts/migrate-cloudflare-to-mux.ts
  ```
  - [ ] All eligible streams migrated
  - [ ] No migration errors
  - [ ] Firestore data validated
  - [ ] Legacy streams still work

---

## POST-DEPLOYMENT MONITORING

### 11. Monitor First 24 Hours ⏳

- [ ] **Server Logs**
  - [ ] No unexpected errors
  - [ ] Webhook deliveries successful
  - [ ] API response times normal
  - [ ] No memory leaks

- [ ] **Mux Dashboard**
  - [ ] Live streams showing correctly
  - [ ] Recording processing normally
  - [ ] No failed webhooks
  - [ ] Bandwidth usage as expected

- [ ] **User Feedback**
  - [ ] No reported issues with streaming
  - [ ] Chat functionality working
  - [ ] Recording playback working
  - [ ] OBS setup straightforward

### 12. Performance Metrics ⏳

- [ ] **Track Key Metrics**
  - Average stream creation time: `_____`
  - Average time to live: `_____`
  - Average recording processing time: `_____`
  - Chat message latency: `_____`
  - Analytics refresh rate: `_____`

- [ ] **Cost Monitoring**
  - Review Mux usage dashboard
  - Compare to estimates ($5-10/stream)
  - Adjust projections if needed

---

## ROLLBACK PLAN (If Needed)

### Emergency Rollback Steps

1. **Revert Code Deployment**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Switch Back to Cloudflare**
   - Previous stream creation still uses Cloudflare
   - Migrated streams keep legacy IDs
   - Can manually update streams to use Cloudflare

3. **Database Rollback** (Last Resort)
   - Restore from backup
   - Run reverse migration script
   - Verify data integrity

---

## COMPLETION CHECKLIST

- [ ] All staging tests passed
- [ ] Production deployment successful
- [ ] First production stream successful
- [ ] Migration completed (if applicable)
- [ ] 24-hour monitoring completed
- [ ] No critical issues reported
- [ ] Team trained on new features
- [ ] Documentation updated
- [ ] Metrics tracking in place

---

## SUCCESS CRITERIA

✅ **Technical Success:**
- New streams use Mux platform
- RTMP streaming works reliably
- Chat functionality operational
- Analytics display correctly
- Recordings process automatically
- Webhooks deliver successfully

✅ **User Success:**
- Admins can create streams easily
- Broadcasters can use OBS
- Viewers can watch live streams
- Chat enhances engagement
- Recordings available promptly

✅ **Business Success:**
- Cost per stream within budget
- Performance meets SLAs
- User satisfaction maintained
- Feature parity with Cloudflare
- New capabilities enable growth

---

**DEPLOYMENT APPROVED BY:** _______________________

**DATE:** _______________________

**NOTES:**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

---

**END OF CHECKLIST**
