# WBS Comparison: Memorial Page (Public) vs Admin Panel

**Document Created:** January 22, 2026

---

## Quick Reference

| **Aspect** | **Memorial Page (Public)** | **Admin Panel** |
|------------|---------------------------|-----------------|
| **Route** | `/[fullSlug]` | `/admin/services/memorials/*` |
| **Purpose** | Display memorial to visitors | Manage memorial data |
| **Access** | Public/Owner/Director/Admin | Admin only |
| **Server File** | `src/routes/[fullSlug]/+page.server.ts` | `src/routes/admin/services/memorials/*/+page.server.ts` |

---

## 1. Collections Accessed Comparison

| **Collection** | **Public Page** | **Admin Panel** |
|----------------|-----------------|-----------------|
| `memorials` | READ | READ + UPDATE |
| `streams` | READ + REALTIME | READ + CREATE + UPDATE/DELETE |
| `memorials/{id}/slideshows` | READ | READ |
| `memorials/{id}/followers` | ❌ | READ (count only) |
| `admin_audit_logs` | ❌ | CREATE |
| `auditLogs` | ❌ | CREATE |

---

## 2. Read Operations Comparison

### Memorial Document Fields

| **Field** | **Public** | **Admin** | **Notes** |
|-----------|------------|-----------|-----------|
| `id` | ✅ | ✅ | |
| `lovedOneName` | ✅ | ✅ | |
| `fullSlug` | ✅ | ✅ | |
| `content` | ✅ | ❌ | Not displayed in admin |
| `isPublic` | ✅ | ✅ | Permission check / badge |
| `isComplete` | ❌ | ✅ | Admin badge only |
| `services` | ✅ | ✅ | |
| `imageUrl` | ✅ | ❌ | Not in admin detail |
| `birthDate` | ✅ | ❌ | Not in admin detail |
| `deathDate` | ✅ | ❌ | Not in admin detail |
| `photos` | ✅ | ❌ | |
| `embeds` | ✅ | ❌ | |
| `familyContact*` | ✅ | ❌ | |
| `funeralHomeName` | ✅ | ❌ | |
| `directorFullName` | ✅ | ❌ | |
| `directorEmail` | ✅ | ❌ | |
| `additionalNotes` | ✅ | ❌ | |
| `custom_html` | ✅ | ❌ | Legacy display |
| `emergencyEmbed` | ✅ | ✅ | Display / management |
| `customTitle` | ✅ | ✅ | Display / editor |
| `publicNote` | ✅ | ✅ | Display / editor |
| `ownerUid` | ✅ | ✅ | Permission / link |
| `funeralDirectorUid` | ✅ | ❌ | Permission check only |
| `creatorEmail` | ❌ | ✅ | Admin display |
| `creatorName` | ❌ | ✅ | Admin display |
| `calculatorConfig` | ❌ | ✅ | Payment info |
| `isPaid` | ❌ | ✅ | Payment badge |
| `isDeleted` | ❌ | ✅ | Filtering |
| `createdAt` | ✅ | ✅ | |
| `updatedAt` | ✅ | ✅ | |

### Stream Document Fields

| **Field** | **Public** | **Admin** | **Notes** |
|-----------|------------|-----------|-----------|
| `id` | ✅ | ✅ | |
| `title` | ✅ | ✅ | |
| `description` | ✅ | ✅ | |
| `status` | ✅ | ✅ | Live/scheduled/completed |
| `memorialId` | ✅ | ✅ | |
| `scheduledStartTime` | ✅ | ✅ | |
| `isVisible` | ✅ | ✅ | Filtering |
| `isDeleted` | ✅ | ✅ | Filtering |
| `mux.*` | ✅ | ✅ | Playback / management |
| `chat.*` | ✅ | ✅ | Chat widget / moderation |
| `recordingReady` | ✅ | ✅ | |
| `viewerCount` | ❌ | ✅ | Analytics |
| `peakViewerCount` | ❌ | ✅ | Analytics |
| `totalViews` | ❌ | ✅ | Analytics |
| `calculator*` | ❌ | ✅ | Calculator linking |

---

## 3. Write Operations Comparison

| **Operation** | **Public** | **Admin** | **API Endpoint** |
|---------------|------------|-----------|------------------|
| Create memorial | ❌ | ❌* | `/api/admin/create-memorial` |
| Update `isPaid` | ❌ | ✅ | `/api/admin/bulk-actions` |
| Update `isPublic` | ❌ | ✅ | `/api/admin/bulk-actions` |
| Soft delete memorial | ❌ | ✅ | `/api/admin/bulk-actions` |
| Update `customTitle` | ❌ | ✅ | `/api/admin/memorials/[id]/display-settings` |
| Update `publicNote` | ❌ | ✅ | `/api/admin/memorials/[id]/display-settings` |
| Create stream | ❌ | ✅ | `/api/memorials/[id]/streams` |
| Delete stream | ❌ | ✅ | `/api/streams/[id]/delete` |
| Set emergency embed | ❌ | ✅ | `/api/memorials/[id]/emergency-embed` |
| Remove emergency embed | ❌ | ✅ | `/api/memorials/[id]/emergency-embed` |
| Create audit log | ❌ | ✅ | (automatic) |

*Memorial creation exists but via separate create page, not detail page

---

## 4. Real-Time Features Comparison

