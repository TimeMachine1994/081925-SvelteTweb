# WBS: Email Audit System Implementation

**Created:** January 29, 2026  
**Purpose:** Track all emails sent from the system, allowing admins to review email contents, verify correct data was sent, and debug delivery issues.

---

## Executive Summary

### Problem Statement
Currently, when emails are sent via SendGrid, there's no record of what data was sent. If a customer reports receiving incorrect information or not receiving an email, admins have no way to:
- Verify what was actually sent
- Check if the correct password/URL/name was included
- Debug template data issues
- Resend emails with the same data

### Solution
Implement an email audit logging system that captures every email sent, stores the full template data, and provides an admin interface to search, view, and resend emails.

---

## Phase 1: Data Model & Core Logging

### 1.1 Create Firestore Collection Schema

| Task ID | Task | Priority | Effort |
|---------|------|----------|--------|
| 1.1.1 | Define `email_audit_logs` collection schema | HIGH | Low |
| 1.1.2 | Create TypeScript interface for EmailAuditLog | HIGH | Low |
| 1.1.3 | Add Firestore indexes for common queries | HIGH | Low |

#### Schema Definition

```typescript
// src/lib/types/email-audit.ts

export interface EmailAuditLog {
  id: string;                    // Auto-generated document ID
  
  // Email identification
  type: EmailType;               // Enum of all email types
  templateId?: string;           // SendGrid template ID (null for raw HTML)
  templateName?: string;         // Human-readable template name
  
  // Recipients
  to: string;                    // Primary recipient
  cc?: string[];                 // CC recipients
  from: string;                  // Sender address
  
  // Content
  subject?: string;              // Subject line (for raw HTML emails)
  templateData: Record<string, any>;  // Full JSON sent to SendGrid
  
  // Timestamps
  sentAt: Date;
  
  // Context
  triggeredBy: string;           // What action triggered this email
  triggeredByUserId?: string;    // User who triggered (if applicable)
  triggeredByAdminId?: string;   // Admin who triggered (if admin action)
  
  // Related entities
  memorialId?: string;
  userId?: string;
  invoiceId?: string;
  streamId?: string;
  
  // Status & tracking
  status: 'sent' | 'failed' | 'mocked';
  error?: string;                // Error message if failed
  sendgridMessageId?: string;    // SendGrid's X-Message-Id for tracking
  
  // Metadata
  environment: 'production' | 'development' | 'test';
  ipAddress?: string;            // Request IP (for security auditing)
}

export type EmailType = 
  | 'enhanced_registration'
  | 'basic_registration'
  | 'funeral_director_registration'
  | 'invitation'
  | 'email_change_confirmation'
  | 'payment_confirmation'
  | 'payment_action_required'
  | 'payment_failure'
  | 'password_reset'
  | 'owner_welcome'
  | 'funeral_director_welcome'
  | 'contact_form_support'
  | 'contact_form_confirmation'
  | 'invoice'
  | 'invoice_receipt';
```

#### Firestore Indexes (firestore.indexes.json)

```json
{
  "indexes": [
    {
      "collectionGroup": "email_audit_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sentAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "email_audit_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "sentAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "email_audit_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "to", "order": "ASCENDING" },
        { "fieldPath": "sentAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "email_audit_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "sentAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "email_audit_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "memorialId", "order": "ASCENDING" },
        { "fieldPath": "sentAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

### 1.2 Create Email Audit Logging Service

| Task ID | Task | Priority | Effort |
|---------|------|----------|--------|
| 1.2.1 | Create `src/lib/server/emailAudit.ts` service | HIGH | Medium |
| 1.2.2 | Implement `logEmailSent()` function | HIGH | Low |
| 1.2.3 | Implement `logEmailFailed()` function | HIGH | Low |
| 1.2.4 | Implement `logEmailMocked()` function (dev mode) | MEDIUM | Low |
| 1.2.5 | Add helper to sanitize sensitive data for logs | HIGH | Medium |

#### Implementation

```typescript
// src/lib/server/emailAudit.ts

import { adminDb } from './firebase';
import type { EmailAuditLog, EmailType } from '$lib/types/email-audit';
import { env } from '$env/dynamic/private';

