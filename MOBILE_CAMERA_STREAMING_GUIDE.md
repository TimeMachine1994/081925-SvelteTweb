# 📱 Mobile Camera Streaming Guide

## 🎯 Overview

The Mobile Input arm type allows you to use a **phone/tablet as a camera** and stream that feed into OBS. Perfect for multi-camera funeral setups!

---

## 🔄 How It Works

```
Phone Browser → WHIP → Cloudflare → Iframe URL → OBS → Main Stream
   (Camera)   (WebRTC)  (Stream)   (Browser Src)  (Mix)  (Broadcast)
```

### **The Flow:**

1. **Admin arms stream** with "Mobile Input"
2. **Link is generated** for mobile streaming page
3. **Send link to phone operator** (text/email/etc)
4. **Phone opens link** in browser (Chrome/Safari)
5. **Grant camera/mic permissions**
6. **Click "Start Streaming"**
7. **Phone starts broadcasting** to Cloudflare via WHIP (WebRTC)
8. **Cloudflare generates live stream**
9. **Copy Browser Source URL (iframe) into OBS** as Browser Source
10. **Phone camera appears in OBS!** 📹

---

## 📋 Step-by-Step Setup

### **Part 1: Admin Setup**

1. **Go to Stream Management**
   - `/memorials/[id]/manage-streams`

2. **Arm Stream as "Mobile Input"**
   - Click dropdown → Select "Mobile Input"
   - Click "Arm"

3. **Copy Mobile Link**
   - Purple box appears with mobile streaming link
   - Click "Copy Link"
   - Send to phone operator via text/email

### **Part 2: Phone Operator**

1. **Open Link on Phone**
   - Use Chrome on Android or Safari on iOS
   - Link format: `https://yoursite.com/stream/mobile/[streamId]`

2. **Grant Permissions**
   - Browser will ask for camera and microphone access
   - Click "Allow"

3. **Start Streaming**
   - Click "📹 Start Streaming" button
   - Phone camera preview appears
   - "LIVE" indicator shows when broadcasting

4. **Keep Phone Active**
   - Don't minimize app or switch tabs
   - Keep phone plugged in (battery drains fast)
   - Use WiFi if available for stability

### **Part 3: OBS Setup**

**Method 1: Browser Source (Recommended)** ✅

1. **Copy Browser Source URL**
   - Browser Source URL is shown on the mobile page (top box with ✅)
   - Format: `https://iframe.cloudflarestream.com/{inputId}`
   - Click "Copy" button

2. **Add to OBS**
   - Open OBS Studio
   - Click **+** in Sources
   - Select **"Browser"**
   - Name it (e.g., "Mobile Camera 1")
   - Paste Browser Source URL into **"URL"** field
   - Set **Width: 1920**, **Height: 1080**
   - Click OK

3. **Phone Camera in OBS!**
   - Feed appears in OBS immediately
   - Best quality and lowest latency
   - Position/resize as needed
   - Mix with other cameras/sources
   - Stream to memorial page via main stream

---

**Method 2: Media Source (Alternative)**

If Browser Source doesn't work for some reason:

1. **Copy HLS URL**
   - HLS URL is shown in the alternative box on mobile page
   - Format: `https://customer-xxx.cloudflarestream.com/xxx/manifest/video.m3u8`
   - Click "Copy" button

2. **Add to OBS**
   - Open OBS Studio
   - Click **+** in Sources
   - Select **"Media Source"**
   - Name it (e.g., "Mobile Camera HLS")
   - **Uncheck** "Local File"
   - Paste HLS URL into **"Input"** field
   - **Check** "Restart playback when source becomes active"
   - Click OK

---

## 🎬 Use Cases

### **Multi-Camera Funerals**
```
Phone 1 (Wide angle) ─┐
Phone 2 (Close-up)   ─┤→ OBS → Memorial Stream
Phone 3 (Crowd)      ─┘
```

### **Remote Operators**
- Family member streams from graveside
- Someone captures crowd reactions
- Outdoor service with roving camera

