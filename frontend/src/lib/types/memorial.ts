import type { Timestamp } from 'firebase/firestore';
import type { CloudflareStream } from './livestream';

export interface Embed {
	id: string;
	title: string;
	type: 'youtube' | 'vimeo';
	embedUrl: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

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
	livestream?: CloudflareStream;
	livestreamConfig?: any; // Holds data from the calculator/booking form
	photos?: string[];
	embeds?: Embed[];
}