# Darren's Suggestions - Work Breakdown Structure
**Date:** February 4, 2026

---

## Feature 1: Lightbox for Media Content

### Overview
Enable users to click on timeline events to open a lightbox displaying media content (images, videos, PDFs) fetched from a URL specified in the spreadsheet.

### Tasks

#### 1.1 Column Mapping for Media URL
- [x] Add "Media URL" option to column mapping dropdown (already exists as `mediaUrl`)
- [x] Verify `mediaUrl` field is properly passed through CSV parsing
- [x] Ensure media URL is included in event data returned by API

#### 1.2 Lightbox Component Enhancement
- [x] Review existing `MediaLightbox.svelte` component
- [x] Add support for different media types:
  - [x] Images (jpg, png, gif, webp)
  - [x] Videos (mp4, webm, YouTube, Vimeo embeds)
  - [x] PDFs (embedded viewer)
  - [x] External links (iframe or redirect)
- [x] Add loading state while media fetches
- [x] Add error state for failed media loads
- [x] Add close button and keyboard escape support

#### 1.3 Line Timeline Integration
- [x] Ensure `ZoomTimeline` events are clickable
- [x] Pass `onEventClick` handler to open lightbox
- [x] Display event title, description, and media in lightbox

#### 1.4 Calendar Timeline Integration
- [x] Make calendar day cells clickable when they have events
- [x] Pass `onEventClick` handler to `CalendarTimeline` component
- [x] Open lightbox with event details and media

---

## Feature 2: Tooltips on Calendar View

### Overview
Show tooltips when hovering over colored squares in the calendar/heatmap view, displaying event details.

### Tasks

#### 2.1 Tooltip Component
- [x] Create or use existing tooltip component
- [x] Style tooltip to match app design
- [x] Position tooltip near cursor/element
- [x] Handle edge cases (viewport boundaries)

#### 2.2 Calendar Cell Hover State
- [x] Add `onmouseenter` / `onmouseleave` handlers to calendar cells
- [x] Track hovered cell position and events
- [x] Show tooltip with delay (e.g., 150ms) to prevent flicker

#### 2.3 Tooltip Content
- [x] Display event count for the day
- [x] List event titles (limit to 4 with "and X more")
- [x] Show date in readable format
- [x] Show "Click to view media" hint when media available

#### 2.4 Mobile/Touch Support
- [ ] On touch devices, show tooltip on tap
- [ ] Dismiss tooltip on tap elsewhere
- [ ] Consider long-press for tooltip vs tap for lightbox

---

## Implementation Order

| Priority | Task | Estimated Effort |
|----------|------|------------------|
| 1 | Verify media URL in event data | Small |
| 2 | Add tooltips to calendar cells | Medium |
| 3 | Enhance lightbox for multiple media types | Medium |
| 4 | Connect calendar clicks to lightbox | Small |
| 5 | Mobile/touch support | Small |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/components/timeline/CalendarTimeline.svelte` | Add hover tooltips, click handlers |
| `src/lib/components/timeline/MediaLightbox.svelte` | Enhance media type support |
| `src/routes/projects/[id]/+page.svelte` | Connect lightbox to calendar view |
| `src/lib/utils/csv-parser.ts` | Verify mediaUrl field parsing |

---

## Acceptance Criteria

- [x] User can map a spreadsheet column to "Media URL"
- [x] Clicking any event (line or calendar view) opens lightbox
- [x] Lightbox displays image/video/content from media URL
- [x] Lightbox shows event title and description
- [x] Hovering over calendar cells shows tooltip with event info
- [x] Tooltip displays event count and titles for that day
- [ ] Works on both desktop (hover) and mobile (tap) - *desktop complete, mobile pending*
