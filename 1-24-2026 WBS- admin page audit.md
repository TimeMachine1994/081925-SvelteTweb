# Admin Dashboard Work Breakdown Structure (WBS)
## Complete UI Element Audit - January 24, 2026

This document provides a comprehensive hierarchical breakdown of all UI elements in the Tributestream Admin Dashboard, organized by sidebar navigation tabs.

---

## **1. OVERVIEW (Dashboard Home)**
**Route:** `/admin`

### 1.1 Layout Components
- **1.1.1** AdminLayout wrapper
- **1.1.2** Sidebar navigation (left)
  - **1.1.2.1** Logo section (🕊️ Tributestream)
  - **1.1.2.2** Command palette trigger (⌘K)
  - **1.1.2.3** Navigation domains (see section 1.1.2.4-1.1.2.8)
  - **1.1.2.4** Dashboard domain (📊)
  - **1.1.2.5** Services domain (🕊️)
  - **1.1.2.6** Users domain (👥)
  - **1.1.2.7** Content domain (📝)
  - **1.1.2.8** System domain (⚙️)
  - **1.1.2.9** User info section (bottom)
    - **1.1.2.9.1** User avatar
    - **1.1.2.9.2** User email
    - **1.1.2.9.3** User role badge
- **1.1.3** Top bar
  - **1.1.3.1** Mobile menu toggle button (☰)
  - **1.1.3.2** Sidebar toggle button (◀/▶)
  - **1.1.3.3** Breadcrumb navigation
    - **1.1.3.3.1** "Admin" link
    - **1.1.3.3.2** Current page name
  - **1.1.3.4** Mobile search button (🔍)

### 1.2 Page Header
- **1.2.1** Page title: "Admin Dashboard"
- **1.2.2** Subtitle: "Monitor incomplete memorials and quick access to admin tools"

### 1.3 Incomplete Memorials Section
- **1.3.1** Section header
  - **1.3.1.1** Title: "⚠️ Incomplete Memorials"
  - **1.3.1.2** Count badge showing pending count
- **1.3.2** Empty state (when no incomplete memorials)
  - **1.3.2.1** Empty icon (✅)
  - **1.3.2.2** Message: "All memorials are complete! Great job."
- **1.3.3** Memorials list (when incomplete memorials exist)
  - **1.3.3.1** Individual memorial row (clickable link to `/admin/services/memorials/{id}`)
    - **1.3.3.1.1** Memorial info section
      - **1.3.3.1.1.1** Loved one's name (memorial name)
      - **1.3.3.1.1.2** Memorial meta information
        - **1.3.3.1.1.2.1** Owner icon and email (👤 {creatorEmail})
        - **1.3.3.1.1.2.2** Creation date (📅 {date})
    - **1.3.3.1.2** Memorial actions section
      - **1.3.3.1.2.1** Archive button (📦 Archive)
        - **1.3.3.1.2.1.1** Loading state (⏳)
      - **1.3.3.1.2.2** Status badges container
        - **1.3.3.1.2.2.1** Incomplete badge (⚠️ Incomplete)
        - **1.3.3.1.2.2.2** Payment status badge (✅ Paid / ❌ Unpaid)
  - **1.3.3.2** Archive confirmation modal (shown on archive click)
    - **1.3.3.2.1** Confirmation message with memorial name
    - **1.3.3.2.2** Action buttons
      - **1.3.3.2.2.1** Cancel button
      - **1.3.3.2.2.2** Confirm Archive button (with loading state)

### 1.4 Quick Actions Section
- **1.4.1** Section title: "Quick Actions"
- **1.4.2** Actions grid
  - **1.4.2.1** Manage Memorials card
    - **1.4.2.1.1** Icon (💝)
    - **1.4.2.1.2** Label: "Manage Memorials"
  - **1.4.2.2** Manage Streams card
    - **1.4.2.2.1** Icon (📹)
    - **1.4.2.2.2** Label: "Manage Streams"
  - **1.4.2.3** Manage Users card
    - **1.4.2.3.1** Icon (👥)
    - **1.4.2.3.2** Label: "Manage Users"
  - **1.4.2.4** View Audit Logs card
    - **1.4.2.4.1** Icon (📋)
    - **1.4.2.4.2** Label: "View Audit Logs"

