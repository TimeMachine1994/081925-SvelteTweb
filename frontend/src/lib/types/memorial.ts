import type { Timestamp } from 'firebase/firestore';

export interface Memorial {
	id: string;
	lovedOneName: string;
	slug: string;
	fullSlug: string;
	createdByUserId: string;
	creatorEmail: string;
	creatorName: string;
	directorFullName?: string;
	funeralHomeName?: string;
	memorialDate?: string;
	memorialTime?: string;
	memorialLocationName?: string;
	memorialLocationAddress?: string;
	isPublic: boolean;
	content: string;
	custom_html: string | null;
	createdAt: Timestamp;
	updatedAt: Timestamp;
	imageUrl?: string; // Adding optional fields that might be missing from schema but used in code
	birthDate?: string;
	deathDate?: string;
	livestreamConfig?: any;
	photos?: string[];
}