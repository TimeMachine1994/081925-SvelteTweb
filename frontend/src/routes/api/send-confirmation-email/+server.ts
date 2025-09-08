import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// You'll need to install nodemailer or use a service like SendGrid/Mailgun
// import nodemailer from 'nodemailer';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { receiptData, customerEmail } = await request.json();

    if (!receiptData || !customerEmail) {
      return json({ error: 'Missing required data' }, { status: 400 });
    }

    console.log('📧 Sending confirmation email to:', customerEmail);

    // Mock email sending for development
    // TODO: Replace with actual email service integration
    
    /* 
    // Example with nodemailer (configure with your email service):
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const emailHtml = generateConfirmationEmailHTML(receiptData);
    
    await transporter.sendMail({
      from: '"TributeStream" <noreply@tributestream.com>',
      to: customerEmail,
      subject: 'TributeStream Service Confirmation - Payment Received',
      html: emailHtml,
    });
    */

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('✅ Confirmation email sent successfully (mock)');

    return json({ 
      success: true, 
      message: 'Confirmation email sent successfully',
      development_mode: true 
    });

  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    return json(
      { error: 'Failed to send confirmation email' },
      { status: 500 }
    );
  }
};

function generateConfirmationEmailHTML(receiptData: any): string {
  const { customerInfo, bookingData, paymentIntentId, paymentDate } = receiptData;
  
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
      <p>Dear ${customerInfo.firstName} ${customerInfo.lastName},</p>
      
      <p>Thank you for choosing TributeStream! Your payment has been successfully processed and your memorial service has been confirmed.</p>
      
      <div class="receipt-box">
        <h3>📋 Booking Details</h3>
        <p><strong>Payment ID:</strong> ${paymentIntentId}</p>
        <p><strong>Payment Date:</strong> ${new Date(paymentDate).toLocaleDateString()}</p>
        <p><strong>Email:</strong> ${customerInfo.email}</p>
        
        <h4>Services Ordered:</h4>
        <ul>
          ${bookingData.items.map(item => 
            `<li>${item.name}${item.quantity > 1 ? ` (${item.quantity}x)` : ''}: $${item.total}</li>`
          ).join('')}
        </ul>
        
        <p class="total">Total Paid: $${bookingData.total}</p>
      </div>
      
      <div class="receipt-box">
        <h3>📅 What's Next?</h3>
        <ul>
          <li>Your schedule has been locked and confirmed</li>
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
