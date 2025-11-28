# Emergency Embed Data Flow Trace

## Overview
Emergency embeds allow admins to quickly override normal stream display on memorial pages with external embedded content (Vimeo, YouTube, etc.). This document traces the complete data flow and function calls.

---

## 1. Creation Flow (Admin → Database)

### 1.1 Admin Interface Trigger
**File:** `frontend/src/routes/admin/services/memorials/[memorialId]/+page.svelte`

#### UI Elements:
- **Line 280-282:** Emergency embed button
  ```svelte
  <button class="emergency-btn" onclick={() => showEmergencyEmbed = !showEmergencyEmbed}>
    {showEmergencyEmbed ? '✖ Cancel' : '🚨 Create Emergency Embed'}
  </button>
  ```

- **Lines 300-351:** Emergency embed form
  - Title input (optional)
  - Embed code/iframe URL textarea (required)
  - Warning message
  - Activation button

#### State Variables:
- `showEmergencyEmbed: boolean` - Controls form visibility
- `embedCode: string` - User input for iframe/embed code
- `embedTitle: string` - Optional title for the embed
- `isCreatingEmbed: boolean` - Loading state

### 1.2 Form Submission Handler
**Function:** `handleCreateEmergencyEmbed()` (Lines 165-196)

```typescript
async function handleCreateEmergencyEmbed() {
  // 1. Validation
  if (!embedCode.trim()) {
    alert('Please enter an embed code or iframe URL');
    return;
  }

  isCreatingEmbed = true;

  try {
    // 2. API Call
    const response = await fetch(`/api/memorials/${memorial.id}/emergency-embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embedCode: embedCode.trim(),
        title: embedTitle.trim() || 'Emergency Embed'
      })
    });

    // 3. Handle response
    if (response.ok) {
      alert('Emergency embed created successfully! It will appear on the memorial page.');
      location.reload();
    } else {
      const error = await response.json();
      alert(`Failed to create embed: ${error.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error creating emergency embed:', error);
    alert('An error occurred while creating the embed.');
  } finally {
    isCreatingEmbed = false;
  }
}
```

**Flow:**
1. Validates embed code is not empty
2. Sets loading state
3. Calls POST `/api/memorials/[memorialId]/emergency-embed`
4. Reloads page on success to show new embed

---

## 2. API Processing (Server-Side)

### 2.1 Emergency Embed API Endpoint
**File:** `frontend/src/routes/api/memorials/[memorialId]/emergency-embed/+server.ts`

#### POST Handler (Lines 11-76)

**Authentication Check:**
```typescript
// Line 15-18: Admin-only access
if (!locals.user || locals.user.role !== 'admin') {
  console.log('❌ [EMERGENCY EMBED] Unauthorized access attempt');
  throw svelteError(403, 'Admin access required');
}
```

**Request Processing:**
```typescript
// Lines 23-28: Extract and validate data
const { embedCode, title } = await request.json();

if (!embedCode || !embedCode.trim()) {
  throw svelteError(400, 'Embed code is required');
}
```

**URL Auto-Wrapping:**
```typescript
// Lines 38-44: Smart iframe wrapper
let sanitizedEmbedCode = embedCode.trim();

// If it's just a URL, wrap it in an iframe
if (sanitizedEmbedCode.startsWith('http') && !sanitizedEmbedCode.includes('<iframe')) {
  sanitizedEmbedCode = `<iframe src="${sanitizedEmbedCode}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
}
```

**Emergency Embed Object Structure:**
```typescript
// Lines 47-53: Data structure
const emergencyEmbed = {
  embedCode: sanitizedEmbedCode,
  title: (title && title.trim()) || 'Emergency Embed',
  createdAt: new Date().toISOString(),
  createdBy: locals.user.uid,
  createdByEmail: locals.user.email
};
```

**Firestore Update:**
```typescript
// Lines 56-59: Save to database
await memorialDoc.ref.update({
  emergencyEmbed,
  updatedAt: new Date().toISOString()
});
```

**Response:**
```typescript
// Lines 63-66: Success response
return json({
  success: true,
  emergencyEmbed
});
```

**Console Logs:**
- Line 12: `🚨 [EMERGENCY EMBED] POST - Creating emergency embed for memorial: {memorialId}`
- Line 61: `✅ [EMERGENCY EMBED] Emergency embed created successfully`
- Line 68: `❌ [EMERGENCY EMBED] Error creating emergency embed: {error}`

---

## 3. Data Storage (Firestore)

### 3.1 Database Structure
**Collection:** `memorials`  
**Document:** `{memorialId}`  
**Field:** `emergencyEmbed` (object)

```typescript
emergencyEmbed: {
  embedCode: string,          // Sanitized iframe HTML or URL
  title: string,              // Display title (default: "Emergency Embed")
  createdAt: string,          // ISO timestamp
  createdBy: string,          // Admin user UID
  createdByEmail: string      // Admin email for audit
}
```

### 3.2 Additional Updated Fields
- `updatedAt`: ISO timestamp of when emergency embed was added

---

## 4. Data Retrieval (Memorial Page Load)

### 4.1 Server-Side Data Loading
**File:** `frontend/src/routes/[fullSlug]/+page.server.ts`

#### Emergency Embed Loading (Lines 56-87)
```typescript
const memorial = {
  // ... other fields ...
  
  // Line 80: Emergency embed override
  emergencyEmbed: memorialData.emergencyEmbed || null,
  
  // ... other fields ...
};
```

**Console Logs:**
- Line 89-95: Memorial loading confirmation with `hasEmergencyEmbed` flag

### 4.2 Admin Detail Page Loading
**File:** `frontend/src/routes/admin/services/memorials/[memorialId]/+page.server.ts`

#### Emergency Embed in Admin View (Line 147)
```typescript
// Line 147: Load emergency embed for admin view
emergencyEmbed: memorialData.emergencyEmbed || null,
```

---

## 5. Display Logic (Memorial Page Rendering)

### 5.1 Client-Side Data Processing
**File:** `frontend/src/routes/[fullSlug]/+page.svelte`

#### Data Extraction (Lines 13-17)
```typescript
let memorial = $derived(data.memorial);
let streams = $derived((data.streams || []) as any);
let slideshows = $derived((data.slideshows || []) as any);
let user = $derived(data.user);
```

#### Debug Logging (Lines 32-37)
```typescript
onMount(() => {
  console.log('🎨 [MEMORIAL PAGE] Client-side data loaded:', {
    memorialId: memorial?.id,
    hasEmergencyEmbed: !!memorial?.emergencyEmbed
  });
});
```

#### Passing to Display Component (Lines 294-301 & 396-403)
```svelte
<!-- Legacy Memorial Layout -->
<MemorialStreamDisplay 
  streams={streams || []} 
  memorialName={memorial.lovedOneName}
  emergencyEmbed={memorial.emergencyEmbed}
/>

<!-- Standard Memorial Layout -->
<MemorialStreamDisplay 
  streams={streams || []} 
  memorialName={memorial.lovedOneName}
  emergencyEmbed={memorial.emergencyEmbed}
/>
```

### 5.2 Stream Display Component
**File:** `frontend/src/lib/components/MemorialStreamDisplay.svelte`

#### Component Interface (Lines 34-46)
```typescript
interface EmergencyEmbed {
  embedCode: string;
  title: string;
  createdAt: string;
  createdBy: string;
  createdByEmail?: string;
}

interface Props {
  streams: Stream[];
  memorialName: string;
  emergencyEmbed?: EmergencyEmbed | null;
}

let { streams, memorialName, emergencyEmbed }: Props = $props();
```

#### Rendering Logic (Lines 237-247)
```svelte
{#if emergencyEmbed}
  <!-- Emergency Embed Override - Takes Priority -->
  <div class="memorial-streams">
    <div class="stream-section">
      <div class="stream-item">
        <div class="embed-container">
          {@html emergencyEmbed.embedCode}
        </div>
      </div>
    </div>
  </div>
{:else if hasVisibleStreams}
  <!-- Normal stream display -->
{:else}
  <!-- Placeholder player -->
{/if}
```

**Priority:** Emergency embed takes absolute priority over all other content (live streams, scheduled streams, recorded streams, placeholders)

#### CSS Styling (Lines 561-588)
```css
/* Lines 562-579: Embed container with 16:9 aspect ratio */
.embed-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.embed-container :global(iframe) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}
```

---

## 6. Admin Management Features

### 6.1 Active Embed Display
**File:** `frontend/src/routes/admin/services/memorials/[memorialId]/+page.svelte` (Lines 286-298)

```svelte
{#if memorial.emergencyEmbed}
  <div class="emergency-embed-active">
    <div class="emergency-header">
      <h3>🚨 Active Emergency Embed</h3>
      <button class="danger-btn-small" onclick={handleRemoveEmergencyEmbed}>
        🗑️ Remove
      </button>
    </div>
    <p><strong>Title:</strong> {memorial.emergencyEmbed.title}</p>
    <p class="embed-preview"><strong>Embed Code:</strong> {memorial.emergencyEmbed.embedCode.substring(0, 100)}...</p>
    <p class="warning-text">⚠️ This embed is currently showing on the memorial page and overriding normal streams.</p>
  </div>
{/if}
```

### 6.2 Removal Flow
**Function:** `handleRemoveEmergencyEmbed()` (Lines 204-226)

```typescript
async function handleRemoveEmergencyEmbed() {
  if (!confirm('Are you sure you want to remove the emergency embed? Normal streams will be displayed again.')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/memorials/${memorial.id}/emergency-embed`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      alert(`Error: ${error.message}`);
      return;
    }
    
    alert('Emergency embed removed successfully!');
    window.location.reload();
  } catch (error) {
    console.error('Error removing embed:', error);
    alert('Failed to remove emergency embed. Please try again.');
  }
}
```

### 6.3 DELETE API Endpoint
**File:** `frontend/src/routes/api/memorials/[memorialId]/emergency-embed/+server.ts` (Lines 78-117)

```typescript
export const DELETE: RequestHandler = async ({ locals, params }) => {
  // Authentication check
  if (!locals.user || locals.user.role !== 'admin') {
    throw svelteError(403, 'Admin access required');
  }

  // Get memorial document
  const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

  if (!memorialDoc.exists) {
    throw svelteError(404, 'Memorial not found');
  }

  // Remove emergency embed by setting to null
  await memorialDoc.ref.update({
    emergencyEmbed: null,
    updatedAt: new Date().toISOString()
  });

  return json({ success: true });
};
```

---

## 7. Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. ADMIN CREATES EMBED                        │
│                                                                  │
│  Admin Panel                                                     │
│  └─> [🚨 Create Emergency Embed] Button clicked                 │
│      └─> Form shown (embedCode, embedTitle)                     │
│          └─> User enters iframe code or URL                     │
│              └─> handleCreateEmergencyEmbed() called            │
│                  └─> POST /api/memorials/[id]/emergency-embed  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    2. API PROCESSES REQUEST                      │
│                                                                  │
│  emergency-embed/+server.ts                                      │
│  └─> Check admin authentication                                 │
│      └─> Validate embed code exists                             │
│          └─> Auto-wrap URL in iframe if needed                  │
│              └─> Create emergencyEmbed object                   │
│                  └─> Update Firestore memorial document         │
│                      └─> Return success response                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    3. DATABASE STORES DATA                       │
│                                                                  │
│  Firestore: memorials/{memorialId}                              │
│  └─> emergencyEmbed: {                                          │
│         embedCode: "<iframe src='...' ...></iframe>",           │
│         title: "Emergency Embed",                               │
│         createdAt: "2025-01-15T10:30:00Z",                      │
│         createdBy: "admin-uid",                                 │
│         createdByEmail: "admin@example.com"                     │
│      }                                                           │
│  └─> updatedAt: "2025-01-15T10:30:00Z"                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                4. MEMORIAL PAGE LOADS DATA                       │
│                                                                  │
│  [fullSlug]/+page.server.ts                                      │
│  └─> Load memorial document from Firestore                      │
│      └─> Extract emergencyEmbed field                           │
│          └─> Return memorial data with emergencyEmbed           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                5. CLIENT RECEIVES DATA                           │
│                                                                  │
│  [fullSlug]/+page.svelte                                         │
│  └─> Receive data from server load                              │
│      └─> Extract memorial.emergencyEmbed                        │
│          └─> Pass to MemorialStreamDisplay component            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                6. DISPLAY COMPONENT RENDERS                      │
│                                                                  │
│  MemorialStreamDisplay.svelte                                    │
│  └─> Check if emergencyEmbed exists                             │
│      └─> IF EXISTS:                                             │
│          └─> Render emergency embed ONLY (override everything)  │
│              └─> {@html emergencyEmbed.embedCode}               │
│      └─> ELSE:                                                  │
│          └─> Show normal streams/scheduled/recorded/placeholder │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Key Functions Summary

### Creation Functions:
1. **`handleCreateEmergencyEmbed()`** - Admin panel form submission
2. **`POST /api/memorials/[memorialId]/emergency-embed`** - API endpoint handler
3. **`adminDb.collection('memorials').doc(memorialId).update()`** - Firestore write

### Retrieval Functions:
4. **`load()` in [fullSlug]/+page.server.ts** - Server-side data loading
5. **`load()` in admin/memorials/[memorialId]/+page.server.ts** - Admin view loading

### Display Functions:
6. **`MemorialStreamDisplay.svelte` component render** - Conditional rendering logic
7. **`{@html emergencyEmbed.embedCode}`** - HTML injection for iframe display

### Removal Functions:
8. **`handleRemoveEmergencyEmbed()`** - Admin removal function
9. **`DELETE /api/memorials/[memorialId]/emergency-embed`** - API deletion handler

---

## 9. Security Considerations

### Admin-Only Access:
- ✅ All creation/deletion endpoints check for `locals.user.role === 'admin'`
- ✅ Returns 403 Forbidden for non-admin users

### Input Sanitization:
- ✅ Embed code is trimmed
- ✅ Auto-wraps plain URLs in proper iframe tags
- ✅ Validation ensures embed code is not empty

### HTML Injection:
- ⚠️ Uses `{@html}` directive (Svelte's equivalent to `dangerouslySetInnerHTML`)
- ⚠️ No additional sanitization on embed code content
- ⚠️ Relies on admin trust - admins can inject any HTML/JavaScript

### Audit Trail:
- ✅ Stores creator UID and email
- ✅ Stores creation timestamp
- ✅ Updates memorial's `updatedAt` timestamp

---

## 10. Edge Cases & Error Handling

### Empty Embed Code:
- Client validation alerts user
- Server returns 400 error if bypassed

### Memorial Not Found:
- Server returns 404 error
- Client shows error message

### Unauthorized Access:
- Server returns 403 error
- Redirects to admin panel

### Network Errors:
- Caught in try-catch blocks
- User-friendly error messages displayed

### Multiple Embeds:
- System supports only ONE emergency embed per memorial
- New embed replaces previous embed (field overwrite)

---

## 11. Console Logging Trail

When creating an emergency embed, these logs appear in order:

1. **Admin Page (Client):**
   ```
   🎨 [MEMORIAL PAGE] Client-side data loaded: {memorialId, hasEmergencyEmbed}
   ```

2. **API Endpoint (Server):**
   ```
   🚨 [EMERGENCY EMBED] POST - Creating emergency embed for memorial: {memorialId}
   ✅ [EMERGENCY EMBED] Emergency embed created successfully
   ```

3. **Memorial Page Load (Server):**
   ```
   🏠 [MEMORIAL_PAGE] Loading memorial page for slug: {fullSlug}
   🏠 [MEMORIAL_PAGE] Memorial found: {id, hasEmergencyEmbed: true}
   ```

4. **Memorial Page Client:**
   ```
   🎨 [MEMORIAL PAGE] Client-side data loaded: {memorialId, hasEmergencyEmbed: true}
   ```

---

## 12. Testing Checklist

- [ ] Create emergency embed with valid iframe code
- [ ] Create emergency embed with plain URL (should auto-wrap)
- [ ] Verify embed displays on memorial page
- [ ] Verify normal streams are hidden when embed is active
- [ ] Remove emergency embed and verify streams reappear
- [ ] Try to create embed as non-admin (should fail with 403)
- [ ] Create embed with empty code (should fail with validation)
- [ ] Check audit trail (createdBy, createdAt, createdByEmail)
- [ ] Verify emergency embed shows in admin detail page
- [ ] Test with various embed sources (Vimeo, YouTube, custom HTML)

---

## Summary

The emergency embed system provides a simple but powerful override mechanism for admins to quickly display external content on memorial pages. The data flows from admin UI → API validation → Firestore storage → memorial page load → conditional rendering, with proper authentication checks and audit trails throughout.
