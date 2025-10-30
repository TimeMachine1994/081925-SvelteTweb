# Basic Registration Email Template Update

## ✅ Changes Implemented

### 1. Email Service Updates (`frontend/src/lib/server/email.ts`)

#### New Interface Added
```typescript
export interface BasicRegistrationEmailData {
  email: string;
  lovedOneName: string;
  memorialUrl: string;
  familyName: string;
  password?: string; // Optional - only for new users
  additionalNotes?: string;
}
```

#### Updated Function Signature
**Before:**
```typescript
sendRegistrationEmail(email: string, password: string, lovedOneName: string)
```

**After:**
```typescript
sendRegistrationEmail(data: BasicRegistrationEmailData)
```

#### Dynamic Template Data Sent
- `familyName` - Addressee name (e.g., "The Smith Family")
- `lovedOneName` - Deceased person's name
- `memorialUrl` - Full URL to memorial page
- `email` - User's email address
- `password` - Temporary password (empty string if not provided)
- `additionalNotes` - Optional notes from funeral director
- `hasAdditionalNotes` - Boolean flag for conditional display
- `currentYear` - Current year for footer

### 2. Test Endpoint Updated (`frontend/src/routes/api/test-emails/+server.ts`)

Updated to use new function signature with all required fields.

---

## 📧 SendGrid Template Setup

### Template Configuration

**Template Name:** Basic Registration - Memorial Service  
**Template ID:** `d-d343cf774d45400e94fb64f6c7dbef1b` (from your .env.example)  
**Subject Line:** `Memorial Service Information - {{lovedOneName}}`

### Dynamic Variables Required

| Variable | Type | Description | Required |
|----------|------|-------------|----------|
| `familyName` | string | Family name for greeting | ✅ |
| `lovedOneName` | string | Deceased person's name | ✅ |
| `memorialUrl` | string | Link to memorial page | ✅ |
| `email` | string | User's email address | ✅ |
| `password` | string | Temporary password (can be empty) | Optional |
| `additionalNotes` | string | Notes from funeral director | Optional |
| `hasAdditionalNotes` | boolean | Flag to show/hide notes section | Auto |
| `currentYear` | number | Year for copyright | Auto |

### Template Features

1. **Compassionate Greeting** - Addresses family by name
2. **Memorial URL** - Prominent display with CTA button
3. **Conditional Password Display** - Shows only for new users
4. **Account Information Box** - Yellow box with account details
5. **Additional Notes Section** - Green box (conditional)
6. **Pricing Link** - Link to complete pricing breakdown
7. **Professional Footer** - Tributestream branding

---

## 🔧 How to Use

### Example: Send Registration Email

```typescript
import { sendRegistrationEmail } from '$lib/server/email';

await sendRegistrationEmail({
  email: 'family@example.com',
  familyName: 'The Smith Family',
  lovedOneName: 'John Doe',
  memorialUrl: 'https://tributestream.com/john-doe-memorial',
  password: 'TempPass123!', // Include for new users
  additionalNotes: 'Service will begin at 2 PM' // Optional
});
```

### Example: For Existing Users

```typescript
await sendRegistrationEmail({
  email: 'family@example.com',
  familyName: 'The Johnson Family',
  lovedOneName: 'Jane Doe',
  memorialUrl: 'https://tributestream.com/jane-doe-memorial',
  // No password - existing user
  additionalNotes: 'Please arrive 15 minutes early'
});
```

---

## 📋 SendGrid Template HTML

