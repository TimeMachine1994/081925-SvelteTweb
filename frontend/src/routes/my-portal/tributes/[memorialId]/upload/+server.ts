import { error, json } from '@sveltejs/kit';
import { adminDb, adminStorage } from '$lib/server/firebase';
import { getDownloadURL } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST({ request, params, locals }) {
	console.log('📬 Received photo upload request for memorial:', params.memorialId);

	if (!locals.user) {
		console.log('🚨 Unauthorized upload attempt: No user logged in.');
		throw error(401, 'Unauthorized');
	}

	const { memorialId } = params;
	const memorialRef = adminDb.collection('memorials').doc(memorialId);
	const memorialDoc = await memorialRef.get();

	if (!memorialDoc.exists) {
		console.log(`🤔 Memorial not found with ID: ${memorialId}`);
		return json({ error: 'Memorial not found' }, { status: 404 });
	}

	const memorialData = memorialDoc.data();
	if (!memorialData || memorialData.creatorUid !== locals.user.uid) {
		console.log(`🚫 Forbidden upload attempt by user ${locals.user.uid} for memorial owned by ${memorialData?.creatorUid}`);
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const formData = await request.formData();
	const photo = formData.get('photo') as File;

	if (!photo) {
		return json({ error: 'No file uploaded' }, { status: 400 });
	}

	const fileBuffer = Buffer.from(await photo.arrayBuffer());
	const fileName = photo.name;
	const mimeType = photo.type;

	const filePath = `memorials/${memorialId}/${Date.now()}-${fileName}`;
	const file = adminStorage.bucket().file(filePath);

	try {
		console.log(`⏳ Uploading ${fileName} to Firebase Storage at ${filePath}...`);
		await file.save(fileBuffer, {
			metadata: { contentType: mimeType }
		});

		const downloadURL = await getDownloadURL(file);
		console.log(`✅ File uploaded successfully. URL: ${downloadURL}`);

		await memorialRef.update({
			photos: FieldValue.arrayUnion(downloadURL)
		});
		console.log(`📝 Memorial document updated with new photo URL.`);

		return json({ success: true, url: downloadURL });
	} catch (err) {
		console.error('🔥 Error during file upload or Firestore update:', err);
		return json({ error: 'File upload failed' }, { status: 500 });
	}
}