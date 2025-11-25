# Multi-Stream Recording System

## 🎯 How It Works

Your event pages now support **multiple streams and recordings** with smart display logic.

---

## 📺 **Stream Lifecycle**

### **1. Stream Created**
- Status: `scheduled` or `ready`
- Shows: Countdown timer (if scheduled in future)
- Visibility: Public by default

### **2. Stream Goes Live**
- Status: `scheduled` → `live` (via webhook or smart detection)
- Shows: Live video player in "Live Now" section
- Countdown: Automatically removed
- Result: **One live player visible**

### **3. Stream Ends**
- Status: `live` → `completed`
- Shows: Moves to "Service Recording" section
- Video: Recording/playback URL from Cloudflare
- Result: **Recording preserved on page**

### **4. Second Stream Goes Live**
- Status: `scheduled` → `live`
- Shows: **NEW** live player in "Live Now" section
- Previous Recording: **Still visible** in "Service Recording" section
- Result: **Live player + Previous recording both visible**

### **5. Second Stream Ends**
- Status: `live` → `completed`
- Shows: **TWO recordings** in "Service Recording" section
- Result: **Both recordings preserved**

---

## 🎬 **Display Sections**

### **Live Now Section**
```svelte
{#if categorizedLiveStreams.length > 0}
  {#each categorizedLiveStreams as stream}
    <!-- Live video player -->
  {/each}
{/if}
```

**Shows:**
- Any stream with `status === 'live'`
- OR streams with Cloudflare Input ID (streaming-ready)
- Multiple live streams can show simultaneously

### **Upcoming Service Section**
```svelte
{#if scheduledStreams.length > 0}
  {#each scheduledStreams as stream}
    <!-- Countdown timer -->
  {/each}
{/if}
```

**Shows:**
- Streams with future `scheduledStartTime`
- Automatically removed when stream goes live
- Multiple upcoming streams supported

### **Service Recording Section**
```svelte
{#if recordedStreams.length > 0}
  {#each recordedStreams as stream}
    <!-- Recording player -->
  {/each}
{/if}
```

**Shows:**
- Streams with `status === 'completed'`
- OR `recordingReady === true`
- **All recordings preserved and visible**

---

## 👁️ **Visibility Control**

### **Admin Interface**
Location: `/memorials/[id]/manage-streams`

Each stream has a visibility toggle button:

```
Public → Hidden → Archived → Public
  👁️      🚫        📦        👁️
```

### **Visibility States**

#### **Public** (default)
- `visibility: 'public'`
- `isVisible: true`
- ✅ Shows on event page
- ✅ Shows in all relevant sections (live/scheduled/recorded)

#### **Hidden**
- `visibility: 'hidden'`
- `isVisible: false`
- ❌ Hidden from event page
- ✅ Still visible in admin
- Use case: Temporarily hide a recording

#### **Archived**
- `visibility: 'archived'`
- `isVisible: false`
- ❌ Hidden from event page
- ✅ Still visible in admin (marked as archived)
- Use case: Old recordings you want to keep but not display

---

## 🔄 **How Multiple Streams Work**

### **Example Timeline:**

```
Day 1: Funeral Service
  ↓
Create Stream 1 → Go Live → Stream Ends
  ↓
Recording 1 appears on event page

Day 7: Event Service
  ↓
Create Stream 2 → Go Live
  ↓
Live Stream 2 shows on page
Recording 1 STILL shows on page

Stream 2 Ends
  ↓
Recording 1 + Recording 2 both show on page
```

### **Result:**
- All recordings preserved
- Family can watch any past service
- Each stream is a separate Firestore document
- No overwriting or replacement

---

## 🎯 **Smart Live Detection**

Streams show as "Live Now" if:

1. **Explicitly live**: `status === 'live'` ✅
2. **Past scheduled time**: Current time > `scheduledStartTime` ✅
3. **Has Cloudflare ID**: Stream is armed and ready ✅

This ensures streams appear immediately when broadcasting, even if:
- Scheduled time is wrong
- Webhook hasn't fired yet
- You go live early

---

## 🔧 **Admin Controls**

