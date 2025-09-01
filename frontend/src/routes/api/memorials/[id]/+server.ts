import { adminDb } from '$lib/server/firebase';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
    if (!locals.user) {
        throw error(401, 'Unauthorized');
    }

    const memorialId = params.id;
    if (!memorialId) {
        throw error(400, 'Memorial ID is required');
    }

    try {
        // Get the memorial to check ownership and payment status
        const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
        
        if (!memorialDoc.exists) {
            throw error(404, 'Memorial not found');
        }

        const memorialData = memorialDoc.data();
        
        // Check if user owns this memorial
        if (memorialData?.creatorUid !== locals.user.uid && !locals.user.admin) {
            throw error(403, 'You can only delete your own memorials');
        }

        // Check if memorial has unpaid status (can only delete unpaid memorials)
        const livestreamConfigSnapshot = await adminDb
            .collection('livestreamConfigurations')
            .where('memorialId', '==', memorialId)
            .limit(1)
            .get();

        if (!livestreamConfigSnapshot.empty) {
            const configData = livestreamConfigSnapshot.docs[0].data();
            if (configData.paymentStatus === 'paid' || configData.paymentStatus === 'processing') {
                throw error(400, 'Cannot delete memorial with paid or processing payment status');
            }
        }

        // Delete related data first
        const batch = adminDb.batch();

        // Delete livestream configuration
        if (!livestreamConfigSnapshot.empty) {
            batch.delete(livestreamConfigSnapshot.docs[0].ref);
        }

        // Delete invitations
        const invitationsSnapshot = await adminDb
            .collection('invitations')
            .where('memorialId', '==', memorialId)
            .get();
        
        invitationsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete embeds subcollection
        const embedsSnapshot = await adminDb
            .collection('memorials')
            .doc(memorialId)
            .collection('embeds')
            .get();
        
        embedsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete followers subcollection
        const followersSnapshot = await adminDb
            .collection('memorials')
            .doc(memorialId)
            .collection('followers')
            .get();
        
        followersSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Finally delete the memorial document
        batch.delete(memorialDoc.ref);

        await batch.commit();

        return json({ success: true, message: 'Memorial deleted successfully' });

    } catch (err) {
        console.error('Error deleting memorial:', err);
        if (err instanceof Error && 'status' in err) {
            throw err;
        }
        throw error(500, 'Failed to delete memorial');
    }
};
