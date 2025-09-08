import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { PageServerLoad } from './$types';
import type { Memorial } from '$lib/types/memorial';
import type { Invitation } from '$lib/types/invitation';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('🏠 Loading my-portal for user:', locals.user?.email);

	// Redirect to login if not authenticated
	if (!locals.user) {
		console.log('🚫 User not authenticated, redirecting to login');
		throw redirect(302, '/login');
	}

	const { uid, role } = locals.user;
	console.log('👤 User role:', role);

	try {
		let memorials: Memorial[] = [];
		let invitations: Invitation[] = [];

		switch (role) {
			case 'owner':
				console.log('👑 Loading owner data...');
				// Load memorials owned by this user
				const ownerMemorialsSnap = await adminDb
					.collection('memorials')
					.where('createdByUserId', '==', uid)
					.get();
				
				memorials = ownerMemorialsSnap.docs.map(doc => {
					const data = doc.data();
					return {
						id: doc.id,
						...data,
						// Convert Firestore Timestamps to serializable dates
						createdAt: data.createdAt?.toDate?.() || data.createdAt,
						updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
						serviceDate: data.serviceDate?.toDate?.() || data.serviceDate
					};
				}) as Memorial[];

				// Load invitations sent by this user
				const sentInvitationsSnap = await adminDb
					.collection('invitations')
					.where('invitedByUid', '==', uid)
					.get();
				
				invitations = sentInvitationsSnap.docs.map(doc => {
					const data = doc.data();
					return {
						id: doc.id,
						...data,
						// Convert Firestore Timestamps to serializable dates
						createdAt: data.createdAt?.toDate?.() || data.createdAt,
						updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
						sentAt: data.sentAt?.toDate?.() || data.sentAt,
						acceptedAt: data.acceptedAt?.toDate?.() || data.acceptedAt
					};
				}) as Invitation[];

				console.log(`✅ Loaded ${memorials.length} memorials and ${invitations.length} invitations for owner`);
				break;

			case 'family_member':
				console.log('👨‍👩‍👧‍👦 Loading family member data...');
				// Load accepted invitations for this user
				const acceptedInvitationsSnap = await adminDb
					.collection('invitations')
					.where('inviteeEmail', '==', locals.user.email)
					.where('status', '==', 'accepted')
					.get();

				// Get memorial IDs from accepted invitations
				const memorialIds = acceptedInvitationsSnap.docs.map(doc => doc.data().memorialId);
				
				if (memorialIds.length > 0) {
					// Load memorials this user has access to
					const familyMemorialsSnap = await adminDb
						.collection('memorials')
						.where('__name__', 'in', memorialIds)
						.get();
					
					memorials = familyMemorialsSnap.docs.map(doc => {
						const data = doc.data();
						return {
							id: doc.id,
							...data,
							// Convert Firestore Timestamps to serializable dates
							createdAt: data.createdAt?.toDate?.() || data.createdAt,
							updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
							serviceDate: data.serviceDate?.toDate?.() || data.serviceDate
						};
					}) as Memorial[];
				}

				console.log(`✅ Loaded ${memorials.length} accessible memorials for family member`);
				break;

			case 'viewer':
				console.log('👀 Loading viewer data...');
				// Load followed memorials
				const followedMemorialsSnap = await adminDb
					.collectionGroup('followers')
					.where('userId', '==', uid)
					.get();

				// Get memorial IDs from followed documents
				const followedMemorialIds = followedMemorialsSnap.docs.map(doc => {
					// Extract memorial ID from the document path
					const pathParts = doc.ref.path.split('/');
					return pathParts[pathParts.length - 3]; // memorials/{id}/followers/{uid}
				});

				if (followedMemorialIds.length > 0) {
					// Load the actual memorial documents
					const memorialPromises = followedMemorialIds.map(id => 
						adminDb.collection('memorials').doc(id).get()
					);
					
					const memorialDocs = await Promise.all(memorialPromises);
					memorials = memorialDocs
						.filter(doc => doc.exists)
						.map(doc => {
							const data = doc.data();
							if (!data) return null;
							return {
								id: doc.id,
								...data,
								// Convert Firestore Timestamps to serializable dates
								createdAt: data.createdAt?.toDate?.() || data.createdAt,
								updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
								serviceDate: data.serviceDate?.toDate?.() || data.serviceDate
							};
						})
						.filter(memorial => memorial !== null) as Memorial[];
				}

				console.log(`✅ Loaded ${memorials.length} followed memorials for viewer`);
				break;

			case 'funeral_director':
				console.log('🏢 Loading funeral director data...');
				// Load memorials assigned to this funeral director
				const fdMemorialsSnap = await adminDb
					.collection('memorials')
					.where('funeralDirectorUid', '==', uid)
					.get();
				
				memorials = fdMemorialsSnap.docs.map(doc => {
					const data = doc.data();
					return {
						id: doc.id,
						...data,
						// Convert Firestore Timestamps to serializable dates
						createdAt: data.createdAt?.toDate?.() || data.createdAt,
						updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
						serviceDate: data.serviceDate?.toDate?.() || data.serviceDate
					};
				}) as Memorial[];

				console.log(`✅ Loaded ${memorials.length} assigned memorials for funeral director`);
				break;

			default:
				console.log('❓ Unknown role, loading as basic user');
				memorials = [];
		}

		return {
			user: locals.user,
			memorials,
			invitations,
			role
		};

	} catch (error) {
		console.error('❌ Error loading portal data:', error);
		return {
			user: locals.user,
			memorials: [],
			invitations: [],
			role,
			error: 'Failed to load portal data'
		};
	}
};
