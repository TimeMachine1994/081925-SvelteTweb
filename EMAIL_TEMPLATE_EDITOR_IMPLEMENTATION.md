# Email Template Editor Implementation Plan

## Overview
Create a comprehensive email template editor in the TributeStream admin interface to manage, edit, test, and monitor all customer email communications.

## Current Email System Analysis

### Existing Email Templates (4 types)
1. **Enhanced Registration Email** - Welcome email with memorial URL and login credentials
2. **Basic Registration Email** - Simple account creation notification  
3. **Invitation Email** - Invite family/friends to contribute to memorial
4. **Email Change Confirmation** - Verify email address changes

### Email Triggers (11+ locations)
- Admin memorial creation (`/api/admin/create-memorial`)
- Funeral director customer creation (`/api/funeral-director/create-customer-memorial`)
- User registration flows (`/register/*`)
- Profile email changes (`/profile/settings`)
- Checkout success notifications (`/app/checkout/success`)
- Quick family registration (`/api/funeral-director/quick-register-family`)

---

## Implementation Steps

### Phase 1: Database Schema & API Foundation

#### Step 1.1: Create Email Template Database Schema
**File**: `frontend/src/lib/types/email-template.ts`
```typescript
interface EmailTemplate {
  id: string;
  name: string;
  type: 'registration' | 'invitation' | 'confirmation' | 'notification';
  subject: string;
  htmlContent: string;
  variables: string[]; // ['lovedOneName', 'memorialUrl', etc.]
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  usageCount: number;
}

interface EmailLog {
  id: string;
  templateId: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';`
  sentAt: Date;
  variables: Record<string, string>;
  errorMessage?: string;
}
```

#### Step 1.2: Create Email Template API Endpoints
**Files to create**:
- `frontend/src/routes/api/admin/email-templates/+server.ts` (GET, POST)
- `frontend/src/routes/api/admin/email-templates/[id]/+server.ts` (GET, PUT, DELETE)
- `frontend/src/routes/api/admin/email-templates/[id]/test/+server.ts` (POST)
- `frontend/src/routes/api/admin/email-templates/[id]/preview/+server.ts` (POST)`
- `frontend/src/routes/api/admin/email-logs/+server.ts` (GET)

**API Endpoints**:
```
GET    /api/admin/email-templates          // List all templates
POST   /api/admin/email-templates          // Create new template
GET    /api/admin/email-templates/[id]     // Get single template
PUT    /api/admin/email-templates/[id]     // Update template
DELETE /api/admin/email-templates/[id]     // Delete template
POST   /api/admin/email-templates/[id]/test // Send test email
POST   /api/admin/email-templates/[id]/preview // Generate preview
GET    /api/admin/email-logs               // View email delivery logs
```

#### Step 1.3: Create Email Template Service
**File**: `frontend/src/lib/server/email-template-service.ts`
- CRUD operations for templates
- Template rendering with variable substitution
- Integration with existing SendGrid service
- Email logging functionality

### Phase 2: Admin Interface Components

#### Step 2.1: Add Email Templates Tab to Admin Dashboard
**File**: `frontend/src/routes/admin/mvp-dashboard/+page.svelte`
- Add new tab: "📧 Email Templates"
- Update tab navigation and state management

#### Step 2.2: Create Email Template List Component
**File**: `frontend/src/lib/components/admin/EmailTemplateList.svelte`
- Table view of all templates
- Columns: Name, Type, Subject Preview, Usage Count, Last Modified, Actions
- Filter by template type and status
- Search functionality
- Actions: Edit, Test, Duplicate, Delete

#### Step 2.3: Create Email Template Editor Component
**File**: `frontend/src/lib/components/admin/EmailTemplateEditor.svelte`
- Split view: Editor on left, preview on right
- Subject line editor
- HTML content editor (textarea initially, upgrade to WYSIWYG later)
- Variable insertion helper
- Save/Cancel/Test buttons
- Mobile/Desktop preview toggle

#### Step 2.4: Create Email Test Interface Component
**File**: `frontend/src/lib/components/admin/EmailTestInterface.svelte`
- Email recipient field (defaults to admin email)
- Variable override inputs
- Send test button with status feedback
- Test history display

### Phase 3: Template Management System

#### Step 3.1: Migrate Existing Templates to Database
**File**: `frontend/src/lib/server/migrate-email-templates.ts`
- Script to convert hardcoded templates to database records
- Preserve existing template content and variables
- Create initial template records for all 4 existing types

#### Step 3.2: Update Email Service to Use Database Templates
**File**: `frontend/src/lib/server/email.ts`
- Modify existing functions to use database templates
- Add new `sendTemplatedEmail()` function
- Maintain backward compatibility during transition
- Add email logging for all sent emails

