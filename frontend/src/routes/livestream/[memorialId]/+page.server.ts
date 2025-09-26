import { adminDb } from '$lib/server/firebase';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Helper function to convert Timestamps and Dates to strings
function sanitizeData(data: any): any {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(sanitizeData);
  if (typeof data === 'object' && data !== null) {
    if (data.toDate && typeof data.toDate === 'function') return data.toDate().toISOString(); // Firestore Timestamp
    if (data instanceof Date) return data.toISOString(); // JavaScript Date

    const sanitized: { [key: string]: any } = {};
    for (const key in data) {
      sanitized[key] = sanitizeData(data[key]);
    }
    return sanitized;
  }
  return data;
}

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        throw redirect(303, '/login');
    }

    const { memorialId } = params;
    const { uid, role } = locals.user;

    const memorialRef = adminDb.collection('memorials').doc(memorialId);
    const memorialDoc = await memorialRef.get();

    if (!memorialDoc.exists) {
        throw error(404, 'Memorial not found');
    }

    const memorial = memorialDoc.data();

    if (!memorial) {
        throw error(404, 'Memorial data could not be loaded.');
    }

    // Ensure fullSlug is present for the link
    if (!memorial.fullSlug && memorial.slug) {
        memorial.fullSlug = memorial.slug;
    }

    // Permission check: only admin or the assigned funeral director can access
    const hasPermission = role === 'admin' || memorial?.funeralDirectorUid === uid;

    if (!hasPermission) {
        throw error(403, 'You do not have permission to access this stream.');
    }

    // Ensure livestream data exists
    if (!memorial.livestream) {
        // Here you could add logic to create a livestream if one doesn't exist
        throw error(404, 'Livestream not configured for this memorial.');
    }

    // Fetch the complete livestream session data if there's an active session
    let completeSessionData = null;
    if (memorial.livestream.sessionId) {
        console.log('📡 Fetching complete session data for:', memorial.livestream.sessionId);
        const sessionDoc = await adminDb.collection('livestreams').doc(memorial.livestream.sessionId).get();
        if (sessionDoc.exists) {
            completeSessionData = sessionDoc.data();
            console.log('✅ Complete session data loaded:', JSON.stringify(completeSessionData, null, 2));
            
            // Merge the complete session data into memorial.livestream
            memorial.livestream = {
                ...memorial.livestream,
                ...completeSessionData,
                // Preserve the memorial-level fields
                isActive: memorial.livestream.isActive,
                startedAt: memorial.livestream.startedAt
            };
            console.log('🔄 Merged livestream data:', JSON.stringify(memorial.livestream, null, 2));
        } else {
            console.warn('⚠️ Session document not found:', memorial.livestream.sessionId);
        }
    }

    // Fetch scheduled services from memorial data
    const scheduledServices = [];
    
    // Convert main service to scheduled service
    if (memorial.services?.main) {
        const mainService = {
            id: 'main',
            title: memorial.services.main.location.name || 'Main Service',
            location: memorial.services.main.location,
            time: memorial.services.main.time,
            hours: memorial.services.main.hours,
            status: 'scheduled',
            type: 'main',
            streamKey: memorial.livestream?.streamKey || `stream_main_${Date.now()}`,
            streamUrl: memorial.livestream?.streamUrl || `rtmps://live.cloudflare.com:443/live/`
        };
        scheduledServices.push(mainService);
    }

    // Convert additional services to scheduled services
    if (memorial.services?.additional && memorial.services.additional.length > 0) {
        memorial.services.additional.forEach((additionalService, index) => {
            if (additionalService.enabled) {
                const scheduledService = {
                    id: `additional_${index}`,
                    title: additionalService.location.name || `Additional Service ${index + 1}`,
                    location: additionalService.location,
                    time: additionalService.time,
                    hours: additionalService.hours,
                    status: 'scheduled',
                    type: 'additional',
                    index,
                    streamKey: `stream_additional_${index}_${Date.now()}`,
                    streamUrl: `rtmps://live.cloudflare.com:443/live/`
                };
                scheduledServices.push(scheduledService);
            }
        });
    }

    // Add any custom streams
    if (memorial.customStreams) {
        Object.values(memorial.customStreams).forEach(customStream => {
            scheduledServices.push(sanitizeData(customStream));
        });
    }

    // Sort by date/time
    scheduledServices.sort((a, b) => {
        const dateA = a.time?.date ? new Date(a.time.date).getTime() : 0;
        const dateB = b.time?.date ? new Date(b.time.date).getTime() : 0;
        return dateA - dateB;
    });

    console.log(`📅 Loaded ${scheduledServices.length} scheduled services for memorial ${memorialId}`);

    return {
        memorial: sanitizeData({ id: memorialDoc.id, ...memorial }),
        scheduledServices: sanitizeData(scheduledServices)
    };
};
