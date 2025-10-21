import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	sendEnhancedRegistrationEmail,
	sendRegistrationEmail,
	sendInvitationEmail,
	sendEmailChangeConfirmation,
	sendPaymentConfirmationEmail,
	sendPaymentActionRequiredEmail,
	sendPaymentFailureEmail,
	sendContactFormEmails,
	validateTemplateConfiguration,
	getTemplateIds
} from '$lib/server/email';
import type {
	EnhancedRegistrationEmailData,
	InvitationEmailData,
	EmailChangeConfirmationData,
	PaymentEmailData,
	ContactFormData
} from '$lib/server/email';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { templateType, testEmail, customData } = await request.json();

		if (!testEmail) {
			return json({ error: 'Test email address is required' }, { status: 400 });
		}

		// Validate template configuration first
		const validation = validateTemplateConfiguration();
		if (!validation.valid) {
			console.warn('⚠️ Some templates are not configured:', validation.missing);
		}

		let result;
		switch (templateType) {
			case 'enhanced_registration':
				const enhancedData: EnhancedRegistrationEmailData = {
					email: testEmail,
					lovedOneName: customData?.lovedOneName || 'John Doe',
					memorialUrl: customData?.memorialUrl || 'https://tributestream.com/john-doe-memorial',
					ownerName: customData?.ownerName || 'Jane Doe',
					password: customData?.password || 'TempPass123!'
				};
				result = await sendEnhancedRegistrationEmail(enhancedData);
				break;

			case 'basic_registration':
				result = await sendRegistrationEmail(
					testEmail,
					customData?.password || 'TempPass123!',
					customData?.lovedOneName || 'John Doe'
				);
				break;

			case 'invitation':
				const invitationData: InvitationEmailData = {
					to: testEmail,
					fromName: customData?.fromName || 'Jane Doe',
					memorialName: customData?.memorialName || 'John Doe Memorial',
					invitationId: customData?.invitationId || 'test-invitation-123'
				};
				result = await sendInvitationEmail(invitationData);
				break;

			case 'email_change':
				const emailChangeData: EmailChangeConfirmationData = {
					to: testEmail,
					userName: customData?.userName || 'Jane Doe',
					confirmationUrl: customData?.confirmationUrl || 'https://tributestream.com/confirm-email?token=test123'
				};
				result = await sendEmailChangeConfirmation(emailChangeData);
				break;

			case 'payment_confirmation':
				const paymentConfirmData: PaymentEmailData = {
					memorialId: customData?.memorialId || 'test-memorial-123',
					paymentIntentId: customData?.paymentIntentId || 'pi_test123456789',
					customerEmail: testEmail,
					lovedOneName: customData?.lovedOneName || 'John Doe',
					amount: customData?.amount || 299.99,
					paymentDate: new Date()
				};
				result = await sendPaymentConfirmationEmail(paymentConfirmData);
				break;

			case 'payment_action':
				const paymentActionData: PaymentEmailData = {
					memorialId: customData?.memorialId || 'test-memorial-123',
					paymentIntentId: customData?.paymentIntentId || 'pi_test123456789',
					customerEmail: testEmail,
					lovedOneName: customData?.lovedOneName || 'John Doe',
					nextActionUrl: customData?.nextActionUrl || 'https://tributestream.com/payment/confirm'
				};
				result = await sendPaymentActionRequiredEmail(paymentActionData);
				break;

			case 'payment_failure':
				const paymentFailureData: PaymentEmailData = {
					memorialId: customData?.memorialId || 'test-memorial-123',
					paymentIntentId: customData?.paymentIntentId || 'pi_test123456789',
					customerEmail: testEmail,
					lovedOneName: customData?.lovedOneName || 'John Doe',
					failureReason: customData?.failureReason || 'Card declined - insufficient funds'
				};
				result = await sendPaymentFailureEmail(paymentFailureData);
				break;

			case 'contact_form':
				const contactData: ContactFormData = {
					name: customData?.name || 'Test User',
					email: testEmail,
					subject: customData?.subject || 'Test Contact Form Submission',
					message: customData?.message || 'This is a test message from the email testing interface.',
					timestamp: new Date()
				};
				result = await sendContactFormEmails(contactData);
				break;

			default:
				return json({ error: 'Invalid template type' }, { status: 400 });
		}

		return json({
			success: true,
			message: `Test email sent successfully to ${testEmail}`,
			templateType,
			validation
		});
	} catch (error) {
		console.error('Email test error:', error);
		return json(
			{
				error: 'Failed to send test email',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

// GET endpoint to retrieve template configuration info
export const GET: RequestHandler = async () => {
	try {
		const validation = validateTemplateConfiguration();
		const templateIds = getTemplateIds();

		return json({
			validation,
			templateIds,
			availableTemplates: [
				'enhanced_registration',
				'basic_registration',
				'invitation',
				'email_change',
				'payment_confirmation',
				'payment_action',
				'payment_failure',
				'contact_form'
			]
		});
	} catch (error) {
		console.error('Template info error:', error);
		return json(
			{ error: 'Failed to get template information' },
			{ status: 500 }
		);
	}
};
