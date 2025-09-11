import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sgMail from '@sendgrid/mail';
import { SENDGRID_API_KEY, FROM_EMAIL } from '$env/static/private';

// Initialize SendGrid
if (SENDGRID_API_KEY && SENDGRID_API_KEY !== 'mock_key') {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { memorialId, paymentIntentId, customerEmail, lovedOneName, amount } = await request.json();

    if (!memorialId || !paymentIntentId || !customerEmail || !lovedOneName || !amount) {
      return json({ error: 'Missing required data' }, { status: 400 });
    }

    console.log('📧 Sending confirmation email to:', customerEmail);

    // Generate email content
    const emailHtml = generateConfirmationEmailHTML({
      memorialId,
      paymentIntentId,
      customerEmail,
      lovedOneName,
      amount,
      paymentDate: new Date()
    });

    // Send email with SendGrid
    if (SENDGRID_API_KEY && SENDGRID_API_KEY !== 'mock_key') {
      await sgMail.send({
        from: FROM_EMAIL || 'TributeStream <noreply@tributestream.com>',
        to: customerEmail,
        subject: `TributeStream Service Confirmation - ${lovedOneName}`,
        html: emailHtml,
      });

      console.log('✅ Confirmation email sent successfully via SendGrid');
    } else {
      // Mock for development
      console.log('✅ Confirmation email sent successfully (mock - configure SENDGRID_API_KEY for production)');
    }

    return json({ 
      success: true, 
      message: 'Confirmation email sent successfully'
    });

  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    return json(
      { error: 'Failed to send confirmation email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};

interface EmailData {
  memorialId: string;
  paymentIntentId: string;
  customerEmail: string;
  lovedOneName: string;
  amount: number;
  paymentDate: Date;
}

function generateConfirmationEmailHTML(data: EmailData): string {
  const { memorialId, paymentIntentId, customerEmail, lovedOneName, amount, paymentDate } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>TributeStream Service Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .receipt-box { background: white; border: 1px solid #ddd; padding: 15px; margin: 15px 0; }
    .total { font-size: 18px; font-weight: bold; color: #f59e0b; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎥 TributeStream</h1>
      <h2>Service Confirmation</h2>
    </div>
    
    <div class="content">
      <p>Dear Customer,</p>
      
      <p>Thank you for choosing TributeStream! Your payment has been successfully processed and your memorial service for <strong>${lovedOneName}</strong> has been confirmed.</p>
      
      <div class="receipt-box">
        <h3>📋 Payment Details</h3>
        <p><strong>Memorial:</strong> ${lovedOneName}</p>
        <p><strong>Payment ID:</strong> ${paymentIntentId}</p>
        <p><strong>Payment Date:</strong> ${paymentDate.toLocaleDateString()}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p class="total">Total Paid: $${amount.toFixed(2)}</p>
      </div>
      
      <div class="receipt-box">
        <h3>📅 What's Next?</h3>
        <ul>
          <li>Your memorial service schedule has been confirmed</li>
          <li>Our team will contact you within 24 hours to coordinate service details</li>
          <li>You can access your booking anytime in your TributeStream portal</li>
          <li>We'll send additional information about your service setup closer to the date</li>
        </ul>
      </div>
      
      <p>If you have any questions, please don't hesitate to contact our support team at support@tributestream.com or (555) 123-4567.</p>
      
      <p>Thank you for trusting us with your memorial service.</p>
      
      <p>Warm regards,<br>The TributeStream Team</p>
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
