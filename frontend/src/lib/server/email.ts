import { 
	SENDGRID_API_KEY, 
	FROM_EMAIL,
	SENDGRID_TEMPLATE_ENHANCED_REGISTRATION,
	SENDGRID_TEMPLATE_BASIC_REGISTRATION,
	SENDGRID_TEMPLATE_INVITATION,
	SENDGRID_TEMPLATE_EMAIL_CHANGE,
	SENDGRID_TEMPLATE_PAYMENT_CONFIRMATION,
	SENDGRID_TEMPLATE_PAYMENT_ACTION,
	SENDGRID_TEMPLATE_PAYMENT_FAILURE,
	SENDGRID_TEMPLATE_CONTACT_SUPPORT,
	SENDGRID_TEMPLATE_CONTACT_CONFIRMATION
} from '$env/static/private';
import sgMail from '@sendgrid/mail';

if (SENDGRID_API_KEY && SENDGRID_API_KEY !== 'mock_key') {
	sgMail.setApiKey(SENDGRID_API_KEY);
}

// SendGrid Dynamic Template IDs
export const SENDGRID_TEMPLATES = {
	ENHANCED_REGISTRATION: SENDGRID_TEMPLATE_ENHANCED_REGISTRATION,
	BASIC_REGISTRATION: SENDGRID_TEMPLATE_BASIC_REGISTRATION,
	INVITATION: SENDGRID_TEMPLATE_INVITATION,
	EMAIL_CHANGE_CONFIRMATION: SENDGRID_TEMPLATE_EMAIL_CHANGE,
	PAYMENT_CONFIRMATION: SENDGRID_TEMPLATE_PAYMENT_CONFIRMATION,
	PAYMENT_ACTION_REQUIRED: SENDGRID_TEMPLATE_PAYMENT_ACTION,
	PAYMENT_FAILURE: SENDGRID_TEMPLATE_PAYMENT_FAILURE,
	CONTACT_FORM_SUPPORT: SENDGRID_TEMPLATE_CONTACT_SUPPORT,
	CONTACT_FORM_CONFIRMATION: SENDGRID_TEMPLATE_CONTACT_CONFIRMATION
};

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

export interface EmailChangeConfirmationData {
	to: string;
	userName: string;
	confirmationUrl: string;
}

export interface PaymentEmailData {
	memorialId: string;
	paymentIntentId: string;
	customerEmail: string;
	lovedOneName: string;
	amount?: number;
	paymentDate?: Date;
	nextActionUrl?: string;
	failureReason?: string;
}

export interface ContactFormData {
	name: string;
	email: string;
	subject: string;
	message: string;
	timestamp?: Date;
}

export async function sendEnhancedRegistrationEmail(data: EnhancedRegistrationEmailData) {
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key') {
		console.warn('⚠️ SendGrid client not initialized. Skipping enhanced email.');
		return;
	}

	const msg = {
		to: data.email,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.ENHANCED_REGISTRATION,
		dynamicTemplateData: {
			lovedOneName: data.lovedOneName,
			ownerName: data.ownerName,
			memorialUrl: data.memorialUrl,
			memorialSlug: data.memorialUrl.replace('https://tributestream.com/', ''),
			email: data.email,
			password: data.password,
			currentYear: new Date().getFullYear()
		},
		// Disable click tracking to prevent URL mangling
		trackingSettings: {
			clickTracking: {
				enable: false
			}
		}
	};

	try {
		await sgMail.send(msg);
		console.log('✅ Enhanced registration email sent via dynamic template to:', data.email);
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

	const msg = {
		to: email,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.BASIC_REGISTRATION,
		dynamicTemplateData: {
			lovedOneName: lovedOneName,
			email: email,
			password: password,
			currentYear: new Date().getFullYear()
		},
		// Disable click tracking to prevent URL mangling
		trackingSettings: {
			clickTracking: {
				enable: false
			}
		}
	};

	try {
		await sgMail.send(msg);
		console.log('✅ Basic registration email sent via dynamic template to:', email);
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

	const msg = {
		to: data.to,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.INVITATION,
		dynamicTemplateData: {
			fromName: data.fromName,
			memorialName: data.memorialName,
			invitationUrl: invitationUrl,
			currentYear: new Date().getFullYear()
		},
		// Disable click tracking to prevent URL mangling
		trackingSettings: {
			clickTracking: {
				enable: false
			}
		}
	};

	try {
		await sgMail.send(msg);
		console.log('✅ Invitation email sent via dynamic template to:', data.to);
	} catch (error) {
		console.error('💥 Exception sending invitation email:', error);
		throw error;
	}
}

export async function sendEmailChangeConfirmation(data: EmailChangeConfirmationData) {
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key') {
		console.warn('⚠️ SendGrid client not initialized. Skipping email change confirmation.');
		return;
	}

	const msg = {
		to: data.to,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.EMAIL_CHANGE_CONFIRMATION,
		dynamicTemplateData: {
			userName: data.userName,
			confirmationUrl: data.confirmationUrl,
			currentYear: new Date().getFullYear()
		}
	};

	try {
		await sgMail.send(msg);
		console.log('✅ Email change confirmation sent via dynamic template to:', data.to);
	} catch (error) {
		console.error('💥 Exception sending email change confirmation:', error);
		throw error;
	}
}

