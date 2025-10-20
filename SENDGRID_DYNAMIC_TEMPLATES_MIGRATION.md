# SendGrid Dynamic Templates Migration Guide

## Overview

This guide will help you migrate from inline HTML email templates to SendGrid Dynamic Templates for better maintainability and easier template management.

## ✅ Completed Changes

### 1. Updated Email Service (`/frontend/src/lib/server/email.ts`)
- ✅ Added dynamic template ID configuration
- ✅ Updated all email functions to use `templateId` and `dynamicTemplateData`
- ✅ Added new payment and contact form email functions
- ✅ Added utility functions for template configuration checking

### 2. Updated API Endpoints
- ✅ `/api/send-confirmation-email/+server.ts` - Payment confirmation emails
- ✅ `/api/send-action-required-email/+server.ts` - Payment action required emails  
- ✅ `/api/send-failure-email/+server.ts` - Payment failure emails
- ✅ `/api/contact/+server.ts` - Contact form emails

### 3. Environment Configuration
- ✅ Updated `.env.example` with SendGrid template ID variables

## 🔄 Next Steps (Manual Setup Required)

### Step 1: Create SendGrid Dynamic Templates

Log into your SendGrid dashboard and create 9 dynamic templates:

#### 1. Enhanced Registration Email
- **Template Name**: "Enhanced Registration - TributeStream"
- **Variables**: `{{lovedOneName}}`, `{{ownerName}}`, `{{memorialUrl}}`, `{{email}}`, `{{password}}`, `{{currentYear}}`
- **Subject**: "Welcome to TributeStream - Memorial for {{lovedOneName}}"

#### 2. Basic Registration Email  
- **Template Name**: "Basic Registration - TributeStream"
- **Variables**: `{{email}}`, `{{password}}`, `{{lovedOneName}}`, `{{currentYear}}`
- **Subject**: "Your TributeStream Account Details"

#### 3. Invitation Email
- **Template Name**: "Memorial Invitation - TributeStream"
- **Variables**: `{{fromName}}`, `{{memorialName}}`, `{{invitationUrl}}`, `{{currentYear}}`
- **Subject**: "An invitation to contribute to the memorial for {{memorialName}}"

#### 4. Email Change Confirmation
- **Template Name**: "Email Change Confirmation - TributeStream"
- **Variables**: `{{userName}}`, `{{confirmationUrl}}`, `{{currentYear}}`
- **Subject**: "Confirm Your Email Change - TributeStream"

#### 5. Payment Confirmation
- **Template Name**: "Payment Confirmation - TributeStream"
- **Variables**: `{{lovedOneName}}`, `{{paymentIntentId}}`, `{{amount}}`, `{{paymentDate}}`, `{{customerEmail}}`, `{{memorialId}}`, `{{currentYear}}`
- **Subject**: "TributeStream Service Confirmation - {{lovedOneName}}"

#### 6. Payment Action Required
- **Template Name**: "Payment Action Required - TributeStream"
- **Variables**: `{{lovedOneName}}`, `{{paymentIntentId}}`, `{{actionDate}}`, `{{nextActionUrl}}`, `{{fallbackUrl}}`, `{{currentYear}}`
- **Subject**: "TributeStream Payment Action Required - {{lovedOneName}}"

#### 7. Payment Failure
- **Template Name**: "Payment Failure - TributeStream"
- **Variables**: `{{lovedOneName}}`, `{{paymentIntentId}}`, `{{failureReason}}`, `{{failureDate}}`, `{{retryUrl}}`, `{{currentYear}}`
- **Subject**: "TributeStream Payment Issue - {{lovedOneName}}"

#### 8. Contact Form Support Notification
- **Template Name**: "Contact Form Support - TributeStream"
- **Variables**: `{{name}}`, `{{email}}`, `{{subject}}`, `{{message}}`, `{{submittedAt}}`, `{{currentYear}}`
- **Subject**: "Contact Form: {{subject}}"

