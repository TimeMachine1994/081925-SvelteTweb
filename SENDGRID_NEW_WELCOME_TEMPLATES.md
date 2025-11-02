# New Welcome Email Templates for Tributestream

## Template 11: Owner Welcome Email

**SendGrid Template Name**: Owner Welcome - Tributestream  
**Subject**: Welcome to Tributestream - Let's Create Your Memorial

**Variables**: `{{displayName}}`, `{{email}}`, `{{currentYear}}`

**Environment Variable**: `SENDGRID_TEMPLATE_OWNER_WELCOME`

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Tributestream</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #D5BA7F 0%, #E5CA8F 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎥 Tributestream</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Welcome to your memorial journey</p>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Welcome to Tributestream, {{displayName}}!</h2>
            <p style="color: #333; line-height: 1.6;">Thank you for creating an account with Tributestream. We're honored to help you create a beautiful and meaningful memorial for your loved one.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D5BA7F;">
                <h3 style="color: #1a1a1a; margin-top: 0;">✨ Your Account Details</h3>
                <p style="margin: 5px 0;"><strong>Email:</strong> {{email}}</p>
                <p style="margin: 15px 0 5px 0; color: #666; font-size: 14px;">You can now log in anytime to manage your memorial.</p>
            </div>

            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                <h3 style="color: #1a1a1a; margin-top: 0;">🌟 Next Steps</h3>
                <ol style="color: #333; line-height: 1.6; margin: 10px 0; padding-left: 20px;">
                    <li><strong>Create your first memorial</strong> - Click the button below to get started</li>
                    <li><strong>Personalize your memorial</strong> - Add photos, videos, and service details</li>
                    <li><strong>Invite family & friends</strong> - Share the memorial with loved ones</li>
                    <li><strong>Go live when ready</strong> - Stream your memorial service to anyone, anywhere</li>
                </ol>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="https://tributestream.com/profile" style="background: linear-gradient(135deg, #D5BA7F 0%, #E5CA8F 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Create Your Memorial</a>
            </div>

            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                <h3 style="color: #1a1a1a; margin-top: 0;">💡 Need Help?</h3>
                <p style="color: #333; line-height: 1.6; margin: 5px 0;">Our support team is here to help you every step of the way:</p>
                <p style="margin: 5px 0;">📧 <a href="mailto:support@tributestream.com" style="color: #D5BA7F; text-decoration: none;">support@tributestream.com</a></p>
                <p style="margin: 5px 0;">📞 <a href="tel:+18008742883" style="color: #D5BA7F; text-decoration: none;">(800) 874-2883</a></p>
                <p style="margin: 15px 0 5px 0; color: #666; font-size: 14px;">Monday - Friday, 9 AM - 6 PM EST</p>
            </div>

            <p style="color: #333; line-height: 1.6;">We're here to help you create a lasting tribute that celebrates the life and legacy of your loved one.</p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">With heartfelt support,<br>The Tributestream Team</p>
            <p style="margin: 10px 0 0 0;">© {{currentYear}} Tributestream - Honoring memories, connecting hearts</p>
        </div>
    </div>
