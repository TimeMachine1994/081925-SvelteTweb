import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { requireStreamAccess, canAccessMemorialStreams } from '$lib/server/streamMiddleware';

const STREAMS_COLLECTION = 'streams';

/**
 * GET /api/memorials/[id]/streams
 * Get all streams for a memorial (organized by status)
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const { id: memorialId } = params;
    
    console.log('📺 [MEMORIAL_STREAMS] GET request for memorial:', memorialId);
    console.log('👤 [MEMORIAL_STREAMS] API User:', {
      uid: locals.user?.uid,
      email: locals.user?.email,
      role: locals.user?.role,
      isAdmin: locals.user?.isAdmin,
      timestamp: new Date().toISOString()
    });

    // Check if user can access memorial streams
    const canAccess = await canAccessMemorialStreams(memorialId, locals.user);
    if (!canAccess) {
      return json({ error: 'Permission denied to view memorial streams' }, { status: 403 });
    }

    // Get all streams for this memorial
    const query = adminDb.collection(STREAMS_COLLECTION)
      .where('memorialId', '==', memorialId)
      .orderBy('actualStartTime', 'desc');

    const snapshot = await query.get();
    
    console.log('🔍 [MEMORIAL_STREAMS] Raw Firestore query results:', {
      totalDocs: snapshot.docs.length,
      memorialId,
      queryPath: `streams where memorialId == ${memorialId}`
    });

    const allStreams = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('📄 [MEMORIAL_STREAMS] Processing stream document:', {
        id: doc.id,
        title: data.title,
        status: data.status,
        memorialId: data.memorialId,
        isVisible: data.isVisible,
        isPublic: data.isPublic,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate?.()?.toISOString(),
        actualStartTime: data.actualStartTime?.toDate?.()?.toISOString()
      });
      
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
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        scheduledStartTime: data.scheduledStartTime?.toDate(),
        actualStartTime: data.actualStartTime?.toDate(),
        endTime: data.endTime?.toDate()
      };
    });

    // Filter streams based on permissions
    const filteredStreams = [];
    for (const stream of allStreams) {
      try {
        const access = await requireStreamAccess({
          streamId: stream.id,
          stream,
          user: locals.user,
          action: 'view'
        });
        if (access.canView) {
          filteredStreams.push(stream);
        }
      } catch (error) {
        // Skip streams user can't access
        console.log('🔒 [MEMORIAL_STREAMS] Access denied for stream:', stream.id);
      }
    }

    // Organize streams by status
    const liveStreams = filteredStreams.filter(s => s.status === 'live');
    const scheduledStreams = filteredStreams.filter(s => s.status === 'scheduled');
    const readyStreams = filteredStreams.filter(s => s.status === 'ready');
    const recordedStreams = filteredStreams.filter(s => s.status === 'completed');
    
    // For public viewing, only show visible completed streams with recordings
    const publicRecordedStreams = recordedStreams.filter(s => 
      s.recordingReady && s.isVisible !== false
    );

    console.log('✅ [MEMORIAL_STREAMS] Returning streams:', {
      memorialId,
      total: filteredStreams.length,
      live: liveStreams.length,
      scheduled: scheduledStreams.length,
      ready: readyStreams.length,
      recorded: recordedStreams.length,
      publicRecorded: publicRecordedStreams.length,
      completedBreakdown: {
        total: recordedStreams.length,
        withRecordings: recordedStreams.filter(s => s.recordingReady).length,
        visible: recordedStreams.filter(s => s.isVisible !== false).length,
        publicReady: publicRecordedStreams.length
      }
    });

    return json({
      memorialId,
      liveStreams,
      scheduledStreams,
      readyStreams,
      recordedStreams, // All completed streams for management interface
      publicRecordedStreams, // Only visible streams with recordings for public viewing
      totalStreams: filteredStreams.length,
      allStreams: filteredStreams // Include all for admin interfaces
    });

  } catch (error) {
    console.error('❌ [MEMORIAL_STREAMS] GET error:', error);
    return json({ error: 'Failed to fetch memorial streams' }, { status: 500 });
  }
};

/**
 * POST /api/memorials/[id]/streams
 * Create a new stream associated with a memorial
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { id: memorialId } = params;
    const data = await request.json();
    
    console.log('📺 [MEMORIAL_STREAMS] POST request:', { memorialId, data });

    // Check permissions for creating memorial streams
    const access = await requireStreamAccess({
      memorialId,
      user: locals.user,
      action: 'create'
    });

    if (!access.canEdit) {
      return json({ error: 'Permission denied to create memorial streams' }, { status: 403 });
    }

    // Validate required fields
    if (!data.title) {
      return json({ error: 'Title is required' }, { status: 400 });
    }

    // Get memorial info for stream metadata
    const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
    if (!memorialDoc.exists) {
      return json({ error: 'Memorial not found' }, { status: 404 });
    }

    const memorial = memorialDoc.data()!;

    // Create stream document with memorial association
    const streamData = {
      // Identity
      title: data.title,
      description: data.description || '',
      
      // Memorial Association
      memorialId,
      memorialName: memorial.lovedOneName,
      
      // Stream Configuration (will be populated when stream starts)
      cloudflareId: null,
      streamKey: null,
      streamUrl: null,
      playbackUrl: null,
      
      // Status & Lifecycle
      status: data.scheduledStartTime ? 'scheduled' : 'ready',
      scheduledStartTime: data.scheduledStartTime ? new Date(data.scheduledStartTime) : null,
      actualStartTime: null,
      endTime: null,
      
      // Recording Management
      recordingReady: false,
      recordingUrl: null,
      recordingDuration: null,
      
      // Visibility & Access (inherit from memorial)
      isVisible: data.isVisible !== false, // Default to true
      isPublic: memorial.isPublic !== false, // Inherit from memorial
      
      // Permissions
      createdBy: locals.user.uid,
      allowedUsers: data.allowedUsers || [],
      
      // Metadata
      displayOrder: data.displayOrder || 0,
      viewerCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await adminDb.collection(STREAMS_COLLECTION).add(streamData);
    
    const createdStream = {
      id: docRef.id,
      ...streamData
    };

    console.log('✅ [MEMORIAL_STREAMS] Created stream:', {
      streamId: docRef.id,
      memorialId,
      title: data.title
    });

    return json(createdStream);

  } catch (error) {
    console.error('❌ [MEMORIAL_STREAMS] POST error:', error);
    return json({ error: 'Failed to create memorial stream' }, { status: 500 });
  }
};
