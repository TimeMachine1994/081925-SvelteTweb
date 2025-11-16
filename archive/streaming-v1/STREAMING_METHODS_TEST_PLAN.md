# Streaming Methods Test Plan

**Created:** October 29, 2025  
**Test Coverage:** All 3 streaming methods + method selection  
**Environment:** Development & Production

---

## 🎯 Testing Objectives

1. **Verify all three streaming methods work end-to-end**
2. **Ensure backward compatibility with existing streams**
3. **Test error handling and edge cases**
4. **Validate UI/UX across devices**
5. **Confirm recording functionality**

---

## ✅ Test Cases by Method

### **Method Selection**

#### TC-MS-01: New Stream Creation
- [ ] Create new stream via memorial stream manager
- [ ] Verify stream created with `methodConfigured: false`
- [ ] Navigate to stream management page
- [ ] **Expected:** Method selection UI appears with 3 options
- [ ] **Expected:** Cards show icons, titles, descriptions
- [ ] **Expected:** All 3 methods are clickable (no "Coming Soon")

#### TC-MS-02: Method Selection - OBS
- [ ] Click "💻 OBS" card
- [ ] **Expected:** API call to `/api/streams/management/[id]` with `streamingMethod: 'obs'`
- [ ] **Expected:** Page reloads
- [ ] **Expected:** OBS credentials UI appears
- [ ] **Expected:** No method selection shown anymore

#### TC-MS-03: Method Selection - Phone to OBS
- [ ] Click "📱➡️💻 Phone to OBS" card
- [ ] **Expected:** API call with `streamingMethod: 'phone-to-obs'`
- [ ] **Expected:** Page reloads
- [ ] **Expected:** Two-panel UI appears (OBS + Phone)
- [ ] **Expected:** BrowserStreamer component visible

#### TC-MS-04: Method Selection - Phone to MUX
- [ ] Click "📱 Phone to MUX" card
- [ ] **Expected:** API call with `streamingMethod: 'phone-to-mux'`
- [ ] **Expected:** Page reloads
- [ ] **Expected:** Dual recording architecture UI appears
- [ ] **Expected:** BrowserStreamer component visible

#### TC-MS-05: Error Handling
- [ ] Disconnect internet during method selection
- [ ] Click a method card
- [ ] **Expected:** Error message appears
- [ ] **Expected:** User can retry
- [ ] **Expected:** Method selection UI still shown

---

### **OBS Method**

#### TC-OBS-01: Credentials Display
- [ ] Stream with `streamingMethod: 'obs'` configured
- [ ] Navigate to stream page
- [ ] **Expected:** OBS Method UI displayed
- [ ] **Expected:** RTMP URL visible and read-only
- [ ] **Expected:** Stream Key visible (password masked)
- [ ] **Expected:** Setup instructions visible

#### TC-OBS-02: Copy Functionality
- [ ] Click copy button next to RTMP URL
- [ ] **Expected:** URL copied to clipboard
- [ ] **Expected:** Check icon appears briefly
- [ ] Click copy button next to Stream Key
- [ ] **Expected:** Key copied to clipboard
- [ ] **Expected:** Check icon appears briefly

#### TC-OBS-03: OBS Integration
- [ ] Copy RTMP URL to OBS Settings → Stream
- [ ] Copy Stream Key to OBS Settings → Stream
- [ ] Start streaming from OBS
- [ ] **Expected:** Stream goes live on memorial page
- [ ] **Expected:** Live indicator appears on StreamCard
- [ ] Stop streaming from OBS
- [ ] **Expected:** Stream stops
- [ ] **Expected:** Recording becomes available

#### TC-OBS-04: Live Indicator
- [ ] Stream status is 'live'
- [ ] **Expected:** Red pulsing "LIVE" badge appears
- [ ] **Expected:** Badge says "Your stream is broadcasting"
- [ ] Stream status changes to 'completed'
- [ ] **Expected:** Live badge disappears

---

### **Phone to OBS Method**

#### TC-P2O-01: Two-Panel Layout
- [ ] Stream with `streamingMethod: 'phone-to-obs'`
- [ ] **Expected:** Two panels side by side (desktop)
- [ ] **Expected:** Left panel: OBS credentials
- [ ] **Expected:** Right panel: Phone camera setup
- [ ] Resize to mobile width
- [ ] **Expected:** Panels stack vertically

