import { SENDGRID_API_KEY } from '$env/static/private';

// Enhanced registration email data interface
export interface EnhancedRegistrationEmailData {
	// Login information
	email: string;
	password: string;
	
	// Loved one information
	lovedOneName: string;
	tributeUrl: string;
	
	// Family contact information
	familyContactName?: string;
	familyContactEmail: string;
	familyContactPhone: string;
	contactPreference: 'phone' | 'email';
	
	// Director information
	directorName: string;
	directorEmail?: string;
	funeralHomeName: string;
	
	// Service details
	memorialDate?: string;
	memorialTime?: string;
	locationName?: string;
	locationAddress?: string;
	
	// Additional information
	additionalNotes?: string;
}

export async function sendReceiptEmail(to: string, receiptData: any) {
	console.log('📧 Sending receipt email to:', to);
	console.log('📝 Receipt data:', JSON.stringify(receiptData, null, 2));

	if (!SENDGRID_API_KEY) {
		console.warn('⚠️ SendGrid API key not found. Skipping email.');
		return;
	}

	const msg = {
		personalizations: [{ to: [{ email: to }] }],
		from: { email: 'tributestream@tributestream.com' }, // IMPORTANT: Change to your verified sender
		subject: 'Your Livestream Receipt',
		content: [
			{
				type: 'text/html',
				value: `<p>Thank you for your purchase!</p>
             <p>Order details:</p>
             <pre>${JSON.stringify(receiptData, null, 2)}</pre>`
			}
		]
	};

	try {
		const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${SENDGRID_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(msg)
		});

		if (response.ok) {
			console.log('✅ Email sent successfully');
		} else {
			const { errors } = await response.json();
			console.error('🔥 Error sending email:', errors);
		}
	} catch (error) {
		console.error('🔥 Exception sending email:', error);
	}
}
export async function sendRegistrationEmail(to: string, password: string) {
	console.log(`📧 Sending registration email to: ${to}`);

	if (!SENDGRID_API_KEY) {
		console.warn('⚠️ SendGrid API key not found. Skipping email.');
		return;
	}

	const msg = {
		personalizations: [{ to: [{ email: to }] }],
		from: { email: 'tributestream@tributestream.com' }, // IMPORTANT: Change to your verified sender
		subject: 'Welcome to TributeStream!',
		content: [
			{
				type: 'text/html',
				value: `<p>Welcome! Your account has been created.</p>
             <p>You can now log in using your email and the following password:</p>
             <p><strong>Password:</strong> ${password}</p>
             <p>We recommend changing your password after you log in for the first time.</p>`
			}
		]
	};

	try {
		const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${SENDGRID_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(msg)
		});

		if (response.ok) {
			console.log('✅ Registration email sent successfully');
		} else {
			const { errors } = await response.json();
			console.error('🔥 Error sending registration email:', errors);
		}
	} catch (error) {
		console.error('🔥 Exception sending registration email:', error);
	}
}

