import { getConfiguration } from '$lib/server/db/repos/livestreamConfigurations';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { sendEnhancedRegistrationEmail } from '$lib/server/email';
// Use fallback for PUBLIC_BASE_URL if not set
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';
import type { LivestreamConfig } from '$lib/types/livestream';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const configId = url.searchParams.get('configId');
	if (!configId) {
		throw error(400, 'Missing configuration ID');
	}

	const configData = await getConfiguration(configId);

	if (!configData) {
		throw error(404, 'Configuration not found');
	}

	if (configData?.userId !== locals.user.uid) {
		throw error(403, 'Forbidden');
	}

	const config: LivestreamConfig = {
		...(configData as Omit<LivestreamConfig, 'id' | 'createdAt'>),
		id: configData.id,
		createdAt: configData.createdAt ?? undefined
	};

	if (locals.user.email && configData) {
		await sendEnhancedRegistrationEmail({
			email: locals.user.email,
			ownerName: locals.user.name || 'Tributestream User',
			lovedOneName: configData.formData.lovedOneName,
			memorialUrl: `${PUBLIC_BASE_URL}/memorials/${configData.memorialId}`
		});
	}

	return {
		config
	};
};
