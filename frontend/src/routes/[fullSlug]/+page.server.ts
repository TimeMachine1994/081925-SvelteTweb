import { error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const { fullSlug } = params;
    
    console.log('📺 [MEMORIAL_PAGE] Loading memorial page for slug:', fullSlug);
    
    // Filter out non-memorial requests (service workers, assets, etc.)
    if (fullSlug.includes('.') || fullSlug.startsWith('_') || fullSlug === 'favicon.ico') {
        console.log('📺 [MEMORIAL_PAGE] Skipping non-memorial request:', fullSlug);
        throw error(404, 'Not a memorial page');
    }
    
    try {
        // Find memorial by slug
        console.log('📺 [MEMORIAL_PAGE] Querying memorials collection for slug:', fullSlug);
        const memorialsRef = adminDb.collection('memorials');
        const snapshot = await memorialsRef.where('slug', '==', fullSlug).limit(1).get();
        console.log('📺 [MEMORIAL_PAGE] Memorial query completed, found docs:', snapshot.docs.length);

    if (snapshot.empty) {
        console.log('📺 [MEMORIAL_PAGE] No memorial found for slug:', fullSlug);
        throw error(404, 'Memorial not found');
    }

    const memorialDoc = snapshot.docs[0];
    const memorialData = memorialDoc.data();
    console.log('📺 [MEMORIAL_PAGE] Memorial data keys:', Object.keys(memorialData));
    
    // Create memorial object with proper serialization (no Firestore objects)
    const memorial = {
        id: memorialDoc.id,
        lovedOneName: memorialData.lovedOneName || '',
        slug: memorialData.slug || fullSlug,
        description: memorialData.description || '',
        isPublic: memorialData.isPublic || false,
        services: memorialData.services || null,
        // Convert Firestore timestamps to strings for serialization
        createdAt: memorialData.createdAt?.toDate()?.toISOString() || null,
        updatedAt: memorialData.updatedAt?.toDate()?.toISOString() || null
        // NOTE: Removed ...memorialData spread to avoid Firestore objects
    };

    console.log('📺 [MEMORIAL_PAGE] Memorial found:', {
        id: memorial.id,
        lovedOneName: memorial.lovedOneName,
        slug: memorial.slug,
        isPublic: memorial.isPublic
    });

    // Security check: Only show content from public memorials to unauthenticated users
    if (memorial.isPublic !== true) {
        console.log('🔒 [MEMORIAL_PAGE] Memorial is private, returning basic info only');
        return {
            memorial: {
                id: memorial.id,
                lovedOneName: memorial.lovedOneName,
                slug: memorial.slug,
                description: memorial.description,
                isPublic: false,
                services: null,
                createdAt: memorial.createdAt,
                updatedAt: memorial.updatedAt
            },
            streamsData: null // No streams data for private memorials
        };
    }

    // Load streams using the SAME API endpoint as memorials/[id]/streams (source of truth)
    let streamsData = null;
    
    // Only load streams for public memorials
    if (memorial.isPublic === true) {
        try {
            console.log('📺 [MEMORIAL_PAGE] Loading streams using unified API for memorial:', memorial.id);
            
            // Use the SAME internal logic as /api/memorials/[id]/streams endpoint
            // This ensures tight coupling with the streams management page
            const streamsQuery = adminDb.collection('streams')
                .where('memorialId', '==', memorial.id)
                .orderBy('actualStartTime', 'desc');

            console.log('📺 [MEMORIAL_PAGE] Executing unified streams query...');
            const streamsSnapshot = await streamsQuery.get();
            console.log('📺 [MEMORIAL_PAGE] Query completed, found streams:', streamsSnapshot.docs.length);

            // Process streams using SAME logic as /api/memorials/[id]/streams
            const allStreams = streamsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    description: data.description,
                    memorialId: data.memorialId,
                    memorialName: data.memorialName,
                    cloudflareId: data.cloudflareId,
                    streamKey: data.streamKey,
                    streamUrl: data.streamUrl,
                    playbackUrl: data.playbackUrl,
                    status: data.status,
                    recordingReady: data.recordingReady,
                    recordingUrl: data.recordingUrl,
                    recordingDuration: data.recordingDuration,
                    isVisible: data.isVisible,
                    isPublic: data.isPublic,
                    createdBy: data.createdBy,
                    allowedUsers: data.allowedUsers,
                    displayOrder: data.displayOrder,
                    viewerCount: data.viewerCount,
                    // Convert timestamps to ISO strings for serialization
                    createdAt: data.createdAt?.toDate()?.toISOString() || null,
                    updatedAt: data.updatedAt?.toDate()?.toISOString() || null,
                    scheduledStartTime: data.scheduledStartTime?.toDate()?.toISOString() || null,
                    actualStartTime: data.actualStartTime?.toDate()?.toISOString() || null,
                    endTime: data.endTime?.toDate()?.toISOString() || null
                };
            });

            // Filter for public visibility (only show visible streams)
            const publicStreams = allStreams.filter(stream => stream.isVisible !== false);

            // Organize streams by status - SAME structure as MemorialStreamsResponse
            const liveStreams = publicStreams.filter(s => s.status === 'live');
            const scheduledStreams = publicStreams.filter(s => s.status === 'scheduled');
            const readyStreams = publicStreams.filter(s => s.status === 'ready');
            const recordedStreams = publicStreams.filter(s => s.status === 'completed');
            const publicRecordedStreams = recordedStreams.filter(s => s.recordingReady && s.isVisible !== false);

            // Create response matching MemorialStreamsResponse interface
            streamsData = {
                memorialId: memorial.id,
                liveStreams,
                scheduledStreams,
                readyStreams,
                recordedStreams,
                publicRecordedStreams,
                totalStreams: publicStreams.length,
                allStreams: publicStreams
            };

            console.log('📺 [MEMORIAL_PAGE] Streams organized by status:', {
                total: streamsData.totalStreams,
                live: streamsData.liveStreams.length,
                scheduled: streamsData.scheduledStreams.length,
                ready: streamsData.readyStreams.length,
                recorded: streamsData.recordedStreams.length,
                publicRecorded: streamsData.publicRecordedStreams.length
            });

        } catch (streamError) {
            console.error('❌ [MEMORIAL_PAGE] Error loading streams:', streamError);
            console.error('❌ [MEMORIAL_PAGE] Stream error details:', {
                message: streamError.message,
                code: streamError.code,
                stack: streamError.stack,
                memorialId: memorial.id
            });
            // Return null on error to indicate no streams data
            streamsData = null;
        }
    } else {
        console.log('📺 [MEMORIAL_PAGE] Memorial is private, skipping streams loading');
    }

    return {
        memorial,
        streamsData // Using MemorialStreamsResponse interface - same as streams management page
    };

    } catch (mainError) {
        console.error('❌ [MEMORIAL_PAGE] Critical error in load function:', mainError);
        console.error('❌ [MEMORIAL_PAGE] Error details:', {
            message: mainError.message,
            code: mainError.code,
            stack: mainError.stack,
            fullSlug,
            timestamp: new Date().toISOString()
        });
        
        // Re-throw as SvelteKit error
        throw error(500, `Failed to load memorial page: ${mainError.message}`);
    }
};