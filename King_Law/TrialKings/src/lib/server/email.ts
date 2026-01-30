import sgMail from '@sendgrid/mail';
import { env } from '$env/dynamic/private';

if (env.SENDGRID_API_KEY) {
	sgMail.setApiKey(env.SENDGRID_API_KEY);
}

const FROM_EMAIL = env.SENDGRID_FROM_EMAIL || 'noreply@trialkings.com';
const ADMIN_EMAIL = env.ADMIN_EMAIL || 'admin@trialkings.com';

export async function sendMagicLinkEmail(to: string, magicLinkUrl: string) {
	if (!env.SENDGRID_API_KEY) {
		console.log('[DEV] Magic link email to:', to);
		console.log('[DEV] Magic link URL:', magicLinkUrl);
		return;
	}

	await sgMail.send({
		to,
		from: FROM_EMAIL,
		subject: 'Your TrialKings Login Link',
		html: `
			<h2>Welcome to TrialKings</h2>
			<p>Click the link below to access your account:</p>
			<p><a href="${magicLinkUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Access My Account</a></p>
			<p>This link expires in 1 hour.</p>
			<p>If you didn't request this, you can safely ignore this email.</p>
		`
	});
}

export async function sendFileUploadConfirmation(to: string, fileName: string, dashboardUrl: string) {
	if (!env.SENDGRID_API_KEY) {
		console.log('[DEV] File upload confirmation to:', to);
		console.log('[DEV] File name:', fileName);
		return;
	}

	await sgMail.send({
		to,
		from: FROM_EMAIL,
		subject: 'File Uploaded Successfully - TrialKings',
		html: `
			<h2>File Upload Successful</h2>
			<p>Your file <strong>${fileName}</strong> has been uploaded successfully.</p>
			<p><a href="${dashboardUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View My Files</a></p>
			<p>You can manage your files and place print orders from your dashboard.</p>
		`
	});
}

export async function sendAdminNotification(userEmail: string, fileName: string, fileSize: number) {
	if (!env.SENDGRID_API_KEY) {
		console.log('[DEV] Admin notification for:', userEmail);
		console.log('[DEV] File:', fileName, 'Size:', fileSize);
		return;
	}

	await sgMail.send({
		to: ADMIN_EMAIL,
		from: FROM_EMAIL,
		subject: `New File Upload - ${userEmail}`,
		html: `
			<h2>New File Upload</h2>
			<p><strong>User:</strong> ${userEmail}</p>
			<p><strong>File:</strong> ${fileName}</p>
			<p><strong>Size:</strong> ${(fileSize / 1024).toFixed(2)} KB</p>
			<p><strong>Time:</strong> ${new Date().toISOString()}</p>
		`
	});
}

export async function sendOrderConfirmation(to: string, orderId: string, totalAmount: number) {
	if (!env.SENDGRID_API_KEY) {
		console.log('[DEV] Order confirmation to:', to);
		console.log('[DEV] Order ID:', orderId, 'Total:', totalAmount);
		return;
	}

	await sgMail.send({
		to,
		from: FROM_EMAIL,
		subject: `Order Confirmed - #${orderId}`,
		html: `
			<h2>Order Confirmed</h2>
			<p>Thank you for your order!</p>
			<p><strong>Order ID:</strong> ${orderId}</p>
			<p><strong>Total:</strong> $${(totalAmount / 100).toFixed(2)}</p>
			<p>We'll notify you when your order ships.</p>
		`
	});
}
