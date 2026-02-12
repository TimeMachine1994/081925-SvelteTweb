/**
 * Email utility for King Law Firm
 * 
 * All outbound email is sent via SendGrid using the SENDGRID_API_KEY env var.
 * The verified sender address is print@trialkings.law.
 */

import sgMail from '@sendgrid/mail';
import { env } from '$env/dynamic/private';

const FIRM_EMAIL = 'print@trialkings.law';
const FIRM_NAME = 'King Law, P.L.L.C.';

interface EmailOptions {
	to: string;
	subject: string;
	text: string;
	html?: string;
	replyTo?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
	try {
		if (!env.SENDGRID_API_KEY) {
			console.error('SENDGRID_API_KEY not configured — email not sent');
			return { success: false, error: 'Email service not configured' };
		}

		sgMail.setApiKey(env.SENDGRID_API_KEY);

		await sgMail.send({
			to: options.to,
			from: FIRM_EMAIL,
			subject: options.subject,
			text: options.text,
			...(options.html && { html: options.html }),
			...(options.replyTo && { replyTo: options.replyTo })
		});

		console.log(`📧 Email sent via SendGrid:`, {
			to: options.to,
			subject: options.subject,
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