#### Step 3.3: Update All Email Trigger Points
**Files to update**:
- `frontend/src/routes/api/admin/create-memorial/+server.ts`
- `frontend/src/routes/api/funeral-director/create-customer-memorial/+server.ts`
- `frontend/src/routes/register/funeral-director/+page.server.ts`
- `frontend/src/routes/register/loved-one/+page.server.ts`
- `frontend/src/routes/profile/settings/+page.server.ts`
- `frontend/src/routes/app/checkout/success/+page.server.ts`
- All other email trigger locations

Replace hardcoded email calls with template-based calls.

### Phase 4: Advanced Features

#### Step 4.1: Rich Text Editor Integration
**Dependencies**: Add TinyMCE or Quill.js
**File**: `frontend/src/lib/components/admin/RichTextEditor.svelte`
- WYSIWYG HTML editor
- TributeStream brand styling presets
- Image upload capability
- Template component library

#### Step 4.2: Template Inheritance System
**File**: `frontend/src/lib/server/template-inheritance.ts`
- Header/footer template components
- Template composition system
- Brand consistency enforcement

#### Step 4.3: Email Analytics Dashboard
**File**: `frontend/src/lib/components/admin/EmailAnalytics.svelte`
- Email delivery statistics
- Template usage metrics
- Open/click tracking (if SendGrid analytics enabled)
- Performance insights

#### Step 4.4: A/B Testing System
**Files**:
- `frontend/src/lib/server/email-ab-testing.ts`
- `frontend/src/lib/components/admin/ABTestManager.svelte`
- Template variant management
- Automated winner selection
- Statistical significance tracking

---

## Implementation Checklist

### Phase 1: Foundation ✅
- [ ] Create email template TypeScript interfaces
- [ ] Build email template API endpoints
- [ ] Create email template service layer
- [ ] Set up Firestore collections for templates and logs

### Phase 2: Admin Interface ✅
- [ ] Add email templates tab to admin dashboard
- [ ] Build template list component
- [ ] Create template editor component
- [ ] Build email test interface
- [ ] Integrate components into admin dashboard

### Phase 3: Migration & Integration ✅
- [ ] Create template migration script
- [ ] Update email service to use database templates
- [ ] Update all email trigger points
- [ ] Test all email flows with new system
- [ ] Deploy and monitor

### Phase 4: Advanced Features ✅
- [ ] Integrate rich text editor
- [ ] Build template inheritance system
- [ ] Create email analytics dashboard
- [ ] Implement A/B testing system

---

## Technical Requirements

### Dependencies to Add
```json
{
  "devDependencies": {
    "@tinymce/tinymce-svelte": "^2.0.0",
    "tinymce": "^6.7.0"
  }
}
```

### Environment Variables
```env
# Already exists
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@tributestream.com

# New for template system
ADMIN_TEST_EMAIL=admin@tributestream.com
```

### Firestore Security Rules
```javascript
// Add to firestore.rules
match /email_templates/{templateId} {
  allow read, write: if isAdmin();
}

match /email_logs/{logId} {
  allow read: if isAdmin();
  allow write: if isAdmin() || isServer();
}
```

---

## Testing Strategy

### Unit Tests
- Template CRUD operations
- Variable substitution logic
- Email rendering engine
- API endpoint validation

### Integration Tests
- End-to-end email sending flow
- Template editor functionality
- Admin interface interactions
- Email delivery logging

### User Acceptance Testing
- Admin can create/edit templates
- Test emails are delivered successfully
- All existing email flows continue working
- Template changes reflect in sent emails

---

## Rollout Plan

### Phase 1 Rollout (Week 1-2)
1. Deploy database schema and API endpoints
2. Create basic admin interface
3. Test with admin users only

### Phase 2 Rollout (Week 3)
1. Migrate existing templates to database
2. Update email service (with fallback to hardcoded)
3. Test all email flows thoroughly

### Phase 3 Rollout (Week 4)
1. Remove hardcoded template fallbacks
2. Full production deployment
3. Monitor email delivery metrics

### Phase 4 Rollout (Week 5+)
1. Add advanced features incrementally
2. Gather admin feedback
3. Optimize based on usage patterns

---

## Success Metrics

### Technical Metrics
- Email delivery success rate (>99%)
- Template editor load time (<2 seconds)
- API response times (<500ms)
- Zero email delivery failures during migration

### Business Metrics
- Admin time saved on email management
- Improved email open rates (with better templates)
- Reduced customer support tickets about emails
- Faster time-to-market for new email campaigns

---

## Risk Mitigation

### Email Delivery Risks
- Maintain fallback to hardcoded templates during transition
- Comprehensive testing in staging environment
- Gradual rollout with monitoring
- Quick rollback plan if issues arise

### Data Loss Risks
- Database backups before migration
- Version control for all template changes
- Audit logging for all template modifications
- Template export/import functionality

### Performance Risks
- Database indexing for template queries
- Caching for frequently used templates
- Async email sending to prevent blocking
- Rate limiting for test email functionality
