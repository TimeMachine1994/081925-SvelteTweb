# Emergency Override Embed System

## Overview

A fail-safe "panic button" system that allows administrators to replace the complex streaming infrastructure with a simple embed code (Vimeo, YouTube, etc.) for day-of emergencies. The override is completely invisible to memorial viewers.

## Implementation Date
October 30, 2025

## Key Features

### 1. **Invisible to Public**
- Memorial page viewers see a working player with no indication of override
- No badges, warnings, or visual differences from normal streaming
- Professional, seamless experience for families and guests

### 2. **Admin Visibility**
- Stream Manager shows clear "Override Active" indicator
- Displays override note explaining why it's being used
- Full control to activate/deactivate without deleting code

### 3. **Non-Destructive**
- Original streaming setup remains intact
- Toggle on/off instantly
- Can switch back to normal streaming at any time

## Database Schema

### Added Fields to `streams` Collection

```typescript
interface Stream {
  // ... existing fields ...
  
  // Emergency Override
  overrideEmbedCode?: string;  // Full HTML embed code (iframe, etc.)
  overrideActive?: boolean;     // Toggle without deleting code
  overrideNote?: string;        // Internal note for why override was used
}
```

## User Interface

### Stream Manager (`/memorials/[id]/streams`)

#### Override Active Indicator
When `overrideActive: true`, shows a prominent amber banner:
- 🚨 "Override Active" heading
- Explanation: "Memorial page is showing custom embed instead of Cloudflare stream"
- Displays internal note if provided

#### Emergency Override Section
Collapsible `<details>` element with amber theme:

**Fields:**
1. **Embed Code** - Textarea for full iframe/embed HTML
   - Placeholder shows example Vimeo embed
   - Monospace font for code visibility
   - Resizable textarea

2. **Activate Override** - Checkbox toggle
   - Clear label: "Activate Override (replaces normal player on memorial page)"
   
3. **Internal Note** - Text input
   - Placeholder: "Why override is being used (viewers won't see this)"
   - For documentation purposes

4. **Save Override** - Primary action button
   - Saves all three fields
   - Shows loading state
   - Reloads page on success

### Memorial Page (`/[fullSlug]`)

**Rendering Priority:**
1. **Check for override** - If `overrideActive === true` and `overrideEmbedCode` exists
2. **Render embed** - `{@html stream.overrideEmbedCode}`
3. **Fallback** - Normal Cloudflare streaming

**No Visual Indicators:**
- No badges or warnings
- Standard "LIVE" indicator
- Same styling as normal streams
- Identical user experience

## API Integration

### Endpoint Used
`PUT /api/streams/management/[id]`

**Request Body:**
```json
{
  "overrideEmbedCode": "<iframe src=\"...\"></iframe>",
  "overrideActive": true,
  "overrideNote": "Cloudflare issue - using Vimeo backup"
}
```

**Existing Endpoint Handles Override Fields Automatically:**
- The management API already accepts any fields in the update body
- Spreads updates: `{ ...updates, updatedAt: ... }`
- No API code changes required

## Usage Workflow

### Emergency Scenario (Day-Of)

1. **Funeral Director Opens Stream Manager**
   - Navigate to `/memorials/[id]/streams`
   - Find the affected stream

2. **Open Emergency Override Section**
   - Click "🚨 Emergency Embed Override" to expand
   
3. **Paste Embed Code**
   ```html
   <iframe src="https://player.vimeo.com/video/123456789" 
           width="640" height="360" frameborder="0" 
           allow="autoplay; fullscreen; picture-in-picture" 
           allowfullscreen></iframe>
   ```

4. **Activate Override**
   - Check "Activate Override" checkbox
   - Add note: "Using Vimeo backup - Cloudflare connection issue"

5. **Save**
   - Click "Save Override"
   - Page reloads with changes applied

6. **Verify**
   - Visit memorial page
   - Confirm Vimeo player is showing
   - Viewers see no indication of override

### After Event

1. **Deactivate Override**
   - Uncheck "Activate Override"
   - Click "Save Override"
   - Keeps embed code saved for reference

2. **System Returns to Normal**
   - Memorial page shows Cloudflare stream again
   - Override code remains in database for future use

## Code Files Modified

### 1. TypeScript Interface
**File:** `frontend/src/lib/types/stream.ts`
**Changes:** Added three optional fields to `Stream` interface

### 2. Stream Player Component
**File:** `frontend/src/lib/components/StreamPlayer.svelte`
**Changes:**
- Added override detection at top of stream categorization
- If override streams exist, return only those as "live" streams
- Modified live stream rendering to check for override embed first
- Renders `{@html stream.overrideEmbedCode}` when active