const ENVIRONMENT = env.NODE_ENV || 'development';

interface LogEmailParams {
  type: EmailType;
  to: string;
  cc?: string[];
  templateId?: string;
  templateName?: string;
  subject?: string;
  templateData: Record<string, any>;
  triggeredBy: string;
  triggeredByUserId?: string;
  triggeredByAdminId?: string;
  memorialId?: string;
  userId?: string;
  invoiceId?: string;
  streamId?: string;
}

/**
 * Sanitize sensitive data before logging
 * Masks passwords but keeps first/last chars for verification
 */
function sanitizeForLog(data: Record<string, any>): Record<string, any> {
  const sanitized = { ...data };
  
  // Mask password but keep first 2 and last 2 chars
  if (sanitized.password && typeof sanitized.password === 'string') {
    const pwd = sanitized.password;
    if (pwd.length > 4) {
      sanitized.password = `${pwd.slice(0, 2)}${'*'.repeat(pwd.length - 4)}${pwd.slice(-2)}`;
    } else {
      sanitized.password = '****';
    }
    sanitized._passwordLength = pwd.length; // Store length for debugging
  }
  
  // Keep magic links but note they're one-time use
  if (sanitized.magicLink) {
    sanitized._magicLinkIncluded = true;
  }
  
  if (sanitized.resetLink) {
    sanitized._resetLinkIncluded = true;
  }

  // Mask confirmation URLs (strip tokens)
  if (sanitized.confirmationUrl && typeof sanitized.confirmationUrl === 'string') {
    sanitized._confirmationUrlIncluded = true;
    const url = sanitized.confirmationUrl as string;
    if (url.includes('?')) {
      sanitized.confirmationUrl = url.split('?')[0] + '?token=***MASKED***';
    }
  }

  // Mask calculator magic links (strip tokens)
  if (sanitized.calculatorMagicLink && typeof sanitized.calculatorMagicLink === 'string') {
    sanitized._calculatorMagicLinkIncluded = true;
    const url = sanitized.calculatorMagicLink as string;
    if (url.includes('?')) {
      sanitized.calculatorMagicLink = url.split('?')[0] + '?token=***MASKED***';
    }
  }
  
  return sanitized;
}

/**
 * Helper to build log params from common email data patterns
 * Simplifies integration — all 14 email functions use this
 */
export function buildLogParams(
  type: LogEmailParams['type'],
  to: string,
  templateData: Record<string, unknown>,
  options: {
    templateId?: string;
    templateName?: string;
    subject?: string;
    cc?: string[];
    triggeredBy?: string;
    triggeredByUserId?: string;
    triggeredByAdminId?: string;
    memorialId?: string;
    userId?: string;
    invoiceId?: string;
    streamId?: string;
  } = {}
): LogEmailParams {
  return {
    type,
    to,
    templateData,
    templateId: options.templateId,
    templateName: options.templateName,
    subject: options.subject,
    cc: options.cc,
    triggeredBy: options.triggeredBy || type,
    triggeredByUserId: options.triggeredByUserId,
    triggeredByAdminId: options.triggeredByAdminId,
    memorialId: options.memorialId,
    userId: options.userId,
    invoiceId: options.invoiceId,
    streamId: options.streamId
  };
}

/**
 * Log a successfully sent email
 */
export async function logEmailSent(
  params: LogEmailParams,
  sendgridMessageId?: string
): Promise<string> {
  const logEntry: Omit<EmailAuditLog, 'id'> = {
    type: params.type,
    to: params.to,
    cc: params.cc,
    from: env.FROM_EMAIL || 'noreply@tributestream.com',
    templateId: params.templateId,
    templateName: params.templateName,
    subject: params.subject,
    templateData: sanitizeForLog(params.templateData),
    sentAt: new Date(),
    triggeredBy: params.triggeredBy,
    triggeredByUserId: params.triggeredByUserId,
    triggeredByAdminId: params.triggeredByAdminId,
    memorialId: params.memorialId,
    userId: params.userId,
    invoiceId: params.invoiceId,
    streamId: params.streamId,
    status: 'sent',
    sendgridMessageId,
    environment: ENVIRONMENT as 'production' | 'development' | 'test'
  };

  const docRef = await adminDb.collection('email_audit_logs').add(logEntry);
  console.log(`📧 [EMAIL AUDIT] Logged sent email: ${params.type} to ${params.to} (${docRef.id})`);
  return docRef.id;
}