---

## **2. MEMORIALS**
**Route:** `/admin/services/memorials`

### 2.1 Page Header
- **2.1.1** Title: "Memorials"
- **2.1.2** Subtitle: "Manage all memorial pages and services"
- **2.1.3** Action buttons
  - **2.1.3.1** Filters button (🔍 Filters)
  - **2.1.3.2** Create Memorial button (➕ Create Memorial) - primary variant

### 2.2 Search Bar
- **2.2.1** Search input field
  - **2.2.1.1** Placeholder: "Search by name, slug, owner, location..."
  - **2.2.1.2** Real-time input tracking
- **2.2.2** Search submit button

### 2.3 Bulk Actions Bar (conditional - shown when selections exist)
- **2.3.1** Selected count indicator
- **2.3.2** Bulk action buttons (resource type: memorial)
  - **2.3.2.1** Delete action
  - **2.3.2.2** Mark Paid action
  - **2.3.2.3** Mark Unpaid action
  - **2.3.2.4** Make Public action
  - **2.3.2.5** Make Private action
- **2.3.3** Clear selection button

### 2.4 Filter Panel (conditional - shown when filters toggled)
- **2.4.1** FilterBuilder component
  - **2.4.1.1** Name filter (string type)
  - **2.4.1.2** Owner Email filter (string type)
  - **2.4.1.3** Payment Status filter (boolean type)
  - **2.4.1.4** Visibility filter (boolean type)
  - **2.4.1.5** Created Date filter (date type)

### 2.5 Data Grid
- **2.5.1** Column headers
  - **2.5.1.1** Selection checkbox column (if permissions allow)
  - **2.5.1.2** Name column (sortable, pinnable, width: 200px)
  - **2.5.1.3** Owner column (sortable, width: 200px)
  - **2.5.1.4** Payment column (sortable, width: 120px)
  - **2.5.1.5** Visibility column (width: 100px)
  - **2.5.1.6** Created column (sortable, width: 150px)
  - **2.5.1.7** Location column (width: 180px)
  - **2.5.1.8** Service Date column (width: 120px)
- **2.5.2** Data rows (clickable to memorial detail page)
  - **2.5.2.1** Selection checkbox cell
  - **2.5.2.2** Name cell (displays customTitle or lovedOneName)
  - **2.5.2.3** Owner cell (displays creatorEmail, clickable to user detail)
  - **2.5.2.4** Payment cell (✅ Paid / ❌ Unpaid, clickable to toggle)
  - **2.5.2.5** Visibility cell (🌐 Public / 🔒 Private, clickable to toggle)
  - **2.5.2.6** Created cell (formatted date)
  - **2.5.2.7** Location cell
  - **2.5.2.8** Service Date cell (date + time formatted)

---

## **3. MEMORIAL DETAIL PAGE**
**Route:** `/admin/services/memorials/[memorialId]`

### 3.1 Page Header
- **3.1.1** Title: Memorial loved one's name
- **3.1.2** Subtitle: Memorial ID
- **3.1.3** Action buttons
  - **3.1.3.1** View Public Page button
  - **3.1.3.2** Delete Memorial button (danger variant)

### 3.2 Memorial Overview Card
- **3.2.1** Card title: "Memorial Information"
- **3.2.2** Information grid
  - **3.2.2.1** Memorial ID
  - **3.2.2.2** Full slug
  - **3.2.2.3** Public URL (clickable link)
  - **3.2.2.4** Owner UID
  - **3.2.2.5** Owner email (clickable to user detail)
  - **3.2.2.6** Funeral Director UID (if applicable)
  - **3.2.2.7** Created date
  - **3.2.2.8** Last updated date
  - **3.2.2.9** Payment status badge
  - **3.2.2.10** Visibility status badge
  - **3.2.2.11** Follower count

