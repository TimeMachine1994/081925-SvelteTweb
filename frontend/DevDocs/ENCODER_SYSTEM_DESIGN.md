# Encoder System Design

A new approach to livestreaming that separates device provisioning, assignment, and activation.

---

## Problem Statement

The current system provisions streaming credentials per-stream when "armed." There's no persistent encoder/device concept that a Funeral Director can pre-configure and reuse across multiple services.

---

## Core Concept

**Three distinct operations, two user roles:**

| Operation | Who | What Happens |
|-----------|-----|--------------|
| **Create Encoder** | `<SA>` | Registers a physical device with persistent RTMP credentials |
| **Assign Encoder** | `<FD>` | Associates an encoder with a specific memorial |
| **Arm Encoder** | `<FD>` | Activates the encoder so streams appear to viewers |

---

## User Personas

| Tag | Role | Encoder Permissions |
|-----|------|---------------------|
| `<SA>` | Super Admin | Create, edit, delete encoders; view all assignments |
| `<FD>` | Funeral Director | Assign encoders to their memorials; arm/disarm |

---

## Detailed Flow

### 1. `<SA>` Creates Encoder Registry

The Super Admin sets up physical streaming devices in the system.

**Steps:**
1. `<SA>` navigates to Admin → Encoders
2. Clicks "Add New Encoder"
3. System calls Cloudflare `createLiveInput()` to provision persistent RTMP endpoint
4. `<SA>` names the encoder (e.g., "Encoder #3 - Orlando Office")
5. Encoder saved to Firestore with RTMP URL + Stream Key
6. `<SA>` configures the physical device (phone/hardware encoder) with these credentials

*LOGIC* - The RTMP credentials are **persistent**. The device can stream to this URL anytime; whether it shows to viewers depends on assignment + arm status.

### 2. `<FD>` Assigns Encoder to Memorial

From the Funeral Director Dashboard, per memorial:

**Steps:**
1. `<FD>` views their list of memorials
2. For a specific memorial, clicks "Streaming Settings" or "Add Encoder"
3. Sees dropdown of available encoders (those not currently assigned elsewhere, or all if reassignment allowed)
4. Selects encoder → saved to memorial document
5. Optionally sets scheduled start time for the service

*LOGIC* - Assignment is just a **mapping**. No stream appears yet.

<2.1> If encoder is already assigned to another memorial, system can either:
- Warn and allow reassignment (single-use at a time)
- Block until previous service is complete

### 3. `<FD>` Arms the Encoder

Before the service begins:

**Steps:**
1. `<FD>` returns to memorial streaming settings
2. Clicks "Arm Encoder" button
3. System sets `encoderArmed: true` on the memorial
4. Confirmation shown: "Encoder armed. When you go live, viewers will see the stream."

*LOGIC* - Only armed encoders broadcast to memorial pages.

<3.1> The arm status can include optional fields:
- `armedAt`: timestamp
- `armedBy`: user UID
- `armedUntil`: optional auto-disarm time

### 4. Streaming & Webhook Behavior

When the physical device streams:

**Current Behavior (Cloudflare webhook receives `live-inprogress`):**
1. Webhook looks up stream by `cloudflareInputId`
2. Updates stream status to `live`
3. Memorial page shows video player

**New Behavior with Encoder System:**
1. Webhook receives `live-inprogress` with `cloudflareInputId`
2. System looks up encoder by `cloudflareInputId`
3. System finds memorial(s) where this encoder is assigned
4. **Checks if `encoderArmed: true`**
   - If YES → Update memorial stream status to `live`, show to viewers
   - If NO → Log the stream but **do not show to viewers** (or show "Encoder not armed" to admin)

<4.1> This allows:
- Testing streams without going public
- Pre-configuring devices without accidental broadcasts
- Easy on/off control for funeral directors

### 5. Post-Service

After the service:

**Steps:**
1. `<FD>` clicks "Disarm Encoder"
2. System sets `encoderArmed: false`
3. If encoder needs to be used for another memorial, `<FD>` reassigns it

*LOGIC* - Recordings are still saved regardless of arm status (configurable).

---

## Data Model

### `encoders` Collection (SA-managed)