/**
 * Log a failed email attempt
 */
export async function logEmailFailed(
  params: LogEmailParams,
  error: Error | string
): Promise<string> {
  const errorMessage = error instanceof Error ? error.message : error;
  
  const logEntry: Omit<EmailAuditLog, 'id'> = {
    type: params.type,
    to: params.to,
    cc: params.cc,
    from: env.FROM_EMAIL || 'noreply@tributestream.com',
    templateId: params.templateId,
    templateName: params.templateName,
    subject: params.subject,
    templateData: sanitizeForLog(params.templateData),
    sentAt: new Date(),
    triggeredBy: params.triggeredBy,
    triggeredByUserId: params.triggeredByUserId,
    triggeredByAdminId: params.triggeredByAdminId,
    memorialId: params.memorialId,
    userId: params.userId,
    invoiceId: params.invoiceId,
    streamId: params.streamId,
    status: 'failed',
    error: errorMessage,
    environment: ENVIRONMENT as 'production' | 'development' | 'test'
  };

  const docRef = await adminDb.collection('email_audit_logs').add(logEntry);
  console.log(`📧 [EMAIL AUDIT] Logged FAILED email: ${params.type} to ${params.to} (${docRef.id})`);
  return docRef.id;
}

/**
 * Log a mocked email (dev mode)
 */
export async function logEmailMocked(params: LogEmailParams): Promise<string> {
  const logEntry: Omit<EmailAuditLog, 'id'> = {
    type: params.type,
    to: params.to,
    cc: params.cc,
    from: env.FROM_EMAIL || 'noreply@tributestream.com',
    templateId: params.templateId,
    templateName: params.templateName,
    subject: params.subject,
    templateData: sanitizeForLog(params.templateData),
    sentAt: new Date(),
    triggeredBy: params.triggeredBy,
    triggeredByUserId: params.triggeredByUserId,
    triggeredByAdminId: params.triggeredByAdminId,
    memorialId: params.memorialId,
    userId: params.userId,
    invoiceId: params.invoiceId,
    streamId: params.streamId,
    status: 'mocked',
    environment: ENVIRONMENT as 'production' | 'development' | 'test'
  };

  const docRef = await adminDb.collection('email_audit_logs').add(logEntry);
  console.log(`📧 [EMAIL AUDIT] Logged MOCKED email: ${params.type} to ${params.to} (${docRef.id})`);
  return docRef.id;
}
```

---

### 1.3 Integrate Logging into email.ts

| Task ID | Task | Priority | Effort |
|---------|------|----------|--------|
| 1.3.1 | Add logging to `sendEnhancedRegistrationEmail()` | HIGH | Low |
| 1.3.2 | Add logging to `sendRegistrationEmail()` | HIGH | Low |
| 1.3.3 | Add logging to `sendFuneralDirectorRegistrationEmail()` | HIGH | Low |
| 1.3.4 | Add logging to `sendInvitationEmail()` | HIGH | Low |
| 1.3.5 | Add logging to `sendEmailChangeConfirmation()` | HIGH | Low |
| 1.3.6 | Add logging to `sendPaymentConfirmationEmail()` | HIGH | Low |
| 1.3.7 | Add logging to `sendPaymentActionRequiredEmail()` | HIGH | Low |
| 1.3.8 | Add logging to `sendPaymentFailureEmail()` | HIGH | Low |
| 1.3.9 | Add logging to `sendPasswordResetEmail()` | HIGH | Low |
| 1.3.10 | Add logging to `sendOwnerWelcomeEmail()` | HIGH | Low |
| 1.3.11 | Add logging to `sendFuneralDirectorWelcomeEmail()` | HIGH | Low |
| 1.3.12 | Add logging to `sendContactFormEmails()` | HIGH | Low |
| 1.3.13 | Add logging to `sendInvoiceEmail()` | HIGH | Low |
| 1.3.14 | Add logging to `sendInvoiceReceiptEmail()` | HIGH | Low |

#### Example Integration Pattern

```typescript
// Before (current code)
export async function sendEnhancedRegistrationEmail(data: EnhancedRegistrationEmailData) {
  if (shouldMockEmails()) {
    // ... mock logging
    return;
  }
  
  try {
    await sgMail.send(msg);
    console.log('✅ Email sent');
  } catch (error) {
    console.error('💥 Error:', error);
    throw error;
  }
}