### 3.3 Display Settings Section
- **3.3.1** Section header with edit toggle button
- **3.3.2** View mode (when not editing)
  - **3.3.2.1** Custom title display
  - **3.3.2.2** Public note display
- **3.3.3** Edit mode (when editing)
  - **3.3.3.1** Custom title input field
  - **3.3.3.2** Public note textarea
  - **3.3.3.3** Save button
  - **3.3.3.4** Cancel button
  - **3.3.3.5** Success message display
  - **3.3.3.6** Error message display

### 3.4 Custom Pricing Editor Section
- **3.4.1** CustomPricingEditor component
  - **3.4.1.1** Base package selector
  - **3.4.1.2** Custom pricing fields
  - **3.4.1.3** Add-ons configuration
  - **3.4.1.4** Save pricing button
  - **3.4.1.5** Reset to default button

### 3.5 Schedule Editor Section
- **3.5.1** AdminScheduleEditor component
  - **3.5.1.1** Main service configuration
    - **3.5.1.1.1** Location fields
    - **3.5.1.1.2** Date/time fields
    - **3.5.1.1.3** Duration fields
  - **3.5.1.2** Additional services list
    - **3.5.1.2.1** Add additional service button
    - **3.5.1.2.2** Additional service entries
  - **3.5.1.3** Save schedule button

### 3.6 Streams Section
- **3.6.1** Section header: "Livestreams"
- **3.6.2** Create stream button (➕ Create Stream)
- **3.6.3** Stream cards list
  - **3.6.3.1** Individual StreamCard components
    - **3.6.3.1.1** Stream title
    - **3.6.3.1.2** Stream status badge
    - **3.6.3.1.3** Schedule information
    - **3.6.3.1.4** Stream actions dropdown
    - **3.6.3.1.5** RTMP credentials section (if applicable)
- **3.6.4** Stream creation form (conditional)
  - **3.6.4.1** Stream title input
  - **3.6.4.2** Date picker
  - **3.6.4.3** Time picker
  - **3.6.4.4** Create button
  - **3.6.4.5** Cancel button

### 3.7 Emergency Embed Section
- **3.7.1** Show emergency embed button
- **3.7.2** Emergency embed form (conditional)
  - **3.7.2.1** Embed code textarea
  - **3.7.2.2** Embed title input
  - **3.7.2.3** Create embed button
  - **3.7.2.4** Cancel button

### 3.8 Emergency Chat Embed Section
- **3.8.1** Show emergency chat embed button
- **3.8.2** Emergency chat embed form (conditional)
  - **3.8.2.1** Chat embed code textarea
  - **3.8.2.2** Chat embed title input
  - **3.8.2.3** Create chat embed button
  - **3.8.2.4** Cancel button

### 3.9 Slideshows Section
- **3.9.1** Section header: "Photo Slideshows"
- **3.9.2** Slideshows list
  - **3.9.2.1** Individual slideshow cards
    - **3.9.2.1.1** Slideshow title
    - **3.9.2.1.2** Status badge
    - **3.9.2.1.3** View/edit actions

### 3.10 Admin Chat Panel
- **3.10.1** AdminChatPanel component
  - **3.10.1.1** Chat messages list
  - **3.10.1.2** Message input
  - **3.10.1.3** Send button
  - **3.10.1.4** Moderation actions

---

## **4. STREAMS**
**Route:** `/admin/services/streams`

### 4.1 Page Header
- **4.1.1** Title: "Livestreams"
- **4.1.2** Subtitle: "Manage all memorial livestreams and recordings across all memorials"

### 4.2 Search Bar
- **4.2.1** Search input field
  - **4.2.1.1** Placeholder: "Search by stream title, memorial, status..."
- **4.2.2** Search submit button

