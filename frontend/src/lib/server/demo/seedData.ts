/**
 * Demo Data Seeding Functions
 * Creates realistic memorials, streams, slideshows, and condolences for demo sessions
 */

import { adminDb } from '$lib/server/firebase';
import type {
	DemoScenarioData,
	DemoMemorialTemplate,
	DemoStreamTemplate,
	DemoCondolence
} from '$lib/types/demo-data';
import { DEMO_SCENARIOS } from '$lib/types/demo-data';
import crypto from 'crypto';

/**
 * Generate a unique, URL-friendly slug
 */
function generateSlug(fullName: string): string {
	const base = fullName
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	
	const uniqueId = crypto.randomBytes(4).toString('hex');
	return `${base}-${uniqueId}`;
}

/**
 * Seed a memorial for a demo session
 */
export async function seedDemoMemorial(
	template: DemoMemorialTemplate,
	sessionId: string,
	ownerId: string
): Promise<string> {
	const slug = generateSlug(template.fullName);
	const memorialId = crypto.randomUUID();
	const now = new Date();

	// Parse dates
	const birthDate = new Date(template.dateOfBirth);
	const deathDate = new Date(template.dateOfDeath);
	const age = deathDate.getFullYear() - birthDate.getFullYear();

	const memorialData = {
		id: memorialId,
		fullSlug: slug,
		fullName: template.fullName,
		dateOfBirth: birthDate.toISOString(),
		dateOfDeath: deathDate.toISOString(),
		age: age,
		biography: template.biography,
		obituary: template.obituaryText || '',
		profilePhotoUrl: template.profilePhotoUrl || null,
		coverPhotoUrl: template.coverPhotoUrl || null,
		
		// Owner information
		createdBy: ownerId,
		ownerId: ownerId,
		
		// Demo session tracking
		isDemo: true,
		demoSessionId: sessionId,
		
		// Service information
		serviceDate: template.serviceInfo?.date || null,
		serviceTime: template.serviceInfo?.time || null,
		serviceLocation: template.serviceInfo?.location || null,
		serviceAddress: template.serviceInfo?.address || null,
		
		// Funeral home information
		funeralHomeName: template.funeralHomeInfo?.name || null,
		funeralHomeAddress: template.funeralHomeInfo?.address || null,
		funeralHomePhone: template.funeralHomeInfo?.phone || null,
		
		// Privacy settings
		isPublic: true,
		allowCondolences: true,
		
		// Metadata
		createdAt: now,
		updatedAt: now,
		
		// Stats
		viewCount: Math.floor(Math.random() * 500) + 100, // Random between 100-600
		condolenceCount: 0, // Will be updated as condolences are added
		
		// Status
		status: 'published'
	};

	await adminDb.collection('memorials').doc(memorialId).set(memorialData);
	
	console.log(`[DEMO_SEED] Created memorial: ${template.fullName} (${memorialId})`);
	return memorialId;
}

/**
 * Seed streams for a demo memorial
 */
export async function seedDemoStreams(
	memorialId: string,
	templates: DemoStreamTemplate[],
	sessionId: string,
	createdById: string
): Promise<string[]> {
	const streamIds: string[] = [];

	for (const template of templates) {
		const streamId = crypto.randomUUID();
		const now = new Date();

		// Determine stream status based on scheduling
		let status = 'ready';
		if (template.isScheduled && template.scheduledStartTime) {
			const scheduledTime = new Date(template.scheduledStartTime);
			status = scheduledTime > now ? 'scheduled' : 'completed';
		} else if (!template.isScheduled) {
			status = 'completed';
		}

		const streamData = {
			id: streamId,
			memorialId: memorialId,
			title: template.title,
			description: template.description,
			
			// Demo session tracking
			isDemo: true,
			demoSessionId: sessionId,
			
			// Scheduling
			scheduledStartTime: template.scheduledStartTime || null,
			isScheduled: template.isScheduled,
			
			// Status
			status: status,
			isLive: false,
			
			// Cloudflare Stream placeholders (demo streams don't actually stream)
			rtmpUrl: `rtmp://demo.tributestream.live/live`,
			streamKey: `demo_${crypto.randomBytes(16).toString('hex')}`,
			playbackUrl: status === 'completed' ? `https://demo.cloudflarestream.com/${streamId}` : null,
			
			// Visibility
			isHidden: false,
			isPublic: true,
			
			// Creator
			createdBy: createdById,
			
			// Metadata
			createdAt: now,
			updatedAt: now,
			
			// Stats for completed streams
			...(status === 'completed' && {
				viewerCount: Math.floor(Math.random() * 300) + 50,
				peakViewers: Math.floor(Math.random() * 150) + 25,
				recordingAvailable: true,
				recordingUrl: `https://demo.cloudflarestream.com/${streamId}/recording`
			})
		};

		await adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('streams')
			.doc(streamId)
			.set(streamData);

		streamIds.push(streamId);
		console.log(`[DEMO_SEED] Created stream: ${template.title} (${streamId})`);
	}

	return streamIds;
}

