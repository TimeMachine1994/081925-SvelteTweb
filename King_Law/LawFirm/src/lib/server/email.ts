/**
 * Email utility for King Law Firm
 * 
 * Currently logs emails to console. To enable real email delivery:
 * 1. Install a provider (e.g., `npm install @sendgrid/mail` or `nodemailer`)
 * 2. Add env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (or SENDGRID_API_KEY)
 * 3. Replace the sendEmail function body with the provider's send method
 */

const FIRM_EMAIL = 'info@kinglawpllc.com';
const FIRM_NAME = 'King Law, P.L.L.C.';

interface EmailOptions {
	to: string;
	subject: string;
	text: string;
	html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
	try {
		// TODO: Replace with real email provider
		// Example with SendGrid:
		// import sgMail from '@sendgrid/mail';
		// sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
		// await sgMail.send({ from: FIRM_EMAIL, ...options });

		console.log(`📧 Email queued (no provider configured):`, {
			to: options.to,
			subject: options.subject,
			preview: options.text.substring(0, 100) + '...',
			timestamp: new Date().toISOString()
		});

		return { success: true };
	} catch (err) {
		console.error('Email send failed:', err);
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}

export async function notifyFirmOfConsultation(consultation: {
	firstName: string;
	lastName: string;
	email: string;
	phone?: string | null;
	message: string;
}): Promise<void> {
	const { firstName, lastName, email, phone, message } = consultation;

	await sendEmail({
		to: FIRM_EMAIL,
		subject: `New Consultation Request from ${firstName} ${lastName}`,
		text: [
			`New consultation request received:`,
			``,
			`Name: ${firstName} ${lastName}`,
			`Email: ${email}`,
			`Phone: ${phone || 'Not provided'}`,
			``,
			`Message:`,
			message,
			``,
			`---`,
			`This is an automated notification from ${FIRM_NAME} website.`
		].join('\n'),
		html: `
			<h2>New Consultation Request</h2>
			<table style="border-collapse:collapse;">
				<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Name:</td><td>${firstName} ${lastName}</td></tr>
				<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Email:</td><td><a href="mailto:${email}">${email}</a></td></tr>
				<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Phone:</td><td>${phone || 'Not provided'}</td></tr>
			</table>
			<h3>Message:</h3>
			<p style="background:#f5f5f5;padding:12px;border-radius:4px;">${message.replace(/\n/g, '<br>')}</p>
			<hr>
			<p style="color:#888;font-size:12px;">Automated notification from ${FIRM_NAME} website.</p>
		`
	});
}
