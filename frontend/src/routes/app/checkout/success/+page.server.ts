import { adminDb } from '$lib/server/firebase';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { sendReceiptEmail } from '$lib/server/email';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const configId = url.searchParams.get('configId');
	if (!configId) {
		throw error(400, 'Missing configuration ID');
	}

	const configDoc = await adminDb.collection('livestreamConfigurations').doc(configId).get();

	if (!configDoc.exists) {
		throw error(404, 'Configuration not found');
	}

	const configData = configDoc.data();

	if (configData?.userId !== locals.user.uid) {
		throw error(403, 'Forbidden');
	}

	const config = {
		id: configDoc.id,
		...configData,
		createdAt: configData.createdAt?.toDate ? configData.createdAt.toDate().toISOString() : null
	};

	if (locals.user.email) {
		// We can send the raw configData to the email function if needed,
		// but the page needs the serialized version.
		await sendReceiptEmail(locals.user.email, { id: configDoc.id, ...configData });
	}

	return {
		config
	};
};