#### TC-P2O-02: OBS Panel
- [ ] **Expected:** RTMP URL displayed
- [ ] **Expected:** Stream Key displayed
- [ ] **Expected:** Both have copy buttons
- [ ] **Expected:** Setup instructions visible

#### TC-P2O-03: Phone Panel
- [ ] **Expected:** Browser Source URL displayed
- [ ] **Expected:** Copy button works
- [ ] **Expected:** Instructions for OBS Browser source visible
- [ ] **Expected:** Phone stream status indicator present

#### TC-P2O-04: Phone Camera Stream
- [ ] Scroll to BrowserStreamer component
- [ ] Click "Allow Camera & Microphone"
- [ ] **Expected:** Permission request appears
- [ ] Grant permissions
- [ ] **Expected:** Video preview appears
- [ ] **Expected:** Camera/mic toggle buttons work
- [ ] Click "Start Streaming"
- [ ] **Expected:** Stream starts via WHIP
- [ ] **Expected:** Green "Phone camera active" badge appears

#### TC-P2O-05: OBS Browser Source
- [ ] Copy Browser Source URL
- [ ] Add Browser source in OBS
- [ ] Paste URL, set dimensions 1280x720
- [ ] Start phone stream
- [ ] **Expected:** Phone feed appears in OBS Browser source
- [ ] **Expected:** Live video from phone visible in OBS

#### TC-P2O-06: Complete Workflow
- [ ] Configure OBS with RTMP credentials (left panel)
- [ ] Add Browser source with phone URL (right panel)
- [ ] Start phone camera stream
- [ ] Verify phone feed in OBS
- [ ] Start OBS streaming
- [ ] **Expected:** Final mixed stream goes live on memorial
- [ ] **Expected:** Red "LIVE" badge on StreamCard
- [ ] Stop OBS streaming
- [ ] **Expected:** Recording available

#### TC-P2O-07: Independent Stream States
- [ ] Start phone stream (but not OBS)
- [ ] **Expected:** Green phone badge shows
- [ ] **Expected:** No red LIVE badge (OBS not streaming)
- [ ] Start OBS streaming
- [ ] **Expected:** Red LIVE badge appears
- [ ] Stop phone stream (OBS still running)
- [ ] **Expected:** Green badge disappears
- [ ] **Expected:** Red LIVE badge still shows

---

### **Phone to MUX Method**

#### TC-P2M-01: Dual Recording Display
- [ ] Stream with `streamingMethod: 'phone-to-mux'`
- [ ] **Expected:** Architecture visualization shown
- [ ] **Expected:** Primary Recording badge (Cloudflare)
- [ ] **Expected:** Backup Recording badge (MUX)
- [ ] If `restreamingEnabled: false`:
  - [ ] **Expected:** MUX badge shows "not configured"
- [ ] If `restreamingEnabled: true`:
  - [ ] **Expected:** MUX badge shows checkmark

#### TC-P2M-02: Phone Streaming
- [ ] Click "Allow Camera & Microphone"
- [ ] Grant permissions
- [ ] **Expected:** Video preview appears
- [ ] Click "Start Streaming"
- [ ] **Expected:** Stream starts via WHIP to Cloudflare
- [ ] **Expected:** Stream goes live on memorial instantly
- [ ] **Expected:** Red "LIVE" badge appears

#### TC-P2M-03: Recording Status (Cloudflare Only)
- [ ] MUX not configured (`restreamingEnabled: false`)
- [ ] Start streaming
- [ ] Wait for stream to end and process
- [ ] **Expected:** Cloudflare recording badge shows "Processing..."
- [ ] Wait for processing to complete
- [ ] **Expected:** Cloudflare badge shows "Recording available"
- [ ] **Expected:** No MUX recording section shown

#### TC-P2M-04: Recording Status (Dual Recording)
- [ ] MUX configured (`restreamingEnabled: true`)
- [ ] Start streaming
- [ ] Wait for stream to end
- [ ] **Expected:** Both recording badges show "Processing..."
- [ ] Wait for Cloudflare to finish
- [ ] **Expected:** Cloudflare badge shows "Recording available"
- [ ] Wait for MUX to finish
- [ ] **Expected:** MUX badge shows "Recording available"

#### TC-P2M-05: Workflow Instructions
- [ ] **Expected:** 6-step instructions visible
- [ ] **Expected:** Instructions mention both Cloudflare and MUX (if configured)
- [ ] **Expected:** Clear, simple language for non-technical users

