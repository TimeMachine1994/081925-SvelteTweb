import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import type { EmailType } from '$lib/types/email-audit';
import {
	sendEnhancedRegistrationEmail,
	sendRegistrationEmail,
	sendFuneralDirectorRegistrationEmail,
	sendInvitationEmail,
	sendEmailChangeConfirmation,
	sendPaymentConfirmationEmail,
	sendPaymentActionRequiredEmail,
	sendPaymentFailureEmail,
	sendPasswordResetEmail,
	sendOwnerWelcomeEmail,
	sendFuneralDirectorWelcomeEmail,
	sendContactFormEmails,
	sendInvoiceEmail,
	sendInvoiceReceiptEmail
} from '$lib/server/email';

/**
 * POST /api/admin/email-logs/[id]/resend
 * 
 * Resend an email using the stored template data
 * 
 * Request body (optional):
 * - overrideEmail: string - Send to a different email address
 */
export const POST: RequestHandler = async ({ locals, params, request }) => {
	// Auth check - admin only
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(401, 'Unauthorized - Admin access required');
	}

	const { id } = params;

	if (!id) {
		throw error(400, 'Email log ID is required');
	}

	try {
		// Parse request body
		let overrideEmail: string | undefined;
		try {
			const body = await request.json();
			overrideEmail = body.overrideEmail;
		} catch {
			// No body or invalid JSON - that's fine
		}

		// Get the original email log
		const doc = await adminDb.collection('email_audit_logs').doc(id).get();

		if (!doc.exists) {
			throw error(404, 'Email log not found');
		}

		const data = doc.data()!;
		const emailType = data.type as EmailType;
		const templateData = data.templateData;
		const recipient = overrideEmail || data.to;

		// Context for the resend
		const context = {
			memorialId: data.memorialId,
			userId: data.userId,
			triggeredByAdminId: locals.user.uid
		};

		// Resend based on email type
		switch (emailType) {
			case 'enhanced_registration':
				await sendEnhancedRegistrationEmail({
					email: recipient,
					lovedOneName: templateData.lovedOneName,
					memorialUrl: templateData.memorialUrl,
					ownerName: templateData.ownerName,
					password: templateData.password || 'PASSWORD_NOT_STORED',
					magicLink: templateData.magicLink
				}, context);
				break;

			case 'basic_registration':
				await sendRegistrationEmail({
					email: recipient,
					lovedOneName: templateData.lovedOneName,
					memorialUrl: templateData.memorialUrl,
					familyName: templateData.familyName,
					password: templateData.password,
					additionalNotes: templateData.additionalNotes
				}, context);
				break;

			case 'funeral_director_registration':
				await sendFuneralDirectorRegistrationEmail({
					email: recipient,
					familyName: templateData.familyName,
					lovedOneName: templateData.lovedOneName,
					memorialUrl: templateData.memorialUrl,
					password: templateData.password || 'PASSWORD_NOT_STORED',
					additionalNotes: templateData.additionalNotes,
					calculatorMagicLink: templateData.calculatorMagicLink
				}, context);
				break;

			case 'invitation':
				await sendInvitationEmail({
					to: recipient,
					fromName: templateData.fromName,
					memorialName: templateData.memorialName,
					invitationId: templateData.invitationId
				}, context);
				break;

			case 'email_change_confirmation':
				await sendEmailChangeConfirmation({
					to: recipient,
					userName: templateData.userName,
					confirmationUrl: templateData.confirmationUrl
				}, { userId: data.userId });
				break;

			case 'payment_confirmation':
				await sendPaymentConfirmationEmail({
					memorialId: data.memorialId || '',
					paymentIntentId: templateData.paymentIntentId,
					customerEmail: recipient,
					lovedOneName: templateData.lovedOneName,
					amount: parseFloat(templateData.amount) || 0,
					paymentDate: new Date()
				});
				break;

			case 'payment_action_required':
				await sendPaymentActionRequiredEmail({
					memorialId: data.memorialId || '',
					paymentIntentId: templateData.paymentIntentId,
					customerEmail: recipient,
					lovedOneName: templateData.lovedOneName,
					nextActionUrl: templateData.nextActionUrl
				});
				break;

			case 'payment_failure':
				await sendPaymentFailureEmail({
					memorialId: data.memorialId || '',
					paymentIntentId: templateData.paymentIntentId,
					customerEmail: recipient,
					lovedOneName: templateData.lovedOneName,
					failureReason: templateData.failureReason
				});
				break;

			case 'password_reset':
				await sendPasswordResetEmail({
					email: recipient,
					displayName: templateData.displayName,
					resetLink: templateData.resetLink
				}, { userId: data.userId });
				break;

			case 'owner_welcome':
				await sendOwnerWelcomeEmail({
					email: recipient,
					displayName: templateData.displayName
				}, { userId: data.userId });
				break;

			case 'funeral_director_welcome':
				await sendFuneralDirectorWelcomeEmail({
					email: recipient,
					displayName: templateData.displayName
				}, { userId: data.userId });
				break;

			case 'contact_form_support':
			case 'contact_form_confirmation':
				await sendContactFormEmails({
					name: templateData.name,
					email: overrideEmail || templateData.email,
					subject: templateData.subject,
					message: templateData.message,
					timestamp: new Date()
				});
				break;

			case 'invoice':
				await sendInvoiceEmail({
					customerEmail: recipient,
					customerName: templateData.customerName,
					invoiceId: templateData.invoiceId || data.invoiceId || '',
					items: templateData.items || [],
					total: parseInt(String(templateData.total).replace(/[^0-9]/g, '')) || 0,
					paymentUrl: templateData.paymentUrl
				});
				break;

			case 'invoice_receipt':
				await sendInvoiceReceiptEmail({
					customerEmail: recipient,
					customerName: templateData.customerName,
					invoiceId: templateData.invoiceId || data.invoiceId || '',
					items: templateData.items || [],
					total: parseInt(String(templateData.total).replace(/[^0-9]/g, '')) || 0,
					paidAt: new Date(),
					paymentIntentId: templateData.paymentIntentId,
					receiptUrl: templateData.receiptUrl
				});
				break;

			default:
				throw error(400, `Unsupported email type for resend: ${emailType}`);
		}

		return json({
			success: true,
			message: `Email resent successfully to ${recipient}`,
			originalLogId: id,
			resentTo: recipient
		});
	} catch (err: any) {
		if (err.status) throw err;
		console.error('Error resending email:', err);
		throw error(500, `Failed to resend email: ${err.message}`);
	}
};