### 3. Stream Card Component
**File:** `frontend/src/lib/ui/stream/StreamCard.svelte`
**Changes:**
- Added state management for override fields
- Added `saveOverride()` function
- Added "Override Active" indicator banner
- Added collapsible emergency override section with form

### 4. API Endpoint (No Changes Required)
**File:** `frontend/src/routes/api/streams/management/[id]/+server.ts`
**Status:** Existing PUT handler automatically accepts override fields

## Example Embed Codes

### Vimeo
```html
<iframe src="https://player.vimeo.com/video/123456789" 
        width="640" height="360" frameborder="0" 
        allow="autoplay; fullscreen; picture-in-picture" 
        allowfullscreen></iframe>
```

### YouTube
```html
<iframe width="560" height="315" 
        src="https://www.youtube.com/embed/VIDEO_ID" 
        title="YouTube video player" frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen></iframe>
```

### Zoom
```html
<iframe src="https://zoom.us/j/MEETING_ID?pwd=PASSWORD" 
        width="640" height="360" frameborder="0" 
        allow="camera; microphone" 
        allowfullscreen></iframe>
```

## Benefits

### 1. **Emergency Ready**
- Works immediately when needed
- No development time required during crisis

### 2. **Zero Risk**
- Doesn't break existing streaming system
- Can test ahead of time
- Reversible with one click

### 3. **Platform Agnostic**
- Works with any embed code
- Vimeo, YouTube, Zoom, Facebook Live, etc.
- Custom players supported

### 4. **Professional**
- Viewers never see technical issues
- Seamless experience for families
- Internal documentation via notes

### 5. **Documented**
- Note field explains why override was used
- Historical record of issues
- Helps identify patterns

## Testing Checklist

### Before Event
- [ ] Test with sample Vimeo embed
- [ ] Verify memorial page shows embed correctly
- [ ] Confirm no visual indicators on public page
- [ ] Test toggle off/on functionality
- [ ] Verify note field saves properly

### During Event (If Needed)
- [ ] Paste live stream embed code
- [ ] Activate override
- [ ] Save changes
- [ ] Refresh memorial page
- [ ] Confirm viewers can see stream

### After Event
- [ ] Deactivate override
- [ ] Verify normal streaming restored
- [ ] Document issue in note field
- [ ] Keep embed code for reference

## Future Enhancements

### Potential Improvements
1. **Preview Mode** - Preview override before activating
2. **Embed Validation** - Check if embed code is valid HTML
3. **Quick Templates** - Pre-saved embed templates for common platforms
4. **Multiple Overrides** - Different embeds for different stream states
5. **Override History** - Track when overrides were used and why

### Analytics Opportunities
- Track override usage frequency
- Identify which platforms are used most
- Pattern analysis for system improvements

## Security Considerations

### XSS Protection
- Embed code uses `{@html}` which renders raw HTML
- Only accessible to authenticated stream managers
- Permission-checked (admin, funeral_director, owner)
- Consider adding HTML sanitization if needed

### Recommended Security Layer (Future)
```typescript
import sanitizeHtml from 'sanitize-html';

const sanitizedEmbed = sanitizeHtml(overrideEmbedCode, {
  allowedTags: ['iframe', 'div', 'script'],
  allowedAttributes: {
    iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen']
  }
});
```

## Support Documentation

### For Funeral Directors
**When to Use:**
- Cloudflare streaming isn't working
- Need to use alternative platform (Zoom, Facebook Live)
- Testing with pre-recorded video
- Emergency backup needed immediately

**How to Use:**
1. Get embed code from video platform (Vimeo, YouTube, etc.)
2. Open Stream Manager
3. Click "Emergency Embed Override"
4. Paste embed code
5. Check "Activate Override"
6. Save
7. Refresh memorial page to verify

### For Administrators
**Monitoring:**
- Check for active overrides in database
- Review override notes for patterns
- Identify recurring issues
- Plan infrastructure improvements

**Best Practices:**
- Always add a note explaining why
- Test embed before activating
- Deactivate when no longer needed
- Keep embed code for reference

---

## Summary

The Emergency Override Embed System provides a reliable "eject button" for the streaming infrastructure. When the complex Cloudflare/RTMP system encounters issues, administrators can instantly switch to a simple embed code without any disruption visible to memorial viewers. This ensures that families always have a working stream, regardless of technical difficulties.

**Key Principle:** "Transparent to users, visible to operators."