### **Per-Stream Actions:**

1. **Visibility Toggle**
   - Click eye icon to toggle: Public → Hidden → Archived
   - Updates immediately
   - Controlled via: `/api/streams/[streamId]/visibility`

2. **Edit Start Time**
   - Update scheduled time for countdown
   - Doesn't affect live detection
   - Stream shows when ready regardless of schedule

3. **Stop Stream**
   - Manually end a live stream
   - Changes status to `completed`
   - Moves to recording section

4. **Arm Stream**
   - Generate streaming credentials
   - Choose: Mobile Input, Mobile Streaming, or Stream Key
   - Required before going live

---

## 📊 **Data Structure**

### **Stream Document**
```typescript
{
  id: string,
  title: string,
  description?: string,
  status: 'scheduled' | 'ready' | 'live' | 'completed',
  
  // Visibility
  visibility: 'public' | 'hidden' | 'archived',
  isVisible: boolean, // Derived from visibility
  
  // Timing
  scheduledStartTime?: string,
  liveStartedAt?: string,
  liveEndedAt?: string,
  
  // Playback
  liveWatchUrl?: string, // Set by webhook when live
  playbackUrl?: string,  // Set when recording ready
  embedUrl?: string,
  
  // Cloudflare
  streamCredentials: {
    cloudflareInputId: string,
    whipUrl?: string,
    rtmpUrl?: string,
    streamKey?: string
  },
  
  // Recording
  recordingReady: boolean,
  
  // Metadata
  memorialId: string,
  createdBy: string,
  createdAt: string,
  updatedAt: string
}
```

---

## ✅ **Key Features**

### **✨ Multiple Live Streams**
- Create unlimited streams per event
- Each gets own Cloudflare Input ID
- Multiple can broadcast simultaneously

### **📼 Preserved Recordings**
- All recordings kept permanently (unless hidden/archived)
- Each recording displayed separately
- No overwriting or deletion

### **👁️ Granular Visibility**
- Show/hide individual streams
- Archive old recordings
- Full admin control

### **⚡ Instant Display**
- No page refresh needed
- Real-time Firestore listeners
- Automatic status transitions

### **🎨 Clean UI**
- Sections for Live, Scheduled, Recorded
- No duplicates
- Professional appearance

---

## 🚀 **Usage Flow**

### **For Admins:**

1. **Create Stream**
   - Go to Stream Management
   - Click "Create Stream"
   - Enter details and scheduled time

2. **Arm Stream**
   - Choose arm type (Mobile/OBS)
   - Get credentials

3. **Go Live**
   - Start streaming with credentials
   - Stream automatically appears on event page

4. **Manage Visibility**
   - Toggle visibility as needed
   - Hide old recordings
   - Archive unused streams

### **For Viewers:**

1. **Visit Event Page**
   - See live streams immediately (if any)
   - See countdown for upcoming streams
   - Watch any past recordings

2. **Auto-Updates**
   - Page updates in real-time
   - No refresh needed
   - Smooth transitions

---

## 📁 **Key Files**

### **Components:**
- `MemorialStreamDisplay.svelte` - Event page display
- `StreamCard.svelte` - Admin stream management card

### **API Endpoints:**
- `/api/streams/[streamId]/visibility` - Toggle visibility
- `/api/webhooks/cloudflare-stream` - Webhook handler
- `/api/streams/[streamId]/arm` - Arm stream
- `/api/streams/[streamId]/stop` - Stop stream

### **Pages:**
- `/memorials/[id]/manage-streams` - Admin management
- `/[fullSlug]` - Public event page

---

## 🎉 **Summary**

You now have a complete multi-stream system that:
- ✅ Shows streams live immediately
- ✅ Preserves all recordings
- ✅ Allows multiple simultaneous streams
- ✅ Provides admin visibility controls
- ✅ Updates in real-time
- ✅ Works without webhooks (smart detection)

**Each event can have:**
- Unlimited streams
- Multiple live streams at once
- Preserved recording history
- Granular visibility control

Perfect for memorials with multiple services (funeral, event, celebration of life, etc.)!