### 4.3 Bulk Actions Bar (conditional)
- **4.3.1** Selected count indicator
- **4.3.2** Bulk action buttons (resource type: stream)
- **4.3.3** Clear selection button

### 4.4 Stream Status Sections
- **4.4.1** Live Streams section (🔴 LIVE)
  - **4.4.1.1** Section header with count
  - **4.4.1.2** Stream cards grid
    - **4.4.1.2.1** Selection checkbox
    - **4.4.1.2.2** StreamCard component
- **4.4.2** Scheduled Streams section (📅 SCHEDULED)
  - **4.4.2.1** Section header with count
  - **4.4.2.2** Stream cards grid
- **4.4.3** Completed Streams section (✅ COMPLETED)
  - **4.4.3.1** Section header with count
  - **4.4.3.2** Stream cards grid
- **4.4.4** Other Streams section (if any)
  - **4.4.4.1** Section header with count
  - **4.4.4.2** Stream cards grid

### 4.5 StreamCard Component (repeated)
- **4.5.1** Selection checkbox
- **4.5.2** Stream title
- **4.5.3** Memorial name (clickable link)
- **4.5.4** Status badge
- **4.5.5** Schedule information
- **4.5.6** Live indicator (if live)
- **4.5.7** Viewer count (if live)
- **4.5.8** Recording status
- **4.5.9** Actions menu

---

## **5. SLIDESHOWS**
**Route:** `/admin/services/slideshows`

### 5.1 Page Header
- **5.1.1** Title: "Slideshows"
- **5.1.2** Subtitle: "Photo slideshow library"
- **5.1.3** Action buttons
  - **5.1.3.1** Filters button

### 5.2 Search/Filter Interface
- **5.2.1** Search bar
- **5.2.2** Status filter dropdown
- **5.2.3** Memorial filter

### 5.3 Slideshows Grid
- **5.3.1** Individual slideshow cards
  - **5.3.1.1** Thumbnail preview
  - **5.3.1.2** Slideshow title
  - **5.3.1.3** Memorial name (linked)
  - **5.3.1.4** Status badge
  - **5.3.1.5** Created date
  - **5.3.1.6** Photo count
  - **5.3.1.7** Actions menu
    - **5.3.1.7.1** View option
    - **5.3.1.7.2** Edit option
    - **5.3.1.7.3** Delete option

---

## **6. SCHEDULE REQUESTS**
**Route:** `/admin/services/schedule-requests`

### 6.1 Page Header
- **6.1.1** Title: "Schedule Requests"
- **6.1.2** Subtitle: "Schedule edit requests"
- **6.1.3** Action buttons

### 6.2 Requests List
- **6.2.1** Request cards
  - **6.2.1.1** Memorial name
  - **6.2.1.2** Requester information
  - **6.2.1.3** Requested changes summary
  - **6.2.1.4** Request date
  - **6.2.1.5** Status badge
  - **6.2.1.6** Action buttons
    - **6.2.1.6.1** Approve button
    - **6.2.1.6.2** Reject button
    - **6.2.1.6.3** View details button

---

## **7. ENCODERS**
**Route:** `/admin/services/encoders`

### 7.1 Page Header
- **7.1.1** Title: "Encoders"
- **7.1.2** Subtitle: "Streaming encoder devices"
- **7.1.3** Action buttons
  - **7.1.3.1** Add Encoder button

### 7.2 Encoders List
- **7.2.1** Encoder cards
  - **7.2.1.1** Encoder name
  - **7.2.1.2** Device ID
  - **7.2.1.3** Status indicator (online/offline)
  - **7.2.1.4** Current stream (if active)
  - **7.2.1.5** Last seen timestamp
  - **7.2.1.6** Actions menu
    - **7.2.1.6.1** Edit option
    - **7.2.1.6.2** Disconnect option
    - **7.2.1.6.3** Delete option

---

## **8. RECEIPTS**
**Route:** `/admin/services/receipts`

