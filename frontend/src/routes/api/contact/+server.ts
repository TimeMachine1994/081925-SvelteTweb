import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// You'll need to install @sendgrid/mail: npm install @sendgrid/mail
import sgMail from '@sendgrid/mail';

// Set your SendGrid API key from environment variables
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { name, email, subject, message } = await request.json();

		// Validate required fields
		if (!name || !email || !subject || !message) {
			return json(
				{ error: 'All fields are required' },
				{ status: 400 }
			);
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json(
				{ error: 'Please enter a valid email address' },
				{ status: 400 }
			);
		}

		// Email to your support team
		const supportEmail = {
			to: 'austinbryanfilm@gmail.com', // Replace with your actual support email
			from: 'tributestream@tributestream.com', // Replace with your verified sender email
			subject: `Contact Form: ${subject}`,
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<div style="background: linear-gradient(135deg, #D5BA7F, #E5CA8F); padding: 20px; text-align: center;">
						<h1 style="color: white; margin: 0;">New Contact Form Submission</h1>
					</div>
					<div style="padding: 20px; background: #f9f9f9;">
						<h2 style="color: #333;">Contact Details</h2>
						<p><strong>Name:</strong> ${name}</p>
						<p><strong>Email:</strong> ${email}</p>
						<p><strong>Subject:</strong> ${subject}</p>
						
						<h3 style="color: #333; margin-top: 30px;">Message</h3>
						<div style="background: white; padding: 15px; border-left: 4px solid #D5BA7F; margin: 10px 0;">
							${message.replace(/\n/g, '<br>')}
						</div>
						
						<div style="margin-top: 30px; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
							<p style="margin: 0; color: #856404;">
								<strong>Reply to:</strong> ${email}<br>
								<strong>Submitted:</strong> ${new Date().toLocaleString()}
							</p>
						</div>
					</div>
				</div>
			`
		};

		// Confirmation email to the user
		const confirmationEmail = {
			to: email,
			from: 'noreply@tributestream.com', // Replace with your verified sender email
			subject: 'Thank you for contacting TributeStream',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<div style="background: linear-gradient(135deg, #D5BA7F, #E5CA8F); padding: 20px; text-align: center;">
						<h1 style="color: white; margin: 0;">TributeStream</h1>
						<p style="color: white; margin: 10px 0 0 0;">Thank you for reaching out</p>
					</div>
					<div style="padding: 20px;">
						<h2 style="color: #333;">Hi ${name},</h2>
						<p style="color: #666; line-height: 1.6;">
							Thank you for contacting us. We've received your message and will get back to you within 24 hours.
						</p>
						
						<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
							<h3 style="color: #333; margin-top: 0;">Your Message Summary</h3>
							<p><strong>Subject:</strong> ${subject}</p>
							<p><strong>Message:</strong></p>
							<div style="background: white; padding: 15px; border-left: 4px solid #D5BA7F; margin: 10px 0;">
								${message.replace(/\n/g, '<br>')}
							</div>
							<p style="color: #666; font-size: 14px; margin-bottom: 0;">
								<strong>Submitted:</strong> ${new Date().toLocaleString()}
							</p>
						</div>
						
						<p style="color: #666; line-height: 1.6;">
							If you need immediate assistance, please call us at <strong>1-800-TRIBUTE</strong> 
							(Monday - Friday, 9 AM - 6 PM EST).
						</p>
						
						<div style="margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 8px; text-align: center;">
							<p style="margin: 0; color: #856404;">
								<strong>Need to create a memorial?</strong><br>
								<a href="https://tributestream.com/register/loved-one" style="color: #D5BA7F; text-decoration: none;">
									Start creating a memorial →
								</a>
							</p>
						</div>
					</div>
					<div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
						<p style="margin: 0;">
							TributeStream - Honoring memories, connecting hearts<br>
							<a href="https://tributestream.com" style="color: #D5BA7F;">tributestream.com</a>
						</p>
					</div>
				</div>
			`
		};

		// Send both emails
		await Promise.all([
			sgMail.send(supportEmail),
			sgMail.send(confirmationEmail)
		]);

		return json(
			{ 
				success: true, 
				message: 'Message sent successfully. Confirmation email sent to your inbox.' 
			},
			{ status: 200 }
		);

	} catch (error) {
		console.error('Contact form error:', error);
		
		// Handle SendGrid specific errors
		if (error && typeof error === 'object' && 'response' in error) {
			const sgError = error as any;
			console.error('SendGrid error:', sgError.response?.body);
			
			return json(
				{ error: 'Failed to send email. Please try again or contact us directly.' },
				{ status: 500 }
			);
		}

		return json(
			{ error: 'An unexpected error occurred. Please try again.' },
			{ status: 500 }
		);
	}
};
