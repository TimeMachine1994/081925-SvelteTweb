# Admin Slideshow Page Refactor Plan

## Overview
Refactor the admin slideshow page to improve column structure, remove unnecessary fields, and ensure creator information is properly tracked and displayed.

---

## Phase 1: Investigation - Verify Creator Data Storage

### Objective
Determine if creator/account information is saved when slideshows are created.

### Tasks
1. **Review Firestore slideshow data model**
   - Check `slideshows` collection schema
   - Look for fields like `createdBy`, `userId`, `creatorEmail`, `creatorId`
   
2. **Review slideshow creation API**
   - Find the API endpoint that creates slideshows
   - Check if it saves user/creator information
   - Identify what user data is available at creation time

3. **Review existing slideshow admin page**
   - Check `src/routes/admin/services/slideshows/+page.server.ts`
   - See what fields are currently loaded
   - Understand current data structure

4. **Decision Point**
   - If creator data exists: proceed to Phase 2
   - If creator data missing: add to Phase 2 (update creation logic to save creator)

---

## Phase 2: Update Slideshow Creation to Save Creator Info (if needed)

### Objective
Ensure all new slideshows save creator information.

### Tasks (Conditional - only if creator data not currently saved)
1. **Update slideshow creation API**
   - Add `createdBy` field (user ID)
   - Add `creatorEmail` field
   - Add `creatorName` field (if available)
   
2. **Test slideshow creation**
   - Create a test slideshow
   - Verify creator fields are saved in Firestore

---

## Phase 3: Update Server Load Function

### Objective
Load slideshows with proper fields and enrich with creator and memorial names.

### Tasks
1. **Update `+page.server.ts`**
   - Remove/don't load slideshow title field
   - Keep: memorial reference, photos, status, createdAt
   - Load creator information (email/name)
   - Fetch memorial names for each slideshow
   - Handle duration field (set to "N/A" or calculate if possible)

2. **Return enhanced data**
   - Map slideshow data with memorial names
   - Include creator email/name
   - Format for grid display

---

## Phase 4: Update Column Definitions

### Objective
Modify the DataGrid columns to match new requirements.

### Tasks
1. **Update `+page.svelte` columns array**
   - **Remove**: Title column
   - **Keep**: Memorial (with memorial name, not ID)
   - **Keep**: Photos (count)
   - **Keep**: Status
   - **Update**: Duration to show "Connected" or handle missing data gracefully
   - **Update**: Created column to show creator email/name instead of just timestamp

2. **Add formatters**
   - Memorial: Display memorial name, possibly linkable
   - Photos: Display count (e.g., "12 photos")
   - Status: Format status nicely (e.g., "Processing", "Ready", "Error")
   - Duration: Show "N/A" or calculated duration if available
   - Created: Show creator name/email with optional timestamp

---

## Phase 5: Add Search and Bulk Actions (Optional Enhancement)

### Objective
Similar to memorials and streams, add search and bulk selection.

### Tasks
1. **Add search bar**
   - Search by memorial name, creator email, status
   
2. **Add bulk selection**
   - Checkboxes for each slideshow
   - Bulk delete action
   - Bulk status change (if applicable)

---

## Phase 6: Testing and Verification

### Objective
Ensure all changes work correctly.

### Tasks
1. **Test data loading**
   - Verify slideshows load correctly
   - Check memorial names display properly
   - Verify creator information shows correctly

2. **Test edge cases**
   - Slideshow with no memorial
   - Slideshow with no creator data (legacy)
   - Slideshow with no photos

3. **Visual verification**
   - Check column alignment
   - Verify data formatting
   - Ensure no broken links or missing data

---

## Files to Modify

### Primary Files
1. `frontend/src/routes/admin/services/slideshows/+page.server.ts` - Server load function
2. `frontend/src/routes/admin/services/slideshows/+page.svelte` - Component and columns
3. (Conditional) Slideshow creation API endpoint - Add creator tracking

### Investigation Targets
1. Firestore `slideshows` collection schema
2. Slideshow creation API (likely in `src/routes/api/slideshows/` or similar)

---

## Success Criteria

- [x] Creator data is saved when slideshows are created (if not already)
- [x] Admin slideshow page loads without title column
- [x] Memorial name displays correctly for each slideshow
- [x] Photos count displays
- [x] Status displays correctly
- [x] Duration handles missing data gracefully ("N/A" or "Connected")
- [x] Created column shows creator email/name
- [x] All data loads without errors
- [x] Page is visually clean and organized

---

## Notes

- Duration may need special handling if no duration data exists
- Consider what "connected" means for duration - may need clarification
- Legacy slideshows may not have creator info - handle gracefully
- Memorial name should be clickable to navigate to memorial admin page