// After (with audit logging)
export async function sendEnhancedRegistrationEmail(
  data: EnhancedRegistrationEmailData,
  context?: { triggeredBy: string; memorialId?: string; userId?: string }
) {
  const logParams = {
    type: 'enhanced_registration' as EmailType,
    to: data.email,
    templateId: SENDGRID_TEMPLATES.ENHANCED_REGISTRATION,
    templateName: 'ENHANCED_REGISTRATION',
    templateData: {
      lovedOneName: data.lovedOneName,
      ownerName: data.ownerName,
      memorialUrl: data.memorialUrl,
      email: data.email,
      password: data.password,
      magicLink: data.magicLink
    },
    triggeredBy: context?.triggeredBy || 'registration',
    memorialId: context?.memorialId,
    userId: context?.userId
  };

  if (shouldMockEmails()) {
    await logEmailMocked(logParams);
    // ... existing mock logging
    return;
  }
  
  try {
    const [response] = await sgMail.send(msg);
    const messageId = response.headers['x-message-id'];
    await logEmailSent(logParams, messageId);
    console.log('✅ Email sent');
  } catch (error) {
    await logEmailFailed(logParams, error as Error);
    console.error('💥 Error:', error);
    throw error;
  }
}
```

---

## Phase 2: Admin API Endpoints

### 2.1 Create Email Logs API

| Task ID | Task | Priority | Effort |
|---------|------|----------|--------|
| 2.1.1 | Create `GET /api/admin/email-logs` - List with pagination/filters | HIGH | Medium |
| 2.1.2 | Create `GET /api/admin/email-logs/[id]` - Single log detail | HIGH | Low |
| 2.1.3 | Create `POST /api/admin/email-logs/[id]/resend` - Resend email | MEDIUM | Medium |
| 2.1.4 | Create `GET /api/admin/email-logs/stats` - Dashboard stats | LOW | Low |

#### API Specifications

**GET /api/admin/email-logs**

Query Parameters:
- `page` (number, default: 1)
- `limit` (number, default: 50, max: 100)
- `type` (EmailType, optional) - Filter by email type
- `status` (string, optional) - Filter by sent/failed/mocked
- `to` (string, optional) - Search by recipient email
- `memorialId` (string, optional) - Filter by memorial
- `startDate` (ISO string, optional) - Filter by date range
- `endDate` (ISO string, optional) - Filter by date range
- `search` (string, optional) - Full-text search

Response:
```json
{
  "logs": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "hasMore": true
  }
}
```

**GET /api/admin/email-logs/[id]**

Response:
```json
{
  "log": {
    "id": "abc123",
    "type": "enhanced_registration",
    "to": "user@email.com",
    "templateData": {...},
    // ... full EmailAuditLog
  }
}
```

**POST /api/admin/email-logs/[id]/resend**

Request Body:
```json
{
  "modifyData": {
    "email": "new-email@example.com"  // Optional: override recipient
  }
}
```

Response:
```json
{
  "success": true,
  "newLogId": "xyz789",
  "message": "Email resent successfully"
}
```

---

## Phase 3: Admin UI

### 3.1 Email Logs List Page

| Task ID | Task | Priority | Effort |
|---------|------|----------|--------|
| 3.1.1 | Create route `/admin/system/email-logs/+page.server.ts` | HIGH | Low |
| 3.1.2 | Create route `/admin/system/email-logs/+page.svelte` | HIGH | Medium |
| 3.1.3 | Implement DataGrid with columns | HIGH | Medium |
| 3.1.4 | Implement filter panel (type, status, date range) | HIGH | Medium |
| 3.1.5 | Implement search by recipient email | HIGH | Low |
| 3.1.6 | Implement pagination | HIGH | Low |
| 3.1.7 | Add "Export CSV" button | LOW | Low |

#### UI Components

```
Route: /admin/system/email-logs