### 8.1 Page Header
- **8.1.1** Title: "Receipts"
- **8.1.2** Subtitle: "Payment receipts and invoices"
- **8.1.3** Action buttons
  - **8.1.3.1** Filters button
  - **8.1.3.2** Export button

### 8.2 Search Bar
- **8.2.1** Search input
- **8.2.2** Date range filter

### 8.3 Receipts Data Grid
- **8.3.1** Column headers
  - **8.3.1.1** Receipt ID
  - **8.3.1.2** Memorial name
  - **8.3.1.3** Owner
  - **8.3.1.4** Amount
  - **8.3.1.5** Payment date
  - **8.3.1.6** Payment method
  - **8.3.1.7** Status
- **8.3.2** Data rows (clickable)
  - **8.3.2.1** Receipt details
  - **8.3.2.2** Download PDF button
  - **8.3.2.3** Email receipt button

---

## **9. MEMORIAL OWNERS**
**Route:** `/admin/users/memorial-owners`

### 9.1 Page Header
- **9.1.1** Title: "Memorial Owners"
- **9.1.2** Subtitle: "Family and individual users"
- **9.1.3** Action buttons
  - **9.1.3.1** Filters button
  - **9.1.3.2** Create User button

### 9.2 Search Bar
- **9.2.1** Search input
  - **9.2.1.1** Placeholder: "Search by name, email..."
- **9.2.2** Search submit button

### 9.3 Filter Panel (conditional)
- **9.3.1** FilterBuilder component
  - **9.3.1.1** Name filter
  - **9.3.1.2** Email filter
  - **9.3.1.3** Memorial count filter
  - **9.3.1.4** Payment status filter
  - **9.3.1.5** Registration date filter

### 9.4 Users Data Grid
- **9.4.1** Column headers
  - **9.4.1.1** Name (sortable)
  - **9.4.1.2** Email (sortable)
  - **9.4.1.3** Memorial count
  - **9.4.1.4** Has paid status
  - **9.4.1.5** Registered date (sortable)
  - **9.4.1.6** Last login
- **9.4.2** Data rows (clickable to user detail)
  - **9.4.2.1** User information cells
  - **9.4.2.2** Quick action buttons

---

## **10. FUNERAL DIRECTORS**
**Route:** `/admin/users/funeral-directors`

### 10.1 Page Header
- **10.1.1** Title: "Funeral Directors"
- **10.1.2** Subtitle: "Funeral home accounts"
- **10.1.3** Action buttons
  - **10.1.3.1** Filters button
  - **10.1.3.2** Approve Applications button

### 10.2 Search Bar
- **10.2.1** Search input
- **10.2.2** Search submit button

### 10.3 Filter Panel (conditional)
- **10.3.1** FilterBuilder component
  - **10.3.1.1** Name filter
  - **10.3.1.2** Company filter
  - **10.3.1.3** Status filter (approved/pending)
  - **10.3.1.4** State/region filter

### 10.4 Funeral Directors Data Grid
- **10.4.1** Column headers
  - **10.4.1.1** Name (sortable)
  - **10.4.1.2** Company name
  - **10.4.1.3** Email
  - **10.4.1.4** Phone
  - **10.4.1.5** Status (approved/pending)
  - **10.4.1.6** Memorials created count
  - **10.4.1.7** Registered date
- **10.4.2** Data rows
  - **10.4.2.1** Director information
  - **10.4.2.2** Approval status badge
  - **10.4.2.3** Quick actions
    - **10.4.2.3.1** Approve button (if pending)
    - **10.4.2.3.2** Reject button (if pending)
    - **10.4.2.3.3** View profile button

---

## **11. ADMIN USERS**
**Route:** `/admin/users/admin-users`

### 11.1 Page Header
- **11.1.1** Title: "Admin Users"
- **11.1.2** Subtitle: "Manage administrator accounts and permissions"
- **11.1.3** Action buttons
  - **11.1.3.1** Filters button
  - **11.1.3.2** Add Admin button (permission-gated)

