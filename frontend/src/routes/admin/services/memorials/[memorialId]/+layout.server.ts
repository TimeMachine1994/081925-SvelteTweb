import { error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { requireAdmin } from '$lib/server/adminGuard';
import type { LayoutServerLoad } from './$types';

/**
 * Shared load for every section of the memorial admin page (Overview,
 * Content, Broadcast, Chat, Billing, Settings).
 *
 * Loads only what's needed by *multiple* sections — the memorial doc and its
 * streams (used by Overview's readiness checklist, Content's block editor,
 * and Broadcast). Data needed by only one section (slideshows, schedule edit
 * requests) is loaded in that section's own `+page.server.ts` instead, so
 * the default landing tab doesn't pay for reads it doesn't render.
 */
export const load: LayoutServerLoad = async ({ params, locals }) => {
	const { memorialId } = params;

	requireAdmin(locals, { resource: 'memorial', action: 'read' });

	try {
		const [memorialDoc, streamsSnap, followersCountSnap] = await Promise.all([
			adminDb.collection('memorials').doc(memorialId).get(),
			adminDb.collection('streams').where('memorialId', '==', memorialId).get(),
			// Cheap aggregate count (not a full document read) — used only for the
			// Overview analytics stat.
			adminDb.collection('memorials').doc(memorialId).collection('followers').count().get()
		]);

		if (!memorialDoc.exists) {
			throw error(404, 'Memorial not found');
		}

		const memorialData = memorialDoc.data();
		if (!memorialData) {
			throw error(404, 'Memorial data not found');
		}

		const convertTimestamp = (value: any): string | null => {
			if (!value) return null;
			if (value.toDate && typeof value.toDate === 'function') return value.toDate().toISOString();
			if (value._seconds !== undefined) return new Date(value._seconds * 1000).toISOString();
			if (typeof value === 'string') return value;
			try {
				return new Date(value).toISOString();
			} catch {
				return null;
			}
		};

		const cleanCustomPricing = (pricing: any) => {
			if (!pricing) return null;
			return { ...pricing, setAt: convertTimestamp(pricing.setAt) };
		};

		const cleanCalculatorConfig = (config: any) => {
			if (!config) return null;
			const cleaned = { ...config };
			if (cleaned.formData) {
				cleaned.formData = { ...cleaned.formData };
				if (cleaned.formData.updatedAt) cleaned.formData.updatedAt = convertTimestamp(cleaned.formData.updatedAt);
				if (cleaned.formData.createdAt) cleaned.formData.createdAt = convertTimestamp(cleaned.formData.createdAt);
			}
			if (cleaned.lastModified) cleaned.lastModified = convertTimestamp(cleaned.lastModified);
			if (cleaned.paymentDate) cleaned.paymentDate = convertTimestamp(cleaned.paymentDate);
			if (cleaned.paidAt) cleaned.paidAt = convertTimestamp(cleaned.paidAt);
			if (cleaned.autoSave) {
				cleaned.autoSave = { ...cleaned.autoSave };
				if (cleaned.autoSave.lastModified) cleaned.autoSave.lastModified = convertTimestamp(cleaned.autoSave.lastModified);
				if (cleaned.autoSave.timestamp) cleaned.autoSave.timestamp = convertTimestamp(cleaned.autoSave.timestamp);
				if (cleaned.autoSave.formData?.updatedAt) cleaned.autoSave.formData.updatedAt = convertTimestamp(cleaned.autoSave.formData.updatedAt);
				if (cleaned.autoSave.formData?.createdAt) cleaned.autoSave.formData.createdAt = convertTimestamp(cleaned.autoSave.formData.createdAt);
			}
			return cleaned;
		};

		const memorial = {
			id: memorialDoc.id,
			lovedOneName: memorialData.lovedOneName || 'Unknown',
			fullSlug: memorialData.fullSlug || '',
			createdBy: memorialData.createdBy || '',
			ownerUid: memorialData.ownerUid || '',
			creatorEmail: memorialData.creatorEmail || '',
			creatorName: memorialData.creatorName || '',
			createdAt: convertTimestamp(memorialData.createdAt),
			updatedAt: convertTimestamp(memorialData.updatedAt),

			isPublic: memorialData.isPublic !== false,
			isComplete: memorialData.isComplete || false,

			birthDate: memorialData.birthDate || null,
			deathDate: memorialData.deathDate || null,
			familyContactName: memorialData.familyContactName || null,
			familyContactEmail: memorialData.familyContactEmail || null,
			familyContactPhone: memorialData.familyContactPhone || null,
			familyContactPreference: memorialData.familyContactPreference || null,
			additionalNotes: memorialData.additionalNotes || null,

			additionalSlugs: memorialData.additionalSlugs || [],

			manualPayment: memorialData.manualPayment || null,

			services: memorialData.services || null,

			memorialDate: memorialData.memorialDate || null,
			memorialTime: memorialData.memorialTime || null,
			memorialLocationName: memorialData.memorialLocationName || null,
			memorialLocationAddress: memorialData.memorialLocationAddress || null,

			livestream: memorialData.livestream || null,

			customTitle: memorialData.customTitle || null,

			calculatorConfig: cleanCalculatorConfig(memorialData.calculatorConfig),
			isPaid: memorialData.isPaid || memorialData.calculatorConfig?.isPaid || false,
			paymentStatus: memorialData.calculatorConfig?.status || 'draft',
			totalPrice: memorialData.calculatorConfig?.totalPrice || memorialData.totalPrice || 0,
			paymentDate: convertTimestamp(memorialData.calculatorConfig?.paymentDate),

			schedule:
				memorialData.calculatorConfig?.autoSave?.formData ||
				memorialData.calculatorConfig?.formData ||
				null,

			customPricing: cleanCustomPricing(memorialData.customPricing),

			funeralDirectorName:
				memorialData.funeralDirectorName ||
				memorialData.calculatorConfig?.formData?.funeralDirectorName ||
				'',

			contentBlocks: memorialData.contentBlocks || [],
			contentBlocksVersion: memorialData.contentBlocksVersion || 0
		};

		const streams = streamsSnap.docs
			.filter((doc) => doc.data().isDeleted !== true)
			.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					memorialId: data.memorialId,
					title: data.title || 'Untitled Stream',
					description: data.description || '',
					status: data.status || 'scheduled',
					visibility: data.visibility || 'public',
					sourceType: data.sourceType || 'rtmp',
					scheduledStartTime: data.scheduledStartTime || null,
					startedAt: data.startedAt || null,
					endedAt: data.endedAt || null,
					liveStartedAt: data.liveStartedAt || null,
					liveEndedAt: data.liveEndedAt || null,

					streamCredentials: data.streamCredentials || null,
					mux: data.mux || null,

					streamingMethod: data.streamingMethod || null,
					cloudflareStreamId: data.cloudflareStreamId || null,
					rtmpUrl: data.rtmpUrl || null,
					streamKey: data.streamKey || null,
					playbackUrl: data.playbackUrl || null,
					embedUrl: data.embedUrl || null,

					phoneSourceStreamId: data.phoneSourceStreamId || null,
					phoneSourcePlaybackUrl: data.phoneSourcePlaybackUrl || null,
					phoneSourceWhipUrl: data.phoneSourceWhipUrl || null,

					recordingReady: data.recordingReady || false,
					recordingUrl: data.recordingUrl || null,
					recordingPlaybackUrl: data.recordingPlaybackUrl || null,
					recordingDuration: data.recordingDuration || null,

					viewerCount: data.viewerCount || 0,
					peakViewerCount: data.peakViewerCount || 0,
					totalViews: data.totalViews || 0,

					calculatorServiceType: data.calculatorServiceType || null,
					calculatorServiceIndex: data.calculatorServiceIndex || null,

					createdAt: data.createdAt || null,
					updatedAt: data.updatedAt || null
				};
			});

		return {
			memorial,
			streams,
			followerCount: followersCountSnap.data().count,
			adminUser: {
				email: locals.user!.email,
				uid: locals.user!.uid
			}
		};
	} catch (err: any) {
		if (err.status) throw err;
		console.error('Error loading memorial:', err);
		throw error(500, `Failed to load memorial: ${err.message}`);
	}
};
