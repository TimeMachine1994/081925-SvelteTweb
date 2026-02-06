# Layout Types Refactor

Replace the current Uniform/Chrono spacer toggle with a full **Layout Mode** system supporting 6 distinct visualization types, each rendered by its own component.

---

## Current State

- **SpacerMode** type: `'uniform' | 'chronological'` — controls gap sizing within `YearColumn`
- **ColumnTimeline** is the only editor-rendered layout (vertical columns grouped by year)
- **CalendarTimeline**, **MasterTimeline**, **ZoomTimeline** exist but are unused/legacy
- The **EditorToolbar** has a simple Uniform/Chrono toggle
- The **TimelineStylePicker** has Line/Calendar options (unused in editor flow)

## New Layout Modes

| # | ID | Name | Description |
|---|-----|------|-------------|
| 1 | `columns` | **Columns** | Current `ColumnTimeline` — vertical year columns with event cards. Keeps existing uniform spacing. Rename from "uniform". |
| 2 | `timeline` | **Timeline** | Classic horizontal line with date dots and spoke lines connecting to info cards above/below. Builds on existing `ZoomTimeline` pattern. |
| 3 | `calendar` | **Calendar** | Month grids where each day is a square — filled squares indicate events, hover shows event data tooltip. Extends existing `CalendarTimeline`. |
| 4 | `coverflow` | **Coverflow** | Horizontal scrollable strip with 3D perspective transforms mimicking Apple's Coverflow. Center card is full-size, neighbors angle away. Scrollbar + scroll-snap + CSS transforms. |
| 5 | `rolodex` | **Rolodex** | Stacked card carousel — forward/back flips cards with a 3D rotation animation. One card visible at a time, previous/next peek behind. |
| 6 | `index` | **Index** | Grid of date cells. Clicking a date opens a full-screen slide view with forward/back/home navigation. No forward at end, no back at start. |

---

## Implementation Plan

### Phase 1: Type System & Plumbing

**Files:** `editor.svelte.ts`, `categories.ts`, `+page.svelte`, `EditorToolbar.svelte`

1. **Replace `SpacerMode` with `LayoutMode`** in `src/lib/stores/editor.svelte.ts`
   - New type: `export type LayoutMode = 'columns' | 'timeline' | 'calendar' | 'coverflow' | 'rolodex' | 'index';`
   - Remove `SpacerMode` type, update `EditorState` and store functions.
   - Rename `setSpacer` → `setLayout`.

2. **Update `+page.svelte`**
   - `let spacerMode` → `let layoutMode = $state<LayoutMode>('columns')`.
   - Pass `layoutMode` to toolbar and conditionally render the correct layout component.
   - Persist `layoutMode` in project settings via the save flow.

3. **Update `EditorToolbar.svelte`**
   - Replace Uniform/Chrono toggle with a **Layout dropdown** or segmented control showing all 6 modes with icons.
   - New prop: `layoutMode` + `onLayoutChange`.

4. **Update `ColumnTimeline.svelte`**
   - Remove `spacerMode` prop (it becomes the default columns behavior — always uniform spacing).
   - Remove `SpacerMode` import.

5. **Update `YearColumn.svelte` and `GapIndicator.svelte`**
   - Remove `spacerMode` prop — gap indicators always use uniform height when in columns mode.

### Phase 2: New Layout Components

Each component receives the **shared props interface**:

```ts
interface LayoutProps {
  events: TimelineEvent[];
  categoryConfig: CategoryConfig[];
  yearStyles: Map<number, YearStyle>;
  selectedEventId?: string | null;
  onEventClick?: (event: TimelineEvent) => void;
  onYearClick?: (year: number) => void;
}
```

#### 2A — `HorizontalTimeline.svelte` (layout: `timeline`)
- Horizontal line with dots at proportional date positions.
- Spoke lines extend up/down (alternating) to info cards showing date, title, category badge.
- Cards use `categoryConfig` colors.
- Horizontal scroll with minimap.
- Click a card → opens properties panel.

#### 2B — Refactor `CalendarTimeline.svelte` (layout: `calendar`)
- Already exists with month-grid, day cells, hover tooltips.
- Wire it into the new layout system with the shared props interface.
- Add `categoryConfig` support so filled cells use category colors.
- Add `selectedEventId` highlight and `onEventClick` integration.

