# Funeral Director Registration Email Template

**IMPORTANT:** This updates your **existing** `SENDGRID_TEMPLATE_ENHANCED_REGISTRATION` template  
**Template ID Variable**: `SENDGRID_TEMPLATE_ENHANCED_REGISTRATION` (d-10efa11389054692a7dc7d24372f5a49)  
**Subject**: `Memorial Service for {{lovedOneName}} - Tributestream`

## Update your existing Enhanced Registration template with this HTML:

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

## Template Variables Used:

- `{{familyName}}` - Family contact name or "Family"
- `{{lovedOneName}}` - Name of deceased person
- `{{memorialUrl}}` - Full URL to memorial page (https://tributestream.com/slug)
- `{{memorialSlug}}` - Just the slug part of the URL
- `{{email}}` - Family contact email
- `{{password}}` - Account password (only shown for new users)
- `{{additionalNotes}}` - Optional notes from funeral director
- `{{hasAdditionalNotes}}` - Boolean to show/hide notes section
- `{{currentYear}}` - Current year for copyright

## Setup Instructions:

1. **Go to SendGrid**: https://mc.sendgrid.com/dynamic-templates
2. **Create New Template**: Click "Create a Dynamic Template"
3. **Name it**: "Funeral Director Registration"
4. **Add Version**: Click "Add Version" → Choose "Code Editor"
5. **Paste HTML**: Copy the HTML above into the editor
6. **Set Subject**: Use `Memorial Service for {{lovedOneName}} - Tributestream`
7. **Save**: Note the template ID (starts with `d-`)
8. **Update .env**: Add the template ID to `SENDGRID_TEMPLATE_FUNERAL_DIRECTOR_REGISTRATION`

## Key Features:

✅ **Professional sympathy message** with respectful tone  
✅ **Memorial URL prominently displayed** for easy access  
✅ **Account credentials included** (password only for new users)  
✅ **Additional notes section** (shows only if director provided notes)  
✅ **Clear next steps** (24-48 hour follow-up mentioned)  
✅ **Conditional password display** using Handlebars `{{#if}}`  
✅ **Mobile-responsive** design  
✅ **Brand colors** (#D5BA7F gold accent)
