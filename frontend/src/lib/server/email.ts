import { env } from '$env/dynamic/private';
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = env.SENDGRID_API_KEY;
const FROM_EMAIL = env.FROM_EMAIL;

if (SENDGRID_API_KEY && SENDGRID_API_KEY !== 'mock_key') {
	sgMail.setApiKey(SENDGRID_API_KEY);
}

// SendGrid Dynamic Template IDs from environment variables
export const SENDGRID_TEMPLATES = {
	ENHANCED_REGISTRATION: env.SENDGRID_TEMPLATE_ENHANCED_REGISTRATION || 'placeholder',
	BASIC_REGISTRATION: env.SENDGRID_TEMPLATE_BASIC_REGISTRATION || 'placeholder',
	INVITATION: env.SENDGRID_TEMPLATE_INVITATION || 'placeholder',
	EMAIL_CHANGE_CONFIRMATION: env.SENDGRID_TEMPLATE_EMAIL_CHANGE || 'placeholder',
	PAYMENT_CONFIRMATION: env.SENDGRID_TEMPLATE_PAYMENT_CONFIRMATION || 'placeholder',
	PAYMENT_ACTION_REQUIRED: env.SENDGRID_TEMPLATE_PAYMENT_ACTION || 'placeholder',
	PAYMENT_FAILURE: env.SENDGRID_TEMPLATE_PAYMENT_FAILURE || 'placeholder',
	CONTACT_SUPPORT: env.SENDGRID_TEMPLATE_CONTACT_SUPPORT || 'placeholder',
	CONTACT_CONFIRMATION: env.SENDGRID_TEMPLATE_CONTACT_CONFIRMATION || 'placeholder',
	PASSWORD_RESET: env.SENDGRID_TEMPLATE_PASSWORD_RESET || 'placeholder',
	OWNER_WELCOME: env.SENDGRID_TEMPLATE_OWNER_WELCOME || 'placeholder',
	FUNERAL_DIRECTOR_WELCOME: env.SENDGRID_TEMPLATE_FUNERAL_DIRECTOR_WELCOME || 'placeholder'
};

export interface EnhancedRegistrationEmailData {
	email: string;
	lovedOneName: string;
	memorialUrl: string;
	ownerName: string;
	password: string; // Add password for the enhanced email
	magicLink?: string; // Optional magic link for one-click access to memorial page
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

export interface PasswordResetEmailData {
	email: string;
	displayName: string;
	resetLink: string;
}

export interface OwnerWelcomeEmailData {
	email: string;
	displayName: string;
}

export interface FuneralDirectorWelcomeEmailData {
	email: string;
	displayName: string;
}

export interface BasicRegistrationEmailData {
	email: string;
	lovedOneName: string;
	memorialUrl: string;
	familyName: string;
	password?: string; // Optional - only for new users
	additionalNotes?: string;
}

export interface FuneralDirectorRegistrationEmailData {
	email: string;
	familyName: string;
	lovedOneName: string;
	memorialUrl: string;
	password: string;
	additionalNotes?: string;
	calculatorMagicLink?: string; // Magic link for one-click calculator access
}

export async function sendEnhancedRegistrationEmail(data: EnhancedRegistrationEmailData) {
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key') {
		console.warn('⚠️ SendGrid client not initialized. Skipping enhanced email.');
		return;
	}

