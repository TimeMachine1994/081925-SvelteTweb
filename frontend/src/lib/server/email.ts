import { SENDGRID_API_KEY, FROM_EMAIL } from '$env/static/private';
import sgMail from '@sendgrid/mail';

if (SENDGRID_API_KEY && SENDGRID_API_KEY !== 'mock_key') {
	sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EnhancedRegistrationEmailData {
	email: string;
	lovedOneName: string;
	memorialUrl: string;
	ownerName: string;
	password: string; // Add password for the enhanced email
}

export interface InvitationEmailData {
	to: string;
	fromName: string;
	memorialName: string;
	invitationId: string;
}

export async function sendEnhancedRegistrationEmail(data: EnhancedRegistrationEmailData) {
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key') {
		console.warn('⚠️ SendGrid client not initialized. Skipping enhanced email.');
		return;
	}

	const htmlContent = `
		<div style="font-family: Arial, sans-serif; color: #333;">
			<h2>Welcome to Tributestream for ${data.lovedOneName}</h2>
			<p>Hello ${data.ownerName},</p>
			<p>Thank you for choosing Tributestream to honor the memory of ${data.lovedOneName}. Your dedicated memorial page is now ready.</p>
			<p>You can view and manage the memorial here:</p>
			<p><a href="${data.memorialUrl}" style="color: #007bff;">${data.memorialUrl}</a></p>
			<p>Your account has been created with a temporary password:</p>
			<ul>
				<li><strong>Email:</strong> ${data.email}</li>
				<li><strong>Temporary Password:</strong> ${data.password}</li>
			</ul>
			<p>We recommend changing your password after you log in for the first time.</p>
			<p>From your portal, you can invite family and friends to contribute photos and memories.</p>
			<p>Sincerely,<br>The Tributestream Team</p>
		</div>
	`;

	const msg = {
		to: data.email,
		from: FROM_EMAIL,
		subject: `Welcome to Tributestream - Memorial for ${data.lovedOneName}`,
		html: htmlContent
	};

	try {
		await sgMail.send(msg);
	} catch (error) {
		console.error('💥 Exception sending enhanced registration email:', error);
		throw error;
	}
}

export async function sendRegistrationEmail(email: string, password: string, lovedOneName: string) {
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key') {
		console.warn('⚠️ SendGrid client not initialized. Skipping registration email.');
		return;
	}

	const htmlContent = `
		<div style="font-family: Arial, sans-serif; color: #333;">
			<h2>Welcome to Tributestream</h2>
			<p>An account has been created for you to manage the memorial for <strong>${lovedOneName}</strong>.</p>
			<p>You can log in with the following credentials:</p>
			<ul>
				<li><strong>Email:</strong> ${email}</li>
				<li><strong>Temporary Password:</strong> ${password}</li>
			</ul>
			<p>We recommend changing your password after you log in for the first time.</p>
			<p>Sincerely,<br>The Tributestream Team</p>
		</div>
	`;

	const msg = {
		to: email,
		from: FROM_EMAIL,
		subject: 'Your Tributestream Account Details',
		html: htmlContent
	};

	try {
		await sgMail.send(msg);
	} catch (error) {
		console.error('💥 Exception sending registration email:', error);
		throw error;
	}
}

export async function sendInvitationEmail(data: InvitationEmailData) {
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key') {
		console.warn('⚠️ SendGrid client not initialized. Skipping invitation email.');
		return;
	}

	const invitationUrl = `https://tributestream.com/invite/${data.invitationId}`;

	const htmlContent = `
		<div style="font-family: Arial, sans-serif; color: #333;">
			<h2>You're Invited to Contribute</h2>
			<p>Hello,</p>
			<p>${data.fromName} has invited you to contribute to the online memorial for ${data.memorialName}.</p>
			<p>You can share photos, memories, and view service details by accepting the invitation below:</p>
			<p><a href="${invitationUrl}" style="color: #007bff;">Accept Invitation</a></p>
			<p>Thank you for helping to create a beautiful tribute.</p>
			<p>Sincerely,<br>The Tributestream Team</p>
		</div>
	`;

	const msg = {
		to: data.to,
		from: FROM_EMAIL,
		subject: `An invitation to contribute to the memorial for ${data.memorialName}`,
		html: htmlContent
	};

	try {
		await sgMail.send(msg);
	} catch (error) {
		console.error('💥 Exception sending invitation email:', error);
		throw error;
	}
}