### **Quick Setup**
- No need for expensive cameras
- Use phones everyone already has
- No HDMI capture cards needed

---

## ⚡ Key Features

### ✅ **Browser-Based**
- No app to download
- Works in Chrome/Safari
- Cross-platform (iOS/Android)

### ✅ **Low Latency**
- WHIP uses WebRTC (real-time)
- 2-5 second delay typical
- Good for live mixing

### ✅ **OBS Integration**
- Browser Source (iframe) for best quality
- HLS playback as fallback
- Treat like any other source
- Positioning, filters, transitions all work

### ✅ **Cloudflare Reliability**
- Enterprise-grade CDN
- Automatic scaling
- Global edge network

---

## 🔧 Technical Details

### **Protocols:**

- **WHIP** (WebRTC-HTTP Ingestion Protocol)
  - Phone → Cloudflare streaming
  - Real-time, low latency
  - Browser native support

- **Browser Source / Iframe Embed** (Recommended)
  - Cloudflare → OBS playback
  - Best quality and lowest latency
  - OBS Browser Source compatible
  - Direct embed of live stream player

- **HLS** (HTTP Live Streaming) (Alternative)
  - Cloudflare → OBS playback
  - Standard streaming protocol
  - OBS Media Source compatible
  - Fallback if Browser Source unavailable

### **Stream Quality:**

Phone streams at:
- **Video:** 1280x720 @ 30fps (ideal settings)
- **Audio:** Echo cancellation, noise suppression enabled
- **Bitrate:** Adaptive based on connection

### **URLs Generated:**

1. **Mobile Streaming Page:**
   ```
   https://yoursite.com/stream/mobile/{streamId}
   ```

2. **WHIP Endpoint (internal):**
   ```
   https://customer-xxx.cloudflarestream.com/{inputId}/webrtc/publish
   ```

3. **Browser Source / Iframe URL (for OBS - Recommended):**
   ```
   https://iframe.cloudflarestream.com/{inputId}
   ```

4. **HLS Playback (for OBS - Alternative):**
   ```
   https://customer-xxx.cloudflarestream.com/{inputId}/manifest/video.m3u8
   ```

---

## 💡 Tips & Best Practices

### **For Phone Operators:**

1. **Battery Life**
   - Keep phone plugged in
   - Streaming is battery-intensive
   - Bring power bank for outdoor locations

2. **Network**
   - WiFi is more stable than cellular
   - Test connection before service
   - Have backup 4G/5G if WiFi fails

3. **Positioning**
   - Use phone holder/tripod
   - Landscape orientation (rotate phone sideways)
   - Test framing before going live

4. **App Management**
   - Keep browser tab active
   - Don't minimize or switch apps
   - Disable auto-lock/sleep

### **For OBS Operators:**

1. **Source Settings**
   - **Browser Source (Recommended):** Set Width: 1920, Height: 1080
   - **Media Source (Alternative):** Check "Restart playback when source becomes active"
   - Browser Source typically has lower latency
   - Set buffering to 1-2 seconds if using Media Source

2. **Monitoring**
   - Add audio meter for phone camera
   - Monitor for frozen frames
   - Have phone operator's contact ready
   - Browser Source auto-reconnects on interruptions

3. **Layouts**
   - Create scenes for multi-camera switching
   - Pre-configure positions/sizes
   - Test scene transitions before service

### **For Network Stability:**

1. **Test Before Service**
   - Start streaming 10-15 minutes early
   - Check OBS feed quality
   - Confirm audio levels

2. **Bandwidth Requirements**
   - Upload: ~2-4 Mbps per phone
   - Download (OBS): ~1-2 Mbps per feed
   - Test with speed test app

3. **Backup Plan**
   - Have USB camera as backup
   - Know how to switch sources quickly
   - Communicate with phone operator

---

## 🐛 Troubleshooting

### **Phone Not Streaming**

**Symptom:** "Start Streaming" button doesn't work

