// firecms/src/types/memorial.ts

/**
 * Defines the data structure for a Memorial document in Firestore.
 * Updated to match frontend schema and include new Phase 1 refactoring fields.
 */
export type Memorial = {
    // Core memorial information
    id: string;
    lovedOneName: string;
    slug: string;
    fullSlug: string;
    createdByUserId: string;
    creatorEmail: string;
    creatorName: string;
    
    // Funeral director and service information
    directorFullName?: string;
    funeralHomeName?: string;
    
    // Memorial service details
    memorialDate?: string;
    memorialTime?: string;
    memorialLocationName?: string;
    memorialLocationAddress?: string;
    
    // Content and visibility
    isPublic: boolean;
    content: string;
    custom_html: string | null;
    
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    
    // Media and additional content
    imageUrl?: string;
    birthDate?: string;
    deathDate?: string;
    photos: string[];
    embeds?: Array<{
        id: string;
        title: string;
        type: 'youtube' | 'vimeo';
        embedUrl: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    
    // Livestream configuration
    livestream?: any; // CloudflareStream type
    livestreamConfig?: any; // Holds data from the calculator/booking form
    
    // NEW FIELDS - Phase 1 refactoring: Family contact information
    familyContactName?: string;
    familyContactEmail?: string;
    familyContactPhone?: string;
    familyContactPreference?: 'phone' | 'email';
    
    // NEW FIELDS - Phase 1 refactoring: Director information
    directorEmail?: string;
    
    // NEW FIELDS - Phase 1 refactoring: Additional notes
    additionalNotes?: string;
    
    // Legacy fields for backward compatibility
    title?: string; // Maps to lovedOneName
    description?: string; // Maps to content
    creatorUid?: string; // Maps to createdByUserId
}