# Funeral Director Registration - Magic Link Implementation

## ✅ Implementation Complete

Magic link system has been added to the **Funeral Director Registration Email** that auto-logs families in and takes them directly to the **booking calculator**.

---

## What Was Changed

### 1. Backend Code Updates

#### **File:** `/routes/register/funeral-director/+page.server.ts`
- ✅ Generates Firebase custom token with event context
- ✅ Creates magic link to calculator: `{baseUrl}/auth/session?token={token}&redirect=schedule/{memorialId}`
- ✅ Passes `calculatorMagicLink` to email function

#### **File:** `/lib/server/email.ts`
- ✅ Added `calculatorMagicLink?: string` to `FuneralDirectorRegistrationEmailData` interface
- ✅ Includes `calculatorMagicLink` and `hasCalculatorMagicLink` flag in template data

### 2. SendGrid Template Updates

#### **Template Variables Available:**
```handlebars
{{familyName}}              - Family contact name
{{lovedOneName}}            - Deceased person's name
{{memorialUrl}}             - Event page URL (normal link)
{{email}}                   - User's email
{{password}}                - Generated password (if new user)
{{additionalNotes}}         - Director's notes
{{calculatorMagicLink}}     - Magic link to calculator (ONE-CLICK)
{{hasCalculatorMagicLink}}  - Boolean flag
{{currentYear}}             - Current year
```

#### **What Changed in Template:**

1. **"View Event Page" Button** - Stays as normal link ✅
2. **Social Share Buttons** - Added below event button ✅
   - 📘 Facebook
   - 𝕏 X (Twitter)
   - 🦋 Bluesky
   - 🧵 Threads
   - 📋 Copy URL display
3. **"Complete Service Booking" Button** - Now uses magic link ✅

---

## User Experience Flow

### For Family Members:

```
1. Funeral Director creates event
2. Family receives email
3. Can view event (normal link)
4. Can share on social media (5 platforms)
5. Click "Complete Service Booking" → Magic Link
   ↓
   Auto-authenticated + Lands on Calculator
   ↓
   Fill out service details & pay
```

### Email Structure:
```
┌─────────────────────────────────────┐
│  Sympathy Message                   │
│  Event URL Box                   │
│  [View Event Page] Button        │ ← Normal link
│  [Share: FB|X|Bluesky|Threads|Copy] │ ← NEW social buttons
│  Account Info (email/password)      │
│  Additional Notes (if any)          │
│  [🔒 Complete Service Booking]       │ ← MAGIC LINK to calculator
└─────────────────────────────────────┘
```

---

## Social Share Integration

### Platforms & URLs:

**Facebook:**
```
https://www.facebook.com/sharer/sharer.php?u={{memorialUrl}}
```

**X (Twitter):**
```
https://twitter.com/intent/tweet?url={{memorialUrl}}&text=Event%20for%20{{lovedOneName}}
```

**Bluesky:**
```
https://bsky.app/intent/compose?text=Event%20for%20{{lovedOneName}}%20{{memorialUrl}}
```

**Threads:**
```
https://www.threads.net/intent/post?text=Event%20for%20{{lovedOneName}}%20{{memorialUrl}}
```

**Copy Link:**
- Displays event URL in code block for easy copying

---

## Magic Link Details

### Calculator Magic Link Structure:
```
https://tributestream.com/auth/session?token={FIREBASE_CUSTOM_TOKEN}&redirect=schedule/{MEMORIAL_ID}
```

### Token Properties:
- **Type:** Firebase Custom Token
- **Lifetime:** 1 hour
- **Single use:** Consumed after first authentication
- **Claims included:**
  - `role: 'owner'`
  - `email: {user_email}`
  - `memorial_id: {memorial_id}`

### Authentication Flow:
1. User clicks "Complete Service Booking" button
2. Loads `/auth/session` page with token + redirect params
3. Client-side exchanges custom token for Firebase ID token
4. Creates session cookie via `/api/session`
5. Redirects to calculator at `/schedule/{memorialId}`
6. User authenticated and ready to book