/**
 * Seed condolences for a demo memorial
 */
export async function seedDemoCondolences(
	memorialId: string,
	templates: DemoCondolence[],
	sessionId: string
): Promise<number> {
	let count = 0;

	for (const template of templates) {
		const condolenceId = crypto.randomUUID();

		const condolenceData = {
			id: condolenceId,
			memorialId: memorialId,
			authorName: template.authorName,
			authorEmail: null, // Demo condolences don't have emails
			message: template.message,
			relationship: template.relationship || null,
			isPublic: template.isPublic,
			
			// Demo session tracking
			isDemo: true,
			demoSessionId: sessionId,
			
			// Metadata
			createdAt: template.createdAt || new Date(),
			
			// Moderation
			isApproved: true,
			isReported: false
		};

		await adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('condolences')
			.doc(condolenceId)
			.set(condolenceData);

		count++;
	}

	// Update memorial condolence count
	await adminDb.collection('memorials').doc(memorialId).update({
		condolenceCount: count
	});

	console.log(`[DEMO_SEED] Created ${count} condolences for memorial ${memorialId}`);
	return count;
}

/**
 * Seed all data for a specific scenario
 */
export async function seedDemoScenario(
	scenario: string,
	sessionId: string,
	ownerId: string
): Promise<{ memorialId: string; slug: string }> {
	console.log(`[DEMO_SEED] Starting data seeding for scenario: ${scenario}`);

	const scenarioData = DEMO_SCENARIOS[scenario];
	if (!scenarioData) {
		throw new Error(`Unknown demo scenario: ${scenario}`);
	}

	// 1. Create memorial
	const memorialId = await seedDemoMemorial(
		scenarioData.memorial,
		sessionId,
		ownerId
	);

	const memorial = await adminDb.collection('memorials').doc(memorialId).get();
	const slug = memorial.data()?.fullSlug;

	// 2. Create streams
	if (scenarioData.streams && scenarioData.streams.length > 0) {
		await seedDemoStreams(
			memorialId,
			scenarioData.streams,
			sessionId,
			ownerId
		);
	}

	// 3. Create condolences
	if (scenarioData.condolences && scenarioData.condolences.length > 0) {
		await seedDemoCondolences(
			memorialId,
			scenarioData.condolences,
			sessionId
		);
	}

	// 4. Slideshows would be created here (Phase 2 later)
	// For now, we'll skip slideshow creation as they require actual image assets

	console.log(`[DEMO_SEED] ✅ Completed data seeding for ${scenario}`);
	console.log(`[DEMO_SEED] Memorial ID: ${memorialId}`);
	console.log(`[DEMO_SEED] Memorial Slug: ${slug}`);

	return { memorialId, slug };
}

/**
 * Clean up all demo data for a session (used by cleanup API)
 */
export async function cleanupDemoData(sessionId: string): Promise<void> {
	console.log(`[DEMO_CLEANUP] Cleaning up demo data for session: ${sessionId}`);

	// Get all memorials for this session
	const memorialsSnapshot = await adminDb
		.collection('memorials')
		.where('demoSessionId', '==', sessionId)
		.get();

	for (const memorialDoc of memorialsSnapshot.docs) {
		const memorialId = memorialDoc.id;

		// Delete streams subcollection
		const streamsSnapshot = await adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('streams')
			.where('demoSessionId', '==', sessionId)
			.get();

		for (const streamDoc of streamsSnapshot.docs) {
			await streamDoc.ref.delete();
		}

		// Delete condolences subcollection
		const condolencesSnapshot = await adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('condolences')
			.where('demoSessionId', '==', sessionId)
			.get();

		for (const condolenceDoc of condolencesSnapshot.docs) {
			await condolenceDoc.ref.delete();
		}

		// Delete memorial
		await memorialDoc.ref.delete();
	}

	console.log(`[DEMO_CLEANUP] ✅ Cleaned up demo data for session: ${sessionId}`);
}
