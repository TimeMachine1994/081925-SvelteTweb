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

// Service Detail Interfaces (moved from LivestreamConfig)
export interface ServiceDetails {
	location: LocationInfo;         // Service location
	time: TimeInfo;                 // Service time
	hours: number;                  // Duration in hours
}

export interface AdditionalServiceDetails {
	enabled: boolean;               // Whether service is enabled
	location: LocationInfo;         // Service location
	time: TimeInfo;                 // Service time
	hours: number;                  // Duration in hours
}

export interface LocationInfo {
	name: string;                   // Location name
	address: string;                // Location address
	isUnknown: boolean;             // Unknown location flag
}

export interface TimeInfo {
	date: string | null;            // Service date
	time: string | null;            // Service time
	isUnknown: boolean;             // Unknown time flag
}

export interface LivestreamArchiveEntry {
	id: string;                     // Unique identifier for this stream
	title: string;                  // Stream title
	description?: string;           // Stream description
	cloudflareId: string;           // Cloudflare Stream ID
	playbackUrl: string;            // Playback URL for recorded stream
	startedAt: Timestamp;           // When stream started
	endedAt?: Timestamp;            // When stream ended
	duration?: number;              // Duration in seconds
	isVisible: boolean;             // Whether visible on memorial page
	recordingReady: boolean;        // Whether recording is available
	startedBy: string;              // UID of user who started stream
	startedByName?: string;         // Name of user who started stream
	viewerCount?: number;           // Peak viewer count
	createdAt: Timestamp;           // Archive entry creation
	updatedAt: Timestamp;           // Last update
}

export interface Memorial {
	id: string;
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
		main: ServiceDetails;         // Primary service details
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
	createdAt: Timestamp;
	updatedAt: Timestamp;
	imageUrl?: string; // Adding optional fields that might be missing from schema but used in code
	birthDate?: string;
	deathDate?: string;
	livestream?: any; // CloudflareStream when available
	livestreamConfig?: any; // Holds data from the calculator/booking form
	livestreamArchive?: LivestreamArchiveEntry[]; // Historical livestreams
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
	
	// Access control - required fields
	funeralDirectorUid?: string;
}