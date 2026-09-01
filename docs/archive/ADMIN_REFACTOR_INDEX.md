# Tributestream Admin Dashboard Refactor - Complete Plan

## Overview

This is a comprehensive 4-part plan to refactor the Tributestream admin dashboard following enterprise-grade best practices for SaaS admin interfaces.

---

## 📚 Documentation Structure

### [Part 1: Information Architecture & Navigation](./ADMIN_REFACTOR_1_ARCHITECTURE.md)
**Focus:** Clear mental models, navigation, search, and saved views

**Key Features:**
- Domain-based navigation (Dashboard, Services, Users, Content, System)
- Unified search with Cmd+K shortcut
- Deep-linkable URLs with filters
- Saved views (personal + team presets)
- Breadcrumb navigation
- Recently viewed tracking

**Collections Mapped:**
- All 14 collections organized by domain
- Cross-collection search and filtering
- Resource relationship navigation

---

### [Part 2: Data Operations](./ADMIN_REFACTOR_2_DATA_OPERATIONS.md)
**Focus:** High-density data grids, filtering, bulk actions, and editing

**Key Features:**
- Resizable/sortable/pinnable columns
- Boolean logic filtering with date ranges
- Bulk actions with progress tracking
- Inline + full-form editing
- Server + client validation
- Draft/staging system
- Field-level revision history

**Collections Covered:**
- `memorials` - Full CRUD with payment management
- `streams` - Status tracking and bulk visibility changes
- `users` - Profile editing and role assignment
- `funeral_directors` - Business profile management
- All collections with appropriate data grids

---

### [Part 3: Safety & Guardrails](./ADMIN_REFACTOR_3_SAFETY.md)
**Focus:** RBAC, destructive action guards, undo, and rate limiting

**Key Features:**
- 5 admin role levels with granular permissions
- Confirmation dialogs with impact summaries
- Re-authentication for critical actions
- 30-day soft delete with undo
- Dry-run simulations for bulk actions
- Rate limiting per user/action
- Circuit breakers for external services

**Security Model:**
- Resource-scoped permissions
- Condition-based access control
- Audit logging for all changes
- Deleted items recovery system

---

### [Part 4: Workflow & Approvals](./ADMIN_REFACTOR_4_WORKFLOWS.md)
**Focus:** State machines, approvals, task queues, and runbooks

**Key Features:**
- Explicit state machines for memorials and edit requests
- Multi-step approval workflows with SLA tracking
- Task inbox with bulk triage
- Progress indicators and escalation rules
- Embedded checklists for reviews
- SOPs and runbook system

**Workflows:**
- Memorial review (Draft → Pending → Approved → Live)
- Schedule edit requests (Pending → Approved → Completed)
- Payment investigations
- Support ticket management

---

## 🎯 Implementation Timeline

### Week 1-2: Foundation
- **Part 1 Implementation**: Navigation and search
- Set up domain structure
- Create saved views system
- Build URL state management

### Week 3-4: Data Operations
- **Part 2 Implementation**: Grids and forms
- Build data grid component
- Implement filter builder
- Create bulk action system

### Week 5-6: Safety
- **Part 3 Implementation**: Permissions and guardrails
- Define role permissions
- Build confirmation system
- Implement soft delete

### Week 7-8: Workflows
- **Part 4 Implementation**: Approvals and tasks
- Create state machines
- Build approval engine
- Implement task queue

---

## 📊 Firestore Collections Mapping

### Services Domain
- **memorials** - Memorial management with payment tracking
- **streams** - Livestream oversight and recording management
- **memorials/{id}/slideshows** - Photo slideshow library
- **memorials/{id}/followers** - Follower tracking

### Users Domain
- **users** - All user accounts (owners, viewers, admins)
- **funeral_directors** - Professional profiles

### System Domain
- **audit_logs** - System-wide activity tracking
- **admin_actions** - Admin-specific action logging
- **admin_audit_logs** - Detailed admin auditing
- **schedule_edit_requests** - Schedule change approvals
- **passwordResetTokens** - Password recovery (server-only)
- **demoSessions** - Demo environment management

### Content Domain
- **blog** - Blog post CMS
- **purchases** - Payment transactions (placeholder)

### New Collections (To Be Created)
- **admin_saved_views** - User-saved filters and column sets
- **admin_tasks** - Task queue and assignment
- **approval_tracking** - Multi-step approval workflows
- **admin_drafts** - Draft changes before publish
- **memorial_history** (subcollection) - Field-level revision history

---

## 🔧 Technical Stack

### Frontend
- **SvelteKit 5** with runes
- **Tailwind CSS** for styling
- **Minimal Modern** design system components
- **Command palette** (Cmd+K) for search
- **Real-time updates** via Firestore listeners