### 11.2 Filter Panel (conditional)
- **11.2.1** FilterBuilder component
  - **11.2.1.1** Name filter
  - **11.2.1.2** Email filter
  - **11.2.1.3** Admin role filter
    - **11.2.1.3.1** Super Admin option
    - **11.2.1.3.2** Content Admin option
    - **11.2.1.3.3** Financial Admin option
    - **11.2.1.3.4** Customer Support option
    - **11.2.1.3.5** Read-Only option
  - **11.2.1.4** Suspended status filter

### 11.3 Role Information Banner
- **11.3.1** Info icon (ℹ️)
- **11.3.2** Role descriptions
  - **11.3.2.1** Super Admin: Full system access
  - **11.3.2.2** Content Admin: Content and user management
  - **11.3.2.3** Financial Admin: Payment and financial operations
  - **11.3.2.4** Customer Support: Limited editing and support tasks
  - **11.3.2.5** Read-Only: View-only access for reporting

### 11.4 Admin Users Data Grid
- **11.4.1** Column headers
  - **11.4.1.1** Selection checkbox (if permissions allow)
  - **11.4.1.2** Name (sortable, width: 200px)
  - **11.4.1.3** Email (sortable, width: 250px)
  - **11.4.1.4** Admin Role (sortable, width: 180px)
  - **11.4.1.5** Status (sortable, width: 100px)
  - **11.4.1.6** Added date (sortable, width: 120px)
  - **11.4.1.7** Last Login (width: 120px)
- **11.4.2** Data rows
  - **11.4.2.1** Admin name
  - **11.4.2.2** Email address
  - **11.4.2.3** Role badge (with icon)
    - **11.4.2.3.1** 👑 Super Admin
    - **11.4.2.3.2** 📝 Content Admin
    - **11.4.2.3.3** 💰 Financial Admin
    - **11.4.2.3.4** 🎧 Support
    - **11.4.2.3.5** 👁️ Read-Only
  - **11.4.2.4** Status indicator (🚫 Suspended / ✅ Active)
  - **11.4.2.5** Added date (formatted)
  - **11.4.2.6** Last login (formatted, "Never" if no login)

---

## **12. BLOG POSTS**
**Route:** `/admin/content/blog`

### 12.1 Page Header
- **12.1.1** Title: "Blog Posts"
- **12.1.2** Subtitle: "Blog content management"
- **12.1.3** Action buttons
  - **12.1.3.1** Create Post button

### 12.2 Posts List
- **12.2.1** Post cards
  - **12.2.1.1** Featured image
  - **12.2.1.2** Post title
  - **12.2.1.3** Excerpt
  - **12.2.1.4** Author
  - **12.2.1.5** Published date
  - **12.2.1.6** Status badge (draft/published)
  - **12.2.1.7** Actions menu
    - **12.2.1.7.1** Edit option
    - **12.2.1.7.2** Preview option
    - **12.2.1.7.3** Delete option

---

## **13. AUDIT LOGS**
**Route:** `/admin/system/audit-logs`

### 13.1 Page Header
- **13.1.1** Title: "Audit Logs"
- **13.1.2** Subtitle: "System activity logs"
- **13.1.3** Action buttons
  - **13.1.3.1** Filters button
  - **13.1.3.2** Export button

### 13.2 Filter Panel (conditional)
- **13.2.1** FilterBuilder component
  - **13.2.1.1** Action type filter
  - **13.2.1.2** User filter
  - **13.2.1.3** Resource type filter
  - **13.2.1.4** Date range filter
  - **13.2.1.5** Status filter (success/failure)

### 13.3 Logs Data Grid
- **13.3.1** Column headers
  - **13.3.1.1** Timestamp (sortable)
  - **13.3.1.2** User
  - **13.3.1.3** Action
  - **13.3.1.4** Resource type
  - **13.3.1.5** Resource ID
  - **13.3.1.6** Status
  - **13.3.1.7** Details
