import type { Timestamp } from 'firebase/firestore';

export interface Embed {
	id: string;
	title: string;
	type: 'youtube' | 'vimeo';
	embedUrl: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

// Service Detail Interfaces
export interface ServiceDetails {
	location: LocationInfo; // Service location
	time: TimeInfo; // Service time
	hours: number; // Duration in hours
	streamId?: string; // Associated stream ID for bidirectional linking
	streamHash?: string; // Hash of service data for change detection
}

export interface AdditionalServiceDetails {
	type: 'location' | 'day'; // Service type
	location: LocationInfo; // Service location
	time: TimeInfo; // Service time
	hours: number; // Duration in hours
	streamId?: string; // Associated stream ID for bidirectional linking
	streamHash?: string; // Hash of service data for change detection
}

export interface LocationInfo {
	name: string; // Location name
	address: string; // Location address
	isUnknown: boolean; // Unknown location flag
}

export interface TimeInfo {
	date: string | null; // Service date
	time: string | null; // Service time
	isUnknown: boolean; // Unknown time flag
}

export interface Memorial {
	lovedOneName: string;
	slug: string;
	fullSlug: string;
	ownerUid: string;
	creatorEmail: string;
	creatorName: string;
	directorFullName?: string;
	funeralHomeName?: string;

	// Service Details - consolidated structure
	services: {
		main: ServiceDetails; // Primary service details
		additional: AdditionalServiceDetails[]; // Additional locations/days
	};

	// Legacy fields (deprecated - will be removed after migration)
	memorialDate?: string;
	memorialTime?: string;
	memorialLocationName?: string;
	memorialLocationAddress?: string;
	isPublic: boolean;
	content: string;
	custom_html: string | null;
	isLegacy?: boolean; // Indicates if this memorial uses custom_html instead of structured data
	createdByUserId?: string; // Used to identify migration script created memorials
	createdAt: Timestamp;
	imageUrl?: string; // Adding optional fields that might be missing from schema but used in code
	birthDate?: string;
	deathDate?: string;
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
	followerCount?: number;

	// Access control - required fields
	funeralDirectorUid?: string;
}
