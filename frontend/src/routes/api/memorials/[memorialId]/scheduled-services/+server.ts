import { json, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { requireViewAccess, requireEditAccess } from '$lib/server/memorialMiddleware';
import type { RequestHandler } from './$types';
import type { Memorial, ServiceDetails, AdditionalServiceDetails } from '$lib/types/memorial';

interface ScheduledService {
	id: string;
	title: string;
	location: {
		name: string;
		address: string;
		isUnknown: boolean;
	};
	time: {
		date: string | null;
		time: string | null;
		isUnknown: boolean;
	};
	hours: number;
	streamKey?: string;
	streamUrl?: string;
	sessionId?: string;
	status: 'scheduled' | 'live' | 'completed';
	createdAt: Date;
	type: 'main' | 'additional';
	index?: number; // For additional services
}

// Helper function to generate unique stream credentials
function generateStreamCredentials() {
	const streamKey = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	const streamUrl = `rtmps://live.cloudflare.com:443/live/${streamKey}`;
	return { streamKey, streamUrl };
}

// Helper function to convert service data to scheduled service format
function serviceToScheduledService(
	service: ServiceDetails | AdditionalServiceDetails, 
	type: 'main' | 'additional',
	index?: number
): ScheduledService {
	const { streamKey, streamUrl } = generateStreamCredentials();
	
	// Generate title based on service type and location
	let title = '';
	if (type === 'main') {
		title = service.location.name || 'Main Service';
	} else {
		title = service.location.name || `Additional Service ${(index || 0) + 1}`;
	}
	
	return {
		id: `${type}_${index !== undefined ? index : 'main'}`,
		title,
		location: service.location,
		time: service.time,
		hours: service.hours,
		streamKey,
		streamUrl,
		status: 'scheduled',
		createdAt: new Date(),
		type,
		index
	};
}

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	const { memorialId } = params;
	const { uid, role } = locals.user;

	// Verify memorial access
	await requireViewAccess({ memorialId, user: { uid, email: locals.user.email, role, isAdmin: locals.user.isAdmin } });

	try {
		// Get memorial data to extract services
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		
		if (!memorialDoc.exists) {
			throw error(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data() as Memorial;
		const scheduledServices: ScheduledService[] = [];

		// Convert main service to scheduled service
		if (memorial.services?.main) {
			const mainService = serviceToScheduledService(memorial.services.main, 'main');
			scheduledServices.push(mainService);
		}

		// Convert additional services to scheduled services
		if (memorial.services?.additional && memorial.services.additional.length > 0) {
			memorial.services.additional.forEach((additionalService, index) => {
				if (additionalService.enabled) {
					const scheduledService = serviceToScheduledService(additionalService, 'additional', index);
					scheduledServices.push(scheduledService);
				}
			});
		}

		// Sort by date/time
		scheduledServices.sort((a, b) => {
			const dateA = a.time.date ? new Date(a.time.date).getTime() : 0;
			const dateB = b.time.date ? new Date(b.time.date).getTime() : 0;
			return dateA - dateB;
		});

		console.log(`📅 Found ${scheduledServices.length} scheduled services for memorial ${memorialId}`);

		return json({
			success: true,
			services: scheduledServices
		});

	} catch (err) {
		console.error('Error fetching scheduled services:', err);
		throw error(500, 'Failed to fetch scheduled services');
	}
};

export const POST: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	const { memorialId } = params;
	const { uid, role } = locals.user;

	// Verify memorial access (edit permission required)
	await requireEditAccess({ memorialId, user: { uid, email: locals.user.email, role, isAdmin: locals.user.isAdmin } });

	try {
		const body = await request.json();
		const { title, scheduleType, scheduledTime, location, hours = 2 } = body;

		if (!title) {
			throw error(400, 'Stream title is required');
		}

		// Generate stream credentials
		const { streamKey, streamUrl } = generateStreamCredentials();

		// Create new scheduled service
		const newService: ScheduledService = {
			id: `custom_${Date.now()}`,
			title,
			location: location || {
				name: title,
				address: '',
				isUnknown: true
			},
			time: {
				date: scheduleType === 'scheduled' && scheduledTime ? scheduledTime.split('T')[0] : null,
				time: scheduleType === 'scheduled' && scheduledTime ? scheduledTime.split('T')[1] : null,
				isUnknown: scheduleType === 'now'
			},
			hours,
			streamKey,
			streamUrl,
			status: scheduleType === 'now' ? 'live' : 'scheduled',
			createdAt: new Date(),
			type: 'additional'
		};

		// For MVP, we'll store this in the memorial's livestream config
		// In a full implementation, you might want a separate collection
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		await memorialRef.update({
			[`customStreams.${newService.id}`]: newService,
			updatedAt: new Date()
		});

		console.log(`✅ Created new scheduled service: ${title} for memorial ${memorialId}`);

		return json({
			success: true,
			service: newService
		});

	} catch (err) {
		console.error('Error creating scheduled service:', err);
		throw error(500, 'Failed to create scheduled service');
	}
};
