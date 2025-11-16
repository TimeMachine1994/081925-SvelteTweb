# Complete Admin Panel Implementation Task List

**Project:** Tributestream Admin Panel
**Last Updated:** November 16, 2025
**Total Estimated Time:** 5-6 weeks (1 developer) or 3-4 weeks (2 developers)

---

## 🗑️ **PHASE 0: Remove Demo Sessions** ✅ COMPLETE (1-2 hours)

### Tasks
- [x] Delete `/admin/system/demo-sessions/+page.svelte`
- [x] Delete `/admin/system/demo-sessions/+page.server.ts`
- [x] Remove demo sessions entry from `/lib/admin/navigation.ts`
- [x] Remove any demo-related API endpoints
- [x] Remove `demoSessions` collection references
- [x] Update any documentation mentioning demo mode

---

## 🎯 **PHASE 1: Critical Business Operations** (2-3 weeks)

### **1.1 - Complete Deleted Items Recovery System** ✅ COMPLETE ⭐ HIGH PRIORITY
**UX Principles:** Miller's Law (chunking), Jakob's Law (familiar patterns), Aesthetic-Usability Effect

#### API Endpoints Needed
- [x] **POST `/api/admin/restore-deleted`** ✅
  - Accept array of item IDs
  - Restore items by removing `isDeleted` flag
  - Log restoration action in audit logs
  - Return success/failure for each item
  
- [x] **POST `/api/admin/permanent-delete`** ✅
  - Accept array of item IDs
  - Permanently delete from Firestore (no soft delete)
  - Delete associated files from Firebase Storage
  - Delete related subcollections (streams for memorials, etc.)
  - Log permanent deletion in audit logs
  - Return success/failure for each item

- [ ] **POST `/api/admin/cleanup-expired`**
  - Find all items with `deletedAt` > 30 days ago
  - Permanently delete them
  - Return count of items cleaned up