Copy this HTML into your SendGrid template (already formatted for you):

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Memorial Service - Tributestream</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #D5BA7F 0%, #E5CA8F 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎥 Tributestream</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Memorial Service Information</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Dear {{familyName}},</h2>
            
            <p style="color: #333; line-height: 1.6;">
                Tributestream wishes you our deepest sympathy for the passing of your loved one, <strong>{{lovedOneName}}</strong>.
            </p>
            
            <p style="color: #333; line-height: 1.6;">
                We hope that our duty to share the coming memorial will bring greater comfort.
            </p>
            
            <p style="color: #333; line-height: 1.6;">
                Please follow the link below to finish the booking process.
            </p>
            
            <!-- Memorial URL Box -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D5BA7F;">
                <h3 style="color: #1a1a1a; margin-top: 0;">Memorial Livestream Page</h3>
                <p style="color: #666; margin: 5px 0 10px 0; font-size: 14px;">
                    In the meantime, here is a shareable link to the website page that will broadcast the stream:
                </p>
                <p style="margin: 10px 0;">
                    <a href="{{memorialUrl}}" style="color: #D5BA7F; font-weight: bold; text-decoration: none; font-size: 16px;">{{memorialUrl}}</a>
                </p>
            </div>
            
            <p style="color: #333; line-height: 1.6;">
                You will be contacted within 24-48 hours to complete the process.
            </p>
            
            <p style="color: #333; line-height: 1.6;">
                We look forward to meeting you in the near term to offer our personal condolences.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{memorialUrl}}" style="background: linear-gradient(135deg, #D5BA7F 0%, #E5CA8F 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    View Memorial Page
                </a>
            </div>
            
            <!-- Account Information Box -->
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #ffc107;">
                <h3 style="color: #856404; margin-top: 0;">📋 Account Information</h3>
                <p style="color: #856404; margin: 5px 0; font-size: 14px;">
                    <em>This email was sent because a funeral director submitted it on your behalf. You have been automatically registered to an account where you may edit your booking details and pay securely online.</em>
                </p>
                {{#if password}}
                <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <p style="margin: 5px 0;"><strong>Email:</strong> {{email}}</p>
                    <p style="margin: 5px 0;"><strong>Account Password:</strong> <code style="background: #f8f9fa; padding: 2px 6px; border-radius: 3px; font-family: monospace;">{{password}}</code></p>
                </div>
                <p style="color: #856404; margin: 10px 0 0 0; font-size: 13px;">
                    <strong>Important:</strong> Please change your password after logging in for the first time.
                </p>
                {{else}}
                <p style="color: #856404; margin: 15px 0 5px 0;">
                    You may log in to your existing account at <a href="https://tributestream.com/login" style="color: #D5BA7F;">tributestream.com/login</a>
                </p>
                {{/if}}
            </div>
            
            <!-- Additional Notes (if provided) -->
            {{#if hasAdditionalNotes}}
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                <h3 style="color: #1a1a1a; margin-top: 0;">📝 Additional Notes from Funeral Director</h3>
                <div style="color: #333; line-height: 1.6; white-space: pre-wrap;">{{additionalNotes}}</div>
            </div>
            {{/if}}
            
            <!-- Pricing Information Box -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D5BA7F; text-align: center;">
                <h3 style="color: #1a1a1a; margin-top: 0; font-size: 16px;">📋 Complete Service Pricing</h3>
                <p style="color: #666; margin: 10px 0; font-size: 14px;">
                    View our complete pricing breakdown including all packages, add-ons, and payment options.
                </p>
                <a href="https://tributestream.com/pricing-breakdown" style="display: inline-block; margin-top: 10px; color: #D5BA7F; text-decoration: underline; font-weight: 500;">
                    View Complete Pricing Details →
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Respectfully,<br><strong>Tributestream</strong></p>
            <p style="margin: 10px 0 0 0;">© {{currentYear}} Tributestream - Honoring memories, connecting hearts</p>
            <p style="margin: 10px 0 0 0;">
                <a href="https://tributestream.com" style="color: #D5BA7F; text-decoration: none;">tributestream.com</a>
            </p>
        </div>
    </div>
</body>
</html>
```

---

## 🧪 Testing

### Test the Template

1. **Via Test Endpoint:**
   ```bash
   POST /api/test-emails
   {
     "templateType": "basic_registration",
     "testEmail": "your-email@example.com",
     "customData": {
       "familyName": "The Test Family",
       "lovedOneName": "John Test",
       "memorialUrl": "https://tributestream.com/test-memorial",
       "password": "TempPass123!",
       "additionalNotes": "This is a test"
     }
   }
   ```

2. **Via SendGrid Dashboard:**
   - Use SendGrid's "Send Test" feature
   - Input all dynamic variables
   - Verify rendering with and without password
   - Verify conditional additional notes section

---

## 🚀 Deployment Steps

1. ✅ **Code Changes Applied** - All TypeScript changes complete
2. ⏳ **Update SendGrid Template:**
   - Go to: https://mc.sendgrid.com/dynamic-templates
   - Find template ID: `d-d343cf774d45400e94fb64f6c7dbef1b`
   - Edit template → Code Editor
   - Paste the HTML above
   - Update subject line: `Memorial Service Information - {{lovedOneName}}`
   - Save template
3. ⏳ **Test the Template:**
   - Use SendGrid test send feature
   - Test with password field populated
   - Test with password field empty
   - Test with/without additional notes
4. ✅ **Deploy Code** - Push changes to production

---

## 📝 Notes

- **Backwards Compatible:** Function signature changed but all calls updated
- **Template Validation:** Added validation to ensure template is configured
- **Error Handling:** Comprehensive error messages if template missing
- **Click Tracking:** Disabled to prevent URL mangling in memorial links
- **Conditional Rendering:** Smart display of password and notes sections

---

## ✅ Summary

All code changes have been successfully implemented. The `sendRegistrationEmail` function now:
- Accepts a data object with all required fields
- Sends comprehensive template data to SendGrid
- Supports conditional password display
- Includes optional funeral director notes
- Provides proper error handling and validation

Next step: Update the SendGrid template in your dashboard with the HTML provided above.
