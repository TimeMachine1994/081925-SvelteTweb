import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/firebase';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login?redirect=/funeral-director/stream');
	}

	if (locals.user.role !== 'funeral_director') {
		throw redirect(303, '/profile?error=funeral-director-only');
	}

	try {
		const memorialsSnapshot = await adminDb
			.collection('memorials')
			.where('funeralDirector.id', '==', locals.user.uid)
			.orderBy('createdAt', 'desc')
			.get();

		const memorials = await Promise.all(
			memorialsSnapshot.docs.map(async (doc) => {
				const data = doc.data();
				
				const activeStreamQuery = await adminDb
					.collection('streams')
					.where('memorialId', '==', doc.id)
					.where('status', 'in', ['pending', 'live'])
					.limit(1)
					.get();

				const hasActiveStream = !activeStreamQuery.empty;
				const activeStreamId = hasActiveStream ? activeStreamQuery.docs[0].id : null;

				const serviceDate = data.services?.main?.time?.date;
				const serviceTime = data.services?.main?.time?.time;
				const upcomingService = serviceDate && new Date(serviceDate) > new Date();

				return {
					id: doc.id,
					lovedOneName: data.lovedOneName,
					fullSlug: data.fullSlug,
					services: {
						main: {
							time: {
								date: serviceDate || null,
								time: serviceTime || null
							},
							location: {
								name: data.services?.main?.location?.name || 'Location TBD',
								address: data.services?.main?.location?.address || ''
							}
						}
					},
					createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
					hasActiveStream,
					activeStreamId,
					upcomingService
				};
			})
		);

		memorials.sort((a, b) => {
			if (a.hasActiveStream && !b.hasActiveStream) return -1;
			if (!a.hasActiveStream && b.hasActiveStream) return 1;
			if (a.upcomingService && !b.upcomingService) return -1;
			if (!a.upcomingService && b.upcomingService) return 1;
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});

		return {
			memorials
		};
	} catch (error) {
		console.error('Error loading memorials for streaming:', error);
		return {
			memorials: []
		};
	}
};