export async function sendEnhancedRegistrationEmail(data: EnhancedRegistrationEmailData) {
	console.log('📧 Sending enhanced registration email to:', data.email);
	console.log('🎯 Enhanced email data:', {
		lovedOneName: data.lovedOneName,
		familyContactName: data.familyContactName,
		directorName: data.directorName,
		funeralHomeName: data.funeralHomeName,
		hasServiceDetails: !!(data.memorialDate || data.memorialTime),
		hasLocationDetails: !!(data.locationName || data.locationAddress),
		tributeUrl: data.tributeUrl
	});

	if (!SENDGRID_API_KEY) {
		console.warn('⚠️ SendGrid API key not found. Skipping enhanced email.');
		return;
	}

	// Generate professional HTML email template
	const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Welcome to TributeStream</title>
	<style>
		body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; }
		.container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
		.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
		.header h1 { margin: 0; font-size: 28px; font-weight: 300; }
		.content { padding: 30px 20px; }
		.section { margin-bottom: 30px; }
		.section h2 { color: #333; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 5px; }
		.login-box { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0; }
		.login-box h3 { margin-top: 0; color: #495057; }
		.credential { margin: 10px 0; }
		.credential strong { color: #333; }
		.service-details { background-color: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; }
		.detail-row { display: flex; margin-bottom: 12px; }
		.detail-label { font-weight: 600; color: #495057; min-width: 140px; }
		.detail-value { color: #333; }
		.cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 25px; font-weight: 600; margin: 20px 0; text-align: center; }
		.cta-button:hover { opacity: 0.9; }
		.next-steps { background-color: #e7f3ff; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; }
		.footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
		.footer a { color: #667eea; text-decoration: none; }
		@media only screen and (max-width: 600px) {
			.container { width: 100% !important; }
			.content { padding: 20px 15px !important; }
			.detail-row { flex-direction: column; }
			.detail-label { min-width: auto; margin-bottom: 5px; }
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Welcome to TributeStream</h1>
			<p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your memorial tribute for ${data.lovedOneName} is ready</p>
		</div>
		
		<div class="content">
			<div class="section">
				<p>Dear ${data.familyContactName || 'Valued Family'},</p>
				<p>Tributestream wishes you our deepest sympathy for the passing of your loved one, <strong>${data.lovedOneName}</strong>. We hope that our duty to share the coming memorial will bring greater comfort.</p>
				<p>Please follow the link below to finish the booking process.</p>
				<div style="text-align: center; margin: 30px 0;">
					<a href="https://tributestream.com/login" class="cta-button">
						Complete Your Booking
					</a>
				</div>
				<p>In the meantime, here is a shareable link to the website page that will broadcast the stream:</p>
				<p><a href="${data.tributeUrl}" style="color: #667eea;">${data.tributeUrl}</a></p>
				<p>You will be contacted within 24-48 hours to complete the process.</p>
				<p>We look forward to meeting you in the near term to offer our personal condolences.</p>
				<p>Respectfully,<br/>Tributestream</p>
				<p style="margin-top: 20px; font-size: 12px; color: #6c757d;">
					This email was sent because a funeral director submitted it on your behalf. You have been automatically registered to an account where you may edit your booking details and pay securely online. Your account password is <strong>${data.password}</strong>.
				</p>
				${data.additionalNotes ? `<p style="font-size: 12px; color: #6c757d;"><strong>Extra Notes:</strong> ${data.additionalNotes}</p>` : ''}
			</div>
		</div>

		<div class="footer">
			<p>© 2024 TributeStream. All rights reserved.</p>
			<p>
				<a href="https://tributestream.com/privacy">Privacy Policy</a> |
				<a href="https://tributestream.com/terms">Terms of Service</a> |
				<a href="https://tributestream.com/contact">Contact Us</a>
			</p>
		</div>
	</div>
</body>
</html>
	`;

	const msg = {
		personalizations: [{ to: [{ email: data.email }] }],
		from: { email: 'tributestream@tributestream.com' },
		subject: `TributeStream - Memorial Booking for ${data.lovedOneName}`,
		content: [
			{
				type: 'text/html',
				value: htmlContent
			}
		]
	};

	try {
		console.log('🚀 Sending enhanced registration email...');
		const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${SENDGRID_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(msg)
		});

		if (response.ok) {
			console.log('✅ Enhanced registration email sent successfully');
			console.log('📧 Email sent to:', data.email);
			console.log('🎯 Subject: Welcome to TributeStream - Memorial for', data.lovedOneName);
		} else {
			const { errors } = await response.json();
			console.error('🔥 Error sending enhanced registration email:', errors);
			throw new Error(`SendGrid API error: ${JSON.stringify(errors)}`);
		}
	} catch (error) {
		console.error('💥 Exception sending enhanced registration email:', error);
		throw error;
	}
}

export async function sendEmail(to: string, subject: string, htmlBody: string) {
	console.log(`📧 Sending generic email to: ${to} with subject: ${subject}`);

	if (!SENDGRID_API_KEY) {
		console.warn('⚠️ SendGrid API key not found. Skipping email.');
		return;
	}

	const msg = {
		personalizations: [{ to: [{ email: to }] }],
		from: { email: 'tributestream@tributestream.com' }, // IMPORTANT: Change to your verified sender
		subject: subject,
		content: [
			{
				type: 'text/html',
				value: htmlBody
			}
		]
	};

	try {
		const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${SENDGRID_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(msg)
		});

		if (response.ok) {
			console.log('✅ Generic email sent successfully');
		} else {
			const { errors } = await response.json();
			console.error('🔥 Error sending generic email:', errors);
		}
	} catch (error) {
		console.error('🔥 Exception sending generic email:', error);
	}
}