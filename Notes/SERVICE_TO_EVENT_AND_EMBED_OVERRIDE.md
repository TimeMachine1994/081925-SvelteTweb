# Service to Event Rename & Admin Embed Override

## Overview
This plan covers two main changes:
1. Rename "Service" to "Event" in the custom URL page and custom player
2. Add admin interface to override the default player with a custom video embed

---

## Step 1: Change "Service" to "Event" in UI

### 1.1 Custom URL Page (`[fullSlug]`)
- [ ] Find all instances of "Service" text in the fullSlug page
- [ ] Update labels, headings, and descriptions to use "Event" instead
- [ ] Examples: "Service Time" → "Event Time", "Service Location" → "Event Location"

### 1.2 Custom Player / Stand-in Player
- [ ] Locate the player component(s) used on event pages
- [ ] Update any "Service" labels to "Event"
- [ ] Update placeholder/stand-in text if applicable

### 1.3 Related Components
- [ ] Check schedule components for "Service" terminology
- [ ] Check booking/calculator components
- [ ] Update any related API responses or data labels

---

## Step 2: Add Admin Video Embed Override

### 2.1 Database Schema Update
- [ ] Add `embedOverride` field to stream or event document
- [ ] Structure: `{ enabled: boolean, embedCode: string, embedType: 'youtube' | 'vimeo' | 'custom' }`

### 2.2 Admin Interface
- [ ] Add "Embed Override" section in admin stream management
- [ ] Text area for pasting embed code (iframe or video URL)
- [ ] Toggle to enable/disable the override
- [ ] Preview of the embed before saving

### 2.3 Frontend Player Logic
- [ ] Check if `embedOverride.enabled` is true for the stream
- [ ] If enabled, render the custom embed instead of default player
- [ ] Sanitize embed code for security (allow only safe iframe attributes)

### 2.4 API Endpoints
- [ ] Create/update endpoint to save embed override settings
- [ ] Ensure only admins can set embed overrides

---

## Files to Modify (Estimated)

### Step 1
- `src/routes/[fullSlug]/+page.svelte` - Main event page
- `src/lib/components/` - Player and stream components
- `src/lib/components/calculator/` - Booking components

### Step 2
- `src/routes/admin/` or `src/lib/components/portals/AdminPortal.svelte` - Admin UI
- `src/routes/api/` - API endpoints for saving embed settings
- `src/routes/[fullSlug]/+page.svelte` - Render embed override
- Firestore schema (streams or memorials collection)

---

## Testing Checklist
- [ ] Verify "Event" terminology appears correctly on public pages
- [ ] Test embed override with YouTube embed
- [ ] Test embed override with Vimeo embed
- [ ] Test embed override with custom iframe
- [ ] Verify only admins can set embed overrides
- [ ] Test disabling embed override returns to default player