#### UI Enhancements
- [x] **Confirmation Modals** ✅ (Fitts's Law - large touch targets)
  - Create `RestoreConfirmationModal.svelte`
    - Show item details before restore
    - Display what will be restored (memorial + streams + slideshows)
    - "Cancel" and "Restore [Count] Items" buttons
  
  - Create `PermanentDeleteModal.svelte`
    - RED WARNING with explanation of permanence
    - Require typing "DELETE" to confirm
    - List exactly what will be permanently lost
    - "Cancel" and "Permanently Delete" buttons

- [x] **Bulk Action Feedback** ✅ (Feedback Principle)
  - Show loading spinner during operations
  - Display progress: "Restoring 3 of 10 items..."
  - Toast notifications for success/failure
  - If some fail, show detailed error modal with retry option

- [ ] **Expiring Soon Warning** (Von Restorff Effect) ⏳
  - Highlight rows with < 7 days in orange/red
  - Add visual warning icon
  - Sort expiring items to top by default

#### Testing
- [ ] Test restore for each resource type (memorial, stream, user, blog)
- [ ] Test permanent delete with cleanup of storage files
- [ ] Test bulk operations with mixed success/failure
- [ ] Test cleanup-expired job

---

### **1.2 - Schedule Edit Requests Approval System** ✅ COMPLETE ⭐ HIGH PRIORITY
**UX Principles:** Hick's Law (reduce choices), Postel's Law (lenient input), Goal-Gradient Effect

#### API Endpoints Needed
- [x] **GET `/api/admin/schedule-requests/[requestId]`** ✅
  - Fetch full request details
  - Include memorial info, requester info, current schedule, requested changes
  
- [x] **POST `/api/admin/schedule-requests/[requestId]/approve`** ✅
  - Update memorial schedule with requested changes
  - Update streams with new scheduled times
  - Set request status to 'approved'
  - Log action in audit logs
  - Send email notification to requester (TODO)
  
- [x] **POST `/api/admin/schedule-requests/[requestId]/deny`** ✅
  - Accept denial reason
  - Set request status to 'denied'
  - Log action in audit logs
  - Send email notification with reason (TODO)
  
- [ ] **POST `/api/admin/schedule-requests/[requestId]/request-more-info`**
  - Accept message to requester
  - Set status to 'pending_info'
  - Send email with admin questions

#### Create Detail Page Component
- [x] **Create `/admin/services/schedule-requests/[requestId]/+page.svelte`** ✅
  
  **Layout Structure:**
  ```
  ┌─────────────────────────────────────┐
  │ Header: Request #123 - [Status]    │
  │ [← Back] [Approve] [Deny] [More Info]
  └─────────────────────────────────────┘
  
  ┌─────────────────────────────────────┐
  │ REQUEST INFORMATION                 │
  │ • Memorial: [Name] ([View Link])   │
  │ • Requested by: [Email] on [Date]  │
  │ • Status: [Badge]                   │
  └─────────────────────────────────────┘
  
  ┌──────────────┬──────────────────────┐
  │ CURRENT      │ REQUESTED CHANGES    │
  │              │                      │
  │ Date: X      │ → New Date: Y       │
  │ Time: X      │ → New Time: Y       │
  │ Location: X  │ → New Location: Y   │
  └──────────────┴──────────────────────┘
  
  ┌─────────────────────────────────────┐
  │ REASON FOR CHANGE (from requester) │
  │ [Text explanation]                  │
  └─────────────────────────────────────┘
  
  ┌─────────────────────────────────────┐
  │ ADMIN NOTES (internal only)        │
  │ [Text area for internal notes]     │
  │ [Save Notes]                        │
  └─────────────────────────────────────┘
  
  ┌─────────────────────────────────────┐
  │ APPROVAL ACTIONS                    │
  │ ○ Approve changes                   │
  │ ○ Deny (provide reason)            │
  │ ○ Request more information         │
  └─────────────────────────────────────┘
  ```

- [x] **Approval Modal** ✅ (Confirmation)
  - Show diff view of changes again
  - Checkbox: "Send confirmation email to requester"
  - "Cancel" and "Approve Changes" buttons

- [x] **Denial Modal** ✅ (Require reason)
  - Textarea: "Reason for denial (will be sent to requester)"
  - Character counter (min 20 chars - Doherty Threshold)
  - "Cancel" and "Deny Request" buttons

- [ ] **More Info Modal**
  - Textarea: "Questions for requester"
  - "Cancel" and "Send Request" buttons

#### Bulk Actions
- [ ] Add bulk approve (only for low-risk changes)
- [ ] Add bulk deny with common reasons
- [ ] Disable bulk actions for high-value memorials (paid > $1000)

#### Email Notifications
- [ ] Create SendGrid template for approval notification ⏳ TODO
- [ ] Create SendGrid template for denial notification ⏳ TODO
- [ ] Create SendGrid template for more-info request ⏳ TODO

#### Testing
- [ ] Test approval updates memorial + streams correctly
- [ ] Test denial sends proper notification
- [ ] Test edge cases (memorial deleted, stream conflicts)

---

### **1.3 - Funeral Director Management Enhancement** ✅ COMPLETE ⭐ MEDIUM PRIORITY
**UX Principles:** Recognition over Recall, Serial Position Effect, Aesthetic-Usability Effect

#### Create Detail Page
- [x] **Create `/admin/users/funeral-directors/[directorId]/+page.svelte`** ✅
  
  **Layout Structure:**
  ```
  ┌─────────────────────────────────────┐
  │ [Company Logo/Icon] Company Name    │
  │ [← Back] [Edit] [Suspend] [Delete] │
  └─────────────────────────────────────┘
  
  ┌─────────────────────────────────────┐
  │ COMPANY INFORMATION                 │
  │ • Company: [Name]                   │
  │ • Contact: [Person Name]            │
  │ • Email: [Email] ([Send Email btn]) │
  │ • Phone: [Phone] ([Call btn])      │
  │ • License #: [Number]               │
  │ • Website: [URL]                    │
  │ • Address: [Full Address]           │
  │ • Status: [Badge with actions]      │
  └─────────────────────────────────────┘
  
  ┌─────────────────────────────────────┐
  │ ACCOUNT ACTIVITY                    │
  │ • Registered: [Date]                │
  │ • Last Login: [Date]                │
  │ • Memorials Created: [Count]        │
  │ • Total Revenue: $[Amount]          │
  └─────────────────────────────────────┘
  
  ┌─────────────────────────────────────┐
  │ MEMORIALS CREATED ([Count])         │
  │ [DataGrid of memorials]             │
  │ - Memorial name                      │
  │ - Created date                       │
  │ - Payment status                     │
  │ - Service date                       │
  │ [View All Memorials →]              │
  └─────────────────────────────────────┘
  
  ┌─────────────────────────────────────┐
  │ ADMIN NOTES                         │
  │ [Textarea for internal notes]       │
  │ [Save Notes]                        │
  └─────────────────────────────────────┘
  
  ┌─────────────────────────────────────┐
  │ ACCOUNT ACTIONS                     │
  │ [Suspend Account] [Reset Password]  │
  │ [Delete Account]                    │
  └─────────────────────────────────────┘
  ```

#### API Endpoints Needed
- [x] **GET `/api/admin/users/funeral-directors/[directorId]`** ✅
  - Full director profile
  - Memorial list with pagination
  - Revenue statistics
  
- [x] **PUT `/api/admin/users/funeral-directors/[directorId]`** ✅
  - Update director information
  - Update status
  - Save admin notes
  
- [x] **POST `/api/admin/users/funeral-directors/[directorId]/suspend`** ✅
  - Suspend account with reason
  - Send notification email (TODO)
  - Disable login
  
- [x] **POST `/api/admin/users/funeral-directors/[directorId]/reset-password`** ✅
  - Generate temporary password
  - Send email with reset link (TODO)
  
- [ ] **DELETE `/api/admin/users/funeral-directors/[directorId]`**
  - Soft delete (mark as deleted)
  - Keep memorial associations
  - Send notification

#### Edit Modal/Page
- [x] Create inline editing for key fields ✅
- [x] Validate license number format ✅
- [x] Validate email/phone formats ✅
- [ ] Auto-save with debounce (Doherty Threshold - 400ms) ⏳ Future

#### Testing
- [ ] Test editing all fields saves correctly
- [ ] Test suspend/unsuspend workflow
- [ ] Test memorial list pagination
- [ ] Test revenue calculation accuracy

---

## 🎨 **PHASE 2: Content & User Management** (1-2 weeks)

### **2.1 - Blog Post Management** ⭐ MEDIUM PRIORITY
**UX Principles:** WYSIWYG, Progressive Disclosure, Consistency

#### Create Detail/Edit Pages
- [ ] **Create `/admin/content/blog/[postId]/+page.svelte`** (View Mode)
  - Full blog post preview
  - Metadata display (author, category, status, dates)
  - SEO information (title, description, keywords)
  - View count and engagement stats
  - Quick actions: Edit, Delete, Publish/Unpublish, Feature/Unfeature

- [ ] **Create `/admin/content/blog/[postId]/edit/+page.svelte`** (Edit Mode)
  - Rich text editor (TipTap or similar)
  - Title, slug, excerpt fields
  - Featured image upload
  - Category selection
  - Tags input (multi-select)
  - SEO fields (meta title, description)
  - Status dropdown (draft, scheduled, published, archived)
  - Publish date picker (for scheduled posts)
  - Preview button (opens in new tab)
  - Save draft / Publish buttons

- [ ] **Create `/admin/content/blog/create/+page.svelte`**
  - Same as edit mode but for new posts
  - Auto-generate slug from title
  - Default to draft status

#### API Endpoints Needed
- [ ] **GET `/api/admin/blog/[postId]`**
  - Full post data
  
- [ ] **PUT `/api/admin/blog/[postId]`**
  - Update post
  - Handle featured image upload
  - Update timestamps
  
- [ ] **POST `/api/admin/blog`**
  - Create new post
  
- [ ] **DELETE `/api/admin/blog/[postId]`**
  - Soft delete post
  
- [ ] **POST `/api/admin/blog/[postId]/publish`**
  - Change status to published
  - Set publishedAt timestamp
  
- [ ] **POST `/api/admin/blog/[postId]/feature`**
  - Toggle featured status

#### Bulk Actions Implementation
- [ ] Bulk publish (change status to published)
- [ ] Bulk unpublish (change to draft)
- [ ] Bulk delete (soft delete)
- [ ] Bulk change category

#### Components to Create
- [ ] `BlogEditor.svelte` (rich text editor wrapper)
- [ ] `BlogImageUploader.svelte` (drag-drop featured image)
- [ ] `BlogSEOPanel.svelte` (SEO fields in collapsible panel)
- [ ] `BlogPreview.svelte` (live preview of rendered post)

#### Testing
- [ ] Test creating new post saves all fields
- [ ] Test editing updates correctly
- [ ] Test scheduling publishes at correct time
- [ ] Test featured toggle on homepage
- [ ] Test image upload and storage

---

### **2.2 - Admin User Management** ⭐ MEDIUM PRIORITY
**UX Principles:** Safety (confirmation), Least Surprise, Visual Hierarchy

#### Create Detail Page
- [ ] **Create `/admin/users/admin-users/[adminId]/+page.svelte`**
  
  **Layout:**
  ```
  ┌─────────────────────────────────────┐
  │ 👑 [Admin Name] - [Role Badge]     │
  │ [← Back] [Edit] [Suspend] [Delete] │
  └─────────────────────────────────────┘
  
  ┌─────────────────────────────────────┐
  │ ADMIN INFORMATION                   │
  │ • Name: [Name]                      │
  │ • Email: [Email]                    │
  │ • Role: [Super/Content/Financial/   │
  │          Support/ReadOnly]          │
  │ • Status: [Active/Suspended]        │
  │ • Phone: [Phone]                    │
  └─────────────────────────────────────┘
  
  ┌─────────────────────────────────────┐
  │ PERMISSIONS & ACCESS                │
  │ [List of permissions based on role] │
  │ ✓ Can view memorials                │
  │ ✓ Can edit memorials                │
  │ ✗ Cannot delete users               │
  │ ...                                 │
  └─────────────────────────────────────┘
  
  ┌─────────────────────────────────────┐
  │ ACTIVITY LOG                        │
  │ Last Login: [Date/Time]             │
  │ Actions This Month: [Count]         │
  │ [View Full Audit Log →]            │
  └─────────────────────────────────────┘
  
  ┌─────────────────────────────────────┐
  │ RECENT ACTIONS (Last 10)            │
  │ [Mini audit log specific to admin]  │
  └─────────────────────────────────────┘
  
  ┌─────────────────────────────────────┐
  │ SECURITY                            │
  │ [Reset Password] [Force Logout]     │
  │ [Enable 2FA] [View Login History]  │
  └─────────────────────────────────────┘
  ```

#### Create/Edit Admin Modal
- [ ] **Create `CreateAdminModal.svelte`**
  - Email (required, validated)
  - Name (required)
  - Role selection with permission explanations
  - Generate temporary password checkbox
  - Send welcome email checkbox
  - Form validation

- [ ] **Edit Mode** (inline or modal)
  - Update name, phone
  - Change role (requires confirmation if reducing permissions)
  - Cannot change email (security)

#### API Endpoints Needed
- [ ] **GET `/api/admin/users/admin-users/[adminId]`**
  - Full admin profile
  - Permission list
  - Recent actions from audit log
  
- [ ] **POST `/api/admin/users/admin-users`**
  - Create new admin
  - Set role and permissions
  - Send welcome email with temp password
  
- [ ] **PUT `/api/admin/users/admin-users/[adminId]`**
  - Update admin info
  - Change role (log change in audit)
  
- [ ] **POST `/api/admin/users/admin-users/[adminId]/suspend`**
  - Suspend admin account
  - Require reason
  - Invalidate all sessions
  
- [ ] **POST `/api/admin/users/admin-users/[adminId]/reset-password`**
  - Generate reset link
  - Send email
  
- [ ] **DELETE `/api/admin/users/admin-users/[adminId]`**
  - Soft delete admin
  - Transfer ownership of their actions in audit log

#### Role Permission Matrix
- [ ] Document exact permissions for each role:
  - **Super Admin:** All permissions
  - **Content Admin:** Blog, memorials (edit), users (view)
  - **Financial Admin:** Payments, invoices, memorials (payment status)
  - **Customer Support:** Memorials (view/edit), users (view), tickets
  - **Read-Only:** View all, edit none

#### Security Features
- [ ] Prevent self-deletion
- [ ] Prevent self-role-change to higher privilege
- [ ] Require current admin password for sensitive operations
- [ ] Force password change on first login
- [ ] Optional 2FA setup

#### Testing
- [ ] Test creating admin with each role
- [ ] Test permission enforcement
- [ ] Test cannot delete self
- [ ] Test suspend invalidates sessions
- [ ] Test role change permissions

---

### **2.3 - Slideshow Management Enhancement** ⭐ LOW PRIORITY
**UX Principles:** Visibility of System Status, Error Prevention

#### Enhanced List Page Features
- [ ] Add preview thumbnails (show first photo)
- [ ] Add status indicators:
  - Draft: Gray
  - Generating: Blue with spinner
  - Ready: Green
  - Failed: Red with retry button
  
- [ ] Add quick actions in row:
  - View on memorial page (opens in new tab)
  - Regenerate (if failed)
  - Delete

#### API Endpoints Needed
- [ ] **POST `/api/admin/slideshows/[slideshowId]/regenerate`**
  - Retry video generation
  - Update status to 'generating'
  
- [ ] **DELETE `/api/admin/slideshows/[slideshowId]`**
  - Delete from memorial subcollection
  - Delete video from storage
  - Delete photos from storage

#### Bulk Actions
- [ ] Bulk delete slideshows
- [ ] Bulk regenerate failed slideshows

#### Monitoring Dashboard
- [ ] Add stats widget:
  - Total slideshows
  - Failed count (needs attention)
  - Average photos per slideshow
  - Total storage used

#### Testing
- [ ] Test regenerate fixes failed slideshows
- [ ] Test delete removes all files
- [ ] Test bulk operations

---

## 🎯 **PHASE 3: UX Polish & Advanced Features** (1 week)

### **3.1 - Global Admin UX Improvements**
**UX Principles:** All of them! This is the polish phase.

#### Search & Filter Enhancement
- [ ] **Global Admin Search** (Command Palette improvement)
  - Search across memorials, users, blog posts
  - Keyboard shortcuts (Cmd+K)
  - Recent searches
  - Quick actions from search results

#### Bulk Action Improvements
- [ ] **Smart Bulk Actions** (Context-aware)
  - Show different actions based on selection
  - Disable invalid actions (can't publish already published)
  - Show impact preview: "This will affect 5 memorials and 12 streams"

#### Better Feedback Systems
- [ ] **Toast Notification System**
  - Success: Green with checkmark
  - Error: Red with details and retry button
  - Warning: Yellow with info
  - Info: Blue
  - Auto-dismiss after 5s (except errors)
  - Stack multiple notifications
  - Action buttons in toasts (Undo, View, Retry)

- [ ] **Loading States** (Skeleton Screens)
  - Replace spinners with skeleton screens
  - Show structure while loading
  - Reduces perceived load time

- [ ] **Empty States** (Better than "No data")
  - Illustration + helpful message
  - Call to action button
  - Example: "No memorials yet. Create your first memorial →"

#### Keyboard Shortcuts
- [ ] Document all keyboard shortcuts
- [ ] Add shortcut hints in UI (like Gmail)
- [ ] Common shortcuts:
  - `?` - Show shortcuts modal
  - `Cmd+K` - Global search
  - `Cmd+S` - Save
  - `Esc` - Close modal
  - `Cmd+Enter` - Submit form
  - Arrow keys - Navigate lists

#### Responsive Design Polish
- [ ] Test all pages on mobile (320px - 768px)
- [ ] Make DataGrids horizontally scrollable on mobile
- [ ] Stack filters vertically on mobile
- [ ] Larger touch targets (min 44px)
- [ ] Hide less important columns on mobile

---

### **3.2 - Analytics & Insights**
**UX Principles:** Data Visualization, Progressive Disclosure

#### Admin Dashboard Enhancement
- [ ] **Statistics Cards**
  - Total memorials (this month vs last month)
  - Active streams today
  - New users this week
  - Revenue this month
  - Use trend indicators (↑ 12% vs last month)

- [ ] **Activity Timeline**
  - Recent admin actions
  - System events
  - Real-time updates

- [ ] **Quick Stats by Resource**
  - Most active funeral directors
  - Most viewed memorials
  - Most engaged blog posts

#### Memorial Analytics Page
- [ ] **Create `/admin/analytics/memorials`**
  - Total memorials over time (chart)
  - Public vs private ratio
  - Paid vs unpaid ratio
  - Average completion rate
  - Geographic distribution

#### User Analytics Page
- [ ] **Create `/admin/analytics/users`**
  - User growth chart
  - Active users (logged in last 30 days)
  - User roles breakdown
  - Retention metrics

---

### **3.3 - Export & Reporting**
**UX Principles:** Familiarity (use standard formats)

#### CSV Export Implementation
- [ ] **Add export buttons to all list pages**
  - Current view (with filters applied)
  - All data (remove limits)
  - Selected rows only

- [ ] **Create `/api/admin/export/[resource]`**
  - Generate CSV
  - Support date ranges
  - Apply filters
  - Return download link

#### Report Generation
- [ ] **Monthly Report**
  - Memorials created
  - Revenue
  - User activity
  - Email to super admins

- [ ] **On-Demand Reports**
  - Custom date range
  - Custom metrics
  - PDF or CSV format

---

## 🔒 **PHASE 4: Security & Performance** (3-5 days)

### **4.1 - Permission Enforcement**
- [ ] Audit all API endpoints for permission checks
- [ ] Create permission middleware
- [ ] Test permission boundaries
- [ ] Add rate limiting to sensitive operations

### **4.2 - Audit Log Enhancement**
- [ ] Log all admin actions automatically
- [ ] Include before/after values
- [ ] Add IP address tracking
- [ ] Add user agent tracking
- [ ] Create audit log viewer improvements:
  - Filter by date range
  - Filter by impact level (low/medium/high)
  - Export audit logs

### **4.3 - Performance Optimization**
- [ ] Add pagination to all lists (50 items per page)
- [ ] Implement virtual scrolling for large lists
- [ ] Add loading indicators everywhere
- [ ] Optimize Firestore queries:
  - Add composite indexes
  - Use cursors for pagination
  - Cache frequently accessed data
- [ ] Add Redis caching for stats

---

## ✅ **PHASE 5: Testing & Documentation** (3-5 days)

### **5.1 - Testing**
- [ ] **Unit Tests**
  - Test all API endpoints
  - Test permission checks
  - Test data validation

- [ ] **Integration Tests**
  - Test complete workflows (create → edit → delete)
  - Test bulk operations
  - Test email notifications

- [ ] **E2E Tests** (Playwright)
  - Test admin login
  - Test memorial management flow
  - Test user management flow
  - Test critical paths

- [ ] **Load Testing**
  - Test with 1000+ memorials
  - Test with 100+ concurrent users
  - Test bulk operations on 100+ items

### **5.2 - Documentation**
- [ ] **Admin User Guide**
  - How to use each page
  - Common workflows
  - Keyboard shortcuts
  - Troubleshooting

- [ ] **Developer Documentation**
  - API endpoint documentation
  - Component documentation
  - Database schema
  - Deployment process

- [ ] **Video Tutorials**
  - Admin panel overview (5 min)
  - Memorial management (3 min)
  - User management (3 min)
  - Common tasks (2 min each)

---

## 📊 **Success Metrics**

Track these to measure admin panel effectiveness:

- [ ] **Performance**
  - All pages load in < 2 seconds
  - Bulk operations handle 100+ items smoothly
  - No UI blocking during operations

- [ ] **Usability**
  - Admin can complete common tasks in < 5 clicks
  - No confusion about what actions do
  - Error messages are helpful and actionable

- [ ] **Reliability**
  - 99.9% uptime for admin panel
  - All bulk operations have proper rollback
  - No data loss incidents

- [ ] **Adoption**
  - All admins trained and using system
  - No bypass methods needed
  - Positive feedback from admin team

---

## 🎯 **Priority Order Summary**

1. **Week 1-2:** Phase 0 (remove demo) + Phase 1.1-1.2 (deleted items + schedule requests)
2. **Week 3:** Phase 1.3 (funeral directors) + Start Phase 2.1 (blog)
3. **Week 4:** Finish Phase 2 (content/users)
4. **Week 5:** Phase 3 (UX polish + analytics)
5. **Week 6:** Phase 4-5 (security + testing)

**Total Estimated Time:** 5-6 weeks for full completion with 1 developer, or 3-4 weeks with 2 developers working in parallel.

---

## 📋 **Component Inventory**

### New Components to Create
- `RestoreConfirmationModal.svelte`
- `PermanentDeleteModal.svelte`
- `CreateAdminModal.svelte`
- `BlogEditor.svelte`
- `BlogImageUploader.svelte`
- `BlogSEOPanel.svelte`
- `BlogPreview.svelte`
- `ToastNotification.svelte`
- `SkeletonLoader.svelte`
- `EmptyState.svelte`
- `KeyboardShortcutsModal.svelte`

### Reusable Components to Enhance
- `DataGrid.svelte` - Add export, better mobile support
- `FilterBuilder.svelte` - Add saved filters
- `BulkActionBar.svelte` - Add smart context-aware actions
- `AdminLayout.svelte` - Add keyboard shortcuts, command palette

---

## 🔗 **External Dependencies**

### NPM Packages to Install
- [ ] `@tiptap/core` - Rich text editor
- [ ] `@tiptap/starter-kit` - TipTap extensions
- [ ] `chart.js` - Analytics charts
- [ ] `date-fns` - Date manipulation
- [ ] `csv-stringify` - CSV export
- [ ] `@playwright/test` - E2E testing

### Firebase/Firestore Indexes Needed
- [ ] Compound index: `memorials` (isDeleted, deletedAt)
- [ ] Compound index: `schedule_edit_requests` (status, createdAt)
- [ ] Compound index: `users` (role, suspended, createdAt)
- [ ] Compound index: `blog` (status, publishedAt)
- [ ] Compound index: `admin_audit_logs` (adminId, timestamp)

---

## 🚀 **Deployment Checklist**

Before deploying to production:

- [ ] All tests passing
- [ ] All Firestore indexes created
- [ ] Environment variables set
- [ ] SendGrid templates created
- [ ] Admin users created
- [ ] Permissions tested
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured
- [ ] Documentation complete
- [ ] Training videos recorded

---

## 📞 **Support & Maintenance**

Post-launch considerations:

- [ ] Monitor error rates
- [ ] Track admin usage patterns
- [ ] Collect admin feedback
- [ ] Schedule regular security audits
- [ ] Plan quarterly feature reviews
- [ ] Document common issues
- [ ] Create runbooks for critical operations

---

**End of Task List**