/**
 * Send payment confirmation email using dynamic template
 */
export async function sendPaymentConfirmationEmail(data: PaymentEmailData) {
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key') {
		console.warn('⚠️ SendGrid client not initialized. Skipping payment confirmation.');
		return;
	}

	const msg = {
		to: data.customerEmail,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.PAYMENT_CONFIRMATION,
		dynamicTemplateData: {
			lovedOneName: data.lovedOneName,
			paymentIntentId: data.paymentIntentId,
			amount: data.amount?.toFixed(2) || '0.00',
			paymentDate: data.paymentDate?.toLocaleDateString() || new Date().toLocaleDateString(),
			customerEmail: data.customerEmail,
			memorialId: data.memorialId,
			currentYear: new Date().getFullYear()
		}
	};

	try {
		await sgMail.send(msg);
		console.log('✅ Payment confirmation email sent via dynamic template');
	} catch (error) {
		console.error('💥 Exception sending payment confirmation email:', error);
		throw error;
	}
}

/**
 * Send payment action required email using dynamic template
 */
export async function sendPaymentActionRequiredEmail(data: PaymentEmailData) {
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key') {
		console.warn('⚠️ SendGrid client not initialized. Skipping payment action required.');
		return;
	}

	const baseUrl = process.env.PUBLIC_BASE_URL || 'https://tributestream.com';
	const fallbackUrl = `${baseUrl}/schedule/${data.memorialId}`;

	const msg = {
		to: data.customerEmail,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.PAYMENT_ACTION_REQUIRED,
		dynamicTemplateData: {
			lovedOneName: data.lovedOneName,
			paymentIntentId: data.paymentIntentId,
			actionDate: new Date().toLocaleDateString(),
			nextActionUrl: data.nextActionUrl || fallbackUrl,
			fallbackUrl: fallbackUrl,
			currentYear: new Date().getFullYear()
		}
	};

	try {
		await sgMail.send(msg);
		console.log('✅ Payment action required email sent via dynamic template');
	} catch (error) {
		console.error('💥 Exception sending payment action required email:', error);
		throw error;
	}
}

/**
 * Send payment failure email using dynamic template
 */
export async function sendPaymentFailureEmail(data: PaymentEmailData) {
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key') {
		console.warn('⚠️ SendGrid client not initialized. Skipping payment failure.');
		return;
	}

	const baseUrl = process.env.PUBLIC_BASE_URL || 'https://tributestream.com';
	const retryUrl = `${baseUrl}/schedule/${data.memorialId}`;

	const msg = {
		to: data.customerEmail,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.PAYMENT_FAILURE,
		dynamicTemplateData: {
			lovedOneName: data.lovedOneName,
			paymentIntentId: data.paymentIntentId,
			failureReason: data.failureReason || 'Payment processing error',
			failureDate: new Date().toLocaleDateString(),
			retryUrl: retryUrl,
			currentYear: new Date().getFullYear()
		}
	};

	try {
		await sgMail.send(msg);
		console.log('✅ Payment failure email sent via dynamic template');
	} catch (error) {
		console.error('💥 Exception sending payment failure email:', error);
		throw error;
	}
}

/**
 * Send contact form emails using dynamic templates
 */
export async function sendContactFormEmails(data: ContactFormData) {
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key') {
		console.warn('⚠️ SendGrid client not initialized. Skipping contact form emails.');
		return;
	}

	const timestamp = data.timestamp || new Date();

	// Support team notification
	const supportMsg = {
		to: 'austinbryanfilm@gmail.com', // Replace with your support email
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.CONTACT_FORM_SUPPORT,
		dynamicTemplateData: {
			name: data.name,
			email: data.email,
			subject: data.subject,
			message: data.message,
			submittedAt: timestamp.toLocaleString(),
			currentYear: new Date().getFullYear()
		}
	};

	// Customer confirmation
	const confirmationMsg = {
		to: data.email,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.CONTACT_FORM_CONFIRMATION,
		dynamicTemplateData: {
			name: data.name,
			subject: data.subject,
			message: data.message,
			submittedAt: timestamp.toLocaleString(),
			currentYear: new Date().getFullYear()
		}
	};

	try {
		await Promise.all([
			sgMail.send(supportMsg),
			sgMail.send(confirmationMsg)
		]);
		console.log('✅ Contact form emails sent via dynamic templates');
	} catch (error) {
		console.error('💥 Exception sending contact form emails:', error);
		throw error;
	}
}

/**
 * Utility function to test if dynamic templates are configured
 */
export function isDynamicTemplatesConfigured(): boolean {
	return Object.values(SENDGRID_TEMPLATES).every(templateId => 
		templateId && !templateId.startsWith('d-placeholder')
	);
}

/**
 * Get all configured template IDs for debugging
 */
export function getTemplateIds() {
	return SENDGRID_TEMPLATES;
}

/**
 * Validate that all required templates are configured
 */
export function validateTemplateConfiguration(): { valid: boolean; missing: string[] } {
	const missing: string[] = [];
	
	Object.entries(SENDGRID_TEMPLATES).forEach(([key, templateId]) => {
		if (!templateId || templateId.startsWith('d-xxxxxxxxxx') || templateId === 'undefined') {
			missing.push(key);
		}
	});
	
	return {
		valid: missing.length === 0,
		missing
	};
}