#### 9. Contact Form Customer Confirmation
- **Template Name**: "Contact Form Confirmation - TributeStream"
- **Variables**: `{{name}}`, `{{subject}}`, `{{message}}`, `{{submittedAt}}`, `{{currentYear}}`
- **Subject**: "Thank you for contacting TributeStream"

### Step 2: Update Environment Variables

Add these to your `.env` file (replace with actual template IDs from SendGrid):

```env
# SendGrid Configuration
SENDGRID_API_KEY=your_actual_sendgrid_api_key
FROM_EMAIL=noreply@tributestream.com

# SendGrid Dynamic Template IDs
SENDGRID_TEMPLATE_ENHANCED_REGISTRATION=d-actual-template-id-1
SENDGRID_TEMPLATE_BASIC_REGISTRATION=d-actual-template-id-2
SENDGRID_TEMPLATE_INVITATION=d-actual-template-id-3
SENDGRID_TEMPLATE_EMAIL_CHANGE=d-actual-template-id-4
SENDGRID_TEMPLATE_PAYMENT_CONFIRMATION=d-actual-template-id-5
SENDGRID_TEMPLATE_PAYMENT_ACTION=d-actual-template-id-6
SENDGRID_TEMPLATE_PAYMENT_FAILURE=d-actual-template-id-7
SENDGRID_TEMPLATE_CONTACT_SUPPORT=d-actual-template-id-8
SENDGRID_TEMPLATE_CONTACT_CONFIRMATION=d-actual-template-id-9
```

### Step 3: Design Templates in SendGrid

For each template, use the SendGrid Design Editor to create professional email layouts using your brand colors:

**Brand Colors to Use:**
- Primary Gold: `#D5BA7F`
- Secondary Gold: `#E5CA8F`
- Dark: `#1a1a1a`
- White: `#ffffff`

**Template Structure Recommendations:**
1. Header section with TributeStream branding
2. Main content area with dynamic variables
3. Call-to-action buttons (where applicable)
4. Footer with contact information and branding

### Step 4: Test Templates

Use the utility functions to verify configuration:

```typescript
import { isDynamicTemplatesConfigured, getTemplateIds } from '$lib/server/email';

// Check if all templates are configured
console.log('Templates configured:', isDynamicTemplatesConfigured());

// View all template IDs
console.log('Template IDs:', getTemplateIds());
```

### Step 5: Verify Email Functionality

Test each email type:
1. Create a new memorial (enhanced registration)
2. Invite someone to a memorial (invitation)
3. Submit contact form (contact form emails)
4. Process a payment (payment confirmation)
5. Change email address (email change confirmation)

## 🎯 Benefits of This Migration

### For Developers:
- ✅ Cleaner, more maintainable code
- ✅ Separation of concerns (logic vs presentation)
- ✅ Easier testing and debugging
- ✅ Version control for templates

### For Business Users:
- ✅ Edit templates without code changes
- ✅ A/B testing capabilities
- ✅ Professional template editor
- ✅ Email analytics and tracking
- ✅ Template preview functionality

### For Operations:
- ✅ Faster template updates
- ✅ No deployment required for template changes
- ✅ Better email deliverability
- ✅ Centralized template management

## 🔧 Debugging

If emails aren't sending:

1. **Check Template IDs**: Verify all template IDs are correct in environment variables
2. **Check SendGrid API Key**: Ensure API key has proper permissions
3. **Check Console Logs**: Look for SendGrid error messages
4. **Test Individual Templates**: Use SendGrid's test send feature

## 📚 Additional Resources

- [SendGrid Dynamic Templates Documentation](https://docs.sendgrid.com/ui/sending-email/how-to-send-an-email-with-dynamic-transactional-templates)
- [SendGrid Template Editor Guide](https://docs.sendgrid.com/ui/sending-email/editor)
- [SendGrid API Reference](https://docs.sendgrid.com/api-reference/mail-send/mail-send)

## 🚀 Rollback Plan

If you need to rollback, the old inline HTML templates are preserved in git history. You can:

1. Revert the email service changes
2. Restore the old API endpoint implementations
3. Remove the dynamic template environment variables

However, the new system is much more maintainable and should be preferred for production use.
