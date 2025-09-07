import type { Timestamp } from 'firebase/firestore';
// import type { CloudflareStream } from './livestream'; // Commented out until livestream types are available

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
	livestream?: any; // CloudflareStream when available
	livestreamConfig?: any; // Holds data from the calculator/booking form
	photos?: string[];
	embeds?: Embed[];
	
	// New fields for Phase 1 refactoring - Family contact information
	familyContactName?: string;
	familyContactEmail?: string;
	familyContactPhone?: string;
	familyContactPreference?: 'phone' | 'email';
	
	// New fields for Phase 1 refactoring - Director information
	directorEmail?: string;
	
	// New fields for Phase 1 refactoring - Additional notes
	additionalNotes?: string;
	
	// Missing properties used in ViewerPortal and other components
	serviceDate?: string;
	serviceTime?: string;
	location?: string;
	duration?: number;
	livestreamEnabled?: boolean;
	followerCount?: number;
	
	// Additional properties for access control
	ownerUid?: string;
	funeralDirectorUid?: string;
	familyMemberUids?: string[];
}