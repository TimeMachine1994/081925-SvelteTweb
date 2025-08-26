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
			<!-- Welcome Message -->
			<div class="section">
				<h2>🕊️ Memorial Created Successfully</h2>
				<p>Dear ${data.familyContactName || data.directorName},</p>
				<p>Thank you for creating a memorial tribute for <strong>${data.lovedOneName}</strong>. Your TributeStream account has been set up and is ready to use.</p>
			</div>

			<!-- Login Information -->
			<div class="section">
				<h2>🔐 Your Login Information</h2>
				<div class="login-box">
					<h3>Account Access Details</h3>
					<div class="credential">
						<strong>Email:</strong> ${data.email}
					</div>
					<div class="credential">
						<strong>Password:</strong> ${data.password}
					</div>
					<p style="margin-top: 15px; color: #6c757d; font-size: 14px;">
						<em>For security, we recommend changing your password after your first login.</em>
					</p>
				</div>
			</div>

			<!-- Service Details Summary -->
			<div class="section">
				<h2>📋 Service Details Summary</h2>
				<div class="service-details">
					<div class="detail-row">
						<div class="detail-label">Loved One:</div>
						<div class="detail-value">${data.lovedOneName}</div>
					</div>
					<div class="detail-row">
						<div class="detail-label">Funeral Director:</div>
						<div class="detail-value">${data.directorName}</div>
					</div>
					<div class="detail-row">
						<div class="detail-label">Funeral Home:</div>
						<div class="detail-value">${data.funeralHomeName}</div>
					</div>
					${data.directorEmail ? `
					<div class="detail-row">
						<div class="detail-label">Director Email:</div>
						<div class="detail-value">${data.directorEmail}</div>
					</div>
					` : ''}
					<div class="detail-row">
						<div class="detail-label">Family Contact:</div>
						<div class="detail-value">${data.familyContactName || 'Not specified'}</div>
					</div>
					<div class="detail-row">
						<div class="detail-label">Contact Phone:</div>
						<div class="detail-value">${data.familyContactPhone}</div>
					</div>
					<div class="detail-row">
						<div class="detail-label">Contact Preference:</div>
						<div class="detail-value">${data.contactPreference === 'phone' ? 'Phone' : 'Email'}</div>
					</div>
					${data.memorialDate ? `
					<div class="detail-row">
						<div class="detail-label">Service Date:</div>
						<div class="detail-value">${data.memorialDate}</div>
					</div>
					` : ''}
					${data.memorialTime ? `
					<div class="detail-row">
						<div class="detail-label">Service Time:</div>
						<div class="detail-value">${data.memorialTime}</div>
					</div>
					` : ''}
					${data.locationName ? `
					<div class="detail-row">
						<div class="detail-label">Location:</div>
						<div class="detail-value">${data.locationName}</div>
					</div>
					` : ''}
					${data.locationAddress ? `
					<div class="detail-row">
						<div class="detail-label">Address:</div>
						<div class="detail-value">${data.locationAddress}</div>
					</div>
					` : ''}
					${data.additionalNotes ? `
					<div class="detail-row">
						<div class="detail-label">Additional Notes:</div>
						<div class="detail-value">${data.additionalNotes}</div>
					</div>
					` : ''}
				</div>
			</div>

			<!-- Next Steps -->
			<div class="section">
				<h2>🚀 Next Steps</h2>
				<div class="next-steps">
					<h3 style="margin-top: 0; color: #0056b3;">What you can do now:</h3>
					<ul style="margin: 15px 0; padding-left: 20px;">
						<li><strong>Access your memorial:</strong> Visit your tribute page at <a href="${data.tributeUrl}" style="color: #667eea;">${data.tributeUrl}</a></li>
						<li><strong>Upload photos and videos:</strong> Add meaningful memories to the tribute</li>
						<li><strong>Customize the memorial:</strong> Edit details, add stories, and personalize the page</li>
						<li><strong>Set up livestreaming:</strong> Configure live streaming for the service</li>
						<li><strong>Invite family and friends:</strong> Share the tribute link with loved ones</li>
						<li><strong>Manage settings:</strong> Update privacy settings and notification preferences</li>
					</ul>
				</div>
			</div>

			<!-- Call to Action -->
			<div style="text-align: center; margin: 30px 0;">
				<a href="https://tributestream.com/login" class="cta-button">
					Access Your Memorial Dashboard
				</a>
			</div>

			<!-- Support Information -->
			<div class="section">
				<h2>💬 Need Help?</h2>
				<p>Our support team is here to help you every step of the way:</p>
				<ul>
					<li><strong>Email Support:</strong> <a href="mailto:support@tributestream.com" style="color: #667eea;">support@tributestream.com</a></li>
					<li><strong>Phone Support:</strong> 1-800-TRIBUTE (1-800-874-2883)</li>
					<li><strong>Help Center:</strong> <a href="https://tributestream.com/help" style="color: #667eea;">tributestream.com/help</a></li>
				</ul>
				<p style="color: #6c757d; font-style: italic;">We're available 24/7 to assist you during this important time.</p>
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
		subject: `Welcome to TributeStream - Memorial for ${data.lovedOneName}`,
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