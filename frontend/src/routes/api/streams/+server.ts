import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { requireStreamAccess } from '$lib/server/streamMiddleware';

const STREAMS_COLLECTION = 'streams';

/**
 * GET /api/streams
 * List streams with filtering and pagination
 */
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    // Extract query parameters
    const memorialId = url.searchParams.get('memorialId');
    const status = url.searchParams.get('status');
    const isPublic = url.searchParams.get('isPublic');
    const createdBy = url.searchParams.get('createdBy');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    console.log('📺 [STREAMS] GET request:', {
      memorialId,
      status,
      isPublic,
      createdBy,
      limit,
      offset,
      userId: locals.user?.uid
    });

    // Build query
    let query = adminDb.collection(STREAMS_COLLECTION).orderBy('createdAt', 'desc');

    // Apply filters
    if (memorialId) {
      query = query.where('memorialId', '==', memorialId);
    }
    if (status) {
      query = query.where('status', '==', status);
    }
    if (isPublic !== null) {
      query = query.where('isPublic', '==', isPublic === 'true');
    }
    if (createdBy) {
      query = query.where('createdBy', '==', createdBy);
    }

    // Apply pagination
    if (offset > 0) {
      const offsetSnapshot = await query.limit(offset).get();
      if (!offsetSnapshot.empty) {
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.limit(limit + 1).get(); // +1 to check if there are more

    const streams = snapshot.docs.slice(0, limit).map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      scheduledStartTime: doc.data().scheduledStartTime?.toDate(),
      actualStartTime: doc.data().actualStartTime?.toDate(),
      endTime: doc.data().endTime?.toDate()
    }));

    const hasMore = snapshot.docs.length > limit;
    const total = streams.length; // Note: This is approximate for performance

    // Filter streams based on permissions
    const filteredStreams = [];
    for (const stream of streams) {
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
        console.log('🔒 [STREAMS] Access denied for stream:', stream.id);
      }
    }

    console.log('✅ [STREAMS] Returning', filteredStreams.length, 'streams');

    return json({
      streams: filteredStreams,
      total,
      hasMore,
      pagination: {
        limit,
        offset,
        nextOffset: hasMore ? offset + limit : null
      }
    });

  } catch (error) {
    console.error('❌ [STREAMS] GET error:', error);
    return json({ error: 'Failed to fetch streams' }, { status: 500 });
  }
};

/**
 * POST /api/streams
 * Create a new stream
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const data = await request.json();
    console.log('📺 [STREAMS] POST request:', data);

    // Validate required fields
    if (!data.title) {
      return json({ error: 'Title is required' }, { status: 400 });
    }

    // Check permissions for memorial association
    if (data.memorialId) {
      try {
        await requireStreamAccess({
          memorialId: data.memorialId,
          user: locals.user,
          action: 'create'
        });
      } catch (error) {
        return json({ error: 'Permission denied for memorial' }, { status: 403 });
      }
    }

    // Create stream document
    const streamData = {
      // Identity
      title: data.title,
      description: data.description || '',
      
      // Memorial Association
      memorialId: data.memorialId || null,
      memorialName: data.memorialName || null,
      
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
      
      // Visibility & Access
      isVisible: data.isVisible !== false, // Default to true
      isPublic: data.isPublic !== false,   // Default to true
      
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

    console.log('✅ [STREAMS] Created stream:', docRef.id);

    return json(createdStream);

  } catch (error) {
    console.error('❌ [STREAMS] POST error:', error);
    return json({ error: 'Failed to create stream' }, { status: 500 });
  }
};