---

### **API & Backend**

#### TC-API-01: Stream Creation with Method
- [ ] POST to `/api/memorials/[memorialId]/streams`
- [ ] Body: `{ title: "Test", streamingMethod: "obs" }`
- [ ] **Expected:** 200 OK
- [ ] **Expected:** Stream created with OBS configuration
- [ ] **Expected:** `cloudflareInputId` present
- [ ] **Expected:** `methodConfigured: true`

#### TC-API-02: Stream Creation - Phone to OBS
- [ ] POST with `streamingMethod: "phone-to-obs"`
- [ ] **Expected:** Two Cloudflare inputs created
- [ ] **Expected:** `phoneSourceStreamId` present
- [ ] **Expected:** `phoneSourcePlaybackUrl` present
- [ ] **Expected:** `phoneSourceWhipUrl` present

#### TC-API-03: Stream Creation - Phone to MUX
- [ ] POST with `streamingMethod: "phone-to-mux"`
- [ ] MUX configured
- [ ] **Expected:** Cloudflare input created
- [ ] **Expected:** MUX stream created
- [ ] **Expected:** `muxStreamId`, `muxStreamKey`, `muxPlaybackId` present
- [ ] **Expected:** `restreamingEnabled: true`

#### TC-API-04: Stream Creation - Phone to MUX (No MUX)
- [ ] Remove MUX environment variables
- [ ] POST with `streamingMethod: "phone-to-mux"`
- [ ] **Expected:** Still succeeds
- [ ] **Expected:** Cloudflare input created
- [ ] **Expected:** MUX fields empty or missing
- [ ] **Expected:** `restreamingEnabled: false`

#### TC-API-05: Stream Update - Method Selection
- [ ] PUT to `/api/streams/management/[id]`
- [ ] Body: `{ streamingMethod: "obs", methodConfigured: true }`
- [ ] **Expected:** 200 OK
- [ ] **Expected:** Stream updated
- [ ] Reload stream page
- [ ] **Expected:** Method-specific UI appears

---

### **Error Handling**

#### TC-ERR-01: No Camera Permission
- [ ] Deny camera permission
- [ ] **Expected:** Error message appears
- [ ] **Expected:** Instructions to allow permissions
- [ ] **Expected:** Can retry after allowing

#### TC-ERR-02: Network Failure During Setup
- [ ] Start creating stream with method
- [ ] Disconnect internet mid-request
- [ ] **Expected:** Error message appears
- [ ] **Expected:** Stream not created in broken state
- [ ] Reconnect internet
- [ ] **Expected:** Can retry

#### TC-ERR-03: Invalid Method
- [ ] POST with `streamingMethod: "invalid"`
- [ ] **Expected:** 400 Bad Request
- [ ] **Expected:** Error message about invalid method

#### TC-ERR-04: MUX API Failure
- [ ] Invalid MUX credentials
- [ ] Create phone-to-mux stream
- [ ] **Expected:** Still succeeds (graceful degradation)
- [ ] **Expected:** `restreamingEnabled: false`
- [ ] **Expected:** Warning logged
- [ ] **Expected:** Cloudflare-only mode

---

### **UI/UX**

#### TC-UI-01: Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] **Expected:** All layouts work correctly
- [ ] **Expected:** Phone to OBS panels stack on mobile
- [ ] **Expected:** Method selection cards resize properly

#### TC-UI-02: Copy Button Feedback
- [ ] Click any copy button
- [ ] **Expected:** Check icon appears immediately
- [ ] **Expected:** Check icon disappears after 2 seconds
- [ ] **Expected:** Tooltip or visual feedback clear

#### TC-UI-03: Loading States
- [ ] Click method selection card
- [ ] **Expected:** Button shows loading/disabled state
- [ ] **Expected:** Cannot click other cards during loading
- [ ] **Expected:** Clear visual feedback

#### TC-UI-04: Live Indicators
- [ ] Stream goes live
- [ ] **Expected:** Pulsing animation on live badge
- [ ] **Expected:** Animation smooth and not distracting
- [ ] **Expected:** Red color clearly indicates LIVE status

#### TC-UI-05: Instructions Clarity
- [ ] Read all instruction sections
- [ ] **Expected:** Clear, concise language
- [ ] **Expected:** Numbered steps easy to follow
- [ ] **Expected:** No technical jargon (or explained)

