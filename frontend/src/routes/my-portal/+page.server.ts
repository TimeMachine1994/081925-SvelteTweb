import { getAdminDb, getAdminAuth } from '$lib/server/firebase';
import { redirect } from '@sveltejs/kit';
import type { Memorial } from '$lib/types/memorial';
import type { Invitation } from '$lib/types/invitation';
import type { Booking } from '$lib/types/booking';
import { FieldPath, type Query } from 'firebase-admin/firestore';

export const load = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

    // Admin role preview logic
    const previewRole = url.searchParams.get('preview_role');
    if (locals.user.admin && previewRole) {
        locals.user.role = previewRole;
    }

	const memorialsRef = getAdminDb().collection('memorials');
	let query: Query = memorialsRef;
	let allUsers: { uid: string; email: string; displayName: string; }[] = [];

	if (locals.user.admin) {
		console.log('👤 Admin user detected, fetching all memorials and users.');
		// Admin query remains the same
		query = memorialsRef;
		try {
			const listUsersResult = await getAdminAuth().listUsers();
			allUsers = listUsersResult.users.map(userRecord => ({
				uid: userRecord.uid,
				email: userRecord.email || '',
				displayName: userRecord.displayName || ''
			}));
			console.log(`👥 Fetched ${allUsers.length} users.`);
		} catch (error) {
			console.error('Error fetching users:', error);
		}
	} else if (locals.user.role === 'family_member') {
		console.log(`👪 Family member detected (${locals.user.email}), fetching invited memorials.`);
		const invitationsRef = getAdminDb().collection('invitations');
		const invitationsSnap = await invitationsRef.where('inviteeEmail', '==', locals.user.email).where('status', '==', 'accepted').get();
		const memorialIds = invitationsSnap.docs.map(doc => doc.data().memorialId);

		if (memorialIds.length > 0) {
			query = memorialsRef.where(FieldPath.documentId(), 'in', memorialIds);
		} else {
			// If no invitations, return empty memorials immediately
			return { user: locals.user, memorials: [], invitations: [], allUsers: [] };
		}
	} else if (locals.user.role === 'viewer') {
		console.log(`👁️ Viewer detected (${locals.user.uid}), fetching followed memorials.`);
		const followsSnap = await getAdminDb().collectionGroup('followers').where('userId', '==', locals.user.uid).get();
		const memorialIds = followsSnap.docs.map(doc => doc.ref.parent.parent!.id);

		if (memorialIds.length > 0) {
			query = memorialsRef.where(FieldPath.documentId(), 'in', memorialIds);
		} else {
			return { user: locals.user, memorials: [], invitations: [], allUsers: [] };
		}
	} else {
		console.log(`👤 Standard user detected (${locals.user.uid}), fetching user's memorials.`);
		console.log(`🔍 User role: ${locals.user.role}`);
		// Check both creatorUid and createdByUserId for backward compatibility
		// First try with createdByUserId (newer field)
		const queryNew = memorialsRef.where('createdByUserId', '==', locals.user.uid);
		const snapshotNew = await queryNew.get();
		
		// If no results, try with creatorUid (legacy field)
		if (snapshotNew.empty) {
			console.log(`🔄 No memorials found with createdByUserId, trying creatorUid...`);
			query = memorialsRef.where('creatorUid', '==', locals.user.uid);
		} else {
			console.log(`✅ Found ${snapshotNew.size} memorial(s) with createdByUserId`);
			// We'll use this snapshot directly instead of re-querying
			const snapshot = snapshotNew;
			
			// Process the memorials directly here since we already have the snapshot
			console.log(`✅ Found ${snapshot.size} memorial(s), processing...`);
			const memorialsData = await Promise.all(snapshot.docs.map(async (doc) => {
				const data = doc.data();

				const embedsSnapshot = await getAdminDb().collection('memorials').doc(doc.id).collection('embeds').get();
				const embeds = embedsSnapshot.docs.map(embedDoc => ({
					id: embedDoc.id,
					...embedDoc.data()
				})) as Memorial['embeds'];
			  
				// Manually construct the Memorial object to ensure type safety
				const memorial: Memorial = {
					id: doc.id,
					lovedOneName: data.lovedOneName || '',
					slug: data.slug || '',
					fullSlug: data.fullSlug || '',
					createdByUserId: data.createdByUserId || '',
					creatorEmail: data.creatorEmail || '',
					creatorName: data.creatorName || '',
					isPublic: data.isPublic || false,
					content: data.content || '',
					custom_html: data.custom_html || null,
					createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
					updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
					directorFullName: data.directorFullName,
					funeralHomeName: data.funeralHomeName,
					memorialDate: data.memorialDate,
					memorialTime: data.memorialTime,
					memorialLocationName: data.memorialLocationName,
					memorialLocationAddress: data.memorialLocationAddress,
					imageUrl: data.imageUrl,
					birthDate: data.birthDate,
					deathDate: data.deathDate,
					livestream: data.livestream,
					photos: data.photos || [],
					embeds: embeds || [],
					// Add service coordination fields from master tech doc
					familyContactName: data.familyContactName,
					familyContactEmail: data.familyContactEmail,
					familyContactPhone: data.familyContactPhone,
					familyContactPreference: data.familyContactPreference,
					directorEmail: data.directorEmail,
					additionalNotes: data.additionalNotes
				};
				
				console.log(`📝 Processed memorial: ${memorial.lovedOneName} (ID: ${memorial.id})`);
				return memorial;
			}));

			console.log(`🎯 Processed ${memorialsData.length} memorial(s) total`);
			console.log(`📋 Memorial IDs:`, memorialsData.map(m => m.id));

			// Fetch invitations for the memorials
			let invitations: Invitation[] = [];
			if (memorialsData.length > 0) {
				const memorialIds = memorialsData.map(m => m.id);
				const invitationsSnapshot = await getAdminDb().collection('invitations').where('memorialId', 'in', memorialIds).get();
				invitations = invitationsSnapshot.docs.map(doc => {
					const data = doc.data();
					return {
						id: doc.id,
						...data,
						createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
						updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
					} as Invitation;
				});
			}
		   
			// Fetch bookings for the memorials
			let bookings: Booking[] = [];
			if (memorialsData.length > 0) {
				const memorialIds = memorialsData.map(m => m.id);
				const bookingsSnapshot = await getAdminDb().collection('bookings').where('memorialId', 'in', memorialIds).get();
				bookings = bookingsSnapshot.docs.map(doc => {
					const data = doc.data();
					return {
						id: doc.id,
						...data,
						createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
						updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
					} as Booking;
				});
			}
		   
			console.log(`📦 Returning data to client:`);
			console.log(`   - User: ${locals.user.uid} (role: ${locals.user.role})`);
			console.log(`   - Memorials: ${memorialsData.length}`);
			console.log(`   - Bookings: ${bookings.length}`);
			console.log(`   - Invitations: ${invitations.length}`);
			
			return {
				user: locals.user,
				memorials: memorialsData,
				invitations,
				bookings,
				allUsers: locals.user.admin ? allUsers : [],
				previewingRole: previewRole // Pass the preview role to the page
			};
		}
	}
	
	   const snapshot = await query.get();
	   console.log(`📊 Query executed, found ${snapshot.size} documents`);

	   if (snapshot.empty) {
		console.log('⚠️ No memorials found for user, returning empty array');
		return {
			user: locals.user,
			memorials: [],
			allUsers: locals.user.admin ? allUsers : [],
			bookings: []
		};
	   }

	   console.log(`✅ Found ${snapshot.size} memorial(s), processing...`);
	   const memorialsData = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();

        const embedsSnapshot = await getAdminDb().collection('memorials').doc(doc.id).collection('embeds').get();
        const embeds = embedsSnapshot.docs.map(embedDoc => ({
        	id: embedDoc.id,
        	...embedDoc.data()
        })) as Memorial['embeds'];
      
        // Manually construct the Memorial object to ensure type safety
        const memorial: Memorial = {
        	id: doc.id,
        	lovedOneName: data.lovedOneName || '',
        	slug: data.slug || '',
        	fullSlug: data.fullSlug || '',
        	createdByUserId: data.createdByUserId || '',
        	creatorEmail: data.creatorEmail || '',
        	creatorName: data.creatorName || '',
        	isPublic: data.isPublic || false,
        	content: data.content || '',
        	custom_html: data.custom_html || null,
        	createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
        	updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
        	directorFullName: data.directorFullName,
        	funeralHomeName: data.funeralHomeName,
        	memorialDate: data.memorialDate,
        	memorialTime: data.memorialTime,
        	memorialLocationName: data.memorialLocationName,
        	memorialLocationAddress: data.memorialLocationAddress,
        	imageUrl: data.imageUrl,
        	birthDate: data.birthDate,
        	deathDate: data.deathDate,
        	livestream: data.livestream,
        	photos: data.photos || [],
        	embeds: embeds || [],
        	// Add service coordination fields from master tech doc
        	familyContactName: data.familyContactName,
        	familyContactEmail: data.familyContactEmail,
        	familyContactPhone: data.familyContactPhone,
        	familyContactPreference: data.familyContactPreference,
        	directorEmail: data.directorEmail,
        	additionalNotes: data.additionalNotes
        };
        
        console.log(`📝 Processed memorial: ${memorial.lovedOneName} (ID: ${memorial.id})`);
        return memorial;
       }));

    console.log(`🎯 Processed ${memorialsData.length} memorial(s) total`);
    console.log(`📋 Memorial IDs:`, memorialsData.map(m => m.id));

    // Fetch invitations for the memorials
    let invitations: Invitation[] = [];
    if (memorialsData.length > 0) {
    	const memorialIds = memorialsData.map(m => m.id);
    	const invitationsSnapshot = await getAdminDb().collection('invitations').where('memorialId', 'in', memorialIds).get();
    	invitations = invitationsSnapshot.docs.map(doc => {
    		const data = doc.data();
    		return {
    				id: doc.id,
    				...data,
    				createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
    				updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
    		} as Invitation;
    	});
    }
   
    // Fetch bookings for the memorials
    let bookings: Booking[] = [];
    if (memorialsData.length > 0) {
    	const memorialIds = memorialsData.map(m => m.id);
    	const bookingsSnapshot = await getAdminDb().collection('bookings').where('memorialId', 'in', memorialIds).get();
    	bookings = bookingsSnapshot.docs.map(doc => {
    		const data = doc.data();
    		return {
    			id: doc.id,
    			...data,
    			createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
    			updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
    		} as Booking;
    	});
    }
   
    console.log(`📦 Returning data to client:`);
    console.log(`   - User: ${locals.user.uid} (role: ${locals.user.role})`);
    console.log(`   - Memorials: ${memorialsData.length}`);
    console.log(`   - Bookings: ${bookings.length}`);
    console.log(`   - Invitations: ${invitations.length}`);
    
    return {
    	user: locals.user,
    	memorials: memorialsData,
    	invitations,
    	bookings,
    	allUsers: locals.user.admin ? allUsers : [],
    	previewingRole: previewRole // Pass the preview role to the page
    };
};

export const actions = {
    logout: async ({ cookies }) => {
        console.log('Logging out user...');
        cookies.delete('session', { path: '/' });
        console.log('Session cookie deleted.');
        throw redirect(303, '/login');
    }
};