| **Feature** | **Public** | **Admin** |
|-------------|------------|-----------|
| Stream status updates | ✅ `onSnapshot()` | ❌ |
| Chat messages | ✅ via LiveChatWidget | ✅ via AdminChatPanel |
| Follower count | ❌ | ❌ (static load) |

---

## 5. Permission Model Comparison

### Public Page

```typescript
hasPermission = 
    memorial.isPublic === true ||      // Anyone can view public
    userRole === 'admin' ||            // Admin override
    ownerUid === userId ||             // Memorial owner
    funeralDirectorUid === userId;     // Assigned director
```

**Outcomes:**
- ✅ Permission → Full data (memorial, streams, slideshows)
- ❌ Permission → Limited data (basic memorial info only, no streams/slideshows)

### Admin Panel

```typescript
// Route level
if (!locals.user || locals.user.role !== 'admin') {
    throw redirect(302, '/admin');
}

// Action level (bulk-actions)
hasPermission(userWithRole, resourceType, requiredAction)
```

**Outcomes:**
- ✅ Admin role → Full access
- ❌ Not admin → Redirect to login

---

## 6. Error Handling Comparison

### Public Page

| **Error** | **HTTP Code** | **Message** |
|-----------|---------------|-------------|
| Invalid slug format | 404 | "Not a memorial page" |
| Memorial not found | 404 | "Memorial not found" |
| Firebase permission denied | 500 | "Database access denied" |
| Firebase unavailable | 500 | "Database temporarily unavailable" |
| Generic error | 500 | "Failed to load memorial: {message}" |

### Admin Panel

| **Error** | **HTTP Code** | **Message** |
|-----------|---------------|-------------|
| Not authenticated | 302 | Redirect to `/admin` or `/login` |
| Memorial not found | 404 | "Memorial not found" |
| Permission denied | 403 | "Permission denied" / "Admin access required" |
| Generic error | 500 | "Failed to load memorial: {message}" |

---

## 7. Data Transformation Comparison

### Public Page

| **Transformation** | **Purpose** |
|--------------------|-------------|
| Timestamp → ISO string | Serialization for SSR |
| Filter `isDeleted` streams | Hide deleted content |
| Filter `isVisible` streams | Hide hidden content |
| `hasCustomHtml` flag | Layout type detection |

### Admin Panel

| **Transformation** | **Purpose** |
|--------------------|-------------|
| Timestamp → ISO string | Serialization for SSR |
| Filter `isDeleted` memorials | Hide deleted from list |
| Filter `isDeleted` streams | Hide deleted streams |
| Extract location from `services` | Display summary |
| Extract scheduled time from `services` | Display in grid |
| Compute `isPaid` from multiple sources | Unified status |
| Clean `calculatorConfig` timestamps | Deep serialization |

---

## 8. Component Architecture Comparison

### Public Page Components

```
+page.svelte
├── BookingReminderBanner
├── SlideshowSection
│   └── (renders slideshows)
├── MemorialStreamDisplay
│   ├── CountdownVideoPlayer (scheduled)
│   ├── MuxVideoPlayer (live/recorded)
│   └── LiveChatWidget
└── Legacy custom_html rendering
```

### Admin Panel Components

```
+page.svelte (Detail)
├── AdminLayout
├── StreamCard (per stream)
├── CustomPricingEditor
├── AdminChatPanel (per stream)
├── Display Settings Form
├── Stream Creation Form
├── Emergency Embed Form
├── Slideshows List
└── Analytics Display
```

---

## 9. API Dependencies

### Public Page

| **Internal API** | **Purpose** |
|------------------|-------------|
| None | All data loaded server-side |

### Admin Panel

| **Internal API** | **Purpose** |
|------------------|-------------|
| `/api/admin/bulk-actions` | Payment, visibility, delete |
| `/api/admin/memorials/[id]/display-settings` | Title, note management |
| `/api/admin/memorials/[id]/pricing` | Custom pricing |
| `/api/memorials/[id]/streams` | Stream CRUD |
| `/api/memorials/[id]/emergency-embed` | Emergency embed |
| `/api/streams/[id]/delete` | Stream deletion |
| `/api/streams/[id]/chat/toggle` | Chat enable/disable |

---

## 10. Key Differences Summary

| **Category** | **Public Page** | **Admin Panel** |
|--------------|-----------------|-----------------|
| **Primary Function** | Read & display | Full CRUD |
| **User Access** | Multi-tier permissions | Admin only |
| **Real-time** | Yes (streams) | No |
| **Audit Logging** | None | All writes logged |
| **Data Volume** | Single memorial + related | List + detail views |
| **Write Capability** | None | Extensive |
| **Error Visibility** | User-friendly | Detailed for debugging |

---

## 11. Shared Firestore Indexes Required

Both pages rely on these indexes:

```
memorials:
  - fullSlug (equality)
  - createdAt (order)
  - isDeleted (equality, optional)

streams:
  - memorialId (equality)
  - isDeleted (equality, optional)
  - isVisible (equality, optional)

memorials/{id}/slideshows:
  - createdAt (order, desc)
```

---

## Related Documents

- [WBS_MEMORIAL_PAGE_PUBLIC.md](./WBS_MEMORIAL_PAGE_PUBLIC.md) - Full public page breakdown
- [WBS_MEMORIAL_PAGE_ADMIN.md](./WBS_MEMORIAL_PAGE_ADMIN.md) - Full admin panel breakdown