┌─────────────────────────────────────────────────────────────────────────┐
│  📧 Email Audit Logs                                    [Export CSV]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Filters:                                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────────────┐ │
│  │ Type    ▼  │ │ Status  ▼  │ │ Date Range │ │ 🔍 Search email...   │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────────────────┘ │
│                                                                         │
│  Stats: 1,234 total | 1,180 sent | 42 failed | 12 mocked              │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  □ │ Type           │ To              │ Subject/Template   │ Sent     │ Status │
│────┼────────────────┼─────────────────┼───────────────────┼──────────┼────────│
│  □ │ 📝 Registration│ john@email.com  │ Welcome to Tribu..│ 2 min ago│ ✅ Sent│
│  □ │ 🔑 Password    │ jane@email.com  │ Reset Your Pass..│ 15 min   │ ✅ Sent│
│  □ │ 💳 Invoice     │ bob@company.com │ Invoice - $299   │ 1 hour   │ ❌ Fail│
│  □ │ ✅ Payment     │ mary@gmail.com  │ Payment Confirmed│ 2 hours  │ ✅ Sent│
│  □ │ 📨 Invitation  │ friend@mail.com │ You're Invited.. │ 3 hours  │ ✅ Sent│
├─────────────────────────────────────────────────────────────────────────┤
│  Showing 1-50 of 1,234                        [< Prev] [1] [2] [3] [>] │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Email Log Detail View

| Task ID | Task | Priority | Effort |
|---------|------|----------|--------|
| 3.2.1 | Create expandable row detail OR modal component | HIGH | Medium |
| 3.2.2 | Display full template data as formatted JSON | HIGH | Low |
| 3.2.3 | Add "Copy JSON" button | MEDIUM | Low |
| 3.2.4 | Add "Resend Email" button with confirmation | MEDIUM | Medium |
| 3.2.5 | Add link to related memorial/user if applicable | MEDIUM | Low |
| 3.2.6 | Show error details for failed emails | HIGH | Low |

#### Detail View UI

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📧 Email Details                                              [✕]      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Type: Enhanced Registration                                            │
│  Status: ✅ Sent                                                        │
│  Sent At: January 29, 2026 at 4:15:32 PM EST                           │
│  SendGrid Message ID: abc123xyz                                         │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Recipient: john@email.com                                              │
│  From: noreply@tributestream.com                                        │
│  Template: d-abc123 (ENHANCED_REGISTRATION)                             │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Related:                                                               │
│  • Memorial: John Smith Memorial [View →]                               │
│  • User: john@email.com [View →]                                        │
│  • Triggered by: registration                                           │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Template Data Sent:                                    [📋 Copy JSON]  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ {                                                                │   │
│  │   "lovedOneName": "John Smith",                                 │   │
│  │   "ownerName": "Jane Smith",                                    │   │
│  │   "memorialUrl": "https://tributestream.com/john-smith",        │   │
│  │   "email": "john@email.com",                                    │   │
│  │   "password": "Te****23!",                                      │   │
│  │   "_passwordLength": 10,                                        │   │
│  │   "magicLink": "https://tributestream.com/magic/...",           │   │
│  │   "_magicLinkIncluded": true,                                   │   │
│  │   "currentYear": 2026                                           │   │
│  │ }                                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐                            │
│  │  🔄 Resend Email │  │  📋 Copy All     │                            │
│  └──────────────────┘  └──────────────────┘                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Integration with Existing Admin Pages

| Task ID | Task | Priority | Effort |
|---------|------|----------|--------|
| 3.3.1 | Add "Email History" section to memorial detail page | MEDIUM | Low |
| 3.3.2 | Add "Email History" section to user detail page | MEDIUM | Low |
| 3.3.3 | Add email logs link to admin sidebar/navigation | HIGH | Low |

---

## Phase 4: Testing & Documentation

### 4.1 Testing

