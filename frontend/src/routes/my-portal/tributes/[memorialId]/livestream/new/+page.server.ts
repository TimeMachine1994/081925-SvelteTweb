import { doc, getDoc } from 'firebase/firestore';
import { db } from '$lib/server/firebase';
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { Memorial } from '$lib/types/memorial';
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } from '$env/static/private';

export const load: PageServerLoad = async ({ params, locals }) => {
	console.log('Loading memorial data for livestream creation 📝');
	if (!locals.user?.admin) {
		console.error('Permission denied: User is not an admin 🚫');
		throw error(403, 'Permission denied');
	}

	const memorialRef = doc(db, 'memorials', params.memorialId);
	const memorialSnap = await getDoc(memorialRef);

	if (!memorialSnap.exists()) {
		console.error('Memorial not found with ID:', params.memorialId);
		throw error(404, 'Memorial not found');
	}

	const memorial = { id: memorialSnap.id, ...memorialSnap.data() } as Memorial;
	console.log('Memorial data loaded successfully 👍');
	return { memorial };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		console.log('Create livestream action initiated 🚀');
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const memorialId = params.memorialId;

		if (!name) {
			console.error('Validation failed: Livestream name is missing 😟');
			return fail(400, { error: 'Livestream name is required.' });
		}

		try {
			console.log('Sending request to Cloudflare API... ☁️');
			const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					meta: { name },
					recording: { mode: 'automatic' }
				})
			});

			if (!response.ok) {
				const errorBody = await response.text();
				console.error(`Cloudflare API error: ${response.status} - ${errorBody} ❌`);
				return fail(response.status, { error: `Cloudflare API error: ${errorBody}` });
			}

			const data = await response.json();
			console.log('Cloudflare response received ✅:', data.result);

			const livestreamData = {
				uid: data.result.uid,
				rtmpsUrl: data.result.rtmps.url,
				streamKey: data.result.rtmps.streamKey,
				name
			};

			console.log('Updating memorial document in Firestore... 🔥');
			const memorialRef = doc(db, 'memorials', memorialId);
			await updateDoc(memorialRef, { livestream: livestreamData });
			console.log('Firestore document updated successfully 👍');

		} catch (err: any) {
			console.error('An unexpected error occurred:', err.message);
			return fail(500, { error: 'An unexpected error occurred.' });
		}

		console.log('Redirecting to the memorial edit page...');
		redirect(303, `/my-portal/tributes/${memorialId}/edit`);
	}
};