- **13.3.2** Data rows (expandable)
  - **13.3.2.1** Log entry information
  - **13.3.2.2** Expand/collapse icon
  - **13.3.2.3** Details panel (when expanded)
    - **13.3.2.3.1** Request data
    - **13.3.2.3.2** Response data
    - **13.3.2.3.3** IP address
    - **13.3.2.3.4** User agent

---

## **14. DEMO SESSIONS**
**Route:** `/admin/system/demo-sessions`

### 14.1 Page Header
- **14.1.1** Title: "Demo Sessions"
- **14.1.2** Subtitle: "Monitor active demo mode sessions"
- **14.1.3** Action buttons
  - **14.1.3.1** Filters button
  - **14.1.3.2** Cleanup Expired button

### 14.2 Filter Panel (conditional)
- **14.2.1** FilterBuilder component
  - **14.2.1.1** Status filter
    - **14.2.1.1.1** Active option
    - **14.2.1.1.2** Expired option
    - **14.2.1.1.3** Terminated option
  - **14.2.1.2** Current role filter
    - **14.2.1.2.1** Admin option
    - **14.2.1.2.2** Funeral Director option
    - **14.2.1.2.3** Owner option
    - **14.2.1.2.4** Viewer option
  - **14.2.1.3** Start date filter

### 14.3 Statistics Bar
- **14.3.1** Stats grid
  - **14.3.1.1** Active sessions stat
    - **14.3.1.1.1** Label: "Active"
    - **14.3.1.1.2** Count value (green)
  - **14.3.1.2** Expired sessions stat
    - **14.3.1.2.1** Label: "Expired"
    - **14.3.1.2.2** Count value (red)
  - **14.3.1.3** Total sessions stat
    - **14.3.1.3.1** Label: "Total Sessions"
    - **14.3.1.3.2** Count value

### 14.4 Information Banner
- **14.4.1** Info icon (ℹ️)
- **14.4.2** Message: "Demo sessions automatically expire after 2 hours. All demo data (memorials, streams, users) is deleted when a session expires."

### 14.5 Sessions Data Grid
- **14.5.1** Column headers
  - **14.5.1.1** Selection checkbox (if permissions allow)
  - **14.5.1.2** Session ID (width: 150px, truncated with "...")
  - **14.5.1.3** Status (sortable, width: 120px)
  - **14.5.1.4** Current Role (width: 150px)
  - **14.5.1.5** Created By (width: 200px)
  - **14.5.1.6** Started (sortable, width: 150px)
  - **14.5.1.7** Expires (width: 150px)
  - **14.5.1.8** Last Activity (width: 150px)
- **14.5.2** Data rows
  - **14.5.2.1** Truncated session ID
  - **14.5.2.2** Status badge
    - **14.5.2.2.1** ✅ Active
    - **14.5.2.2.2** ⏰ Expired
    - **14.5.2.2.3** 🛑 Terminated
  - **14.5.2.3** Role badge
    - **14.5.2.3.1** 👑 Admin
    - **14.5.2.3.2** 🏥 Funeral Director
    - **14.5.2.3.3** 💝 Owner
    - **14.5.2.3.4** 👁️ Viewer
  - **14.5.2.4** Creator email
  - **14.5.2.5** Start timestamp (formatted)
  - **14.5.2.6** Expiry countdown (e.g., "2h 15m" or "Expired")
  - **14.5.2.7** Last activity (relative time, e.g., "5m ago")

---

## **15. DELETED ITEMS**
**Route:** `/admin/system/deleted-items`

### 15.1 Page Header
- **15.1.1** Title: "Deleted Items"
- **15.1.2** Subtitle: "Soft-deleted resources"
- **15.1.3** Action buttons
  - **15.1.3.1** Filters button

### 15.2 Resource Type Tabs
- **15.2.1** Memorials tab
- **15.2.2** Streams tab
- **15.2.3** Users tab
- **15.2.4** Other resources tab