| Task ID | Task | Priority | Effort |
|---------|------|----------|--------|
| 4.1.1 | Unit tests for `emailAudit.ts` functions | MEDIUM | Medium |
| 4.1.2 | Integration tests for API endpoints | MEDIUM | Medium |
| 4.1.3 | E2E test: Registration → Email logged | LOW | Medium |
| 4.1.4 | E2E test: View email in admin panel | LOW | Medium |
| 4.1.5 | E2E test: Resend email functionality | LOW | Medium |

### 4.2 Documentation

| Task ID | Task | Priority | Effort |
|---------|------|----------|--------|
| 4.2.1 | Update `ADMIN_INTERFACE_JOURNEYS.md` with email logs route | HIGH | Low |
| 4.2.2 | Add email audit section to `ProjectOverview.md` | MEDIUM | Low |
| 4.2.3 | Document API endpoints in code comments | MEDIUM | Low |

---

## Implementation Schedule

### Week 1: Core Infrastructure
- [x] **Day 1-2**: Phase 1.1 (Data model & types)
- [x] **Day 3-4**: Phase 1.2 (Audit logging service)
- [x] **Day 5**: Phase 1.3 (Integrate into first 5 email functions)

### Week 2: Complete Integration & API
- [x] **Day 1-2**: Phase 1.3 continued (Remaining 9 email functions)
- [x] **Day 3-4**: Phase 2.1 (API endpoints — list, detail, resend)
- [ ] **Day 5**: Testing & bug fixes

### Week 3: Admin UI
- [x] **Day 1-2**: Phase 3.1 (List page with DataGrid, FilterBuilder, stats, pagination)
- [x] **Day 3**: Phase 3.2 (EmailLogDetail modal — JSON viewer, resend, related links)
- [x] **Day 4**: Phase 3.3.1 (Email logs link in admin sidebar navigation)
- [ ] **Day 4**: Phase 3.3.2-3.3.3 (Integration with memorial/user detail pages — deferred)
- [ ] **Day 5**: Phase 4.2 (Documentation)

### Week 4: Polish & Testing
- [ ] **Day 1-2**: Phase 4.1 (Testing)
- [ ] **Day 3-4**: Bug fixes and polish
- [ ] **Day 5**: Final review and deployment

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/lib/types/email-audit.ts` | TypeScript interfaces |
| `src/lib/server/emailAudit.ts` | Audit logging service |
| `src/routes/api/admin/email-logs/+server.ts` | List API |
| `src/routes/api/admin/email-logs/[id]/+server.ts` | Detail API |
| `src/routes/api/admin/email-logs/[id]/resend/+server.ts` | Resend API |
| `src/routes/admin/system/email-logs/+page.server.ts` | Admin page loader |
| `src/routes/admin/system/email-logs/+page.svelte` | Admin page UI |
| `src/lib/components/admin/EmailLogDetail.svelte` | Detail view component |

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/server/email.ts` | Add audit logging to all 14 email functions |
| `firestore.indexes.json` | Add indexes for email_audit_logs |
| `DevDocs/ADMIN_INTERFACE_JOURNEYS.md` | Document new route |

---

## Success Criteria

1. ✅ Every email sent is logged with full template data
2. ✅ Admins can search and filter email logs
3. ✅ Admins can view exact data that was sent in any email
4. ✅ Admins can resend failed emails
5. ✅ Passwords are masked but verifiable (first/last chars + length)
6. ✅ Performance: List page loads in <2 seconds with 10k+ logs
7. ✅ Dev mode emails are also logged (status: 'mocked')

---

## Security Considerations

1. **Password Handling**: Passwords are partially masked (first 2 + last 2 chars) - enough to verify but not expose
2. **Access Control**: Only admin role can access email logs
3. **Audit of Audits**: Consider logging when admins view sensitive emails
4. **Data Retention**: Consider auto-deleting logs older than 90 days
5. **PII Compliance**: Template data may contain PII - ensure proper access controls

---

## Future Enhancements (Out of Scope)

- [ ] Real-time email delivery status from SendGrid webhooks
- [ ] Email analytics dashboard (open rates, click rates)
- [ ] Template preview before resending
- [ ] Bulk resend functionality
- [ ] Email scheduling/queue management
- [ ] A/B testing for email templates

---

*Document Version: 1.1*  
*Last Updated: February 19, 2026 — Phase 2 (API endpoints) and Phase 3 (Admin UI) implemented*