	// Check if template is configured
	if (!SENDGRID_TEMPLATES.ENHANCED_REGISTRATION || SENDGRID_TEMPLATES.ENHANCED_REGISTRATION === 'placeholder') {
		console.error('💥 Enhanced registration template not configured. Template ID:', SENDGRID_TEMPLATES.ENHANCED_REGISTRATION);
		throw new Error('Email template not configured. Please check SENDGRID_TEMPLATE_ENHANCED_REGISTRATION environment variable.');
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
			magicLink: data.magicLink || '', // Include magic link for one-click access
			hasMagicLink: !!data.magicLink, // Boolean flag for template conditional logic
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

export async function sendRegistrationEmail(data: BasicRegistrationEmailData) {
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key') {
		console.warn('⚠️ SendGrid client not initialized. Skipping registration email.');
		return;
	}

	// Check if template is configured
	if (!SENDGRID_TEMPLATES.BASIC_REGISTRATION || SENDGRID_TEMPLATES.BASIC_REGISTRATION === 'placeholder') {
		console.error('💥 Basic registration template not configured. Template ID:', SENDGRID_TEMPLATES.BASIC_REGISTRATION);
		throw new Error('Email template not configured. Please check SENDGRID_TEMPLATE_BASIC_REGISTRATION environment variable.');
	}

	const msg = {
		to: data.email,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.BASIC_REGISTRATION,
		dynamicTemplateData: {
			familyName: data.familyName,
			lovedOneName: data.lovedOneName,
			memorialUrl: data.memorialUrl,
			email: data.email,
			password: data.password || '', // Empty string if not provided
			additionalNotes: data.additionalNotes || '',
			hasAdditionalNotes: !!data.additionalNotes,
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
		console.log('✅ Basic registration email sent via dynamic template to:', data.email);
	} catch (error) {
		console.error('💥 Exception sending registration email:', error);
		throw error;
	}
}

export async function sendFuneralDirectorRegistrationEmail(data: FuneralDirectorRegistrationEmailData) {
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key') {
		console.warn('⚠️ SendGrid client not initialized. Skipping funeral director registration email.');
		return;
	}

	// Check if template is configured
	if (!SENDGRID_TEMPLATES.ENHANCED_REGISTRATION || SENDGRID_TEMPLATES.ENHANCED_REGISTRATION === 'placeholder') {
		console.error('💥 Enhanced registration template not configured. Template ID:', SENDGRID_TEMPLATES.ENHANCED_REGISTRATION);
		throw new Error('Email template not configured. Please check SENDGRID_TEMPLATE_ENHANCED_REGISTRATION environment variable.');
	}

	const msg = {
		to: data.email,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.ENHANCED_REGISTRATION,
		dynamicTemplateData: {
			familyName: data.familyName,
			lovedOneName: data.lovedOneName,
			memorialUrl: data.memorialUrl,
			memorialSlug: data.memorialUrl.replace('https://tributestream.com/', ''),
			email: data.email,
			password: data.password,
			additionalNotes: data.additionalNotes || '',
			hasAdditionalNotes: !!data.additionalNotes,
			calculatorMagicLink: data.calculatorMagicLink || '', // Magic link for calculator
			hasCalculatorMagicLink: !!data.calculatorMagicLink, // Boolean flag for template
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
		console.log('✅ Funeral director registration email sent to:', data.email);
	} catch (error) {
		console.error('💥 Exception sending funeral director registration email:', error);
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
 * Send password reset email using dynamic template
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key') {
		console.warn('⚠️ SendGrid client not initialized. Skipping password reset email.');
		return;
	}

	// Check if template is configured
	if (!SENDGRID_TEMPLATES.PASSWORD_RESET || SENDGRID_TEMPLATES.PASSWORD_RESET === 'placeholder') {
		console.error('💥 Password reset template not configured. Template ID:', SENDGRID_TEMPLATES.PASSWORD_RESET);
		throw new Error('Password reset email template not configured. Please check SENDGRID_TEMPLATE_PASSWORD_RESET environment variable.');
	}

	const msg = {
		to: data.email,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.PASSWORD_RESET,
		dynamicTemplateData: {
			displayName: data.displayName || 'User',
			email: data.email,
			resetLink: data.resetLink,
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
		console.log('✅ Password reset email sent via dynamic template to:', data.email);
	} catch (error) {
		console.error('💥 Exception sending password reset email:', error);
		throw error;
	}
}

/**
 * Send owner welcome email after registration
 */
export async function sendOwnerWelcomeEmail(data: OwnerWelcomeEmailData) {
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key') {
		console.warn('⚠️ SendGrid client not initialized. Skipping owner welcome email.');
		return;
	}

	// Check if template is configured
	if (!SENDGRID_TEMPLATES.OWNER_WELCOME || SENDGRID_TEMPLATES.OWNER_WELCOME === 'placeholder') {
		console.error('💥 Owner welcome template not configured. Template ID:', SENDGRID_TEMPLATES.OWNER_WELCOME);
		throw new Error('Email template not configured. Please check SENDGRID_TEMPLATE_OWNER_WELCOME environment variable.');
	}

	const msg = {
		to: data.email,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.OWNER_WELCOME,
		dynamicTemplateData: {
			displayName: data.displayName,
			email: data.email,
			currentYear: new Date().getFullYear()
		}
	};

	try {
		await sgMail.send(msg);
		console.log('✅ Owner welcome email sent to:', data.email);
	} catch (error) {
		console.error('💥 Exception sending owner welcome email:', error);
		throw error;
	}
}

/**
 * Send funeral director welcome email after registration
 */
export async function sendFuneralDirectorWelcomeEmail(data: FuneralDirectorWelcomeEmailData) {
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key') {
		console.warn('⚠️ SendGrid client not initialized. Skipping funeral director welcome email.');
		return;
	}

	// Check if template is configured
	if (!SENDGRID_TEMPLATES.FUNERAL_DIRECTOR_WELCOME || SENDGRID_TEMPLATES.FUNERAL_DIRECTOR_WELCOME === 'placeholder') {
		console.error('💥 Funeral director welcome template not configured. Template ID:', SENDGRID_TEMPLATES.FUNERAL_DIRECTOR_WELCOME);
		throw new Error('Email template not configured. Please check SENDGRID_TEMPLATE_FUNERAL_DIRECTOR_WELCOME environment variable.');
	}

	const msg = {
		to: data.email,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.FUNERAL_DIRECTOR_WELCOME,
		dynamicTemplateData: {
			displayName: data.displayName,
			email: data.email,
			currentYear: new Date().getFullYear()
		}
	};

	try {
		await sgMail.send(msg);
		console.log('✅ Funeral director welcome email sent to:', data.email);
	} catch (error) {
		console.error('💥 Exception sending funeral director welcome email:', error);
		throw error;
	}
}

/**
 * Send contact form emails using dynamic templates
 */
export async function sendContactFormEmails(data: ContactFormData) {
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
	console.log('[EMAIL] 🚀 Starting sendContactFormEmails');
	console.log('[EMAIL] 📋 Form Data:', { 
		name: data.name, 
		email: data.email, 
		subject: data.subject,
		messageLength: data.message?.length || 0
	});

	// Step 1: Check SendGrid API Key
	console.log('[EMAIL] 🔑 Step 1: Checking SendGrid API Key...');
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key') {
		console.warn('[EMAIL] ⚠️ SendGrid client not initialized. Skipping contact form emails.');
		console.log('[EMAIL] SENDGRID_API_KEY status:', SENDGRID_API_KEY ? 'Set' : 'Not set');
		return;
	}
	console.log('[EMAIL] ✅ SendGrid API key is configured');
	console.log('[EMAIL] FROM_EMAIL:', FROM_EMAIL);

