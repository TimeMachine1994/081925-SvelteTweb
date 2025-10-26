import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { debugTemplateConfiguration, validateTemplateConfiguration, getTemplateIds } from '$lib/server/email';
import { SENDGRID_API_KEY, FROM_EMAIL } from '$env/static/private';

export const GET: RequestHandler = async () => {
	try {
		// Log debug info to console
		debugTemplateConfiguration();
		
		// Get validation results
		const validation = validateTemplateConfiguration();
		const templateIds = getTemplateIds();
		
		// Create safe response (no sensitive data)
		const response = {
			timestamp: new Date().toISOString(),
			configuration: {
				apiKeyConfigured: !!SENDGRID_API_KEY && SENDGRID_API_KEY !== 'mock_key',
				apiKeyLength: SENDGRID_API_KEY ? SENDGRID_API_KEY.length : 0,
				fromEmail: FROM_EMAIL,
				templateValidation: validation,
				templateIds: Object.entries(templateIds).map(([key, id]) => ({
					name: key,
					id: id,
					isConfigured: id && id !== 'placeholder',
					isPlaceholder: id === 'placeholder'
				}))
			},
			recommendations: []
		};
		
		// Add recommendations based on issues found
		if (!response.configuration.apiKeyConfigured) {
			response.recommendations.push('Set SENDGRID_API_KEY environment variable');
		}
		
		if (!response.configuration.fromEmail) {
			response.recommendations.push('Set FROM_EMAIL environment variable');
		}
		
		if (!validation.valid) {
			validation.missing.forEach(templateName => {
				response.recommendations.push(`Set SENDGRID_TEMPLATE_${templateName} environment variable`);
			});
		}
		
		return json(response);
		
	} catch (error) {
		console.error('SendGrid debug error:', error);
		return json(
			{ 
				error: 'Failed to debug SendGrid configuration',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