</body>
</html>
```

---

## Template 12: Funeral Director Welcome Email

**SendGrid Template Name**: Funeral Director Welcome - Tributestream  
**Subject**: Welcome to Tributestream - Your Professional Account is Ready

**Variables**: `{{displayName}}`, `{{email}}`, `{{currentYear}}`

**Environment Variable**: `SENDGRID_TEMPLATE_FUNERAL_DIRECTOR_WELCOME`

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Funeral Director</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #D5BA7F 0%, #E5CA8F 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎥 Tributestream</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Professional Account Activated</p>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Welcome to Tributestream, {{displayName}}!</h2>
            <p style="color: #333; line-height: 1.6;">Thank you for joining Tributestream as a funeral director. Your professional account has been created and you're ready to serve families with our comprehensive memorial streaming services.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D5BA7F;">
                <h3 style="color: #1a1a1a; margin-top: 0;">🔐 Your Account Details</h3>
                <p style="margin: 5px 0;"><strong>Email:</strong> {{email}}</p>
                <p style="margin: 5px 0;"><strong>Account Type:</strong> Funeral Director</p>
                <p style="margin: 15px 0 5px 0; color: #666; font-size: 14px;">You now have access to all professional features.</p>
            </div>

            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                <h3 style="color: #1a1a1a; margin-top: 0;">🚀 Complete Your Profile</h3>
                <p style="color: #333; line-height: 1.6; margin: 10px 0;">To start creating family memorials, please complete your funeral home profile with:</p>
                <ul style="color: #333; line-height: 1.6; margin: 10px 0; padding-left: 20px;">
                    <li>Your funeral home name and contact information</li>
                    <li>Service location details</li>
                    <li>Your professional information</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="https://tributestream.com/register/funeral-director" style="background: linear-gradient(135deg, #D5BA7F 0%, #E5CA8F 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Complete Your Profile</a>
            </div>

            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h3 style="color: #1a1a1a; margin-top: 0;">💼 What You Can Do</h3>
                <ul style="color: #333; line-height: 1.6; margin: 10px 0; padding-left: 20px;">
                    <li><strong>Create family memorials</strong> - Quick registration for families you serve</li>
                    <li><strong>Manage multiple services</strong> - Handle all your memorial services in one place</li>
                    <li><strong>Schedule livestreams</strong> - Set up and manage streaming for services</li>
                    <li><strong>Access your dashboard</strong> - View all memorials and upcoming services</li>
                    <li><strong>Professional support</strong> - Priority assistance from our team</li>
                </ul>
            </div>

            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                <h3 style="color: #1a1a1a; margin-top: 0;">📞 Professional Support</h3>
                <p style="color: #333; line-height: 1.6; margin: 5px 0;">As a funeral director partner, you have access to priority support:</p>
                <p style="margin: 5px 0;">📧 <a href="mailto:support@tributestream.com" style="color: #D5BA7F; text-decoration: none;">support@tributestream.com</a></p>
                <p style="margin: 5px 0;">📞 <a href="tel:+18008742883" style="color: #D5BA7F; text-decoration: none;">(800) 874-2883</a></p>
                <p style="margin: 15px 0 5px 0; color: #666; font-size: 14px;">Monday - Friday, 9 AM - 6 PM EST</p>
            </div>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="color: #666; margin: 0; font-size: 14px;">💡 <strong>Pro Tip:</strong> Once your profile is complete, you can create family memorials in just 2 minutes!</p>
            </div>

            <p style="color: #333; line-height: 1.6;">We're excited to partner with you in serving families during their most important moments.</p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Thank you for your partnership,<br>The Tributestream Team</p>
            <p style="margin: 10px 0 0 0;">© {{currentYear}} Tributestream - Honoring memories, connecting hearts</p>
        </div>
    </div>
</body>
</html>
```

---

## 🚀 Setup Instructions

1. **Go to SendGrid**: https://mc.sendgrid.com/dynamic-templates
2. **Create Template 11** - "Owner Welcome - Tributestream"
   - Copy the HTML above into SendGrid's Code Editor
   - Save and note the template ID (starts with `d-`)
3. **Create Template 12** - "Funeral Director Welcome - Tributestream"
   - Copy the HTML above into SendGrid's Code Editor
   - Save and note the template ID (starts with `d-`)
4. **Add to your `.env` file**:
   ```
   SENDGRID_TEMPLATE_OWNER_WELCOME=d-your-template-id-here
   SENDGRID_TEMPLATE_FUNERAL_DIRECTOR_WELCOME=d-your-template-id-here
   ```
5. **Test the templates** using SendGrid's test send feature

## 📧 When These Emails Are Sent

- **Owner Welcome**: Sent automatically after a user registers as an owner
- **Funeral Director Welcome**: Sent automatically after a user registers as a funeral director

Both emails are sent in the background and won't fail the registration if there's an email error.