	// Step 2: Log Template IDs
	console.log('[EMAIL] 📝 Step 2: Checking Template IDs...');
	console.log('[EMAIL] Template Configuration:', {
		support: SENDGRID_TEMPLATES.CONTACT_SUPPORT,
		confirmation: SENDGRID_TEMPLATES.CONTACT_CONFIRMATION
	});

	// Step 3: Validate Templates
	console.log('[EMAIL] ✔️ Step 3: Validating templates...');
	const templateValidation = validateContactFormTemplates();
	if (!templateValidation.valid) {
		console.error('[EMAIL] 💥 Contact form templates not configured properly:', templateValidation.missing);
		throw new Error(`Contact form templates not configured: ${templateValidation.missing.join(', ')}`);
	}
	console.log('[EMAIL] ✅ Both templates validated successfully');

	const timestamp = data.timestamp || new Date();

	// Step 4: Build Support Email Message
	console.log('[EMAIL] 📧 Step 4: Building support email message...');
	const supportMsg = {
		to: 'austinbryanfilm@gmail.com',
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.CONTACT_SUPPORT,
		dynamicTemplateData: {
			name: data.name,
			email: data.email,
			subject: data.subject,
			message: data.message,
			submittedAt: timestamp.toLocaleString(),
			currentYear: new Date().getFullYear()
		}
	};
	console.log('[EMAIL] 📧 Support message built:', {
		to: supportMsg.to,
		from: supportMsg.from,
		templateId: supportMsg.templateId,
		dataKeys: Object.keys(supportMsg.dynamicTemplateData)
	});

	// Step 5: Build Confirmation Email Message
	console.log('[EMAIL] 📧 Step 5: Building confirmation email message...');
	const confirmationMsg = {
		to: data.email,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.CONTACT_CONFIRMATION,
		dynamicTemplateData: {
			name: data.name,
			subject: data.subject,
			message: data.message,
			submittedAt: timestamp.toLocaleString(),
			currentYear: new Date().getFullYear()
		}
	};
	console.log('[EMAIL] 📧 Confirmation message built:', {
		to: confirmationMsg.to,
		from: confirmationMsg.from,
		templateId: confirmationMsg.templateId,
		dataKeys: Object.keys(confirmationMsg.dynamicTemplateData)
	});

