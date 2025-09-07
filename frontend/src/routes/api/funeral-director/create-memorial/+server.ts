import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import type { FuneralDirectorMemorialRequest } from '$lib/types/funeral-director';
import { Timestamp } from 'firebase-admin/firestore';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify user is an approved funeral director
    const funeralDirectorDoc = await adminDb.collection('funeral_directors').doc(locals.user.uid).get();
    if (!funeralDirectorDoc.exists) {
      return json({ error: 'Funeral director profile not found' }, { status: 404 });
    }

    const funeralDirector = funeralDirectorDoc.data();
    if (funeralDirector?.status !== 'approved') {
      return json({ error: 'Funeral director account not approved' }, { status: 403 });
    }

    const memorialData: FuneralDirectorMemorialRequest = await request.json();

    // Generate memorial title if not provided
    const title = memorialData.memorial.title || 
      `In Memory of ${memorialData.deceased.firstName} ${memorialData.deceased.lastName}`;

    // Generate slug
    const baseSlug = memorialData.memorial.customSlug || 
      `${memorialData.deceased.firstName}-${memorialData.deceased.lastName}`.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    // Create memorial document
    const memorial = {
      title,
      slug: baseSlug,
      fullSlug: `${baseSlug}-${Date.now()}`, // Ensure uniqueness
      
      // Deceased information
      deceased: {
        firstName: memorialData.deceased.firstName,
        lastName: memorialData.deceased.lastName,
        middleName: memorialData.deceased.middleName,
        nickname: memorialData.deceased.nickname,
        dateOfBirth: memorialData.deceased.dateOfBirth,
        dateOfDeath: memorialData.deceased.dateOfDeath,
        placeOfBirth: memorialData.deceased.placeOfBirth,
        placeOfDeath: memorialData.deceased.placeOfDeath,
        occupation: memorialData.deceased.occupation,
        education: memorialData.deceased.education,
        militaryService: memorialData.deceased.militaryService,
        militaryBranch: memorialData.deceased.militaryBranch,
        militaryRank: memorialData.deceased.militaryRank,
      },

      // Family information
      family: memorialData.family,

      // Service information
      services: memorialData.services,

      // Funeral director information
      funeralDirector: {
        id: locals.user.uid,
        companyName: funeralDirector.companyName,
        contactPerson: funeralDirector.contactPerson,
        phone: funeralDirector.phone,
        email: funeralDirector.email,
        licenseNumber: funeralDirector.licenseNumber
      },

      // Owner information (will be created as user)
      ownerInfo: memorialData.owner,

      // Memorial settings
      description: memorialData.memorial.description || '',
      isPublic: memorialData.memorial.isPublic,
      allowComments: memorialData.memorial.allowComments,
      allowPhotos: memorialData.memorial.allowPhotos,
      allowTributes: memorialData.memorial.allowTributes,
      enableLivestream: memorialData.memorial.enableLivestream,

      // Additional options
      options: memorialData.options,

      // Permissions
      permissions: {
        funeralDirectorCanEdit: true,
        funeralDirectorCanStream: memorialData.memorial.enableLivestream
      },

      // Metadata
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: locals.user.uid,
      createdByRole: 'funeral_director',
      
      // Status
      status: 'active',
      livestreamEnabled: memorialData.memorial.enableLivestream,
      activeStreams: 0
    };

    // Create memorial document
    const memorialRef = adminDb.collection('memorials').doc();
    await memorialRef.set(memorial);

    // TODO: Create owner user account and send invitation email
    // This would involve creating a user account for the owner and sending them login credentials

    return json({
      success: true,
      memorialId: memorialRef.id,
      fullSlug: memorial.fullSlug,
      message: 'Memorial created successfully'
    });

  } catch (error) {
    console.error('Error creating memorial:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
