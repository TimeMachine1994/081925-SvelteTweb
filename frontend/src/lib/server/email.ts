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