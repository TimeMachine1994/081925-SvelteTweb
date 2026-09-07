# Email Audit System Documentation

**Version:** 1.0  
**Created:** January 29, 2026  
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [Email Types](#email-types)
5. [Admin UI](#admin-ui)
6. [API Reference](#api-reference)
7. [Security & Privacy](#security--privacy)
8. [Development Guide](#development-guide)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Email Audit System provides complete visibility into all emails sent from the Tributestream application. Every email is logged to Firestore with full template data, allowing admins to:

- **Verify** correct information was sent to users
- **Debug** email delivery issues
- **Resend** emails when needed
- **Track** email patterns and failures
- **Audit** system email activity

### Key Features

| Feature | Description |
|---------|-------------|
| **Comprehensive Logging** | All 14+ email types tracked |
| **Template Data Storage** | Full JSON of what was sent |
| **Sensitive Data Masking** | Passwords/tokens partially masked |
| **Status Tracking** | Sent, Failed, or Mocked (dev) |
| **Resend Capability** | One-click email resend |
| **Environment Awareness** | Production vs Development tracking |
| **Admin UI** | Full-featured management interface |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Email Flow                                   │
└─────────────────────────────────────────────────────────────────┘

  Application Code
        │
        ▼
  ┌─────────────────────┐
  │   email.ts          │  ← Email sending functions
  │   (14 functions)    │
  └─────────────────────┘
        │
        ├────────────────────────────────┐
        ▼                                ▼
  ┌─────────────────────┐    ┌─────────────────────┐
  │   SendGrid API      │    │   emailAudit.ts     │
  │   (Actual Send)     │    │   (Audit Logging)   │
  └─────────────────────┘    └─────────────────────┘
                                      │
                                      ▼
                             ┌─────────────────────┐
                             │   Firestore         │
                             │   email_audit_logs  │
                             └─────────────────────┘
                                      │
                                      ▼
                             ┌─────────────────────┐
                             │   Admin UI          │
                             │   /admin/system/    │
                             │   email-logs        │
                             └─────────────────────┘
```

### File Structure

```
frontend/src/
├── lib/
│   ├── types/
│   │   └── email-audit.ts          # TypeScript interfaces
│   └── server/
│       ├── email.ts                # Email sending (modified)
│       └── emailAudit.ts           # Audit logging service
└── routes/
    ├── api/admin/email-logs/
    │   ├── +server.ts              # GET list
    │   └── [id]/
    │       ├── +server.ts          # GET detail
    │       └── resend/
    │           └── +server.ts      # POST resend
    └── admin/system/email-logs/
        ├── +page.server.ts         # Auth guard
        └── +page.svelte            # UI component
```

---

## Data Model

### Firestore Collection: `email_audit_logs`

Each document represents one email sent (or attempted).

```typescript
interface EmailAuditLog {
  // Identification
  id: string;                    // Firestore document ID
  type: EmailType;               // Email type (see below)
  
  // Template Info
  templateId?: string;           // SendGrid template ID
  templateName?: string;         // Human-readable name
  
  // Recipients
  to: string;                    // Primary recipient
  cc?: string[];                 // CC recipients
  from: string;                  // Sender address
  
  // Content
  subject?: string;              // Email subject
  templateData: Record<string, unknown>;  // Full template variables
  
  // Timing
  sentAt: Date;                  // When sent/attempted
  
  // Context
  triggeredBy: string;           // What triggered it
  triggeredByUserId?: string;    // User who triggered
  triggeredByAdminId?: string;   // Admin who triggered (resends)
  
  // Related Entities
  memorialId?: string;           // Related memorial
  userId?: string;               // Related user
  invoiceId?: string;            // Related invoice
  streamId?: string;             // Related stream
  
  // Status
  status: 'sent' | 'failed' | 'mocked';
  error?: string;                // Error message if failed
  sendgridMessageId?: string;    // SendGrid tracking ID
  
  // Metadata
  environment: 'production' | 'development' | 'test';
}
```

### Sample Document

```json
{
  "type": "enhanced_registration",
  "to": "newuser@example.com",
  "from": "noreply@tributestream.com",
  "templateId": "d-abc123def456",
  "templateName": "ENHANCED_REGISTRATION",
  "templateData": {
    "lovedOneName": "John Smith",
    "ownerName": "Jane Smith",
    "memorialUrl": "https://tributestream.com/john-smith-memorial",
    "email": "newuser@example.com",
    "password": "Te****23!",
    "_passwordLength": 10,
    "magicLink": "https://tributestream.com/magic?token=***MASKED***",
    "_magicLinkIncluded": true
  },
  "sentAt": "2026-01-29T21:45:00.000Z",
  "triggeredBy": "registration",
  "memorialId": "memorial_abc123",
  "userId": "user_xyz789",
  "status": "sent",
  "sendgridMessageId": "sg_msg_123456",
  "environment": "production"
}
```

---

## Email Types

| Type | Template Name | Trigger |
|------|---------------|---------|
| `enhanced_registration` | ENHANCED_REGISTRATION | New user with memorial |
| `basic_registration` | BASIC_REGISTRATION | Basic registration |
| `funeral_director_registration` | FD_REGISTRATION | FD creates memorial |
| `invitation` | INVITATION | User invites someone |
| `email_change_confirmation` | EMAIL_CHANGE | User changes email |
| `payment_confirmation` | PAYMENT_CONFIRMATION | Payment successful |
| `payment_action_required` | PAYMENT_ACTION | Payment needs action |
| `payment_failure` | PAYMENT_FAILURE | Payment failed |
| `password_reset` | PASSWORD_RESET | Password reset request |
| `owner_welcome` | OWNER_WELCOME | Owner welcome |
| `funeral_director_welcome` | FD_WELCOME | FD welcome |
| `contact_form_support` | CONTACT_SUPPORT | Contact form (to support) |
| `contact_form_confirmation` | CONTACT_CONFIRMATION | Contact form (to user) |
| `invoice` | N/A (HTML) | Invoice sent |
| `invoice_receipt` | N/A (HTML) | Invoice paid |

---

## Admin UI

### Access

**URL:** `/admin/system/email-logs`  
**Requires:** Admin role

### List View

The main page displays a paginated table with:

| Column | Description |
|--------|-------------|
| Type | Email type with icon |
| To | Recipient email |
| Sent At | Timestamp |
| Status | Sent/Failed/Mocked badge |
| Environment | Production/Development |
| Actions | View button |

### Filters

- **Type Filter**: Dropdown of all email types
- **Status Filter**: Sent, Failed, Mocked
- **Search**: Search by recipient email
- **Pagination**: 50 per page with Next/Previous

### Detail Modal

Click any row to open the detail modal showing:

- Full recipient/sender info
- Template name and ID
- Related entities (with links to memorials)
- Complete template data as JSON
- Error message (if failed)
- SendGrid message ID
- **Copy JSON** button
- **Resend Email** button

### Resend Feature

1. Open email detail modal
2. Click "Resend Email"
3. Email is resent using stored template data
4. New audit log entry created
5. Success/failure message displayed

---

## API Reference

### GET `/api/admin/email-logs`

List email logs with pagination and filters.

**Authentication:** Admin only

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page (max 100) |
| `type` | EmailType | - | Filter by email type |
| `status` | EmailStatus | - | Filter by status |
| `search` | string | - | Search recipient email |
| `memorialId` | string | - | Filter by memorial |
| `startDate` | ISO string | - | Start of date range |
| `endDate` | ISO string | - | End of date range |

**Response:**

```json
{
  "logs": [
    {
      "id": "abc123",
      "type": "enhanced_registration",
      "to": "user@example.com",
      "sentAt": "2026-01-29T21:45:00.000Z",
      "status": "sent",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "hasMore": true
  }
}
```

---

### GET `/api/admin/email-logs/[id]`

Get a single email log by ID.

**Authentication:** Admin only

**Response:**

```json
{
  "log": {
    "id": "abc123",
    "type": "enhanced_registration",
    "to": "user@example.com",
    "templateData": { ... },
    ...
  }
}
```

---

### POST `/api/admin/email-logs/[id]/resend`

Resend an email using stored template data.

**Authentication:** Admin only

**Request Body (optional):**

```json
{
  "overrideEmail": "different@email.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Email resent successfully to user@example.com",
  "originalLogId": "abc123",
  "resentTo": "user@example.com"
}
```

---

## Security & Privacy

### Sensitive Data Masking

The system automatically masks sensitive data before storing:

| Data Type | Masking Method | Example |
|-----------|----------------|---------|
| Passwords | Show first 2 + last 2 chars | `Te****23!` |
| Magic Links | Mask token parameter | `...?token=***MASKED***` |
| Reset Links | Mask token parameter | `...?token=***MASKED***` |
| Confirmation URLs | Mask token parameter | `...?token=***MASKED***` |

Additional metadata is preserved:
- `_passwordLength`: Original password length
- `_magicLinkIncluded`: Boolean flag
- `_resetLinkIncluded`: Boolean flag

### Access Control

- All API endpoints require admin role
- UI page is protected by server-side auth check
- Firestore rules should restrict `email_audit_logs` to admin access

### Audit Trail

- Resends create new log entries
- `triggeredByAdminId` tracks who resent
- Original log is preserved

---

## Development Guide

### Adding Audit Logging to a New Email Function

1. Import the logging functions:

```typescript
import { logEmailSent, logEmailFailed, logEmailMocked, buildLogParams } from './emailAudit';
import type { EmailType } from '$lib/types/email-audit';
```

2. Build log params at the start of the function:

```typescript
const templateData = {
  // ... your template variables
};

const logParams = buildLogParams(
  'your_email_type' as EmailType,
  recipientEmail,
  templateData,
  {
    templateId: SENDGRID_TEMPLATES.YOUR_TEMPLATE,
    templateName: 'YOUR_TEMPLATE',
    triggeredBy: 'your_trigger',
    memorialId: context?.memorialId,
    userId: context?.userId
  }
);
```

3. Log mocked emails in dev mode:

```typescript
if (shouldMockEmails()) {
  // ... console logging ...
  await logEmailMocked(logParams);
  return;
}
```

4. Log sent emails after success:

```typescript
try {
  const [response] = await sgMail.send(msg);
  const messageId = response?.headers?.['x-message-id'];
  await logEmailSent(logParams, messageId);
} catch (error) {
  await logEmailFailed(logParams, error as Error);
  throw error;
}
```

### Adding a New Email Type

1. Add to `EmailType` union in `src/lib/types/email-audit.ts`:

```typescript
export type EmailType = 
  | 'existing_type'
  | 'your_new_type';  // Add here
```

2. Add to the resend switch statement in `api/admin/email-logs/[id]/resend/+server.ts`

3. Add to `EMAIL_TYPES` array in the UI component for proper labeling

---

## Troubleshooting

### Logs Not Appearing

1. **Check Firestore connection**: Verify `adminDb` is properly initialized
2. **Check for errors**: Look for `[EMAIL AUDIT] Failed to log` in server logs
3. **Verify environment**: Mocked emails still log with `status: 'mocked'`

### Resend Not Working

1. **Check template data**: Some fields may be masked or missing
2. **Password warning**: Resent registration emails show `PASSWORD_NOT_STORED` if password was masked
3. **Check email type**: Ensure the type is handled in the resend switch

### Performance Considerations

- Logs are ordered by `sentAt DESC` for efficient recent queries
- Consider adding Firestore indexes for common filter combinations
- Large date ranges may be slow - encourage specific filters

### Recommended Firestore Indexes

Add to `firestore.indexes.json`:

```json
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
```

---

## Changelog

### v1.0 (January 29, 2026)

- Initial implementation
- Support for all 14 email types
- Admin UI with list, detail, and resend
- API endpoints for programmatic access
- Sensitive data masking
- Full documentation

---

*End of Documentation*