### Backend
- **Firebase Admin SDK** for server-side operations
- **Firestore** for all data storage
- **Firebase Auth** for authentication
- **Cloud Functions** for automation (cleanup, notifications)

### Key Libraries
- **lru-cache** for rate limiting
- **date-fns** for date handling
- **zod** for validation schemas
- **pg** or **mysql** (optional) for analytics warehouse

---

## 🎨 UI Components Needed

### New Components
1. **DataGrid** - High-density table with all features
2. **FilterBuilder** - Boolean logic filter UI
3. **BulkActionBar** - Toolbar for multi-select actions
4. **ConfirmationDialog** - Guarded destructive actions
5. **StateVisualizer** - State machine diagram
6. **ApprovalPanel** - Multi-step approval UI
7. **TaskInbox** - Task queue interface
8. **EmbeddedChecklist** - Workflow checklists
9. **CommandPalette** - Global search (Cmd+K)
10. **ViewSelector** - Saved views dropdown
11. **RevisionHistory** - Field-level change tracking
12. **BulkActionProgress** - Real-time bulk operation progress

### Enhanced Components
- **AdminPageLayout** - Standard page template
- **Breadcrumbs** - Navigation trail
- **Toast** - Notifications with undo
- **Modal** - Dialogs and forms

---

## 🔐 Security Considerations

### Role Hierarchy
```
super_admin (full access)
  ├─ content_admin (content + users)
  ├─ financial_admin (payment management)
  └─ customer_support (limited editing)
      └─ readonly_admin (read-only)
```

### Permission Enforcement
- **Server-side** - All API endpoints check permissions
- **Client-side** - UI elements hidden/disabled
- **Resource-scoped** - Can limit to own/team/all
- **Condition-based** - Additional constraints (e.g., isPaid check)

### Audit Trail
Every admin action logged with:
- Who (admin user ID and email)
- What (action and resource type)
- When (timestamp)
- Where (IP address, user agent)
- Why (reason, if provided)
- Result (success/failure)

---

## 📈 Success Metrics

### Navigation Efficiency
- **Time to find record**: < 10 seconds (via search)
- **Clicks to common actions**: ≤ 3 clicks
- **Search success rate**: > 95%

### Data Operations
- **Bulk action completion**: > 99% success rate
- **Form validation accuracy**: > 99%
- **Edit conflicts**: < 1% of operations

### Safety & Compliance
- **Unauthorized access attempts**: 0
- **Accidental deletions**: < 1 per month (with undo)
- **Audit log completeness**: 100%

### Workflow Efficiency
- **SLA compliance**: > 90%
- **Task completion time**: < 24 hours average
- **Approval bottlenecks**: < 5% of workflows

---

## 🚀 Quick Start Guide

### For Developers

1. **Start with Part 1**: Build navigation structure first
2. **Read collection docs**: Understand data models in `FIRESTORE_COLLECTIONS_*.md`
3. **Follow phase order**: Each part builds on previous
4. **Test incrementally**: Deploy features as completed
5. **Get feedback early**: Show admins prototype for validation

### For Admins

1. **Learn shortcuts**: Cmd+K for search, saved views for common filters
2. **Use checklists**: Follow embedded workflows for consistency
3. **Check tasks daily**: Task inbox shows what needs attention
4. **Monitor SLAs**: Approval deadlines prevent bottlenecks
5. **Review audit logs**: Regular security and compliance checks

---

## 📞 Support & Questions

**Documentation Location:** `/admin-refactor-docs/`

**Implementation Priority:**
1. **High**: Part 1 (Navigation) + Part 3 (Safety)
2. **Medium**: Part 2 (Data Operations)
3. **Lower**: Part 4 (Workflows) - can phase in gradually

**Estimated Effort:**
- **Full implementation**: 8 weeks (1 FTE)
- **MVP (Parts 1 + 3)**: 4 weeks
- **Each additional part**: 2 weeks

---

## 🎉 Expected Outcomes

### For Admins
- ⚡ **10x faster** record lookup via unified search
- 📊 **5x more efficient** with bulk actions
- 🛡️ **Zero accidental deletions** with undo system
- 📋 **Clear workflows** with state machines and checklists

### For Users (Families & Funeral Directors)
- ✅ **Faster approval times** with SLA tracking
- 💬 **Better communication** via task system
- 🔒 **More security** with audit trails
- 🎯 **Higher quality** with review checklists

### For Business
- 📈 **Increased admin capacity** (handle 3x more volume)
- 💰 **Reduced errors** (fewer refunds/corrections)
- 🔐 **Better compliance** (complete audit trail)
- ⏱️ **Faster onboarding** (clear workflows and runbooks)

---

*Last Updated: 2025-11-11*
*Questions? Review individual part documents for detailed implementation guides.*
