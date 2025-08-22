import { SENDGRID_API_KEY } from '$env/static/private';

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