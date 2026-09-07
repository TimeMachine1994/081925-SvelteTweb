# Encoder System - Reusable Code Audit

This document identifies existing components, functions, and patterns that can be reused for the new Encoder System.

---

## ✅ Highly Reusable (Use As-Is or Minor Modifications)

### 1. Cloudflare Stream API Functions

**File:** `src/lib/server/cloudflare-stream.ts`

| Function | Reusability | Notes |
|----------|-------------|-------|
| `createLiveInput(name)` | ✅ **Direct reuse** | Already provisions RTMP + WHIP credentials. Use this when SA creates a new encoder. |
| `getLiveInputStatus(liveInputId)` | ✅ **Direct reuse** | Check if encoder is currently streaming |
| `getLiveInputVideos(liveInputId)` | ✅ **Direct reuse** | Get recordings from an encoder |
| `getStreamPlaybackUrl(videoUid)` | ✅ **Direct reuse** | Get playback URLs |

**Action:** No changes needed. Call `createLiveInput()` when creating an encoder instead of when arming a stream.

---

### 2. Stream Types

**File:** `src/lib/types/stream.ts`

Existing types that map to encoder system:

```typescript
// Can reuse for encoder credentials
interface StreamCredentials {
  whipUrl?: string;
  whepUrl?: string;
  rtmpUrl?: string;
  streamKey?: string;
  cloudflareInputId?: string;
}

// Can adapt for encoder arm status
interface StreamArmStatus {
  isArmed: boolean;
  armType: StreamArmType | null;
  armedAt?: string;
  armedBy?: string;
}
```

**Action:** Create new `src/lib/types/encoder.ts` extending these patterns.

---

### 3. Admin Layout & Components

**Files:**
- `src/lib/components/admin/AdminLayout.svelte`
- `src/lib/components/admin/DataGrid.svelte`
- `src/lib/components/admin/BulkActionBar.svelte`
- `src/lib/components/admin/FilterBuilder.svelte`

| Component | Reusability | Use For |
|-----------|-------------|---------|
| `AdminLayout` | ✅ **Direct reuse** | Wrap new `/admin/encoders` page |
| `DataGrid` | ✅ **Direct reuse** | List all encoders in admin |
| `BulkActionBar` | ✅ **Minor mod** | Add `resourceType: 'encoder'` case |
| `FilterBuilder` | ✅ **Direct reuse** | Filter encoders by status/location |

**Action:** Use existing admin components. Add `encoder` resource type to BulkActionBar.

---

### 4. Funeral Directors Admin Page Pattern

**Files:**
- `src/routes/admin/users/funeral-directors/+page.svelte`
- `src/routes/admin/users/funeral-directors/+page.server.ts`

This is an excellent template for the encoder admin page:
- Uses `AdminLayout` with title/subtitle/actions
- Uses `DataGrid` with sortable columns
- Has bulk action handling
- Pattern for server-side data loading with Firestore

**Action:** Copy this pattern for `/admin/encoders` page.

---

### 5. StreamCard Component

**File:** `src/lib/components/streaming/StreamCard.svelte`

Reusable UI patterns:
- **Copy-to-clipboard** functionality (lines 91-107)
- **Arm dropdown** UI (lines 317-371)
- **Credentials display** - RTMP URL + Stream Key (lines 422-471)
- **Status badges** styling (lines 24-31)

**Action:** Extract these into a new `EncoderCard.svelte` component.

---

### 6. Webhook Handler Structure

**File:** `src/routes/api/webhooks/cloudflare-stream/+server.ts`

Already handles:
- Signature verification
- Looking up resources by `cloudflareInputId`
- Mapping Cloudflare states to app states

**Action:** Modify webhook to also check encoders collection and arm status.

---

## ⚠️ Needs Modification

### 1. Arm API

**File:** `src/routes/api/streams/[streamId]/arm/+server.ts`

Current: Creates new Cloudflare credentials on each arm.
New: Should reference existing encoder credentials.

**Changes needed:**
```typescript
// OLD: Create new credentials
const liveInput = await createLiveInput(streamData.title);

// NEW: Reference encoder's existing credentials
const encoderDoc = await adminDb.collection('encoders').doc(encoderId).get();
const encoder = encoderDoc.data();
// Use encoder.rtmpUrl, encoder.streamKey, encoder.cloudflareInputId
```