**Solutions:**
- Check camera/mic permissions in browser
- Try Safari (iOS) or Chrome (Android)
- Reload page and try again
- Ensure stream is armed in admin

---

### **OBS Shows Black Screen**

**Symptom:** Source added but no video

**Solutions:**

**For Browser Source:**
- Verify iframe URL is correct (`https://iframe.cloudflarestream.com/...`)
- Ensure Width: 1920, Height: 1080 is set
- Check that phone is actually streaming (LIVE indicator)
- Try refreshing the browser source (right-click → Refresh)
- Check browser console for errors

**For Media Source:**
- Verify HLS URL is correct
- **Uncheck** "Local File"
- Check "Restart playback when source becomes active"
- Ensure phone is actually streaming (check LIVE indicator)
- Wait 10-15 seconds for stream to buffer
- Try toggling source visibility in OBS

**If both fail:**
- Try using Browser Source instead of Media Source
- Browser Source typically works more reliably for live streams

---

### **Stream Keeps Cutting Out**

**Symptom:** Video freezes or drops frequently

**Solutions:**
- Switch from cellular to WiFi
- Move closer to WiFi router
- Check upload speed on phone
- Reduce activity on network (pause other devices)
- Lower video quality expectations

---

### **Audio Out of Sync**

**Symptom:** Audio doesn't match video

**Solutions:**
- In OBS: Right-click Media Source → Filters → Add "Video Delay"
- Adjust sync offset (usually 100-500ms)
- Test with clapping hands in frame

---

## 📊 Comparison: Mobile Input vs Stream Key

| Feature | Mobile Input | Stream Key (OBS) |
|---------|-------------|------------------|
| **Equipment** | Just a phone | Camera + encoder/OBS |
| **Setup Time** | 2 minutes | 10+ minutes |
| **Quality** | 720p mobile camera | Professional camera quality |
| **Latency** | 2-5 seconds | 5-15 seconds |
| **Reliability** | Depends on phone/network | More stable |
| **Use Case** | Quick/multi-camera | Main professional stream |
| **Cost** | $0 (use existing phone) | $$$ (cameras, equipment) |

---

## 🎯 Real-World Example

### **Funeral with 3 Cameras:**

**Setup:**
- **Main Camera:** Canon DSLR → OBS (Stream Key arm type)
- **Wide Camera:** iPhone on tripod → OBS (Mobile Input #1)
- **Close Camera:** Android tablet → OBS (Mobile Input #2)

**OBS Scenes:**
1. **Main View:** Just the main camera
2. **Split Screen:** Main + Wide
3. **Picture-in-Picture:** Main (large) + Close (small corner)
4. **Wide Only:** For procession shots

**Result:**
- Professional multi-camera production
- Total equipment cost: ~$50 (phone holders)
- Broadcast quality memorial service
- Family watches from home with perfect view

---

## 📁 Key Files

### **Mobile Streaming Page:**
- **Frontend:** `/stream/mobile/[streamId]/+page.svelte`
- **Backend:** `/stream/mobile/[streamId]/+page.server.ts`

### **Components:**
- **BrowserStreamer:** `/lib/components/BrowserStreamer.svelte`
- **WHIPClient:** `/lib/utils/whip-client.ts`

### **Admin:**
- **Stream Management:** `/memorials/[id]/manage-streams`
- **StreamCard:** Shows mobile link when armed

---

## ✅ Summary

Mobile Input streaming allows you to:
- ✅ Use phones as cameras
- ✅ Stream phone feed to OBS via Browser Source (recommended) or HLS (fallback)
- ✅ Create multi-camera setups affordably
- ✅ No apps or downloads needed
- ✅ Browser-based (Chrome/Safari)
- ✅ Low latency via WHIP/WebRTC
- ✅ Perfect for funerals and memorial services

**The flow is simple:**
```
Arm → Send Link → Phone Streams → Copy iframe URL → Add Browser Source → Go Live! 🎉
```

**Alternative:** Copy HLS URL → Add Media Source → Go Live!
