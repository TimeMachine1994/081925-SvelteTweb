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

            // Log raw stream data for debugging
            streamsSnapshot.docs.forEach((doc, index) => {
                const data = doc.data();
                console.log(`📄 [MEMORIAL_PAGE] Raw stream ${index + 1}:`, {
                    id: doc.id,
                    title: data.title,
                    status: data.status,
                    isVisible: data.isVisible,
                    recordingReady: data.recordingReady,
                    memorialId: data.memorialId
                });
            });

            // Process streams using unified Stream interface (matches real-time listener)
            const allStreams = streamsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title || 'Untitled Stream',
                    description: data.description || '',
                    memorialId: data.memorialId || '',
                    memorialName: data.memorialName || memorial.lovedOneName, // Include memorialName
                    cloudflareId: data.cloudflareId || null,
                    streamKey: data.streamKey || null,
                    streamUrl: data.streamUrl || null,
                    playbackUrl: data.playbackUrl || null,
                    status: data.status || 'unknown',
                    recordingReady: data.recordingReady === true,
                    recordingUrl: data.recordingUrl || null,
                    recordingDuration: data.recordingDuration || null, // Include recordingDuration
                    recordings: data.recordings || [], // Include recordings array
                    isVisible: data.isVisible !== false, // Default to true if undefined
                    isPublic: data.isPublic || false, // Default to false if undefined
                    createdBy: data.createdBy || null,
                    allowedUsers: data.allowedUsers || [],
                    displayOrder: data.displayOrder || 0,
                    viewerCount: data.viewerCount || 0,
                    // Convert timestamps to Date objects (not strings) to match unified interface
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    scheduledStartTime: data.scheduledStartTime?.toDate() || null,
                    actualStartTime: data.actualStartTime?.toDate() || null,
                    endTime: data.endTime?.toDate() || null
                };
            });

            // Filter for public visibility (only show visible streams)
            const publicStreams = allStreams.filter(stream => stream.isVisible === true);
            
            console.log('📺 [MEMORIAL_PAGE] Public streams after visibility filter:', {
                total: publicStreams.length,
                streams: publicStreams.map(s => ({
                    id: s.id,
                    title: s.title,
                    status: s.status,
                    isVisible: s.isVisible,
                    recordingReady: s.recordingReady
                }))
            });

            // Organize streams by status - SAME structure as MemorialStreamsResponse
            const liveStreams = publicStreams.filter(s => s.status === 'live');
            const scheduledStreams = publicStreams.filter(s => s.status === 'scheduled');
            const readyStreams = publicStreams.filter(s => s.status === 'ready');
            const recordedStreams = publicStreams.filter(s => s.status === 'completed');
            const publicRecordedStreams = recordedStreams.filter(s => s.recordingReady === true && s.isVisible === true);
            
            console.log('📺 [MEMORIAL_PAGE] Streams categorized by status:', {
                live: liveStreams.map(s => s.title),
                scheduled: scheduledStreams.map(s => s.title),
                ready: readyStreams.map(s => s.title),
                completed: recordedStreams.map(s => s.title),
                publicRecorded: publicRecordedStreams.map(s => s.title)
            });

            // Fetch recordings for all streams
            console.log('📹 [MEMORIAL_PAGE] Fetching recordings for all streams...');
            const allRecordings = [];
            
            for (const stream of publicStreams) {
                try {
                    // Get recordings from the recordings array in the stream document
                    const recordings = stream.recordings || [];
                    
                    // Also include legacy single recording for backward compatibility
                    if (stream.recordingReady && stream.recordingUrl) {
                        const legacyRecording = {
                            id: 'legacy',
                            cloudflareVideoId: stream.cloudflareId,
                            recordingUrl: stream.recordingUrl,
                            playbackUrl: stream.playbackUrl || `https://cloudflarestream.com/${stream.cloudflareId}/iframe`,
                            duration: stream.recordingDuration,
                            createdAt: stream.createdAt,
                            title: `${stream.title} - Recording`,
                            sequenceNumber: 0,
                            recordingReady: true,
                            streamId: stream.id,
                            streamTitle: stream.title
                        };
                        allRecordings.push(legacyRecording);
                    }
                    
                    // Add new recordings with stream context
                    recordings.forEach(recording => {
                        if (recording.recordingReady && recording.recordingUrl) {
                            allRecordings.push({
                                ...recording,
                                streamId: stream.id,
                                streamTitle: stream.title
                            });
                        }
                    });
                    
                } catch (recordingError) {
                    console.error('❌ [MEMORIAL_PAGE] Error processing recordings for stream:', stream.id, recordingError);
                }
            }
            
            // Sort recordings by sequence number and created date
            allRecordings.sort((a, b) => {
                if (a.sequenceNumber !== b.sequenceNumber) {
                    return a.sequenceNumber - b.sequenceNumber;
                }
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });
            
            console.log('📹 [MEMORIAL_PAGE] Total recordings found:', allRecordings.length);

            // Create response matching MemorialStreamsResponse interface
            streamsData = {
                memorialId: memorial.id,
                liveStreams,
                scheduledStreams,
                readyStreams,
                recordedStreams,
                publicRecordedStreams,
                totalStreams: publicStreams.length,
                allStreams: publicStreams,
                recordings: allRecordings // Add recordings to server response
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