	try {
		// Step 6: Send Both Emails
		console.log('[EMAIL] 📤 Step 6: Sending emails...');
		console.log('[EMAIL] 📤 Attempting to send SUPPORT email to:', supportMsg.to);
		console.log('[EMAIL] 📤 Attempting to send CONFIRMATION email to:', confirmationMsg.to);
		console.log('[EMAIL] Using Promise.allSettled for independent sending...');

		// Send emails individually with separate tracking
		const results = await Promise.allSettled([
			sgMail.send(supportMsg).then(result => {
				console.log('[EMAIL] ✅ SUPPORT email sent successfully!');
				console.log('[EMAIL] Support email SendGrid response:', JSON.stringify(result, null, 2));
				return { type: 'support', success: true, result };
			}).catch(error => {
				console.error('[EMAIL] ❌ SUPPORT email FAILED:', error);
				if (error && typeof error === 'object' && 'response' in error) {
					const sgError = error as any;
					console.error('[EMAIL] Support email SendGrid error body:', sgError.response?.body);
				}
				throw error;
			}),
			sgMail.send(confirmationMsg).then(result => {
				console.log('[EMAIL] ✅ CONFIRMATION email sent successfully!');
				console.log('[EMAIL] Confirmation email SendGrid response:', JSON.stringify(result, null, 2));
				return { type: 'confirmation', success: true, result };
			}).catch(error => {
				console.error('[EMAIL] ❌ CONFIRMATION email FAILED:', error);
				if (error && typeof error === 'object' && 'response' in error) {
					const sgError = error as any;
					console.error('[EMAIL] Confirmation email SendGrid error body:', sgError.response?.body);
					console.error('[EMAIL] Confirmation email SendGrid status:', sgError.response?.statusCode);
					console.error('[EMAIL] Confirmation email SendGrid headers:', sgError.response?.headers);
				}
				throw error;
			})
		]);

		console.log('[EMAIL] 📊 Email sending results:', results);

		// Check individual results
		const supportResult = results[0];
		const confirmationResult = results[1];

		if (supportResult.status === 'fulfilled') {
			console.log('[EMAIL] ✅ Support email: SUCCESS');
		} else {
			console.error('[EMAIL] ❌ Support email: FAILED -', supportResult.reason);
		}

		if (confirmationResult.status === 'fulfilled') {
			console.log('[EMAIL] ✅ Confirmation email: SUCCESS');
		} else {
			console.error('[EMAIL] ❌ Confirmation email: FAILED -', confirmationResult.reason);
		}

		// If either failed, throw error
		if (supportResult.status === 'rejected' || confirmationResult.status === 'rejected') {
			const errors = [];
			if (supportResult.status === 'rejected') errors.push(`Support: ${supportResult.reason}`);
			if (confirmationResult.status === 'rejected') errors.push(`Confirmation: ${confirmationResult.reason}`);
			throw new Error(`Email sending failed: ${errors.join(', ')}`);
		}

		console.log('[EMAIL] ✅✅ Both contact form emails sent successfully via dynamic templates');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
	} catch (error) {
		console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.error('[EMAIL] 💥💥 EXCEPTION in sendContactFormEmails');
		console.error('[EMAIL] Error type:', typeof error);
		console.error('[EMAIL] Error:', error);
		if (error && typeof error === 'object' && 'response' in error) {
			const sgError = error as any;
			console.error('[EMAIL] 💥 SendGrid error details:', sgError.response?.body);
			console.error('[EMAIL] 💥 SendGrid status code:', sgError.response?.statusCode);
		}
		console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		throw error;
	}
}

/**
 * Utility function to test if dynamic templates are configured
 */
export function isDynamicTemplatesConfigured(): boolean {
	return Object.values(SENDGRID_TEMPLATES).every(templateId => 
		templateId && templateId !== 'placeholder' && !templateId.startsWith('d-xxxxxxxxxx')
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
		if (!templateId || templateId === 'placeholder' || templateId.startsWith('d-xxxxxxxxxx') || templateId === 'undefined') {
			missing.push(key);
		}
	});
	
	return {
		valid: missing.length === 0,
		missing
	};
}

/**
 * Validate that contact form templates specifically are configured
 */
export function validateContactFormTemplates(): { valid: boolean; missing: string[] } {
	const missing: string[] = [];
	const requiredTemplates = ['CONTACT_SUPPORT', 'CONTACT_CONFIRMATION'];
	
	requiredTemplates.forEach(key => {
		const templateId = SENDGRID_TEMPLATES[key as keyof typeof SENDGRID_TEMPLATES];
		if (!templateId || templateId === 'placeholder' || templateId.startsWith('d-xxxxxxxxxx') || templateId === 'undefined') {
			missing.push(key);
		}
	});
	
	return {
		valid: missing.length === 0,
		missing
	};
}
