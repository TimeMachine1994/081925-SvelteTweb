# Journey Visualization Implementation Plan

> **Status:** ✅ IMPLEMENTED (December 29, 2025)

## Overview
Transform the journey grid to show a vertical flow visualization with different module types and visual connectors.

---

## Implementation Notes

**Successfully Implemented:**
- ✅ Module type system with 5 types (layout, page, route, logic, endpoint)
- ✅ Vertical flow layout in JourneyGrid component
- ✅ SquigglyConnector SVG component for visual separation
- ✅ RoutesBar component for horizontal route display
- ✅ Route expansion/collapse functionality
- ✅ Module-specific icons and styling

**Files Created/Modified:**
- `src/lib/components/JourneyGrid.svelte` - Vertical flow implementation
- `src/lib/components/SquigglyConnector.svelte` - New SVG connector component
- `src/lib/components/RoutesBar.svelte` - New horizontal routes component
- `src/lib/types/journey.ts` - Added moduleType, linkedRoutes, parentLayout fields

## Concept
Each journey follows a vertical flow pattern:
- **Beginning**: Main Layout → Start Page → Squiggly Connector → Routes Bar
- **Middle**: Route Logic Connectors (expandable from routes)
- **End**: Endpoint modules (Layout + Page pairs)

## Module Types

### 1. Layout Module
- Represents layout components (`+layout.svelte`)
- Used in Beginning (main layout) and End (endpoint layouts)
- Icon: 📐
- Type: `layout`

### 2. Page Module
- Represents page components (`+page.svelte`)
- Used in Beginning (start page) and End (endpoint pages)
- Icon: 📄
- Type: `page`

### 3. Route Module
- Represents route paths (clickable bar)
- Appears after squiggly line in Beginning
- Expandable to show connected logic
- Icon: 🔗
- Type: `route`

### 4. Logic Connector Module
- Middleware, auth, data loading, API calls
- Appears in Middle section
- Linked to specific routes
- Icon: ⚡
- Type: `logic`

### 5. Endpoint Module
- Final destination (Layout + Page pair)
- Appears in End section
- May extend main layout or use custom layout
- Icon: 🎯
- Type: `endpoint`

## Data Structure Changes

### Update POTJ Interface
```typescript
export interface POTJ {
  id: string;
  title: string;
  moduleType: 'layout' | 'page' | 'route' | 'logic' | 'endpoint';
  description?: string;
  section: JourneySectionType;
  fileRef?: string;
  linkedRoutes?: string[]; // For logic connectors
  parentLayout?: string; // For endpoints
  isExpandable?: boolean; // For routes
  expanded?: boolean; // UI state for routes
  // ... existing fields
}
```

### Update Journey Markdown Format
```markdown
### [POTJ:guest-b-1] Main Layout
**Type**: layout
**File**: `@/routes/+layout.svelte`
...

### [POTJ:guest-b-2] Landing Page
**Type**: page
**File**: `@/routes/+page.svelte`
...

### [POTJ:guest-b-3] Auth Routes
**Type**: route
**Routes**: /auth/login, /auth/signup, /auth/verify
...

### [POTJ:guest-m-1] Authentication Logic
**Type**: logic
**Linked Routes**: guest-b-3
**File**: `@/lib/server/auth.ts`
...

### [POTJ:guest-e-1] Dashboard Page
**Type**: endpoint
**Parent Layout**: guest-b-1
**File**: `@/routes/dashboard/+page.svelte`
...
```

## Implementation Steps

### Phase 1: Data Structure (30 min)
1. Update `POTJ` interface in `types/journey.ts`
2. Update parser in `journey-parser.ts` to extract `moduleType`
3. Parse `Type`, `Routes`, `Linked Routes`, and `Parent Layout` fields
4. Test with updated journey markdown

### Phase 2: Visual Layout (45 min)
1. Update `JourneyGrid.svelte` to vertical flow layout
2. Replace grid with flex column layout
3. Add module type icons based on `moduleType`
4. Add squiggly line connector SVG component
5. Create routes bar component (horizontal list of route modules)

### Phase 3: Route Expansion (30 min)
1. Add expand/collapse state management to JourneyGrid
2. When route clicked, show connected logic modules
3. Add visual indicator for expandable routes
4. Animate expansion/collapse

### Phase 4: Styling (15 min)
1. Keep existing card styles (MVP)
2. Add type-specific icons
3. Add subtle visual connectors (lines/arrows)
4. Ensure responsive layout

## File Changes Required

### 1. `src/lib/types/journey.ts`
- Add `moduleType` to POTJ interface
- Add `linkedRoutes`, `parentLayout`, `isExpandable`, `expanded` fields

### 2. `src/lib/server/journey-parser.ts`
- Parse `**Type**:` field from markdown
- Parse `**Routes**:` for route modules
- Parse `**Linked Routes**:` for logic connectors
- Parse `**Parent Layout**:` for endpoints

### 3. `src/lib/components/JourneyGrid.svelte`
- Change from grid to vertical flow layout
- Add `SquigglyConnector.svelte` component
- Add `RoutesBar.svelte` component
- Add expand/collapse logic
- Map module types to icons

### 4. New Components
- `src/lib/components/SquigglyConnector.svelte` - SVG squiggly line
- `src/lib/components/RoutesBar.svelte` - Horizontal route list

### 5. `journeys/guest.journey.md`
- Update all POTJs to include `**Type**:` field
- Add route groupings
- Link logic connectors to routes

## MVP Scope

### Include:
✅ Module type icons (simple emoji/text)
✅ Vertical flow layout
✅ Squiggly line connector (simple SVG wave)
✅ Routes bar (horizontal card list)
✅ Route expansion (show/hide linked logic)
✅ Keep existing card styles

### Exclude (Future):
❌ Animated transitions
❌ Complex visual connectors
❌ Drag-and-drop reordering
❌ Custom module colors/themes
❌ Real-time collaboration

## Testing Checklist
- [x] Parser correctly extracts module types
- [x] All 5 module types render with correct icons
- [x] Vertical flow displays in correct order
- [x] Squiggly line appears between start page and routes
- [x] Routes bar displays horizontally
- [x] Clicking route expands to show logic connectors
- [x] Clicking again collapses logic connectors
- [x] Endpoint modules show parent layout reference
- [x] Live updates work with new format
- [x] Responsive layout works on mobile

## Timeline Estimate
- Phase 1: 30 minutes ✅ Complete
- Phase 2: 45 minutes ✅ Complete
- Phase 3: 30 minutes ✅ Complete
- Phase 4: 15 minutes ✅ Complete
- Testing: 15 minutes ✅ Complete
**Total: ~2 hours** ✅ **COMPLETED**

## Next Steps
1. Review and approve this plan
2. Update journey markdown with module types
3. Implement data structure changes
4. Build UI components
5. Test with live journey file