---

### 2. FuneralDirectorPortal

**File:** `src/lib/components/portals/FuneralDirectorPortal.svelte`

Current: Shows memorials with basic livestream control.
New: Add encoder assignment + arm controls per memorial.

**Changes needed:**
- Add encoder dropdown selector per memorial
- Add arm/disarm button
- Show encoder status badge
- Link to mobile streaming page when armed

---

### 3. BulkActionBar Resource Types

**File:** `src/lib/components/admin/BulkActionBar.svelte`

Add new case for encoders:

```typescript
case 'encoder':
  return [
    { id: 'markAvailable', label: 'Mark Available', icon: '✅', variant: 'primary' },
    { id: 'markMaintenance', label: 'Maintenance', icon: '🔧', variant: 'secondary' },
    { id: 'export', label: 'Export CSV', icon: '📥', variant: 'secondary' },
    { id: 'delete', label: 'Delete', icon: '🗑️', variant: 'danger' }
  ];
```

---

## 🆕 New Code Required

### 1. Types

**Create:** `src/lib/types/encoder.ts`

```typescript
export type EncoderStatus = 'available' | 'assigned' | 'maintenance';

export interface Encoder {
  id: string;
  name: string;
  description?: string;
  
  // Cloudflare credentials (persistent)
  cloudflareInputId: string;
  rtmpUrl: string;
  streamKey: string;
  whipUrl?: string;
  
  // Status
  status: EncoderStatus;
  currentAssignment?: {
    memorialId: string;
    funeralDirectorId: string;
    assignedAt: string;
  };
  
  // Metadata
  deviceType?: 'phone' | 'hardware' | 'obs';
  location?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface MemorialEncoderConfig {
  assignedEncoderId?: string;
  encoderArmed: boolean;
  armedAt?: string;
  armedBy?: string;
  scheduledStartTime?: string;
}
```

---

### 2. Admin Encoder Page

**Create:** `src/routes/admin/encoders/+page.svelte`
**Create:** `src/routes/admin/encoders/+page.server.ts`

Follow the funeral-directors page pattern.

---

### 3. API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/encoders` | GET | List all encoders |
| `/api/admin/encoders` | POST | Create encoder (calls `createLiveInput`) |
| `/api/admin/encoders/[id]` | PATCH | Update encoder |
| `/api/admin/encoders/[id]` | DELETE | Delete encoder |
| `/api/memorials/[id]/encoder/assign` | POST | FD assigns encoder |
| `/api/memorials/[id]/encoder/arm` | POST | FD arms encoder |
| `/api/memorials/[id]/encoder/disarm` | POST | FD disarms encoder |

---

### 4. EncoderCard Component

**Create:** `src/lib/components/streaming/EncoderCard.svelte`

Adapt StreamCard patterns for encoder-specific UI:
- Show name, status, device type
- Display RTMP credentials (for SA)
- Show current assignment
- Copy buttons

---

### 5. EncoderSelector Component

**Create:** `src/lib/components/streaming/EncoderSelector.svelte`

For FD dashboard - dropdown to assign encoder to memorial:
- Lists available encoders
- Shows currently assigned encoder
- Confirm modal on change

---

### 6. Navigation Update

**File:** `src/lib/admin/navigation.ts`

Add encoder management to admin nav:

```typescript
{
  id: 'encoders',
  label: 'Encoders',
  icon: '📹',
  href: '/admin/encoders',
  permission: { resource: 'encoder', action: 'read' }
}
```

---

## Summary: Build Order

1. **Types first** - Create `encoder.ts` types
2. **Admin API** - CRUD endpoints for encoders
3. **Admin UI** - `/admin/encoders` page using DataGrid
4. **Webhook update** - Check encoder arm status
5. **FD API** - Assign/arm/disarm endpoints
6. **FD UI** - EncoderSelector + arm controls in dashboard
7. **Navigation** - Add to admin sidebar

---

## Code Reuse Ratio

| Category | Reusable | New |
|----------|----------|-----|
| Server functions | 4 | 7 |
| Components | 5 | 2 |
| Types | 2 | 2 |
| API routes | 0 | 7 |

**Estimated reuse: ~40%** - Good foundation exists, moderate new code needed.
