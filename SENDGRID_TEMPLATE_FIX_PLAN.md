# SendGrid Dynamic Template System Fix Plan

## Overview
The Tributestream application has a partially implemented SendGrid dynamic template system that needs completion. Currently, the system has template IDs configured but is missing critical code components to function properly.

## Current Issues Identified

### 1. Missing Code Components
- ❌ `SENDGRID_TEMPLATES` object not defined
- ❌ Missing environment variable imports for template IDs
- ❌ Missing TypeScript interfaces: `PaymentEmailData`, `ContactFormData`
- ❌ Inconsistent email implementation (mix of inline HTML and dynamic templates)

### 2. Template Configuration Status
- ✅ 8 SendGrid templates configured in `.env.example`
- ✅ Template IDs appear to be valid (d-xxxxxxxxxx format)
- ⚠️ One placeholder template ID needs replacement: `SENDGRID_TEMPLATE_INVITATION=d-xxxxxxxxxx`

## Step-by-Step Fix Plan

### Step 1: Add Missing Environment Variable Imports
**File**: `/frontend/src/lib/server/email.ts`
**Action**: Add imports for all SendGrid template environment variables

```typescript
import { 
    SENDGRID_API_KEY, 
    FROM_EMAIL,
    SENDGRID_TEMPLATE_ENHANCED_REGISTRATION,
    SENDGRID_TEMPLATE_BASIC_REGISTRATION,
    SENDGRID_TEMPLATE_INVITATION,
    SENDGRID_TEMPLATE_EMAIL_CHANGE,
    SENDGRID_TEMPLATE_PAYMENT_CONFIRMATION,
    SENDGRID_TEMPLATE_PAYMENT_ACTION,
    SENDGRID_TEMPLATE_PAYMENT_FAILURE,
    SENDGRID_TEMPLATE_CONTACT_SUPPORT,
    SENDGRID_TEMPLATE_CONTACT_CONFIRMATION
} from '$env/static/private';
```

### Step 2: Create SENDGRID_TEMPLATES Object
**File**: `/frontend/src/lib/server/email.ts`
**Action**: Define the SENDGRID_TEMPLATES object that maps to environment variables

```typescript
export const SENDGRID_TEMPLATES = {
    ENHANCED_REGISTRATION: SENDGRID_TEMPLATE_ENHANCED_REGISTRATION,
    BASIC_REGISTRATION: SENDGRID_TEMPLATE_BASIC_REGISTRATION,
    INVITATION: SENDGRID_TEMPLATE_INVITATION,
    EMAIL_CHANGE_CONFIRMATION: SENDGRID_TEMPLATE_EMAIL_CHANGE,
    PAYMENT_CONFIRMATION: SENDGRID_TEMPLATE_PAYMENT_CONFIRMATION,
    PAYMENT_ACTION_REQUIRED: SENDGRID_TEMPLATE_PAYMENT_ACTION,
    PAYMENT_FAILURE: SENDGRID_TEMPLATE_PAYMENT_FAILURE,
    CONTACT_FORM_SUPPORT: SENDGRID_TEMPLATE_CONTACT_SUPPORT,
    CONTACT_FORM_CONFIRMATION: SENDGRID_TEMPLATE_CONTACT_CONFIRMATION
};
```

### Step 3: Add Missing TypeScript Interfaces
**File**: `/frontend/src/lib/server/email.ts`
**Action**: Define missing interfaces for email data structures

```typescript
export interface PaymentEmailData {
    memorialId: string;
    paymentIntentId: string;
    customerEmail: string;
    lovedOneName: string;
    amount?: number;
    paymentDate?: Date;
    nextActionUrl?: string;
    failureReason?: string;
}

export interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
    timestamp?: Date;
}
```

### Step 4: Convert Inline HTML Functions to Dynamic Templates
**Files**: `/frontend/src/lib/server/email.ts`
**Action**: Update functions that currently use inline HTML to use dynamic templates

