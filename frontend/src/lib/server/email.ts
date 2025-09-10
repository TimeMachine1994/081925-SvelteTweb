import { RESEND_API_KEY, FROM_EMAIL } from '$env/static/private';
import { Resend } from 'resend';

let resend: Resend | null = null;
if (RESEND_API_KEY && RESEND_API_KEY !== 'mock_key') {
	resend = new Resend(RESEND_API_KEY);
}

export interface EnhancedRegistrationEmailData {
	email: string;
	lovedOneName: string;
	memorialUrl: string;
	ownerName: string;
}

export interface InvitationEmailData {
	to: string;
	fromName: string;
	memorialName: string;
	invitationId: string;
}

export async function sendEnhancedRegistrationEmail(data: EnhancedRegistrationEmailData) {
	if (!resend) {
		console.warn('⚠️ Resend client not initialized. Skipping enhanced email.');
		return;
	}

	const htmlContent = `
		<div style="font-family: Arial, sans-serif; color: #333;">
			<h2>Welcome to TributeStream for ${data.lovedOneName}</h2>
			<p>Hello ${data.ownerName},</p>
			<p>Thank you for choosing TributeStream to honor the memory of ${data.lovedOneName}. Your dedicated memorial page is now ready.</p>
			<p>You can view and manage the memorial here:</p>
			<p><a href="${data.memorialUrl}" style="color: #007bff;">${data.memorialUrl}</a></p>
			<p>From your portal, you can invite family and friends to contribute photos and memories.</p>
			<p>Sincerely,<br>The TributeStream Team</p>
		</div>
	`;

	const msg = {
		from: FROM_EMAIL,
		to: data.email,
		subject: `Welcome to TributeStream - Memorial for ${data.lovedOneName}`,
		html: htmlContent,
	};

	try {
		const { data: responseData, error } = await resend.emails.send(msg);

		if (error) {
			console.error('🔥 Error sending enhanced registration email:', error);
			throw new Error(`Resend API error: ${JSON.stringify(error)}`);
		}

	} catch (error) {
		console.error('💥 Exception sending enhanced registration email:', error);
		throw error;
	}
}

export async function sendInvitationEmail(data: InvitationEmailData) {
	if (!resend) {
		console.warn('⚠️ Resend client not initialized. Skipping invitation email.');
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
			<p>Sincerely,<br>The TributeStream Team</p>
		</div>
	`;

	const msg = {
		from: FROM_EMAIL,
		to: data.to,
		subject: `An invitation to contribute to the memorial for ${data.memorialName}`,
		html: htmlContent,
	};

	try {
		const { data: responseData, error } = await resend.emails.send(msg);

		if (error) {
			throw new Error(`Resend API error: ${JSON.stringify(error)}`);
		}

	} catch (error) {
		console.error('💥 Exception sending invitation email:', error);
		throw error;
	}
}