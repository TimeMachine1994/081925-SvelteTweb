# Tributestream SendGrid Templates - Copy & Paste Ready

## Template 1:  

**SendGrid Template Name**: Enhanced Registration - Tributestream  
**Subject**: Welcome to Tributestream - Memorial for {{lovedOneName}}

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
                <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Welcome to your memorial</p>
            </div>
            <div style="padding: 30px;">
                <h2 style="color: #1a1a1a; margin-top: 0;">Welcome to Tributestream for {{lovedOneName}}</h2>
                <p style="color: #333; line-height: 1.6;">Hello {{ownerName}},</p>
                <p style="color: #333; line-height: 1.6;">Thank you for choosing Tributestream to honor the memory of {{lovedOneName}}. Your dedicated memorial page is now ready.</p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D5BA7F;">
                    <h3 style="color: #1a1a1a; margin-top: 0;">Your Memorial Details</h3>
                    <p style="margin: 5px 0;"><strong>Memorial URL:</strong></p>
                    <p style="margin: 5px 0;"><a href="{{memorialUrl}}" style="color: #D5BA7F; text-decoration: none;">{{memorialUrl}}</a></p>
                    <h4 style="color: #1a1a1a; margin: 20px 0 10px 0;">Login Credentials</h4>
                    <p style="margin: 5px 0;"><strong>Email:</strong> {{email}}</p>
                    <p style="margin: 5px 0;"><strong>Temporary Password:</strong> {{password}}</p>
                </div>
                <p style="color: #666; line-height: 1.6; font-size: 14px;"><strong>Important:</strong> We recommend changing your password after you log in for the first time.</p>
                <p style="color: #333; line-height: 1.6;">From your portal, you can invite family and friends to contribute photos and memories.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{{memorialUrl}}" style="background: linear-gradient(135deg, #D5BA7F 0%, #E5CA8F 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Memorial</a>
                </div>
            </div>
            <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
                <p style="margin: 0;">Sincerely,<br>The Tributestream Team</p>
                <p style="margin: 10px 0 0 0;">© {{currentYear}} Tributestream - Honoring memories, connecting hearts</p>
            </div>
        </div>
    </body>
    </html>
```

## Template 2: Basic Registration Email

**SendGrid Template Name**: Basic Registration - Tributestream  
**Subject**: Your Tributestream Account Details

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Tributestream Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #D5BA7F 0%, #E5CA8F 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎥 Tributestream</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your account is ready</p>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Welcome to Tributestream</h2>
            <p style="color: #333; line-height: 1.6;">An account has been created for you to manage the memorial for <strong>{{lovedOneName}}</strong>.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D5BA7F;">
                <h3 style="color: #1a1a1a; margin-top: 0;">Login Credentials</h3>
                <p style="margin: 5px 0;"><strong>Email:</strong> {{email}}</p>
                <p style="margin: 5px 0;"><strong>Temporary Password:</strong> {{password}}</p>
            </div>
            <p style="color: #666; line-height: 1.6; font-size: 14px;"><strong>Important:</strong> We recommend changing your password after you log in for the first time.</p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Sincerely,<br>The Tributestream Team</p>
            <p style="margin: 10px 0 0 0;">© {{currentYear}} Tributestream - Honoring memories, connecting hearts</p>
        </div>
    </div>
</body>
</html>
```

## Template 3: Memorial Invitation Email

**SendGrid Template Name**: Memorial Invitation - Tributestream  
**Subject**: An invitation to contribute to the memorial for {{memorialName}}

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Memorial Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #D5BA7F 0%, #E5CA8F 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎥 Tributestream</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">You're invited to contribute</p>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">You're Invited to Contribute</h2>
            <p style="color: #333; line-height: 1.6;">Hello,</p>
            <p style="color: #333; line-height: 1.6;">{{fromName}} has invited you to contribute to the online memorial for <strong>{{memorialName}}</strong>.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D5BA7F;">
                <h3 style="color: #1a1a1a; margin-top: 0;">How to Contribute</h3>
                <ul style="color: #333; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li>Share photos and memories</li>
                    <li>View service details</li>
                    <li>Connect with other family and friends</li>
                    <li>Leave messages of support</li>
                </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{invitationUrl}}" style="background: linear-gradient(135deg, #D5BA7F 0%, #E5CA8F 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Accept Invitation</a>
            </div>
            <p style="color: #333; line-height: 1.6;">Thank you for helping to create a beautiful tribute.</p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Sincerely,<br>The Tributestream Team</p>
            <p style="margin: 10px 0 0 0;">© {{currentYear}} Tributestream - Honoring memories, connecting hearts</p>
        </div>
    </div>
</body>
</html>
```

## Template 4: Email Change Confirmation

**SendGrid Template Name**: Email Change Confirmation - Tributestream  
**Subject**: Confirm Your Email Change - Tributestream

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Email Change</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #D5BA7F 0%, #E5CA8F 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎥 Tributestream</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Confirm your email change</p>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Confirm Your Email Change</h2>
            <p style="color: #333; line-height: 1.6;">Hello {{userName}},</p>
            <p style="color: #333; line-height: 1.6;">You requested to change your email address on your Tributestream account.</p>
            <p style="color: #333; line-height: 1.6;">Please click the button below to confirm this change:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{confirmationUrl}}" style="background: linear-gradient(135deg, #D5BA7F 0%, #E5CA8F 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Confirm Email Change</a>
            </div>
            <div style="background: #fff3cd; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <p style="margin: 0; font-size: 14px; color: #856404;"><strong>Important:</strong> This link will expire in 24 hours. If you didn't request this change, please ignore this email and your account will remain unchanged.</p>
            </div>
            <p style="color: #666; line-height: 1.6; font-size: 14px;">If the button doesn't work, you can copy and paste this link into your browser:<br><a href="{{confirmationUrl}}" style="color: #D5BA7F; word-break: break-all;">{{confirmationUrl}}</a></p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Sincerely,<br>The Tributestream Team</p>
            <p style="margin: 10px 0 0 0;">© {{currentYear}} Tributestream - Honoring memories, connecting hearts</p>
        </div>
    </div>
</body>
</html>
```

## Template 5: Payment Confirmation

**SendGrid Template Name**: Payment Confirmation - Tributestream  
**Subject**: Tributestream Service Confirmation - {{lovedOneName}}

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #D5BA7F 0%, #E5CA8F 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎥 Tributestream</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Service Confirmation</p>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Payment Confirmed</h2>
            <p style="color: #333; line-height: 1.6;">Dear Customer,</p>
            <p style="color: #333; line-height: 1.6;">Thank you for choosing Tributestream! Your payment has been successfully processed and your memorial service for <strong>{{lovedOneName}}</strong> has been confirmed.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D5BA7F;">
                <h3 style="color: #1a1a1a; margin-top: 0;">📋 Payment Details</h3>
                <p style="margin: 5px 0;"><strong>Memorial:</strong> {{lovedOneName}}</p>
                <p style="margin: 5px 0;"><strong>Payment ID:</strong> {{paymentIntentId}}</p>
                <p style="margin: 5px 0;"><strong>Payment Date:</strong> {{paymentDate}}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> {{customerEmail}}</p>
                <p style="margin: 15px 0 5px 0; font-size: 18px; font-weight: bold; color: #D5BA7F;">Total Paid: ${{amount}}</p>
            </div>
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                <h3 style="color: #1a1a1a; margin-top: 0;">📅 What's Next?</h3>
                <ul style="color: #333; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li>Your memorial service schedule has been confirmed</li>
                    <li>Our team will contact you within 24 hours to coordinate service details</li>
                    <li>You can access your booking anytime in your Tributestream portal</li>
                    <li>We'll send additional information about your service setup closer to the date</li>
                </ul>
            </div>
            <p style="color: #333; line-height: 1.6;">If you have any questions, please don't hesitate to contact our support team at support@tributestream.com or (555) 123-4567.</p>
            <p style="color: #333; line-height: 1.6;">Thank you for trusting us with your memorial service.</p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Warm regards,<br>The Tributestream Team</p>
            <p style="margin: 10px 0 0 0;">© {{currentYear}} Tributestream - Honoring Lives, Connecting Hearts</p>
        </div>
    </div>
</body>
</html>
```

## Template 6: Payment Action Required

**SendGrid Template Name**: Payment Action Required - Tributestream  
**Subject**: Tributestream Payment Action Required - {{lovedOneName}}

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Action Required</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎥 Tributestream</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Payment Action Required</p>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Action Required</h2>
            <p style="color: #333; line-height: 1.6;">Dear Customer,</p>
            <p style="color: #333; line-height: 1.6;">Your payment for the memorial service for <strong>{{lovedOneName}}</strong> requires additional verification or action from you.</p>
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <h3 style="color: #1a1a1a; margin-top: 0;">⚠️ Action Required</h3>
                <p style="margin: 5px 0;"><strong>Memorial:</strong> {{lovedOneName}}</p>
                <p style="margin: 5px 0;"><strong>Payment ID:</strong> {{paymentIntentId}}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> {{actionDate}}</p>
                <p style="margin: 15px 0 5px 0;">Your bank or payment provider requires additional verification to complete this transaction.</p>
            </div>
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                <h3 style="color: #1a1a1a; margin-top: 0;">🔐 Complete Your Payment</h3>
                <p style="color: #333; line-height: 1.6;">To complete your payment and confirm your memorial service, please:</p>
                <ol style="color: #333; line-height: 1.6; margin: 10px 0; padding-left: 20px;">
                    <li>Click the button below to complete the verification process</li>
                    <li>Follow the instructions from your bank or payment provider</li>
                    <li>Complete any required authentication steps</li>
                </ol>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="{{nextActionUrl}}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Complete Payment Verification</a>
                </div>
            </div>
            <p style="color: #dc2626; line-height: 1.6; font-weight: bold;">Important: Your memorial service reservation is held for 24 hours while you complete this verification. Please complete the process as soon as possible to secure your booking.</p>
            <p style="color: #333; line-height: 1.6;">If you need assistance or have questions about this verification process, please contact our support team at support@tributestream.com or (555) 123-4567.</p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Best regards,<br>The Tributestream Team</p>
            <p style="margin: 10px 0 0 0;">© {{currentYear}} Tributestream - Honoring Lives, Connecting Hearts</p>
        </div>
    </div>
</body>
</html>
```

## Template 7: Payment Failure

**SendGrid Template Name**: Payment Failure - Tributestream  
**Subject**: Tributestream Payment Issue - {{lovedOneName}}

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Issue</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎥 Tributestream</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Payment Issue</p>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Payment Issue</h2>
            <p style="color: #333; line-height: 1.6;">Dear Customer,</p>
            <p style="color: #333; line-height: 1.6;">We encountered an issue processing your payment for the memorial service for <strong>{{lovedOneName}}</strong>.</p>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <h3 style="color: #1a1a1a; margin-top: 0;">❌ Payment Failed</h3>
                <p style="margin: 5px 0;"><strong>Memorial:</strong> {{lovedOneName}}</p>
                <p style="margin: 5px 0;"><strong>Payment ID:</strong> {{paymentIntentId}}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> {{failureDate}}</p>
                <p style="margin: 15px 0 5px 0;"><strong>Reason:</strong> {{failureReason}}</p>
            </div>
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                <h3 style="color: #1a1a1a; margin-top: 0;">🔄 Next Steps</h3>
                <p style="color: #333; line-height: 1.6;">Don't worry - your memorial service reservation is still held for 24 hours. Please try one of the following:</p>
                <ul style="color: #333; line-height: 1.6; margin: 10px 0; padding-left: 20px;">
                    <li>Check that your payment method has sufficient funds</li>
                    <li>Verify your card details are correct</li>
                    <li>Try a different payment method</li>
                    <li>Contact your bank if the issue persists</li>
                </ul>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="{{retryUrl}}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Retry Payment</a>
                </div>
            </div>
            <p style="color: #333; line-height: 1.6;">If you continue to experience issues, please contact our support team at support@tributestream.com or (555) 123-4567. We're here to help ensure your memorial service goes smoothly.</p>
            <p style="color: #333; line-height: 1.6;">Thank you for your patience.</p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Best regards,<br>The Tributestream Team</p>
            <p style="margin: 10px 0 0 0;">© {{currentYear}} Tributestream - Honoring Lives, Connecting Hearts</p>
        </div>
    </div>
</body>
</html>
```

## Template 8: Contact Form Support Notification

**SendGrid Template Name**: Contact Form Support - Tributestream  
**Subject**: Contact Form: {{subject}}

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #D5BA7F 0%, #E5CA8F 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎥 Tributestream</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">New Contact Form Submission</p>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">New Contact Form Submission</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D5BA7F;">
                <h3 style="color: #1a1a1a; margin-top: 0;">Contact Details</h3>
                <p style="margin: 5px 0;"><strong>Name:</strong> {{name}}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> {{email}}</p>
                <p style="margin: 5px 0;"><strong>Subject:</strong> {{subject}}</p>
                <p style="margin: 15px 0 5px 0;"><strong>Submitted:</strong> {{submittedAt}}</p>
            </div>
            <div style="background: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D5BA7F; border: 1px solid #e9ecef;">
                <h3 style="color: #1a1a1a; margin-top: 0;">Message</h3>
                <div style="color: #333; line-height: 1.6; white-space: pre-wrap;">{{message}}</div>
            </div>
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404;"><strong>Reply to:</strong> {{email}}<br><strong>Priority:</strong> Please respond within 24 hours</p>
            </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Tributestream Support System</p>
            <p style="margin: 10px 0 0 0;">© {{currentYear}} Tributestream - Honoring memories, connecting hearts</p>
        </div>
    </div>
</body>
</html>
```

## Template 9: Contact Form Customer Confirmation

**SendGrid Template Name**: Contact Form Confirmation - Tributestream  
**Subject**: Thank you for contacting Tributestream

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You for Contacting Us</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #D5BA7F 0%, #E5CA8F 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎥 Tributestream</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Thank you for reaching out</p>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Hi {{name}},</h2>
            <p style="color: #333; line-height: 1.6;">Thank you for contacting us. We've received your message and will get back to you within 24 hours.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D5BA7F;">
                <h3 style="color: #1a1a1a; margin-top: 0;">Your Message Summary</h3>
                <p style="margin: 5px 0;"><strong>Subject:</strong> {{subject}}</p>
                <p style="margin: 15px 0 5px 0;"><strong>Message:</strong></p>
                <div style="background: white; padding: 15px; border-left: 4px solid #D5BA7F; margin: 10px 0; color: #333; line-height: 1.6; white-space: pre-wrap;">{{message}}</div>
                <p style="color: #666; font-size: 14px; margin: 15px 0 0 0;"><strong>Submitted:</strong> {{submittedAt}}</p>
            </div>
            <p style="color: #333; line-height: 1.6;">If you need immediate assistance, please call us at <strong>1-800-TRIBUTE</strong> (Monday - Friday, 9 AM - 6 PM EST).</p>
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404;"><strong>Need to create a memorial?</strong><br><a href="https://tributestream.com/register/loved-one" style="color: #D5BA7F; text-decoration: none; font-weight: bold;">Start creating a memorial →</a></p>
            </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Sincerely,<br>The Tributestream Team</p>
            <p style="margin: 10px 0 0 0;">Tributestream - Honoring memories, connecting hearts<br><a href="https://tributestream.com" style="color: #D5BA7F;">tributestream.com</a></p>
            <p style="margin: 10px 0 0 0;">© {{currentYear}} Tributestream</p>
        </div>
    </div>
</body>
</html>
```

---

## 🚀 Quick Setup Guide

1. **Go to SendGrid**: https://mc.sendgrid.com/dynamic-templates
2. **Create 9 templates** using the names above
3. **Copy & paste** each HTML code into SendGrid's Code Editor
4. **Save each template** and note the template ID (starts with `d-`)
5. **Add template IDs** to your `.env` file
6. **Test templates** using SendGrid's test send feature

All templates are mobile-responsive and use your Tributestream gold branding (#D5BA7F)!