---

### **Performance**

#### TC-PERF-01: Page Load Time
- [ ] Navigate to stream with method configured
- [ ] Measure page load time
- [ ] **Expected:** < 2 seconds on good connection
- [ ] **Expected:** No JavaScript errors

#### TC-PERF-02: Method Selection Response
- [ ] Click method card
- [ ] Measure time to reload
- [ ] **Expected:** < 3 seconds total
- [ ] **Expected:** Immediate visual feedback on click

#### TC-PERF-03: BrowserStreamer Performance
- [ ] Start phone camera stream
- [ ] Monitor CPU/memory usage
- [ ] **Expected:** Reasonable resource usage
- [ ] **Expected:** No memory leaks
- [ ] Stream for 5 minutes
- [ ] **Expected:** Stable performance

---

### **Security**

#### TC-SEC-01: Stream Key Masking
- [ ] View stream key field
- [ ] **Expected:** Password field (dots/asterisks)
- [ ] Copy stream key
- [ ] **Expected:** Actual key copied
- [ ] View page source
- [ ] **Expected:** Stream key not in plaintext HTML

#### TC-SEC-02: Permission Checks
- [ ] Try to access stream without authentication
- [ ] **Expected:** 401 Unauthorized
- [ ] Try to access someone else's stream
- [ ] **Expected:** 403 Forbidden
- [ ] Admin user accessing any stream
- [ ] **Expected:** Access granted

---

## 🧪 Manual Testing Workflow

### **Setup**
1. Deploy latest code to test environment
2. Create test memorial
3. Create test streams for each method
4. Have OBS installed and configured
5. Have mobile device ready

### **Execution**
1. Run through all test cases systematically
2. Document any failures or issues
3. Take screenshots of UI issues
4. Note any error messages
5. Record timing for performance tests

### **Reporting**
- Green: ✅ Pass
- Red: ❌ Fail (with description)
- Yellow: ⚠️ Warning (works but needs improvement)

---

## 📋 Test Results Template

```markdown
## Test Results - [Date]

**Tester:** [Name]
**Environment:** [Dev/Staging/Prod]
**Browser:** [Chrome/Firefox/Safari]
**Device:** [Desktop/Mobile]

### Summary
- Total Tests: XX
- Passed: XX ✅
- Failed: XX ❌
- Warnings: XX ⚠️

### Failed Tests
1. **TC-XXX-XX:** [Test Name]
   - **Issue:** [Description]
   - **Expected:** [What should happen]
   - **Actual:** [What actually happened]
   - **Screenshot:** [Link if applicable]

### Warnings
1. **TC-XXX-XX:** [Test Name]
   - **Issue:** [Description]
   - **Recommendation:** [Suggested improvement]

### Notes
- [Any additional observations]
- [Performance concerns]
- [UX improvements]
```

---

## 🔧 Critical Path Tests (Must Pass)

Priority tests that MUST work before production:

1. ✅ **TC-MS-01:** Method selection appears for new streams
2. ✅ **TC-OBS-03:** OBS streaming works end-to-end
3. ✅ **TC-P2O-06:** Phone to OBS complete workflow
4. ✅ **TC-P2M-02:** Phone to MUX streaming works
5. ✅ **TC-API-01:** Stream creation API works
6. ✅ **TC-ERR-04:** Graceful degradation without MUX

If any of these fail, **DO NOT DEPLOY TO PRODUCTION**.

---

## 🚀 Pre-Deployment Checklist

- [ ] All critical path tests pass
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] All three methods tested end-to-end
- [ ] Mobile responsiveness confirmed
- [ ] Error handling works properly
- [ ] Documentation updated
- [ ] Team trained on new features
- [ ] Rollback plan in place

---

## 📝 Known Issues / Limitations

*(To be filled in during testing)*

1. **TypeScript Warnings:**
   - `createLiveInput` recording type mismatch
   - `webRTC` possibly undefined
   - **Impact:** None (runtime works correctly)
   - **Fix:** Update Cloudflare Stream type definitions

2. **Accessibility:**
   - Modal keyboard handlers missing
   - **Impact:** Minor (still usable)
   - **Fix:** Add keyboard event handlers

3. **[Add issues found during testing]**

---

## ✅ Sign-Off

**Developer:** [ ]  
**QA:** [ ]  
**Product Owner:** [ ]  
**Ready for Production:** [ ]

**Date:** ___________
