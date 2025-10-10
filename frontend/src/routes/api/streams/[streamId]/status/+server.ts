import { adminDb } from '$lib/server/firebase';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// PATCH - Manually update stream status (for debugging RTMP issues)
export const PATCH: RequestHandler = async ({ params, request }) => {
    const { streamId } = params;
    
    try {
        const { status, startedAt, endedAt } = await request.json();
        
        console.log(`🔧 [MANUAL_STATUS] Updating stream ${streamId} status to:`, status);
        
        const updateData: any = {
            status,
            updatedAt: new Date().toISOString()
        };
        
        if (startedAt !== undefined) {
            updateData.startedAt = startedAt;
        }
        
        if (endedAt !== undefined) {
            updateData.endedAt = endedAt;
        }
        
        // Auto-set startedAt for live streams
        if (status === 'live' && !startedAt) {
            updateData.startedAt = new Date().toISOString();
        }
        
        // Auto-set endedAt for completed streams
        if (status === 'completed' && !endedAt) {
            updateData.endedAt = new Date().toISOString();
        }
        
        await adminDb.collection('streams').doc(streamId).update(updateData);
        
        console.log(`✅ [MANUAL_STATUS] Stream ${streamId} updated successfully`);
        
        return json({
            success: true,
            message: 'Stream status updated',
            streamId,
            status,
            updateData
        });
        
    } catch (err) {
        console.error(`❌ [MANUAL_STATUS] Error updating stream ${streamId}:`, err);
        throw error(500, 'Failed to update stream status');
    }
};

// GET - Get current stream status
export const GET: RequestHandler = async ({ params }) => {
    const { streamId } = params;
    
    try {
        const streamDoc = await adminDb.collection('streams').doc(streamId).get();
        
        if (!streamDoc.exists) {
            throw error(404, 'Stream not found');
        }
        
        const data = streamDoc.data();
        
        return json({
            success: true,
            streamId,
            status: data?.status || 'unknown',
            startedAt: data?.startedAt || null,
            endedAt: data?.endedAt || null,
            cloudflareInputId: data?.cloudflareInputId || null,
            cloudflareStreamId: data?.cloudflareStreamId || null,
            updatedAt: data?.updatedAt || null
        });
        
    } catch (err) {
        console.error(`❌ [MANUAL_STATUS] Error getting stream ${streamId}:`, err);
        throw error(500, 'Failed to get stream status');
    }
};
