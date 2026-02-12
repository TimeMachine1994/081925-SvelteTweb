# Schedule Widget — Reusable Component Extraction

**Date:** 2-11-26  
**Goal:** Replace the simple "Request a Free Consultation" form on the home page with the full scheduling widget from `/schedule`, extracted into a shared Svelte 5 component.

---

## Overview

The scheduling flow (pick date/time → fill booking form → success with ICS download) currently lives inline in `src/routes/schedule/+page.svelte`. We are extracting it into `src/lib/components/ScheduleWidget.svelte` so it can be used on both the schedule page and the home page.

The simple consultation form on the home page (`POST /api/consultations`) will be **removed** and replaced with the full scheduling widget.

---

## Svelte 5 Best Practices Applied

Per official Svelte 5 documentation and MCP guidance:

### Runes
- **`$state`** for all reactive local state (step, selectedDate, slots, formStatus, etc.)
- **`$derived`** for computed values (weekDays, weekLabel)
- **`$props`** for component inputs — typed via a `Props` interface
- No legacy `export let`, `$:`, or stores for local component state

### Props Interface (TypeScript)
```ts
interface Props {
  variant?: 'dark' | 'light';
}
```
- `variant` controls color scheme: `'dark'` for the schedule page (dark bg), `'light'` for the home page (white bg)
- Default: `'dark'`

### Component Design
- Self-contained: all state, API calls, and rendering live inside the component
- No context or stores needed — the widget is stateless from the parent's perspective
- Event handlers use Svelte 5 `onclick={fn}` syntax (not legacy `on:click`)
- Form submission uses `onsubmit={fn}` (not legacy `on:submit`)
- Conditional rendering with `{#if}` / `{:else if}` / `{:else}`

### Styling Strategy
- Tailwind CSS classes throughout (consistent with existing codebase)
- `variant` prop drives conditional class strings for bg, text, border colors
- No scoped `<style>` block needed — Tailwind handles everything

---

## Files Changed

| File | Action |
|------|--------|
| `src/lib/components/ScheduleWidget.svelte` | **Created** — full scheduling widget |
| `src/routes/schedule/+page.svelte` | **Modified** — replaced inline logic with `<ScheduleWidget variant="dark" />` |
| `src/routes/+page.svelte` | **Modified** — removed old consultation form, added `<ScheduleWidget variant="light" />` |

## Files NOT Changed

| File | Reason |
|------|--------|
| `src/routes/api/schedule/availability/+server.ts` | No changes — same GET endpoint |
| `src/routes/api/schedule/book/+server.ts` | No changes — same POST endpoint |
| `src/routes/api/consultations/+server.ts` | No longer used by home page (can be kept for other uses) |

---

## API Dependencies

- **`GET /api/schedule/availability?date=YYYY-MM-DD`** — returns `{ slots: TimeSlot[], message?: string }`
- **`POST /api/schedule/book`** — accepts booking payload, returns `{ icsContent, googleCalendarUrl }`

---

## Component Architecture

```
ScheduleWidget.svelte
├── Props: { variant?: 'dark' | 'light' }
├── State ($state):
│   ├── step: 'pick' | 'form' | 'success'
│   ├── selectedDate, slots, slotsMessage, loadingSlots
│   ├── selectedSlot, weekOffset
│   ├── formStatus, errorMessage, touched, fieldErrors
│   └── icsContent, googleCalendarUrl, bookedSlot
├── Derived ($derived):
│   ├── weekDays
│   └── weekLabel
├── Methods:
│   ├── fetchSlots(dateStr)
│   ├── selectSlot(slot)
│   ├── backToPicker()
│   ├── validateField(name, value)
│   ├── handleBlur(e)
│   ├── handleSubmit(e)
│   ├── downloadICS()
│   ├── formatBookedTime(iso)
│   └── formatBookedDate(iso)
└── Rendering:
    ├── Step 1: Date picker + time slots
    ├── Step 2: Booking form (name, email, phone, matter type, urgency, etc.)
    └── Step 3: Success + calendar download
```

---

## Home Page Layout Change

**Before:**
```
Hero → Values → Practice Areas → [Simple Consultation Form] → Quote/CTA
```

**After:**
```
Hero → Values → Practice Areas → [Schedule Widget (light variant)] → Quote/CTA
```

The section wrapper keeps the "Get Started" heading and marketing copy on the left, with the scheduling widget on the right — but uses a full-width layout when the date picker needs more space.

---

## Schedule Page Layout Change

**Before:**
```
Hero → [Inline scheduling logic ~350 lines] → Trust Indicators
```

**After:**
```
Hero → <ScheduleWidget variant="dark" /> → Trust Indicators
```