```typescript
interface Encoder {
  id: string;
  name: string;                    // "Encoder #3 - Orlando Office"
  description?: string;
  
  // Cloudflare credentials (persistent)
  cloudflareInputId: string;
  rtmpUrl: string;
  streamKey: string;
  whipUrl?: string;                // Optional for browser-based streaming
  
  // Status
  status: 'available' | 'assigned' | 'maintenance';
  currentAssignment?: {
    memorialId: string;
    funeralDirectorId: string;
    assignedAt: string;
  };
  
  // Metadata
  createdAt: string;
  createdBy: string;               // SA user UID
  updatedAt: string;
  
  // Optional: physical device info
  deviceType?: 'phone' | 'hardware' | 'obs';
  location?: string;
}
```

### Memorial Document Updates

```typescript
// Added fields to memorial document
interface MemorialStreamingConfig {
  assignedEncoderId?: string;      // Reference to encoder
  encoderArmed: boolean;           // Is it active?
  armedAt?: string;
  armedBy?: string;
  scheduledStartTime?: string;     // For countdown timer
  
  // Current stream state (updated by webhook)
  streamStatus?: 'offline' | 'live' | 'completed';
  liveStartedAt?: string;
  liveWatchUrl?: string;
  hlsUrl?: string;
}
```

---

## API Routes Needed

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/admin/encoders` | List all encoders (SA) |
| `POST` | `/api/admin/encoders` | Create new encoder (SA) |
| `PATCH` | `/api/admin/encoders/[id]` | Update encoder (SA) |
| `DELETE` | `/api/admin/encoders/[id]` | Delete encoder (SA) |
| `GET` | `/api/encoders/available` | List available encoders for FD |
| `POST` | `/api/memorials/[id]/encoder/assign` | Assign encoder to memorial (FD) |
| `POST` | `/api/memorials/[id]/encoder/arm` | Arm encoder (FD) |
| `POST` | `/api/memorials/[id]/encoder/disarm` | Disarm encoder (FD) |

---

## UI Components Needed

### Admin: Encoder Management Page

**Route:** `/admin/encoders`

- Table of all encoders with status
- "Add Encoder" button → provisions Cloudflare credentials
- Per-encoder: Edit, Delete, View current assignment
- Show streaming credentials for device setup

### FD Dashboard: Per-Memorial Streaming

**Route:** `/funeral-director/dashboard` (enhanced)

For each memorial the FD manages:
- **Encoder Status**: "Not assigned" | "Assigned: Encoder #3" | "Armed & Ready"
- **Actions**:
  - "Assign Encoder" → dropdown picker
  - "Arm" / "Disarm" toggle
  - "Set Schedule" → datetime picker
- **Live Indicator**: Shows when actively streaming

---

## Webhook Modification

**File:** `src/routes/api/webhooks/cloudflare-stream/+server.ts`

```typescript
// New logic in webhook handler:

// 1. Find encoder by cloudflareInputId
const encoderQuery = await adminDb
  .collection('encoders')
  .where('cloudflareInputId', '==', liveInputId)
  .limit(1)
  .get();

if (!encoderQuery.empty) {
  const encoder = encoderQuery.docs[0].data();
  
  // 2. Find memorial with this encoder assigned
  const memorialQuery = await adminDb
    .collection('memorials')
    .where('assignedEncoderId', '==', encoder.id)
    .limit(1)
    .get();
  
  if (!memorialQuery.empty) {
    const memorial = memorialQuery.docs[0];
    const memorialData = memorial.data();
    
    // 3. Check if armed
    if (memorialData.encoderArmed) {
      // Update to LIVE - show to viewers
      await memorial.ref.update({
        streamStatus: 'live',
        liveStartedAt: new Date().toISOString(),
        liveWatchUrl: preview,
        hlsUrl: hlsUrl
      });
    } else {
      // Log but don't broadcast
      console.log('⚠️ Encoder streaming but not armed:', encoder.id);
    }
  }
}
```

---

## Benefits of This Design

1. **Reusable Devices** - Set up once, use for many services
2. **Explicit Control** - No accidental broadcasts
3. **Clear Separation** - SA manages hardware, FD manages services
4. **Audit Trail** - Know who armed what and when
5. **Scalability** - One FD can have multiple encoders across locations
6. **Testing** - Stream to verify device works without going public

---

## Migration Path

1. Keep existing stream system working
2. Add encoder collection + admin UI
3. Add encoder assignment to FD dashboard
4. Update webhook to check both old streams AND new encoder system
5. Gradually migrate to encoder-based approach