---

## Files Modified

### Backend:
- ✅ `frontend/src/routes/register/funeral-director/+page.server.ts`
- ✅ `frontend/src/lib/server/email.ts`

### Documentation:
- ✅ `SENDGRID_FUNERAL_DIRECTOR_TEMPLATE.html` (new template file)
- ✅ `FUNERAL_DIRECTOR_MAGIC_LINK_SUMMARY.md` (this file)

---

## SendGrid Setup Required

### 1. Copy Template
Copy the contents of `SENDGRID_FUNERAL_DIRECTOR_TEMPLATE.html`

### 2. Update SendGrid
1. Login to SendGrid dashboard
2. Navigate to **Email API** → **Dynamic Templates**
3. Find template ID from: `SENDGRID_TEMPLATE_ENHANCED_REGISTRATION`
4. Edit template
5. Replace HTML with new template
6. **Test with sample data**
7. Save and activate

### 3. Test Variables
Use these test values in SendGrid:
```json
{
  "familyName": "Smith Family",
  "lovedOneName": "John Smith",
  "memorialUrl": "https://tributestream.com/celebration-of-life-for-john-smith",
  "email": "family@example.com",
  "password": "TempPass123!",
  "calculatorMagicLink": "https://tributestream.com/auth/session?token=test&redirect=schedule/abc123",
  "hasCalculatorMagicLink": true,
  "hasAdditionalNotes": false,
  "currentYear": 2025
}
```

---

## Environment Variables

Add to your environment:
```bash
PUBLIC_BASE_URL=https://tributestream.com
```

Or for local development:
```bash
PUBLIC_BASE_URL=http://localhost:5173
```

---

## Testing Checklist

### Development Testing:
- [ ] Create event via funeral director form
- [ ] Check console logs for magic link generation
- [ ] Verify email sent (if SendGrid configured)
- [ ] Test magic link authentication flow
- [ ] Verify landing on calculator page
- [ ] Confirm user has owner permissions

### Production Testing:
- [ ] Update SendGrid template
- [ ] Test with real email address
- [ ] Click "View Event Page" (normal link)
- [ ] Test all social share buttons
- [ ] Click "Complete Service Booking" (magic link)
- [ ] Verify auto-authentication
- [ ] Complete booking flow
- [ ] Verify payment integration works

---

## Benefits Achieved

✅ **Reduced Friction** - One-click access to calculator instead of manual login  
✅ **Higher Conversion** - Families more likely to complete booking immediately  
✅ **Professional UX** - Modern authentication experience  
✅ **Social Amplification** - Easy sharing to 5 major platforms  
✅ **Secure** - Time-limited, single-use tokens  
✅ **Flexible** - Fallback to manual login always available  

---

## Troubleshooting

### Magic Link Not Working:
- Check `PUBLIC_BASE_URL` environment variable
- Verify token hasn't expired (1 hour limit)
- Confirm `/auth/session` route is accessible
- Check browser console for errors

### Social Share Buttons Not Working:
- Verify event URL is public and accessible
- Test URLs in browser before sharing
- Check URL encoding in share links

### Email Not Sending:
- Verify SendGrid API key is configured
- Check template ID is correct
- Review SendGrid activity logs
- Confirm email address is valid

---

## Next Steps

1. ✅ **Code implemented** - Backend ready
2. ⏳ **Update SendGrid template** - Copy new HTML
3. ⏳ **Add environment variable** - Set `PUBLIC_BASE_URL`
4. ⏳ **Test in development** - Verify flow works
5. ⏳ **Deploy to production** - Push changes
6. ⏳ **Monitor metrics** - Track engagement and conversions

---

## Support

**For Family Members:**
- Magic link expired? Use manual login credentials in email
- Social share not working? Copy URL and paste manually
- Need help? Contact support@tributestream.com

**For Developers:**
- Template location: `SENDGRID_FUNERAL_DIRECTOR_TEMPLATE.html`
- Auth flow: `/auth/session/+page.svelte`
- Token generation: `/register/funeral-director/+page.server.ts`