#### Functions to Convert:
1. `sendEnhancedRegistrationEmail()` → Use `SENDGRID_TEMPLATES.ENHANCED_REGISTRATION`
2. `sendRegistrationEmail()` → Use `SENDGRID_TEMPLATES.BASIC_REGISTRATION`  
3. `sendInvitationEmail()` → Use `SENDGRID_TEMPLATES.INVITATION`

### Step 5: Verify Template Data Structure
**Action**: Ensure all dynamic template data matches what's expected in SendGrid templates

#### Template Data Variables Needed:
- **Enhanced Registration**: `lovedOneName`, `ownerName`, `memorialUrl`, `email`, `password`, `currentYear`
- **Basic Registration**: `lovedOneName`, `email`, `password`, `currentYear`
- **Invitation**: `fromName`, `memorialName`, `invitationUrl`, `currentYear`
- **Email Change**: `userName`, `confirmationUrl`, `currentYear`
- **Payment Confirmation**: `lovedOneName`, `paymentIntentId`, `amount`, `paymentDate`, `customerEmail`, `memorialId`, `currentYear`
- **Payment Action**: `lovedOneName`, `paymentIntentId`, `actionDate`, `nextActionUrl`, `fallbackUrl`, `currentYear`
- **Payment Failure**: `lovedOneName`, `paymentIntentId`, `failureReason`, `failureDate`, `retryUrl`, `currentYear`
- **Contact Support**: `name`, `email`, `subject`, `message`, `submittedAt`, `currentYear`
- **Contact Confirmation**: `name`, `subject`, `message`, `submittedAt`, `currentYear`

### Step 6: Update Environment Configuration
**File**: `/frontend/.env` (production environment)
**Action**: Ensure all template IDs are properly set

```bash
# Replace placeholder with actual template ID
SENDGRID_TEMPLATE_INVITATION=d-[actual-template-id]
```

### Step 7: Add Error Handling and Validation
**File**: `/frontend/src/lib/server/email.ts`
**Action**: Add validation for template configuration

```typescript
/**
 * Validate that all required templates are configured
 */
export function validateTemplateConfiguration(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];
    
    Object.entries(SENDGRID_TEMPLATES).forEach(([key, templateId]) => {
        if (!templateId || templateId.startsWith('d-xxxxxxxxxx')) {
            missing.push(key);
        }
    });
    
    return {
        valid: missing.length === 0,
        missing
    };
}
```

### Step 8: Testing and Verification
**Actions**:
1. Test each email function with sample data
2. Verify template IDs are correctly loaded from environment
3. Check SendGrid dashboard for successful email sends
4. Validate email content matches template design

## Implementation Priority

### High Priority (Critical for functionality)
1. ✅ Step 1: Add missing imports
2. ✅ Step 2: Create SENDGRID_TEMPLATES object  
3. ✅ Step 3: Add missing interfaces

### Medium Priority (Consistency and reliability)
4. ✅ Step 4: Convert inline HTML functions
5. ✅ Step 7: Add error handling

### Low Priority (Configuration and testing)
6. ✅ Step 5: Verify template data
7. ✅ Step 6: Update environment config
8. ✅ Step 8: Testing

## Expected Outcomes

After completing these steps:
- ✅ All email functions will use dynamic SendGrid templates
- ✅ Consistent email branding and design
- ✅ Easy template management through SendGrid dashboard
- ✅ Proper TypeScript type safety
- ✅ Better error handling and debugging
- ✅ Scalable email system for future templates

## Files That Will Be Modified

1. `/frontend/src/lib/server/email.ts` - Main email service file
2. `/frontend/.env` - Environment configuration (if needed)

## Dependencies

- `@sendgrid/mail` package (already installed)
- Valid SendGrid API key
- Configured SendGrid dynamic templates in dashboard

## Rollback Plan

If issues arise:
1. Keep backup of current `email.ts` file
2. Can revert to inline HTML approach temporarily
3. Template IDs can be individually disabled by setting to empty string

---

**Next Action**: Begin implementation starting with Step 1 (adding missing imports).