#### 2C — `CoverflowTimeline.svelte` (layout: `coverflow`)
- Horizontal strip of event cards.
- CSS 3D transforms: center card is `scale(1) rotateY(0)`, neighbors `scale(0.8) rotateY(±45deg)` with increasing translateZ.
- Scrollbar at bottom for scrubbing.
- `scroll-snap-type: x mandatory` for smooth snapping.
- Left/right arrow keys & swipe support.
- Center card shows full event details; side cards show date only.

#### 2D — `RolodexTimeline.svelte` (layout: `rolodex`)
- Single visible card at a time, centered.
- Forward/back buttons rotate cards with a CSS `rotateX` flip animation.
- Card stack visual: slight offset shadows behind the active card.
- Counter showing "Card N of M".
- Keyboard arrow support.

#### 2E — `IndexTimeline.svelte` (layout: `index`)
- **Index view (default state):** Responsive grid of date cells, each showing formatted date + event count badge. Colored by category.
- **Slide view (after clicking a cell):**
  - Full-width card showing event details (date, title, description, exhibit, media).
  - Navigation bar: **← Back** | **Home (grid icon)** | **Forward →**
  - Hide back arrow on first slide, hide forward arrow on last slide.
  - If a date has multiple events, they become a sub-series of slides.
  - Keyboard arrow + Escape (back to index) support.

### Phase 3: Layout Picker in Editor

- Update `+page.svelte` to conditionally render the active layout component:
  ```svelte
  {#if layoutMode === 'columns'}
    <ColumnTimeline ... />
  {:else if layoutMode === 'timeline'}
    <HorizontalTimeline ... />
  {:else if layoutMode === 'calendar'}
    <CalendarTimeline ... />
  {:else if layoutMode === 'coverflow'}
    <CoverflowTimeline ... />
  {:else if layoutMode === 'rolodex'}
    <RolodexTimeline ... />
  {:else if layoutMode === 'index'}
    <IndexTimeline ... />
  {/if}
  ```

- All layouts emit the same `onEventClick` callback so the **PropertiesPanel** works with every layout.

### Phase 4: Preview & Persistence

- **PreviewMode** respects the saved `layoutMode` instead of hardcoding `ColumnTimeline`.
- Save `layoutMode` to `projectSettings.timelineStyle` via the existing PATCH API (the DB column already exists).
- Load `layoutMode` from `data.settings?.timelineStyle` on page init.

---

## Key Architectural Decisions

- **`SpacerMode` is replaced entirely** by a new `LayoutMode` type
- All 6 layouts share the same **props interface** so the **PropertiesPanel** works with every layout
- The **EditorToolbar** spacer toggle becomes a **layout picker dropdown** with all 6 options
- `layoutMode` is **persisted** in the existing `projectSettings.timelineStyle` DB column
- **PreviewMode** respects the saved layout instead of hardcoding ColumnTimeline

---

## File Change Summary

| File | Action |
|------|--------|
| `src/lib/stores/editor.svelte.ts` | Replace `SpacerMode` → `LayoutMode` |
| `src/lib/components/editor/EditorToolbar.svelte` | Layout dropdown replacing spacer toggle |
| `src/lib/components/timeline/ColumnTimeline.svelte` | Remove `spacerMode` prop |
| `src/lib/components/timeline/YearColumn.svelte` | Remove `spacerMode` prop |
| `src/lib/components/timeline/GapIndicator.svelte` | Remove `spacerMode` prop, always uniform |
| `src/lib/components/timeline/CalendarTimeline.svelte` | Refactor to shared props interface |
| `src/lib/components/timeline/HorizontalTimeline.svelte` | **New** — classic horizontal timeline |
| `src/lib/components/timeline/CoverflowTimeline.svelte` | **New** — Apple Coverflow style |
| `src/lib/components/timeline/RolodexTimeline.svelte` | **New** — card flip carousel |
| `src/lib/components/timeline/IndexTimeline.svelte` | **New** — grid index + slide viewer |
| `src/routes/projects/[id]/+page.svelte` | Layout state, conditional rendering, save/load |
| `src/lib/components/editor/PreviewMode.svelte` | Respect saved layout mode |
| `src/lib/components/timeline/index.ts` | Export new components |

---

## Build Order

1. Phase 1 (plumbing) — get `LayoutMode` type flowing, toolbar updated, columns still works
2. Phase 2A — HorizontalTimeline
3. Phase 2B — CalendarTimeline refactor
4. Phase 2C — CoverflowTimeline
5. Phase 2D — RolodexTimeline
6. Phase 2E — IndexTimeline
7. Phase 3 — conditional rendering + PropertiesPanel integration
8. Phase 4 — preview + persistence
