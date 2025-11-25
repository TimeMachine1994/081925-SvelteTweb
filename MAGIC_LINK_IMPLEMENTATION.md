# Magic Link Implementation for Admin Event Creation

## Overview
When admins create a event, the system now generates a **magic link** that allows family members to access their loved one's event page with **one-click authentication** - no password entry required.

## What Was Implemented

### 1. Backend Changes

#### Admin Create Event API (`/api/admin/create-event/+server.ts`)
- Generates Firebase custom token with user context (role, email, memorial_id)
- Creates magic link URL: `{baseUrl}/auth/session?token={customToken}&fullSlug={fullSlug}`
- Passes magic link to email function

#### Email System (`/lib/server/email.ts`)
- Updated `EnhancedRegistrationEmailData` interface with optional `magicLink` field
- Email function includes `magicLink` and `hasMagicLink` flag in SendGrid template data

### 2. User Experience Flow

#### Before (Manual Login):
1. 📧 Family receives email with password
2. 🔑 Navigate to login page
3. ⌨️ Type email + password
4. 🧭 Navigate to event page
5. ✅ Finally view event

#### After (Magic Link):
1. 📧 Family receives email with magic link button
2. 🎯 **One click** → Auto-authenticated + Lands on event page
3. ✅ Immediately view/edit event

### 3. Security Features

- ✅ **Custom tokens** tied to specific user and event
- ✅ **Single use** - token consumed after authentication
- ✅ **Expires** - Firebase custom tokens expire after 1 hour
- ✅ **Secure** - Token includes user role and event context
- ✅ **Fallback** - Manual login credentials still provided in email

## SendGrid Template Updates Required

### Template Variables Available:
```handlebars
{{lovedOneName}}       - Name of the deceased
{{ownerName}}          - Name of the family contact
{{email}}              - User's email address
{{password}}           - Generated password (backup)
{{magicLink}}          - One-click authentication URL
{{hasMagicLink}}       - Boolean flag (true if magicLink exists)
{{memorialUrl}}        - Direct event page URL
{{memorialSlug}}       - Event slug (without domain)
{{currentYear}}        - Current year
```

### Recommended Email Layout:

```html
<!-- Hero Section -->
<h1>Event Page Created for {{lovedOneName}}</h1>
<p>Hello {{ownerName}},</p>
<p>Your event page for {{lovedOneName}} is ready.</p>

<!-- Primary CTA: Magic Link -->
{{#if hasMagicLink}}
<div style="text-align: center; margin: 40px 0;">
  <a href="{{magicLink}}" 
     style="background: #D5BA7F; 
            color: white; 
            padding: 16px 48px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block;
            font-weight: 600; 
            font-size: 18px;">
    🕊️ View Event Page
  </a>
</div>

<p style="color: #666; font-size: 14px; text-align: center; margin: 20px 0;">
  This secure link will automatically log you in.<br/>
  Link expires in 1 hour for security.
</p>
{{/if}}

<!-- Divider -->
<hr style="margin: 40px 0; border: 1px solid #e5e5e5;" />

<!-- Backup Login Credentials Section -->
<div style="background: #f9f9f9; 
            padding: 24px; 
            border-radius: 8px; 
            margin: 30px 0;">
  <h3 style="margin-top: 0;">Backup Login Credentials</h3>
  <p>You can also login manually using these credentials:</p>
  
  <table style="width: 100%; margin: 20px 0;">
    <tr>
      <td style="font-weight: 600; padding: 8px 0;">Email:</td>
      <td style="padding: 8px 0;">{{email}}</td>
    </tr>
    <tr>
      <td style="font-weight: 600; padding: 8px 0;">Password:</td>
      <td style="padding: 8px 0; font-family: monospace;">{{password}}</td>
    </tr>
  </table>
  
  <a href="https://tributestream.com/login" 
     style="color: #D5BA7F; text-decoration: underline;">
    Login Page →
  </a>
</div>

<!-- What You Can Do Section -->
<div style="margin: 30px 0;">
  <h3>What You Can Do:</h3>
  <ul style="line-height: 1.8;">
    <li>✏️ Edit event content and photos</li>
    <li>📅 Schedule service times</li>
    <li>🎥 Set up livestreaming</li>
    <li>📸 Create photo slideshows</li>
    <li>👥 Invite family members</li>
    <li>💬 Manage condolences</li>
  </ul>
</div>

<!-- Footer -->
<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
  <p style="color: #666; font-size: 14px;">
    Event URL: 
    <a href="{{memorialUrl}}" style="color: #D5BA7F;">
      {{memorialUrl}}
    </a>
  </p>
  <p style="color: #666; font-size: 12px;">
    Need help? Contact us at support@tributestream.com
  </p>
</div>
```

