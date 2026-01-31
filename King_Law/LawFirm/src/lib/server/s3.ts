import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
	ListObjectsV2Command
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '$env/dynamic/private';

// S3 Client Configuration
const s3Client = new S3Client({
	region: env.AWS_REGION || 'us-east-2',
	credentials: {
		accessKeyId: env.AWS_ACCESS_KEY_ID || '',
		secretAccessKey: env.AWS_SECRET_ACCESS_KEY || ''
	}
});

const BUCKET_NAME = env.AWS_S3_BUCKET || 'kinglawbucket';

// Folder structure constants
export const S3_FOLDERS = {
	// Public folders (accessible without authentication)
	PUBLIC_IMAGES: 'public/images',
	PUBLIC_VIDEOS: 'public/videos',
	PUBLIC_ASSETS: 'public/assets',

	// Private folders (require authentication)
	PRIVATE_CASES: 'private/cases',
	PRIVATE_CLIENTS: 'private/clients',
	PRIVATE_LAWYERS: 'private/lawyers'
} as const;

// Get the public URL for a file in the public folder
export function getPublicUrl(key: string): string {
	return `https://${BUCKET_NAME}.s3.${env.AWS_REGION || 'us-east-2'}.amazonaws.com/${key}`;
}

// Upload a file to S3
export async function uploadFile(
	key: string,
	body: Buffer | Uint8Array | string,
	contentType: string,
	metadata?: Record<string, string>
): Promise<{ success: boolean; url: string; key: string }> {
	try {
		await s3Client.send(
			new PutObjectCommand({
				Bucket: BUCKET_NAME,
				Key: key,
				Body: body,
				ContentType: contentType,
				Metadata: metadata
			})
		);

		const isPublic = key.startsWith('public/');
		const url = isPublic ? getPublicUrl(key) : await getPresignedDownloadUrl(key);

		return { success: true, url, key };
	} catch (error) {
		console.error('S3 upload error:', error);
		throw new Error('Failed to upload file to S3');
	}
}

// Upload to public folder (images, videos, assets)
export async function uploadPublicFile(
	folder: 'images' | 'videos' | 'assets',
	fileName: string,
	body: Buffer | Uint8Array,
	contentType: string
): Promise<{ url: string; key: string }> {
	const key = `public/${folder}/${fileName}`;
	const result = await uploadFile(key, body, contentType);
	return { url: getPublicUrl(key), key };
}

// Upload to private case folder
export async function uploadCaseFile(
	caseId: string,
	fileName: string,
	body: Buffer | Uint8Array,
	contentType: string,
	uploadedBy: string
): Promise<{ key: string }> {
	const key = `private/cases/${caseId}/${fileName}`;
	await uploadFile(key, body, contentType, {
		uploadedBy,
		uploadedAt: new Date().toISOString()
	});
	return { key };
}

// Upload to private client folder
export async function uploadClientFile(
	userId: string,
	fileName: string,
	body: Buffer | Uint8Array,
	contentType: string
): Promise<{ key: string }> {
	const key = `private/clients/${userId}/${fileName}`;
	await uploadFile(key, body, contentType);
	return { key };
}

// Upload to private lawyer folder
export async function uploadLawyerFile(
	userId: string,
	fileName: string,
	body: Buffer | Uint8Array,
	contentType: string
): Promise<{ key: string }> {
	const key = `private/lawyers/${userId}/${fileName}`;
	await uploadFile(key, body, contentType);
	return { key };
}

// Generate a presigned URL for downloading private files (expires in 1 hour by default)
export async function getPresignedDownloadUrl(
	key: string,
	expiresIn: number = 3600
): Promise<string> {
	const command = new GetObjectCommand({
		Bucket: BUCKET_NAME,
		Key: key
	});

	return await getSignedUrl(s3Client, command, { expiresIn });
}

// Generate a presigned URL for uploading (client-side direct upload)
export async function getPresignedUploadUrl(
	key: string,
	contentType: string,
	expiresIn: number = 3600
): Promise<string> {
	const command = new PutObjectCommand({
		Bucket: BUCKET_NAME,
		Key: key,
		ContentType: contentType
	});

	return await getSignedUrl(s3Client, command, { expiresIn });
}

// Delete a file from S3
export async function deleteFile(key: string): Promise<void> {
	try {
		await s3Client.send(
			new DeleteObjectCommand({
				Bucket: BUCKET_NAME,
				Key: key
			})
		);
	} catch (error) {
		console.error('S3 delete error:', error);
		throw new Error('Failed to delete file from S3');
	}
}

// List files in a folder
export async function listFiles(
	prefix: string,
	maxKeys: number = 100
): Promise<{ key: string; size: number; lastModified: Date }[]> {
	try {
		const response = await s3Client.send(
			new ListObjectsV2Command({
				Bucket: BUCKET_NAME,
				Prefix: prefix,
				MaxKeys: maxKeys
			})
		);

		return (response.Contents || []).map((item) => ({
			key: item.Key || '',
			size: item.Size || 0,
			lastModified: item.LastModified || new Date()
		}));
	} catch (error) {
		console.error('S3 list error:', error);
		throw new Error('Failed to list files from S3');
	}
}

// List case files
export async function listCaseFiles(caseId: string) {
	return listFiles(`private/cases/${caseId}/`);
}

// List client files
export async function listClientFiles(userId: string) {
	return listFiles(`private/clients/${userId}/`);
}

// List lawyer files
export async function listLawyerFiles(userId: string) {
	return listFiles(`private/lawyers/${userId}/`);
}

// Helper to sanitize filename
export function sanitizeFileName(fileName: string): string {
	return fileName
		.replace(/[^a-zA-Z0-9.-]/g, '_')
		.replace(/_+/g, '_')
		.toLowerCase();
}

// Generate unique filename with timestamp
export function generateUniqueFileName(originalName: string): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	const sanitized = sanitizeFileName(originalName);
	const ext = sanitized.split('.').pop() || '';
	const name = sanitized.replace(`.${ext}`, '');
	return `${name}_${timestamp}_${random}.${ext}`;
}