### 15.3 Deleted Items List
- **15.3.1** Item cards
  - **15.3.1.1** Resource type icon
  - **15.3.1.2** Resource name/title
  - **15.3.1.3** Deleted by user
  - **15.3.1.4** Deleted date
  - **15.3.1.5** Retention period indicator
  - **15.3.1.6** Action buttons
    - **15.3.1.6.1** Restore button
    - **15.3.1.6.2** Permanent delete button
    - **15.3.1.6.3** View details button

---

## **16. WIKI**
**Route:** `/admin/wiki`

### 16.1 Page Header
- **16.1.1** Title: "Wiki"
- **16.1.2** Subtitle: "Internal documentation"
- **16.1.3** Action buttons
  - **16.1.3.1** New Article button
  - **16.1.3.2** Search button

### 16.2 Wiki Navigation
- **16.2.1** Categories sidebar
  - **16.2.1.1** Category list
  - **16.2.1.2** Article count per category
- **16.2.2** Recent articles
- **16.2.3** Popular articles

### 16.3 Articles List
- **16.3.1** Article cards
  - **16.3.1.1** Article title
  - **16.3.1.2** Category badge
  - **16.3.1.3** Author
  - **16.3.1.4** Last updated date
  - **16.3.1.5** View count
  - **16.3.1.6** Actions menu
    - **16.3.1.6.1** Edit option
    - **16.3.1.6.2** Delete option

---

## **SHARED COMPONENTS**

### S.1 AdminLayout
- **S.1.1** Sidebar (see section 1.1.2)
- **S.1.2** Top bar (see section 1.1.3)
- **S.1.3** Page header container
- **S.1.4** Page content container
- **S.1.5** Mobile responsive breakpoints

### S.2 DataGrid
- **S.2.1** Column configuration
- **S.2.2** Sortable columns
- **S.2.3** Pinnable columns
- **S.2.4** Selectable rows
- **S.2.5** Click handlers
- **S.2.6** Custom formatters
- **S.2.7** Empty state message

### S.3 FilterBuilder
- **S.3.1** Field definitions
  - **S.3.1.1** String type fields
  - **S.3.1.2** Boolean type fields
  - **S.3.1.3** Date type fields
  - **S.3.1.4** Enum type fields
- **S.3.2** Filter operators
- **S.3.3** Apply filters button
- **S.3.4** Clear filters button

### S.4 BulkActionBar
- **S.4.1** Selection count display
- **S.4.2** Resource-specific actions
  - **S.4.2.1** Memorial actions
  - **S.4.2.2** Stream actions
  - **S.4.2.3** User actions
- **S.4.3** Clear selection button
- **S.4.4** Confirmation dialogs

### S.5 Modals/Dialogs
- **S.5.1** Confirmation dialogs
- **S.5.2** Form modals
- **S.5.3** Detail view modals
- **S.5.4** Close/cancel buttons
- **S.5.5** Overlay backdrop

---

## **NOTES**

### Permission-Gated Elements
Many UI elements are conditionally rendered based on user permissions checked via the `can()` function from `$lib/stores/adminUser`. Elements check specific resource/action combinations such as:
- `can('memorial', 'create')` - Create memorial button
- `can('memorial', 'update')` - Edit/update actions
- `can('memorial', 'delete')` - Delete actions
- `can('admin_user', 'create')` - Add admin button

### Responsive Design
- Desktop: Full sidebar visible, all columns shown
- Tablet: Collapsible sidebar, some columns hidden
- Mobile: Hamburger menu, single column layouts, stacked cards

### Loading States
Most interactive elements include loading states:
- Button spinners during async operations
- Skeleton loaders for data grids
- Progress indicators for file uploads
- Disabled states during processing

### Error Handling
- Inline error messages for form validation
- Toast notifications for action results
- Alert dialogs for critical errors
- Error boundaries for component failures

---

**Document Version:** 1.0  
**Last Updated:** January 24, 2026  
**Maintained By:** Development Team