## Configuration Required

### Environment Variables:
Add to your `.env` file:
```bash
PUBLIC_BASE_URL=https://tributestream.com
```

Or for local development:
```bash
PUBLIC_BASE_URL=http://localhost:5173
```

### SendGrid Template:
1. Login to SendGrid dashboard
2. Navigate to Email API → Dynamic Templates
3. Find template: `SENDGRID_TEMPLATE_ENHANCED_REGISTRATION`
4. Edit template and add the magic link HTML above
5. Test with sample data to verify layout
6. Activate template

## Testing

### Local Testing:
```bash
# 1. Set environment variable
PUBLIC_BASE_URL=http://localhost:5173

# 2. Create event via admin portal
POST /api/admin/create-event
{
  "lovedOneName": "Test User",
  "creatorEmail": "test@example.com",
  "creatorName": "Family Member"
}

# 3. Check console logs for magic link generation
# Look for: "🔗 [ADMIN API] Magic link created for event page"

# 4. Check email (if SendGrid configured)
# Or copy magic link from logs and test directly
```

### Production Testing:
1. Create test event via admin portal
2. Use real email address
3. Check email delivery
4. Click magic link button
5. Verify auto-authentication works
6. Verify landing on correct event page
7. Verify user has owner permissions

## Technical Details

### Magic Link Structure:
```
https://tributestream.com/auth/session?token={FIREBASE_CUSTOM_TOKEN}&fullSlug={MEMORIAL_SLUG}
```

### Authentication Flow:
1. User clicks magic link
2. Loads `/auth/session` page with token + fullSlug params
3. Client-side exchanges custom token for Firebase ID token
4. Creates session cookie via `/api/session`
5. Redirects to event page at `/{fullSlug}`
6. User authenticated as event owner

### Token Properties:
- **Type**: Firebase Custom Token
- **Lifetime**: 1 hour
- **Single use**: Token consumed after first authentication
- **Claims included**: 
  - `role: 'owner'`
  - `email: {user_email}`
  - `memorial_id: {memorial_id}`

## Benefits

✅ **Reduced friction** - One-click access instead of 4+ steps  
✅ **Better conversion** - Families more likely to engage immediately  
✅ **Improved UX** - No password typing on mobile devices  
✅ **Professional** - Modern authentication experience  
✅ **Secure** - Time-limited, single-use tokens  
✅ **Flexible** - Fallback to manual login always available  

## Next Steps

1. ✅ **Code implemented** - Backend and email system ready
2. ⏳ **Update SendGrid template** - Add magic link button to email
3. ⏳ **Add environment variable** - Set `PUBLIC_BASE_URL`
4. ⏳ **Test in development** - Verify flow works locally
5. ⏳ **Deploy to production** - Push changes and test live
6. ⏳ **Monitor metrics** - Track click-through rates and engagement

## Support

If family members have issues with the magic link:
- Link expired (> 1 hour old) → Use manual login credentials
- Link not working → Check network/firewall settings
- Already used → Use manual login credentials
- Token invalid → Contact support to regenerate

All users receive backup credentials in the same email for fallback access.
