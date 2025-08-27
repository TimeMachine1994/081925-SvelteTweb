import { error, json } from '@sveltejs/kit';
import { adminDb, adminStorage } from '$lib/server/firebase';
import { getDownloadURL } from 'firebase-admin/storage';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { RequestHandler } from './$types';
import crypto from 'crypto';

/**
 * POST handler for photo uploads to memorials
 * 
 * Security Features:
 * - Checks for owner, family member, or admin permissions
 * - Validates file type (images only) and size (10MB max)
 * - Adds comprehensive metadata to uploaded files
 * - Creates audit logs for all upload attempts
 * - Maintains backward compatibility with existing code
 */
export const POST: RequestHandler = async ({ request, params, locals }) => {
	console.log('📸 Photo upload request for memorial:', params.memorialId);
	const startTime = Date.now();

	// Step 1: Authentication check
	if (!locals.user) {
		console.log('🚫 Unauthorized upload attempt: No user logged in');
		// Log failed attempt
		await logUploadAttempt(params.memorialId, null, 'unauthorized', 'No user logged in');
		throw error(401, 'Unauthorized - Please log in to upload photos');
	}

	const { memorialId } = params;
	const userId = locals.user.uid;
	const userEmail = locals.user.email || 'unknown';
	
	console.log(`👤 User ${userId} (${userEmail}) attempting upload to memorial ${memorialId}`);

	try {
		// Step 2: Retrieve memorial document
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			console.log(`❌ Memorial not found with ID: ${memorialId}`);
			await logUploadAttempt(memorialId, userId, 'not_found', 'Memorial does not exist');
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorialData = memorialDoc.data();
		
		// Step 3: Check permissions - Owner, Family Member, or Admin
		console.log('🔐 Checking user permissions...');
		
		// Check ownership (support both old and new field names for backward compatibility)
		const isOwner = memorialData?.creatorUid === userId || 
		               memorialData?.createdByUserId === userId;
		
		if (memorialData?.createdByUserId && !memorialData?.creatorUid) {
			console.warn(`⚠️ Memorial ${memorialId} using deprecated "createdByUserId" field. Consider migration.`);
		}
		
		// Check family member status
		const familyMemberRef = memorialRef
			.collection('familyMembers')
			.doc(userId);
		const familyMemberDoc = await familyMemberRef.get();
		const isFamilyMember = familyMemberDoc.exists;
		
		// Check admin status
		const isAdmin = locals.user.admin === true;
		
		// Determine user role for metadata
		let userRole: string;
		if (isOwner) {
			userRole = 'owner';
			console.log('✅ User is memorial owner');
		} else if (isFamilyMember) {
			userRole = 'family_member';
			console.log('✅ User is family member');
		} else if (isAdmin) {
			userRole = 'admin';
			console.log('✅ User is admin');
		} else {
			userRole = 'unauthorized';
		}
		
		// Deny access if user doesn't have any valid role
		if (!isOwner && !isFamilyMember && !isAdmin) {
			console.log(`🚫 Access denied: User ${userId} has no permission to upload to memorial ${memorialId}`);
			console.log(`   Owner check: ${isOwner}, Family member: ${isFamilyMember}, Admin: ${isAdmin}`);
			await logUploadAttempt(memorialId, userId, 'forbidden', `No permission - role: ${userRole}`);
			return json({ 
				error: 'You do not have permission to upload photos to this memorial' 
			}, { status: 403 });
		}

		// Step 4: Parse and validate the uploaded file
		console.log('📦 Processing uploaded file...');
		const formData = await request.formData();
		const photo = formData.get('photo') as File;

		if (!photo) {
			console.log('❌ No file provided in request');
			await logUploadAttempt(memorialId, userId, 'bad_request', 'No file uploaded');
			return json({ error: 'No file uploaded' }, { status: 400 });
		}

		console.log(`📄 File details: name=${photo.name}, type=${photo.type}, size=${photo.size} bytes`);

		// Step 5: File validation - type and size
		// Validate file type (must be an image)
		const allowedMimeTypes = [
			'image/jpeg',
			'image/jpg',
			'image/png',
			'image/gif',
			'image/webp',
			'image/svg+xml',
			'image/bmp',
			'image/tiff'
		];
		
		if (!photo.type.startsWith('image/') || !allowedMimeTypes.includes(photo.type)) {
			console.log(`❌ Invalid file type: ${photo.type}`);
			await logUploadAttempt(memorialId, userId, 'invalid_type', `File type: ${photo.type}`);
			return json({ 
				error: 'Only image files are allowed (JPEG, PNG, GIF, WebP, SVG, BMP, TIFF)' 
			}, { status: 400 });
		}

		// Validate file size (10MB maximum)
		const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
		if (photo.size > maxSizeInBytes) {
			const sizeInMB = (photo.size / (1024 * 1024)).toFixed(2);
			console.log(`❌ File too large: ${sizeInMB}MB (max 10MB)`);
			await logUploadAttempt(memorialId, userId, 'file_too_large', `Size: ${sizeInMB}MB`);
			return json({ 
				error: `File size (${sizeInMB}MB) exceeds maximum allowed size of 10MB` 
			}, { status: 400 });
		}

		// Step 6: Prepare file for upload
		const fileBuffer = Buffer.from(await photo.arrayBuffer());
		// Generate unique filename with timestamp and UUID to prevent collisions
		const timestamp = Date.now();
		const uuid = crypto.randomUUID();
		const sanitizedFileName = photo.name.replace(/[^a-zA-Z0-9.-]/g, '_');
		const fileName = `${timestamp}-${uuid}-${sanitizedFileName}`;
		const filePath = `memorials/${memorialId}/${fileName}`;
		
		console.log(`📝 Uploading to path: ${filePath}`);

		// Step 7: Upload to Firebase Storage with metadata
		const file = adminStorage.bucket().file(filePath);
		
		try {
			console.log('⏳ Starting file upload to Firebase Storage...');
			await file.save(fileBuffer, {
				metadata: { 
					contentType: photo.type,
					metadata: {
						// User information
						uploadedBy: userId,
						uploadedByEmail: userEmail,
						uploadedByRole: userRole,
						
						// File information
						originalName: photo.name,
						fileSize: photo.size.toString(),
						
						// Memorial information
						memorialId: memorialId,
						memorialName: memorialData?.lovedOneName || 'Unknown',
						
						// Timestamp
						uploadedAt: new Date().toISOString()
					}
				}
			});

			console.log('✅ File uploaded successfully to Storage');

			// Step 8: Get the download URL
			const downloadURL = await getDownloadURL(file);
			console.log(`🔗 Generated download URL: ${downloadURL.substring(0, 50)}...`);

			// Step 9: Update memorial document with new photo
			await memorialRef.update({
				photos: FieldValue.arrayUnion(downloadURL),
				updatedAt: FieldValue.serverTimestamp(),
				// Optionally track last photo upload metadata
				lastPhotoUpload: {
					userId: userId,
					userEmail: userEmail,
					role: userRole,
					timestamp: FieldValue.serverTimestamp()
				}
			});
			console.log('📝 Memorial document updated with new photo');

			// Step 10: Create comprehensive audit log
			const auditLog = {
				action: 'photo_upload',
				status: 'success',
				memorialId: memorialId,
				memorialName: memorialData?.lovedOneName || 'Unknown',
				photoUrl: downloadURL,
				filePath: filePath,
				fileName: fileName,
				originalFileName: photo.name,
				fileSize: photo.size,
				fileType: photo.type,
				uploadedBy: userId,
				uploadedByEmail: userEmail,
				uploadedByRole: userRole,
				uploadedAt: FieldValue.serverTimestamp(),
				processingTimeMs: Date.now() - startTime,
				isOwnerUpload: isOwner,
				isFamilyMemberUpload: isFamilyMember,
				isAdminUpload: isAdmin
			};
			
			await adminDb.collection('photoUploads').add(auditLog);
			console.log('📊 Audit log created for successful upload');

			// Step 11: Also log to general audit collection for comprehensive tracking
			await adminDb.collection('auditLogs').add({
				type: 'photo_upload',
				success: true,
				userId: userId,
				userEmail: userEmail,
				targetId: memorialId,
				targetType: 'memorial',
				details: {
					photoUrl: downloadURL,
					fileName: fileName,
					fileSize: photo.size,
					role: userRole
				},
				timestamp: FieldValue.serverTimestamp()
			});

			console.log(`🎉 Photo upload completed successfully in ${Date.now() - startTime}ms`);
			
			return json({ 
				success: true, 
				url: downloadURL,
				message: 'Photo uploaded successfully',
				metadata: {
					uploadedBy: userEmail,
					role: userRole,
					timestamp: new Date().toISOString()
				}
			});

		} catch (uploadError) {
			console.error('🔥 Error during file upload to Storage:', uploadError);
			await logUploadAttempt(
				memorialId, 
				userId, 
				'upload_failed', 
				`Storage error: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`
			);
			return json({ 
				error: 'File upload failed. Please try again.' 
			}, { status: 500 });
		}

	} catch (err) {
		console.error('🔥 Unexpected error in upload handler:', err);
		await logUploadAttempt(
			memorialId, 
			userId || null, 
			'server_error', 
			`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`
		);
		return json({ 
			error: 'An unexpected error occurred. Please try again.' 
		}, { status: 500 });
	}
};

/**
 * Helper function to log upload attempts (both successful and failed)
 */
async function logUploadAttempt(
	memorialId: string | null, 
	userId: string | null, 
	status: string, 
	details: string
) {
	try {
		await adminDb.collection('uploadAttempts').add({
			memorialId,
			userId,
			status,
			details,
			timestamp: FieldValue.serverTimestamp()
		});
		console.log(`📊 Logged upload attempt: ${status} - ${details}`);
	} catch (logError) {
		console.error('Failed to log upload attempt:', logError);
	}
}