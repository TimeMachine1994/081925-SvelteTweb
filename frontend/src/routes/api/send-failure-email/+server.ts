import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || 'mock_key');

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { memorialId, paymentIntentId, customerEmail, lovedOneName, failureReason } = await request.json();

    if (!memorialId || !paymentIntentId || !customerEmail || !lovedOneName || !failureReason) {
      return json({ error: 'Missing required data' }, { status: 400 });
    }

    console.log('📧 Sending payment failure email to:', customerEmail);

    // Generate email content
    const emailHtml = generateFailureEmailHTML({
      memorialId,
      paymentIntentId,
      customerEmail,
      lovedOneName,
      failureReason,
      failureDate: new Date()
    });

    // Send email with Resend
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'mock_key') {
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'TributeStream <noreply@tributestream.com>',
        to: customerEmail,
        subject: `TributeStream Payment Issue - ${lovedOneName}`,
        html: emailHtml,
      });

      console.log('✅ Payment failure email sent successfully via Resend');
    } else {
      // Mock for development
      console.log('✅ Payment failure email sent successfully (mock - configure RESEND_API_KEY for production)');
    }

    return json({ 
      success: true, 
      message: 'Payment failure email sent successfully'
    });

  } catch (error) {
    console.error('Failed to send payment failure email:', error);
    return json(
      { error: 'Failed to send payment failure email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};

interface FailureEmailData {
  memorialId: string;
  paymentIntentId: string;
  customerEmail: string;
  lovedOneName: string;
  failureReason: string;
  failureDate: Date;
}

function generateFailureEmailHTML(data: FailureEmailData): string {
  const { memorialId, paymentIntentId, customerEmail, lovedOneName, failureReason, failureDate } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>TributeStream Payment Issue</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
    .action-box { background: #f0f9ff; border: 1px solid #bae6fd; border-left: 4px solid #0ea5e9; padding: 15px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .retry-button { background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎥 TributeStream</h1>
      <h2>Payment Issue</h2>
    </div>
    
    <div class="content">
      <p>Dear Customer,</p>
      
      <p>We encountered an issue processing your payment for the memorial service for <strong>${lovedOneName}</strong>.</p>
      
      <div class="alert-box">
        <h3>❌ Payment Failed</h3>
        <p><strong>Memorial:</strong> ${lovedOneName}</p>
        <p><strong>Payment ID:</strong> ${paymentIntentId}</p>
        <p><strong>Date:</strong> ${failureDate.toLocaleDateString()}</p>
        <p><strong>Reason:</strong> ${failureReason}</p>
      </div>
      
      <div class="action-box">
        <h3>🔄 Next Steps</h3>
        <p>Don't worry - your memorial service reservation is still held for 24 hours. Please try one of the following:</p>
        <ul>
          <li>Check that your payment method has sufficient funds</li>
          <li>Verify your card details are correct</li>
          <li>Try a different payment method</li>
          <li>Contact your bank if the issue persists</li>
        </ul>
        
        <p>You can retry your payment by returning to your booking:</p>
        <a href="${process.env.PUBLIC_BASE_URL || 'https://tributestream.com'}/schedule/${memorialId}" class="retry-button">
          Retry Payment
        </a>
      </div>
      
      <p>If you continue to experience issues, please contact our support team at support@tributestream.com or (555) 123-4567. We're here to help ensure your memorial service goes smoothly.</p>
      
      <p>Thank you for your patience.</p>
      
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
