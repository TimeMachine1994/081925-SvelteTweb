# Admin User Journey Documentation & Gap Analysis
## Tributestream Admin Dashboard - January 26, 2026

This document maps the expected user journeys for major admin workflows, identifies involved components, and highlights gaps between expected and actual behavior.

---

## TABLE OF CONTENTS
1. [Journey Map Notation](#journey-map-notation)
2. [Memorial Management Workflows](#memorial-management-workflows)
3. [Livestream Management Workflows](#livestream-management-workflows)
4. [User Management Workflows](#user-management-workflows)
5. [Content Management Workflows](#content-management-workflows)
6. [System Administration Workflows](#system-administration-workflows)
7. [Financial Management Workflows](#financial-management-workflows)
8. [Analytics & Reporting Workflows](#analytics--reporting-workflows)
9. [Gap Summary Matrix](#gap-summary-matrix)
10. [Priority Recommendations](#priority-recommendations)

---

## JOURNEY MAP NOTATION

### Symbols Used
- ✅ **Step Working** - Fully implemented and functional
- ⚠️ **Step Partial** - Implemented but with limitations
- ❌ **Step Missing** - Not implemented
- 🔄 **Step Workaround** - Alternative path exists
- 📍 **Decision Point** - User must make a choice

### Component References
- **[Component Name]** - Links to specific component file
- **/api/endpoint** - API endpoint involved
- **→** - Navigation or flow direction
- **↻** - Loop or return to previous step

---

## UPDATE NOTES (January 26, 2026)

This document was refreshed to match the current merged code.

### Key Changes Since January 24
- Filtering now works (client-side) on these admin list pages:
  - Memorials
  - Slideshows
  - Memorial Owners
  - Funeral Directors
  - Blog Posts
  - Audit Logs
  - Demo Sessions
  - Deleted Items
- Filtering remains a known gap on:
  - Admin Users (filters UI present, but does not filter results)

---

## MEMORIAL MANAGEMENT WORKFLOWS

### Journey 1: Create New Memorial from Admin Panel

**Expected User Journey:**
```
Admin Dashboard → Memorials List → Create Memorial → Configure Memorial → Publish
```

**Detailed Steps:**

#### Step 1: Navigate to Memorials
**Status:** ✅ **Working**

**Components:**
- `AdminLayout.svelte` - Sidebar navigation
- `navigation.ts` - Route configuration

**User Actions:**
1. Click "Services" domain in sidebar
2. Click "Memorials" item
3. Navigate to `/admin/services/memorials`

**Expected Behavior:** User arrives at memorials list page  
**Actual Behavior:** ✅ Works as expected

---

#### Step 2: View Memorials List
**Status:** ✅ **Working**

**Components:**
- `admin/services/memorials/+page.svelte`
- `DataGrid.svelte`
- `BulkActionBar.svelte`
- `FilterBuilder.svelte`

**User Actions:**
1. View existing memorials in data grid
2. Use search to find specific memorial
3. Apply filters (payment status, visibility, date)
4. Select memorials for bulk actions

**Expected Behavior:** 
- See all memorials with key information
- Filter/search works to narrow results
- Bulk actions available for selected items

**Actual Behavior:** 
- ✅ Grid displays correctly
- ✅ Search works
- ✅ Filters work (client-side filtering)
- ✅ Bulk actions work

**Gap Impact:** N/A

---

#### Step 3: Click "Create Memorial"
**Status:** ❌ **Missing**

**Expected Components:**
- Create Memorial button (exists in header)
- `/admin/services/memorials/create` route (doesn't exist)

**User Actions:**
1. Click "Create Memorial" button in page header
2. Navigate to creation form

**Expected Behavior:** Navigate to memorial creation form  
**Actual Behavior:** ❌ **GAP:** Button exists but route doesn't exist (404 error)

**Gap Impact:** High - Cannot create memorials from admin panel

**Workaround:** 🔄 Create memorials via:
- `/register/loved-one` (public route)
- `/api/admin/create-memorial` (API only)
- Funeral director portal

---

#### Step 4: Fill Memorial Creation Form
**Status:** ❌ **Missing**

**Expected Components:**
- Memorial creation form component
- Loved one information fields
- Service details fields
- Owner assignment
- Pricing configuration

**Expected Behavior:** Complete form with all memorial details  
**Actual Behavior:** ❌ **GAP:** No creation form exists

---

#### Step 5: Configure Memorial Settings
**Status:** ⚠️ **Partial - Only via Detail Page**

**Components:**
- `admin/services/memorials/[memorialId]/+page.svelte`
- `CustomPricingEditor.svelte`
- `AdminScheduleEditor.svelte`

**User Actions:**
1. Set custom pricing
2. Configure service schedule
3. Set display options
4. Configure visibility

**Expected Behavior:** Configure during creation  
**Actual Behavior:** ⚠️ **GAP:** Only possible after memorial exists (must edit existing)

---

#### Step 6: Publish Memorial
**Status:** ⚠️ **Partial**

**Components:**
- Memorial detail page
- Visibility toggle in data grid

**Expected Behavior:** 
- Toggle public/private status
- Memorial becomes accessible to public

**Actual Behavior:** 
- ✅ Can toggle visibility via data grid click
- ✅ Can toggle via bulk action
- ⚠️ **GAP:** No "publish" workflow with validation

**Gap Analysis:**
- Missing validation (e.g., "Memorial ready to publish? Check: payment received, schedule set, content added")
- No preview before publishing
- No publish notification to owner

---

### Journey 2: Edit Existing Memorial

**Expected User Journey:**
```
Memorials List → Click Memorial Row → Memorial Detail → Edit Sections → Save Changes
```

**Detailed Steps:**

#### Step 1: Navigate to Memorial Detail
**Status:** ✅ **Working**

**Components:**
- Memorials list page with row click handler
- `/admin/services/memorials/[memorialId]` route

**User Actions:**
1. Click any memorial row in data grid
2. Navigate to memorial detail page

**Expected Behavior:** View full memorial details  
**Actual Behavior:** ✅ Works perfectly

---

#### Step 2: View Memorial Information
**Status:** ✅ **Working**

**Components:**
- Memorial detail page
- Memorial overview card

**Displayed Information:**
- Memorial ID, Full slug, Public URL
- Owner UID and email
- Funeral director info (if applicable)
- Creation and update timestamps
- Payment status, Visibility status
- Follower count

**Expected Behavior:** See comprehensive memorial information  
**Actual Behavior:** ✅ All information displayed correctly

---

#### Step 3: Edit Display Settings
**Status:** ✅ **Working**

**Components:**
- Display settings section
- Inline edit form

**User Actions:**
1. Click "Edit" button
2. Modify custom title
3. Modify public note
4. Save changes

**Expected Behavior:** Update memorial display settings  
**Actual Behavior:** ✅ Works with success/error messages

---

#### Step 4: Edit Custom Pricing
**Status:** ✅ **Working**

**Components:**
- `CustomPricingEditor.svelte`

**User Actions:**
1. Select base package
2. Configure custom pricing
3. Enable/disable add-ons
4. Save pricing configuration

**Expected Behavior:** Update memorial pricing  
**Actual Behavior:** ✅ Works correctly, triggers page reload

---

#### Step 5: Edit Service Schedule
**Status:** ✅ **Working**

**Components:**
- `AdminScheduleEditor.svelte`

**User Actions:**
1. Edit main service location, date, time
2. Add/remove additional services
3. Set service duration
4. Save schedule

**Expected Behavior:** Update memorial schedule  
**Actual Behavior:** ✅ Works correctly

---

#### Step 6: Manage Streams
**Status:** ✅ **Working**

**Components:**
- Streams section
- `StreamCard.svelte`
- Stream creation form

**User Actions:**
1. View existing streams
2. Create new stream
3. Edit stream settings
4. View RTMP credentials

**Expected Behavior:** Full stream management  
**Actual Behavior:** ✅ Comprehensive stream management available

---

#### Step 7: Manage Emergency Embeds
**Status:** ✅ **Working** (but unusual feature)

**Components:**
- Emergency embed section
- Emergency chat embed section

**User Actions:**
1. Add emergency video embed code
2. Add emergency chat embed code
3. Set embed titles

**Expected Behavior:** Override standard stream display  
**Actual Behavior:** ✅ Works as designed

**Note:** This is an "emergency" feature suggesting workarounds for system issues

---

#### Step 8: Manage Slideshows
**Status:** ✅ **Working**

**Components:**
- Slideshows section
- Slideshow cards

**User Actions:**
1. View memorial slideshows
2. Click to edit slideshow

**Expected Behavior:** View and access slideshow management  
**Actual Behavior:** ✅ Lists slideshows correctly

---

#### Step 9: Delete Memorial
**Status:** ✅ **Working**

**Components:**
- Delete button in header
- `/api/admin/bulk-actions` endpoint

**User Actions:**
1. Click "Delete Memorial" danger button
2. Confirm deletion
3. Memorial soft-deleted

**Expected Behavior:** Mark memorial as deleted  
**Actual Behavior:** ✅ Works with confirmation dialog

---

### Journey 3: Bulk Manage Memorials

**Expected User Journey:**
```
Memorials List → Select Multiple → Choose Bulk Action → Confirm → Changes Applied
```

**Status:** ✅ **Working** (with filter gap)

**Components:**
- `DataGrid.svelte` - Selection checkboxes
- `BulkActionBar.svelte` - Action buttons
- `/api/admin/bulk-actions` - Processing

**Available Actions:**
- Mark Paid / Mark Unpaid
- Make Public / Make Private
- Export CSV
- Delete

**User Actions:**
1. Select memorial checkboxes (individual or "select all")
2. Choose action from bulk action bar
3. Confirm action (if destructive)
4. Wait for processing
5. View results (success/failure counts)

**Expected Behavior:** Apply action to all selected memorials  
**Actual Behavior:** ✅ Works correctly with proper error handling

**Enhancement Opportunity:** Could add progress indicator for large batches

---

### Journey 4: Archive Incomplete Memorial

**Expected User Journey:**
```
Admin Dashboard → Incomplete Memorials → Archive Button → Confirm → Archived
```

**Status:** ✅ **Working**

**Components:**
- `admin/+page.svelte` - Dashboard
- Archive button per memorial
- Confirmation modal

**User Actions:**
1. View incomplete memorials on dashboard
2. Click "Archive" button for specific memorial
3. Confirm archival in modal
4. Memorial removed from incomplete list

**Expected Behavior:** Archive memorial to clean up incomplete list  
**Actual Behavior:** ✅ Works with confirmation dialog

**Note:** This is a workflow-specific action for dashboard cleanup

---

## LIVESTREAM MANAGEMENT WORKFLOWS

### Journey 5: Schedule a Livestream

**Expected User Journey:**
```
Memorial Detail → Streams Section → Create Stream → Configure Stream → Save
```

**Detailed Steps:**

#### Step 1: Navigate to Memorial's Streams
**Status:** ✅ **Working**

**Path Options:**
- **Option A:** Memorial detail page → Streams section
- **Option B:** Streams list page → Filter by memorial

**Components:**
- Memorial detail page
- Streams list page

**User Actions:**
1. Navigate to memorial detail page
2. Scroll to "Livestreams" section
3. View existing streams

**Expected Behavior:** See all streams for memorial  
**Actual Behavior:** ✅ Shows all streams with `StreamCard` components

---

#### Step 2: Click "Create Stream"
**Status:** ✅ **Working**

**Components:**
- Create Stream button
- Stream creation form (inline)

**User Actions:**
1. Click "➕ Create Stream" button
2. Form appears inline

**Expected Behavior:** Show stream creation form  
**Actual Behavior:** ✅ Form toggles visibility

---

#### Step 3: Fill Stream Details
**Status:** ✅ **Working**

**Form Fields:**
- Stream title (text input)
- Scheduled date (date picker)
- Scheduled time (time picker)

**User Actions:**
1. Enter stream title
2. Select date
3. Select time
4. Click "Create" button

**Expected Behavior:** 
- Create stream with scheduled start time
- Generate RTMP credentials
- Stream status = "scheduled"

**Actual Behavior:** ✅ Creates stream successfully

---

#### Step 4: View Stream Credentials
**Status:** ✅ **Working**

**Components:**
- `StreamCard.svelte`
- RTMP credentials section

**Displayed Information:**
- Stream status
- Scheduled start time
- RTMP URL
- Stream key
- Copy buttons

**User Actions:**
1. View stream card
2. Copy RTMP URL
3. Copy stream key
4. Share with broadcaster

**Expected Behavior:** Access streaming credentials  
**Actual Behavior:** ✅ All credentials available with copy buttons

---

#### Step 5: Monitor Stream Status
**Status:** ✅ **Working**

**Components:**
- `StreamCard.svelte` with live updates
- Stream status badges

**Stream States:**
- 🕒 Scheduled (before start time)
- 🔴 Live (actively streaming)
- ✅ Completed (recording available)

**User Actions:**
1. Monitor stream status badge
2. Check viewer count (if live)
3. Verify recording status (if completed)

**Expected Behavior:** Real-time status updates  
**Actual Behavior:** ✅ Status updates correctly

---

### Journey 6: View All Livestreams

**Expected User Journey:**
```
Admin Dashboard → Streams → View by Status → Take Action
```

**Detailed Steps:**

#### Step 1: Navigate to Streams List
**Status:** ✅ **Working**

**Components:**
- `admin/services/streams/+page.svelte`
- Grouped stream display

**User Actions:**
1. Click "Services" → "Streams" in navigation
2. View streams page

**Expected Behavior:** See all streams across all memorials  
**Actual Behavior:** ✅ Shows all streams grouped by status

---

#### Step 2: View Streams by Status
**Status:** ✅ **Working**

**Status Groups:**
- 🔴 **LIVE** - Currently streaming
- 📅 **SCHEDULED** - Upcoming streams
- ✅ **COMPLETED** - Past streams with recordings
- ❓ **OTHER** - Any other status

**Components:**
- Status sections with headers
- Stream count badges
- `StreamCard` grid display

**User Actions:**
1. Scan live streams section
2. Review scheduled streams
3. Access completed recordings

**Expected Behavior:** Quickly identify streams by status  
**Actual Behavior:** ✅ Clear visual grouping

---

#### Step 3: Search for Specific Stream
**Status:** ✅ **Working**

**Components:**
- Search bar
- URL parameter handling

**User Actions:**
1. Enter search query (stream title, memorial name, status)
2. Submit search
3. View filtered results

**Expected Behavior:** Find specific stream quickly  
**Actual Behavior:** ✅ Search works correctly

---

#### Step 4: Bulk Manage Streams
**Status:** ✅ **Working**

**Components:**
- Selection checkboxes
- `BulkActionBar.svelte`

**Available Actions:**
- Make Visible / Make Invisible
- Delete

**User Actions:**
1. Select stream checkboxes
2. Choose bulk action
3. Confirm action

**Expected Behavior:** Apply action to selected streams  
**Actual Behavior:** ✅ Works correctly

---

### Journey 7: Manage Hardware Encoders

**Expected User Journey:**
```
Admin Dashboard → Encoders → Create/Configure → Assign to Memorial
```

**Detailed Steps:**

#### Step 1: Navigate to Encoders Page
**Status:** ✅ **Working**

**Components:**
- `admin/services/encoders/+page.svelte`

**User Actions:**
1. Click "Services" → "Encoders"
2. View encoders page

**Expected Behavior:** See encoder management interface  
**Actual Behavior:** ✅ Well-designed encoder dashboard

---

#### Step 2: View Encoder Statistics
**Status:** ✅ **Working**

**Components:**
- Stats grid (Total, Available, Assigned, Maintenance)

**User Actions:**
1. Review encoder availability
2. Check assignment status

**Expected Behavior:** Quick overview of encoder fleet  
**Actual Behavior:** ✅ Clear statistics display

---

#### Step 3: Filter Encoders by Status
**Status:** ✅ **Working**

**Components:**
- Status filter buttons
- URL parameter handling

**Filter Options:**
- All
- Available
- Assigned
- Maintenance

**User Actions:**
1. Click status filter button
2. View filtered encoders

**Expected Behavior:** Show only encoders with selected status  
**Actual Behavior:** ✅ Filters work correctly

---

#### Step 4: Create New Encoder
**Status:** ✅ **Working**

**Components:**
- "Add Encoder" button
- Create encoder modal
- Form inputs

**Form Fields:**
- Encoder name (required)
- Description
- Device type (Phone, Hardware, OBS)
- Location

**User Actions:**
1. Click "Add Encoder" button
2. Fill form fields
3. Click "Create Encoder"
4. Encoder created with RTMP credentials

**Expected Behavior:** Create encoder and provision credentials  
**Actual Behavior:** ✅ Works perfectly, includes credential provisioning

---

#### Step 5: View Encoder Details
**Status:** ✅ **Working**

**Components:**
- Encoder cards
- Expandable credentials section

**Displayed Information:**
- Encoder name and status
- Device type and location
- Current assignment (if assigned)
- RTMP URL and stream key
- Copy buttons

**User Actions:**
1. View encoder card
2. Expand credentials section
3. Copy credentials

**Expected Behavior:** Access all encoder information  
**Actual Behavior:** ✅ Comprehensive information display

---

#### Step 6: Change Encoder Status
**Status:** ✅ **Working**

**Components:**
- Status action buttons

**Available Actions:**
- Mark Available
- Mark Maintenance

**User Actions:**
1. Click status button
2. Confirm status change
3. Encoder status updated

**Expected Behavior:** Update encoder availability  
**Actual Behavior:** ✅ Works with confirmations

**Note:** Cannot change status if currently assigned (protection mechanism)

---

#### Step 7: Delete Encoder
**Status:** ✅ **Working**

**Components:**
- Delete button (trash icon)
- Confirmation dialog

**User Actions:**
1. Click delete button
2. Confirm deletion
3. Encoder deleted

**Expected Behavior:** Remove encoder from system  
**Actual Behavior:** ✅ Works with confirmation

**Note:** Cannot delete if assigned (protection mechanism)

---

## USER MANAGEMENT WORKFLOWS

### Journey 8: Manage Memorial Owners

**Expected User Journey:**
```
Users → Memorial Owners → View/Edit → Take Action
```

**Detailed Steps:**

#### Step 1: Navigate to Memorial Owners
**Status:** ✅ **Working**

**Components:**
- `admin/users/memorial-owners/+page.svelte`
- `DataGrid.svelte`

**User Actions:**
1. Click "Users" → "Memorial Owners"
2. View owners list

**Expected Behavior:** See all memorial owner accounts  
**Actual Behavior:** ✅ Shows all owners in data grid

---

#### Step 2: Search/Filter Owners
**Status:** ⚠️ **Partial**

**Components:**
- Search bar
- `FilterBuilder.svelte`

**User Actions:**
1. Enter search query
2. Apply filters (payment status, memorial count, date)

**Expected Behavior:** Filter owner list  
**Actual Behavior:** 
- ✅ Search works
- ✅ Filters work (client-side filtering)

---

#### Step 3: View Owner Details
**Status:** ❓ **Unknown**

**Components:**
- Row click handler
- `/admin/users/memorial-owners/[userId]` route

**User Actions:**
1. Click owner row
2. Navigate to user detail page

**Expected Behavior:** View detailed user information and memorials  
**Actual Behavior:** ❓ Route exists but implementation not reviewed

**Recommendation:** Review and document user detail page functionality

---

#### Step 4: Bulk Manage Owners
**Status:** ✅ **Working**

**Components:**
- `BulkActionBar.svelte`

**Available Actions:**
- Email Users
- Export CSV
- Suspend

**User Actions:**
1. Select owner checkboxes
2. Choose bulk action
3. Confirm action

**Expected Behavior:** Apply action to selected owners  
**Actual Behavior:** ✅ Works correctly

---

### Journey 9: Manage Funeral Directors

**Expected User Journey:**
```
Users → Funeral Directors → Review Profile → Approve/Suspend
```

**Detailed Steps:**

#### Step 1: Navigate to Funeral Directors
**Status:** ✅ **Working**

**Components:**
- `admin/users/funeral-directors/+page.svelte`

**User Actions:**
1. Click "Users" → "Funeral Directors"
2. View directors list

**Expected Behavior:** See all funeral director accounts  
**Actual Behavior:** ✅ Shows all directors with company info

---

#### Step 2: Review Director Profile
**Status:** ❓ **Unknown**

**Components:**
- Row click handler
- Director detail page (not reviewed)

**User Actions:**
1. Click director row
2. View full profile
3. Review professional information

**Expected Behavior:** See comprehensive director information  
**Actual Behavior:** ❓ Implementation not reviewed

---

#### Step 3: Approve/Suspend Director
**Status:** ⚠️ **Partial**

**Components:**
- Status column in data grid
- Bulk actions

**Expected Actions:**
- Approve pending director
- Suspend active director
- Reactivate suspended director

**User Actions:**
1. Select director(s)
2. Choose action
3. Confirm

**Expected Behavior:** Change director status  
**Actual Behavior:** ⚠️ **GAP:** No visible approve workflow for pending directors

**Recommendation:** Add approval workflow with:
- Pending applications view
- Approve/Reject actions
- Notification emails

---

### Journey 10: Manage Admin Users

**Expected User Journey:**
```
Users → Admin Users → Add Admin → Assign Role → Manage Access
```

**Detailed Steps:**

#### Step 1: Navigate to Admin Users
**Status:** ✅ **Working**

**Components:**
- `admin/users/admin-users/+page.svelte`
- Role information banner

**User Actions:**
1. Click "Users" → "Admin Users"
2. View admin users list
3. Read role descriptions

**Expected Behavior:** See all admin accounts with roles  
**Actual Behavior:** ✅ Clear display with role badges

---

#### Step 2: Add New Admin
**Status:** ❌ **Missing** (Button exists but no route)

**Expected Components:**
- "Add Admin" button (exists, permission-gated)
- Admin creation form (missing)

**Expected Form Fields:**
- Name
- Email
- Admin role selection
- Initial password or magic link

**User Actions:**
1. Click "Add Admin" button
2. Fill form
3. Assign role
4. Create admin account

**Expected Behavior:** Create new admin user  
**Actual Behavior:** ❌ **GAP:** Button exists but no creation route

**Gap Impact:** High - Cannot add new admin users through UI

**Workaround:** 🔄 Must create via:
- Direct database manipulation
- API call
- Firebase console

---

#### Step 3: Filter by Role
**Status:** ⚠️ **Partial**

**Components:**
- `FilterBuilder.svelte` with role enum

**Available Roles:**
- 👑 Super Admin
- 📝 Content Admin
- 💰 Financial Admin
- 🎧 Customer Support
- 👁️ Read-Only

**User Actions:**
1. Open filter panel
2. Select role filter
3. Apply filter

**Expected Behavior:** Show only admins with selected role  
**Actual Behavior:** ⚠️ **GAP:** Filters don't actually filter (console log only)

---

#### Step 4: Suspend Admin User
**Status:** ✅ **Working** (via bulk actions)

**Components:**
- Selection checkboxes
- Suspend bulk action

**User Actions:**
1. Select admin user(s)
2. Choose "Suspend" action
3. Confirm suspension

**Expected Behavior:** Suspend admin access  
**Actual Behavior:** ✅ Works via bulk actions

**Enhancement:** Could add inline suspend toggle

---

## CONTENT MANAGEMENT WORKFLOWS

### Journey 11: Manage Blog Posts

**Expected User Journey:**
```
Content → Blog Posts → Create/Edit → Publish
```

**Detailed Steps:**

#### Step 1: Navigate to Blog Posts
**Status:** ✅ **Working**

**Components:**
- `admin/content/blog/+page.svelte`
- `DataGrid.svelte`

**User Actions:**
1. Click "Content" → "Blog Posts"
2. View blog posts list

**Expected Behavior:** See all blog posts  
**Actual Behavior:** ✅ Shows posts with categories and status

---

#### Step 2: Filter by Category/Status
**Status:** ⚠️ **Partial**

**Components:**
- `FilterBuilder.svelte`

**Categories:**
- Memorial Planning, Grief Support, Technology, Funeral Industry, Livestreaming, Company News, Customer Stories

**Statuses:**
- Published, Draft, Scheduled, Archived

**User Actions:**
1. Open filter panel
2. Select category or status
3. Apply filters

**Expected Behavior:** Filter blog posts  
**Actual Behavior:** ✅ Filters work (client-side filtering)

---

#### Step 3: Create New Blog Post
**Status:** ❓ **Unknown**

**Components:**
- Create button (should exist)
- `/admin/content/blog/create` (exists but not reviewed)

**Expected Actions:**
1. Click "Create Post" button
2. Fill post form
3. Add content, images
4. Set category
5. Save as draft or publish

**Expected Behavior:** Create new blog post  
**Actual Behavior:** ❓ Implementation not reviewed

---

#### Step 4: Edit Blog Post
**Status:** ❓ **Unknown**

**Components:**
- Row click handler
- `/admin/content/blog/[id]` (exists but not reviewed)

**Expected Actions:**
1. Click blog post row
2. Navigate to edit page
3. Modify content
4. Update status
5. Save changes

**Expected Behavior:** Edit existing blog post  
**Actual Behavior:** ❓ Implementation not reviewed

---

## SYSTEM ADMINISTRATION WORKFLOWS

### Journey 12: Review Audit Logs

**Expected User Journey:**
```
System → Audit Logs → Filter by Action/User → View Details → Export
```

**Detailed Steps:**

#### Step 1: Navigate to Audit Logs
**Status:** ✅ **Working**

**Components:**
- `admin/system/audit-logs/+page.svelte`
- `DataGrid.svelte`

**User Actions:**
1. Click "System" → "Audit Logs"
2. View audit log entries

**Expected Behavior:** See all administrative actions  
**Actual Behavior:** ✅ Shows comprehensive audit trail

---

#### Step 2: Filter Logs
**Status:** ⚠️ **Partial**

**Components:**
- `FilterBuilder.svelte`

**Filter Options:**
- Action type
- User/Admin
- Resource type
- Date range
- Status (success/failure)

**User Actions:**
1. Open filter panel
2. Select filter criteria
3. Apply filters

**Expected Behavior:** Filter audit logs  
**Actual Behavior:** ✅ Filters work (client-side filtering)

---

#### Step 3: View Log Details
**Status:** ❌ **Missing**

**Components:**
- Row click handler (logs to console)
- Expandable row details (not implemented)

**Expected Actions:**
1. Click log entry row
2. Expand details panel
3. View request data, response data
4. See IP address, user agent
5. View full error stack (if failed)

**Expected Behavior:** See detailed log information  
**Actual Behavior:** ❌ **GAP:** Row click only logs to console, no detail view

**Gap Impact:** High - Cannot investigate issues effectively

---

#### Step 4: Export Logs
**Status:** ❌ **Missing**

**Expected Components:**
- Export button in header
- CSV/JSON export functionality

**User Actions:**
1. Apply filters (optional)
2. Click "Export" button
3. Choose format (CSV/JSON)
4. Download file

**Expected Behavior:** Export filtered logs  
**Actual Behavior:** ❌ **GAP:** No export functionality

**Gap Impact:** Medium - Manual investigation required

---

### Journey 13: Manage Demo Sessions

**Expected User Journey:**
```
System → Demo Sessions → Monitor Active → Cleanup Expired
```

**Detailed Steps:**

#### Step 1: Navigate to Demo Sessions
**Status:** ✅ **Working**

**Components:**
- `admin/system/demo-sessions/+page.svelte`
- Statistics bar

**User Actions:**
1. Click "System" → "Demo Sessions"
2. View demo sessions list
3. Review statistics

**Expected Behavior:** See all demo sessions  
**Actual Behavior:** ✅ Shows sessions with status and statistics

---

#### Step 2: Filter by Status/Role
**Status:** ⚠️ **Partial**

**Components:**
- `FilterBuilder.svelte`

**Filter Options:**
- Status (Active, Expired, Terminated)
- Current Role (Admin, Funeral Director, Owner, Viewer)
- Start date

**User Actions:**
1. Open filter panel
2. Select filters
3. Apply

**Expected Behavior:** Filter demo sessions  
**Actual Behavior:** ✅ Filters work (client-side filtering)

---

#### Step 3: Monitor Active Sessions
**Status:** ✅ **Working**

**Components:**
- Data grid with session info
- Real-time status badges
- Expiry countdown

**Displayed Information:**
- Session ID
- Status (✅ Active, ⏰ Expired, 🛑 Terminated)
- Current role badge
- Creator email
- Start time
- Expiry countdown (e.g., "2h 15m")
- Last activity

**User Actions:**
1. Review active sessions
2. Check expiry times
3. Monitor last activity

**Expected Behavior:** Monitor demo environment usage  
**Actual Behavior:** ✅ Clear display with countdowns

---

#### Step 4: Cleanup Expired Sessions
**Status:** ✅ **Working**

**Components:**
- "Cleanup Expired" button
- `/api/admin/cleanup-expired` endpoint

**User Actions:**
1. Click "Cleanup Expired" button
2. Confirm cleanup action
3. Wait for processing
4. View deletion report

**Expected Behavior:** Delete expired demo data  
**Actual Behavior:** ✅ Works with detailed deletion report

---

### Journey 14: Restore Deleted Items

**Expected User Journey:**
```
System → Deleted Items → Review → Restore or Permanent Delete
```

**Detailed Steps:**

#### Step 1: Navigate to Deleted Items
**Status:** ✅ **Working**

**Components:**
- `admin/system/deleted-items/+page.svelte`
- Warning banner about 30-day retention
- Statistics bar

**User Actions:**
1. Click "System" → "Deleted Items"
2. Review deleted items
3. Read retention policy

**Expected Behavior:** See all soft-deleted resources  
**Actual Behavior:** ✅ Clear display with retention info

---

#### Step 2: Filter by Type/Date
**Status:** ⚠️ **Partial**

**Components:**
- `FilterBuilder.svelte`

**Filter Options:**
- Resource type (Memorial, Stream, User, Slideshow, Blog Post)
- Name
- Deleted by user
- Deleted date

**User Actions:**
1. Open filter panel
2. Select resource type or date range
3. Apply filters

**Expected Behavior:** Filter deleted items  
**Actual Behavior:** ✅ Filters work (client-side filtering)

---

#### Step 3: Preview Item Details
**Status:** ❌ **Missing**

**Expected Components:**
- Row click handler
- Detail modal (not implemented)

**User Actions:**
1. Click deleted item row
2. View full item details
3. Review before restoring

**Expected Behavior:** Preview item before action  
**Actual Behavior:** ❌ **GAP:** Row click disabled, no preview available

**Gap Impact:** Medium - Risk of restoring wrong items

---

#### Step 4: Restore Items
**Status:** ✅ **Working**

**Components:**
- Fixed action buttons (appear when items selected)
- `/api/admin/restore-deleted` endpoint

**User Actions:**
1. Select item checkboxes
2. Click "Restore Selected" button
3. Confirm restoration
4. Items moved back to active

**Expected Behavior:** Restore deleted items  
**Actual Behavior:** ✅ Works with success/failure reporting

---

#### Step 5: Permanently Delete Items
**Status:** ✅ **Working**

**Components:**
- "Permanently Delete" button
- Strong confirmation dialog
- `/api/admin/permanent-delete` endpoint

**User Actions:**
1. Select item checkboxes
2. Click "Permanently Delete" button
3. Read and confirm warning
4. Items permanently removed

**Expected Behavior:** Irreversibly delete items  
**Actual Behavior:** ✅ Works with strong warnings and confirmation

---

### Journey 15: Browse Internal Wiki

**Expected User Journey:**
```
System → Wiki → Search/Browse → View Article → Edit (if needed)
```

**Detailed Steps:**

#### Step 1: Navigate to Wiki
**Status:** ✅ **Working**

**Components:**
- `admin/wiki/+page.svelte`
- Custom layout (not using AdminLayout)
- Statistics display

**User Actions:**
1. Click "System" → "Wiki"
2. View wiki homepage
3. Review statistics

**Expected Behavior:** Access internal documentation  
**Actual Behavior:** ✅ Beautiful custom wiki interface

---

#### Step 2: Search Articles
**Status:** ✅ **Working**

**Components:**
- `WikiSearch.svelte`

**User Actions:**
1. Enter search query
2. View search results

**Expected Behavior:** Find relevant articles  
**Actual Behavior:** ✅ Search works

---

#### Step 3: Filter by Category
**Status:** ✅ **Working**

**Components:**
- `WikiCategoryFilter.svelte` (sidebar)

**User Actions:**
1. Click category in sidebar
2. View filtered articles

**Expected Behavior:** Show articles in category  
**Actual Behavior:** ✅ Category filtering works

---

#### Step 4: View Article
**Status:** ❓ **Unknown**

**Components:**
- `/admin/wiki/[slug]` (exists but not reviewed)

**User Actions:**
1. Click article card
2. Read article content

**Expected Behavior:** View full article  
**Actual Behavior:** ❓ Implementation not reviewed

---

#### Step 5: Edit Article
**Status:** ❓ **Unknown**

**Components:**
- `/admin/wiki/[slug]/edit` (exists but not reviewed)

**User Actions:**
1. Click "Edit" button
2. Modify article content
3. Save changes

**Expected Behavior:** Update article  
**Actual Behavior:** ❓ Implementation not reviewed

---

#### Step 6: Create New Article
**Status:** ❓ **Unknown**

**Components:**
- "Create Page" button
- `/admin/wiki/new` (exists but not reviewed)

**User Actions:**
1. Click "Create Page" button
2. Fill article form
3. Set category
4. Add content
5. Save article

**Expected Behavior:** Create new wiki article  
**Actual Behavior:** ❓ Implementation not reviewed

---

## FINANCIAL MANAGEMENT WORKFLOWS

### Journey 16: Review Payment Receipts

**Expected User Journey:**
```
Services → Receipts → Search → View Receipt → Download PDF
```

**Detailed Steps:**

#### Step 1: Navigate to Receipts
**Status:** ✅ **Working**

**Components:**
- `admin/services/receipts/+page.svelte`
- Statistics bar (Total Receipts, Total Revenue)

**User Actions:**
1. Click "Services" → "Receipts"
2. View receipts list
3. Review revenue statistics

**Expected Behavior:** See all payment receipts  
**Actual Behavior:** ✅ Shows receipts with statistics

---

#### Step 2: Search Receipts
**Status:** ✅ **Working**

**Components:**
- Search bar

**User Actions:**
1. Enter search query (name, email, payment ID)
2. Submit search

**Expected Behavior:** Find specific receipt  
**Actual Behavior:** ✅ Search works

---

#### Step 3: View Receipt Details
**Status:** ❌ **Broken**

**Expected Components:**
- Row click handler → Receipt detail page
- `/admin/services/receipts/[receiptId]` route

**User Actions:**
1. Click receipt row
2. View full receipt details
3. See line items, totals, payment method

**Expected Behavior:** View detailed receipt information  
**Actual Behavior:** ❌ **GAP:** Row click goes to memorial ID instead of receipt detail

**Gap Impact:** High - Cannot view receipt details

---

#### Step 4: Download Receipt PDF
**Status:** ❌ **Missing**

**Expected Components:**
- "Download PDF" button on receipt detail
- PDF generation endpoint

**User Actions:**
1. View receipt detail
2. Click "Download PDF" button
3. PDF generated and downloaded

**Expected Behavior:** Download receipt as PDF  
**Actual Behavior:** ❌ **GAP:** PDF functionality not implemented

**Gap Impact:** High - Subtitle promises "print/download as PDF" but feature missing

---

#### Step 5: Email Receipt to Customer
**Status:** ❌ **Missing**

**Expected Components:**
- "Email Receipt" button
- Email sending functionality

**User Actions:**
1. View receipt detail
2. Click "Email Receipt" button
3. Receipt emailed to customer

**Expected Behavior:** Send receipt via email  
**Actual Behavior:** ❌ **GAP:** Not implemented

**Gap Impact:** Medium - Manual email required

---

### Journey 17: Approve Schedule Change Requests

**Expected User Journey:**
```
Services → Schedule Requests → Review Changes → Approve/Deny → Notify
```

**Detailed Steps:**

#### Step 1: Navigate to Schedule Requests
**Status:** ✅ **Working**

**Components:**
- `admin/services/schedule-requests/+page.svelte`
- Statistics bar (Pending, Approved, Denied, Total)

**User Actions:**
1. Click "Services" → "Schedule Requests"
2. View requests list
3. Review pending count

**Expected Behavior:** See all schedule change requests  
**Actual Behavior:** ✅ Shows requests with statistics

---

#### Step 2: Filter to Pending Only
**Status:** ✅ **Working**

**Components:**
- "Pending Only" button in header

**User Actions:**
1. Click "Pending Only" button
2. URL updates with `?status=pending`
3. View only pending requests

**Expected Behavior:** Show pending requests  
**Actual Behavior:** ✅ Filters to pending status

---

#### Step 3: Review Request Details
**Status:** ❌ **Missing**

**Expected Components:**
- Row click handler
- `/admin/services/schedule-requests/[id]` detail page

**Expected Detail View:**
- Original schedule
- Requested changes (diff view)
- Requester information
- Request date/reason
- Approve/Deny buttons

**User Actions:**
1. Click request row
2. View change details
3. Compare old vs new schedule

**Expected Behavior:** Review detailed change request  
**Actual Behavior:** ❌ **GAP:** Row click disabled, no detail page

**Gap Impact:** Critical - Cannot actually approve/deny requests

---

#### Step 4: Approve or Deny Request
**Status:** ❌ **Missing**

**Expected Actions:**
- Approve button → Updates schedule, changes status to "approved"
- Deny button → Keeps old schedule, changes status to "denied"
- Both → Send notification to requester

**User Actions:**
1. Review changes
2. Click "Approve" or "Deny"
3. Add optional note
4. Confirm action

**Expected Behavior:** Process schedule change request  
**Actual Behavior:** ❌ **GAP:** No approval workflow exists

**Gap Impact:** Critical - Feature is non-functional

---

#### Step 5: Bulk Approve/Deny
**Status:** ❌ **Missing**

**Expected Components:**
- Selection checkboxes
- Bulk actions for approve/deny

**User Actions:**
1. Select multiple requests
2. Choose bulk action
3. Approve or deny all selected

**Expected Behavior:** Process multiple requests at once  
**Actual Behavior:** ❌ **GAP:** No bulk actions for schedule requests

**Gap Impact:** Medium - Inefficient for high volume

---

## ANALYTICS & REPORTING WORKFLOWS

### Journey 18: View Memorial Analytics

**Expected User Journey:**
```
Memorial Detail → Analytics Tab → View Metrics → Export Report
```

**Status:** ❌ **Not Implemented**

**Expected Components:**
- Analytics tab or section on memorial detail page
- Metrics dashboard
- Charts and graphs

**Expected Metrics:**
- Page views over time
- Stream viewer counts and watch time
- Geographic distribution of viewers
- Device types (mobile vs desktop)
- Slideshow plays
- Follower growth

**User Actions:**
1. Navigate to memorial detail
2. Click "Analytics" tab
3. View metrics and charts
4. Select date range
5. Export report

**Expected Behavior:** View comprehensive memorial analytics  
**Actual Behavior:** ❌ **GAP:** No analytics functionality implemented

**Gap Impact:** High - No visibility into memorial performance

**Workaround:** 🔄 Must check:
- Firestore `followerCount` field
- Stream viewer logs (if available)
- External analytics (Google Analytics)

---

### Journey 19: Export Data Reports

**Expected User Journey:**
```
Any List Page → Apply Filters → Export → Choose Format → Download
```

**Status:** ⚠️ **Partial**

**Components:**
- Export buttons in `BulkActionBar.svelte` for some resource types
- Export functionality in some actions

**Available Exports:**
- Memorials: Export CSV (via bulk actions)
- Users: Export CSV (via bulk actions)
- Funeral Directors: Export CSV (via bulk actions)
- Encoders: Export CSV (via bulk actions)

**User Actions:**
1. Navigate to list page
2. Apply filters (optional)
3. Select items or "select all"
4. Choose "Export CSV" action
5. Download file

**Expected Behavior:** Export data in CSV format  
**Actual Behavior:** ⚠️ **GAP:** Export options exist but actual functionality not verified

**Missing Exports:**
- Streams
- Slideshows
- Receipts (revenue reports)
- Audit logs
- Analytics data

**Gap Impact:** Medium - Limited reporting capabilities

---

### Journey 20: Generate Revenue Reports

**Expected User Journey:**
```
Receipts → Filter by Date Range → View Summary → Export Report
```

**Status:** ❌ **Missing**

**Expected Components:**
- Date range filter
- Revenue summary dashboard
- Export to CSV/PDF

**Expected Metrics:**
- Total revenue by period
- Revenue by package type
- Revenue by funeral home
- Payment method breakdown
- Failed payment tracking

**User Actions:**
1. Navigate to receipts page
2. Set date range filter
3. View revenue summary
4. Export detailed report

**Expected Behavior:** Generate financial reports  
**Actual Behavior:** ❌ **GAP:** Only basic statistics shown (total receipts, total revenue)

**Gap Impact:** High - Cannot generate financial reports

**Current State:** Only shows:
- Total receipt count
- Total revenue (all time)

---

## GAP SUMMARY MATRIX

### Critical Priority (Blocking Core Features)

| Workflow | Missing Component | Impact | Estimated Effort |
|----------|------------------|--------|------------------|
| Schedule Change Approval | Request detail page + approval actions | Cannot approve/deny requests | 6-10 hours |
| Memorial Creation (Admin) | Creation form and route | Cannot create memorials from admin | 8-12 hours |
| Add Admin Users | Creation form and route | Cannot add new admins via UI | 4-6 hours |
| View Receipt Details | Receipt detail page + PDF generation | Cannot view/download receipts | 8-12 hours |

### High Priority (Major Feature Gaps)

| Workflow | Missing Component | Impact | Estimated Effort |
|----------|------------------|--------|------------------|
| Slideshow Management | Detail page for slideshows | Limited slideshow admin tools | 6-10 hours |
| Audit Log Investigation | Expandable detail view | Cannot debug issues effectively | 4-6 hours |
| Deleted Item Preview | Detail modal before restore | Risk of wrong restoration | 4-6 hours |
| Memorial Analytics | Analytics dashboard | No performance visibility | 16-24 hours |
| Revenue Reporting | Financial reports and exports | Limited financial insights | 8-12 hours |

### Medium Priority (Quality of Life)

| Workflow | Missing Component | Impact | Estimated Effort |
|----------|------------------|--------|------------------|
| Funeral Director Approval | Approval workflow for pending | Manual approval required | 6-8 hours |
| Bulk Request Actions | Bulk approve/deny schedule requests | Inefficient processing | 4-6 hours |
| Receipt Email | Email receipt functionality | Manual sending required | 3-4 hours |
| Export Functionality | Verify and complete exports | Limited reporting | 4-6 hours |

### Low Priority (Enhancement Opportunities)

| Workflow | Enhancement | Impact | Estimated Effort |
|----------|------------|--------|------------------|
| Status Toggles | Inline status toggles vs bulk actions | Improved UX | 2-4 hours |
| Progress Indicators | Progress bars for bulk actions | Better feedback | 2-3 hours |
| Memorial Publish Workflow | Validation + preview before publish | Safer publishing | 4-6 hours |
| Wiki Component Review | Document wiki-specific components | Better maintenance | 2-4 hours |

---

## PRIORITY RECOMMENDATIONS

### Immediate Action (Week 1)

**Focus:** Complete critical missing features

1. ✅ **Create Schedule Request Detail Page**
   - Build detail view with diff display
   - Implement approve/deny actions
   - Add notification system
   - **Impact:** Makes schedule requests feature functional

### Sprint 1 (Weeks 2-3)

**Focus:** Receipts and memorial creation

2. ✅ **Create Receipt Detail Page**
   - Build receipt detail view
   - Implement PDF generation
   - Add email functionality
   - **Impact:** Fulfills promised feature

3. ✅ **Create Memorial Creation Form (Admin)**
   - Build creation form
   - Integrate with existing validation
   - Connect to memorial creation API
   - **Impact:** Complete admin workflow

### Sprint 2 (Weeks 4-5)

**Focus:** Complete admin tools

4. ✅ **Create Admin User Creation Form**
   - Build admin creation form
   - Implement role selection
   - Add email invitation system
   - **Impact:** Enable team management

5. ✅ **Create Slideshow Detail Page**
   - Build slideshow detail view
   - Add photo management
   - Fix duration formatter
   - **Impact:** Complete slideshow admin workflow

6. ✅ **Implement Audit Log Details**
   - Add expandable row details
   - Format request/response data
   - Add IP and user agent display
   - **Impact:** Better debugging capability

### Sprint 3 (Weeks 6-7)

**Focus:** Analytics and reporting

7. ✅ **Build Memorial Analytics Dashboard**
   - Implement metrics collection
   - Create charts and graphs
   - Add date range filtering
   - **Impact:** Visibility into memorial performance

8. ✅ **Build Revenue Reporting**
   - Create financial dashboard
   - Implement date range reports
   - Add CSV export
   - **Impact:** Financial insights and reporting

### Sprint 4 (Weeks 8+)

**Focus:** Enhancement and polish

9. ✅ **Complete Remaining Features**
    - Deleted item preview modal
    - Funeral director approval workflow
    - Admin Users page: make FilterBuilder apply to grid
    - Export functionality verification
    - Wiki component documentation
    - **Impact:** System completeness

---

## USER FEEDBACK COLLECTION

### Recommended Questions for Admins

1. **"Which admin task takes you the longest time?"**
   - Will identify workflow inefficiencies

2. **"What information do you wish was easier to find?"**
   - Will highlight navigation or search issues

3. **"Have you ever wanted to do something but couldn't find the button?"**
   - Will identify missing features

4. **"What do you do outside the admin panel that should be inside?"**
   - Will identify workarounds and missing workflows

5. **"Which pages do you visit most often?"**
   - Will help prioritize optimization efforts

---

## TESTING STRATEGY

### User Journey Testing Checklist

For each journey documented above:

- [ ] Happy path test (everything works)
- [ ] Error handling test (API failures, validation errors)
- [ ] Permission test (verify access control)
- [ ] Mobile responsive test
- [ ] Performance test (large datasets)
- [ ] Accessibility test (keyboard navigation, screen readers)

### Critical Path Scenarios

**Scenario 1: Emergency Memorial Setup**
```
Customer calls: "We need a memorial live in 2 hours!"
Admin must:
1. Create memorial (currently missing)
2. Set pricing (✅ works)
3. Schedule livestream (✅ works)
4. Share credentials (✅ works)
5. Make public (✅ works)

Current Time: 10-15 minutes (with workaround)
Target Time: 5 minutes (with creation form)
```

**Scenario 2: Troubleshooting Failed Stream**
```
Customer reports: "Stream didn't record!"
Admin must:
1. Find stream in list (✅ works)
2. Check stream status (✅ works)
3. Review audit logs (⚠️ limited detail view)
4. Check encoding server (✅ works)

Current Time: 15-20 minutes
Target Time: 5 minutes (with better log details)
```

**Scenario 3: Monthly Revenue Report**
```
Finance needs: "Send revenue report for last month"
Admin must:
1. Filter receipts by date (✅ works)
2. Export receipt list (⚠️ functionality unclear)
3. Calculate totals (❌ no reporting)
4. Generate PDF report (❌ missing)

Current Time: 60+ minutes (manual work in Excel)
Target Time: 2 minutes (with proper reports)
```

---

## CONCLUSION

### System Strengths
- ✅ Well-designed component architecture
- ✅ Most core workflows are functional
- ✅ Good permission system
- ✅ Professional UI/UX

### Critical Gaps Identified
1. **Schedule Requests** - No approval workflow (feature non-functional)
2. **Memorial Creation** - No admin creation form (must use workarounds)
3. **Receipt Management** - No detail pages or PDF generation
4. **Admin Users Filtering** - Filters UI present but does not filter results
5. **Analytics** - No metrics or reporting

### Impact Assessment
- **18/28 pages** fully functional
- **1/28 pages** have filtering gaps
- **3 critical workflows** blocked by missing features
- **2 financial features** promised but missing

### Recommended Timeline
- **Weeks 1-3:** Schedule requests, receipts, memorial creation
- **Weeks 4-5:** Complete admin tools
- **Weeks 6-7:** Add analytics and reporting
- **Week 8+:** Polish and enhancements

**Total Estimated Effort:** 60-90 hours to address all critical and high-priority gaps

---

**Document Version:** 1.0  
**Last Updated:** January 26, 2026  
**Audited By:** Development Team  
**Next Review:** February 24, 2026
