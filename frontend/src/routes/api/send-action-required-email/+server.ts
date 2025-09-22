import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sgMail from '@sendgrid/mail';
import { SENDGRID_API_KEY, FROM_EMAIL } from '$env/static/private';
// Use fallback for PUBLIC_BASE_URL if not set
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';

// Initialize SendGrid
if (SENDGRID_API_KEY && SENDGRID_API_KEY !== 'mock_key') {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { memorialId, paymentIntentId, customerEmail, lovedOneName, nextActionUrl } = await request.json();

    if (!memorialId || !paymentIntentId || !customerEmail || !lovedOneName) {
      return json({ error: 'Missing required data' }, { status: 400 });
    }

    console.log('📧 Sending action required email to:', customerEmail);

    // Generate email content
    const emailHtml = generateActionRequiredEmailHTML({
      memorialId,
      paymentIntentId,
      customerEmail,
      lovedOneName,
      nextActionUrl,
      actionDate: new Date()
    });

    // Send email with SendGrid
    if (SENDGRID_API_KEY && SENDGRID_API_KEY !== 'mock_key') {
      await sgMail.send({
        from: FROM_EMAIL || 'TributeStream <noreply@tributestream.com>',
        to: customerEmail,
        subject: `TributeStream Payment Action Required - ${lovedOneName}`,
        html: emailHtml,
      });

      console.log('✅ Action required email sent successfully via SendGrid');
    } else {
      // Mock for development
      console.log('✅ Action required email sent successfully (mock - configure SENDGRID_API_KEY for production)');
    }

    return json({ 
      success: true, 
      message: 'Action required email sent successfully'
    });

  } catch (error) {
    console.error('Failed to send action required email:', error);
    return json(
      { error: 'Failed to send action required email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};

interface ActionRequiredEmailData {
  memorialId: string;
  paymentIntentId: string;
  customerEmail: string;
  lovedOneName: string;
  nextActionUrl?: string;
  actionDate: Date;
}

function generateActionRequiredEmailHTML(data: ActionRequiredEmailData): string {
  const { memorialId, paymentIntentId, customerEmail, lovedOneName, nextActionUrl, actionDate } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>TributeStream Payment Action Required</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .warning-box { background: #fef3c7; border: 1px solid #fcd34d; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
    .action-box { background: #f0f9ff; border: 1px solid #bae6fd; border-left: 4px solid #0ea5e9; padding: 15px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .action-button { background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎥 TributeStream</h1>
      <h2>Payment Action Required</h2>
    </div>
    
    <div class="content">
      <p>Dear Customer,</p>
      
      <p>Your payment for the memorial service for <strong>${lovedOneName}</strong> requires additional verification or action from you.</p>
      
      <div class="warning-box">
        <h3>⚠️ Action Required</h3>
        <p><strong>Memorial:</strong> ${lovedOneName}</p>
        <p><strong>Payment ID:</strong> ${paymentIntentId}</p>
        <p><strong>Date:</strong> ${actionDate.toLocaleDateString()}</p>
        <p>Your bank or payment provider requires additional verification to complete this transaction.</p>
      </div>
      
      <div class="action-box">
        <h3>🔐 Complete Your Payment</h3>
        <p>To complete your payment and confirm your memorial service, please:</p>
        <ol>
          <li>Click the button below to complete the verification process</li>
          <li>Follow the instructions from your bank or payment provider</li>
          <li>Complete any required authentication steps</li>
        </ol>
        
        ${nextActionUrl ? `
        <p>Complete your payment verification:</p>
        <a href="${nextActionUrl}" class="action-button">
          Complete Payment Verification
        </a>
        ` : `
        <p>Return to your booking to complete the payment:</p>
        <a href="${PUBLIC_BASE_URL || 'https://tributestream.com'}/schedule/${memorialId}" class="action-button">
          Complete Payment
        </a>
        `}
      </div>
      
      <p><strong>Important:</strong> Your memorial service reservation is held for 24 hours while you complete this verification. Please complete the process as soon as possible to secure your booking.</p>
      
      <p>If you need assistance or have questions about this verification process, please contact our support team at support@tributestream.com or (555) 123-4567.</p>
      
      <p>Thank you for choosing TributeStream.</p>
      
      <p>Best regards,<br>The TributeStream Team</p>
    </div>
    
    <div class="footer">
      <p>TributeStream - Honoring Lives, Connecting Hearts</p>
      <p>This is an automated email. Please do not reply directly to this message.</p>
    </div>
  </div>
</body>
</html>
  `;
}
