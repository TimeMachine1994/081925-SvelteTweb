// firecms/src/collections/memorials.tsx

import { buildCollection, buildProperty } from "@firecms/core";
import { Memorial } from "../types/memorial";

console.log("🏗️ Initializing Enhanced Memorials Collection Schema");

/**
 * Enhanced schema definition for the 'memorials' collection in Firestore.
 * Updated for Phase 1 refactoring with comprehensive funeral service coordination fields.
 */
export const memorialsCollection = buildCollection<Memorial>({
    id: "memorials",
    name: "Memorials",
    path: "memorials",
    description: "Enhanced memorials and tributes with comprehensive service coordination",
    properties: {
        // === CORE MEMORIAL INFORMATION ===
        id: buildProperty({
            dataType: "string",
            name: "Memorial ID",
            readOnly: true,
            description: "Unique identifier for the memorial"
        }),
        lovedOneName: buildProperty({
            dataType: "string",
            name: "Loved One's Name",
            validation: { required: true },
            description: "Full name of the person being memorialized"
        }),
        slug: buildProperty({
            dataType: "string",
            name: "URL Slug",
            validation: { required: true },
            description: "URL-friendly version of the name"
        }),
        fullSlug: buildProperty({
            dataType: "string",
            name: "Full URL Slug",
            validation: { required: true },
            description: "Complete URL path for the memorial"
        }),
        
        // === CREATOR INFORMATION ===
        createdByUserId: buildProperty({
            dataType: "string",
            name: "Creator User ID",
            readOnly: true,
            description: "Firebase UID of the user who created this memorial"
        }),
        creatorEmail: buildProperty({
            dataType: "string",
            name: "Creator Email",
            validation: { required: true },
            description: "Email address of the memorial creator"
        }),
        creatorName: buildProperty({
            dataType: "string",
            name: "Creator Name",
            validation: { required: true },
            description: "Full name of the memorial creator"
        }),
        
        // === FUNERAL DIRECTOR & SERVICE INFORMATION ===
        directorFullName: buildProperty({
            dataType: "string",
            name: "Funeral Director Name",
            description: "Full name of the funeral director"
        }),
        funeralHomeName: buildProperty({
            dataType: "string",
            name: "Funeral Home Name",
            description: "Name of the funeral home"
        }),
        directorEmail: buildProperty({
            dataType: "string",
            name: "Director Email",
            description: "Email address of the funeral director"
        }),
        
        // === MEMORIAL SERVICE DETAILS ===
        memorialDate: buildProperty({
            dataType: "string",
            name: "Memorial Date",
            description: "Date of the memorial service (YYYY-MM-DD format)"
        }),
        memorialTime: buildProperty({
            dataType: "string",
            name: "Memorial Time",
            description: "Time of the memorial service"
        }),
        memorialLocationName: buildProperty({
            dataType: "string",
            name: "Memorial Location Name",
            description: "Name of the memorial service location"
        }),
        memorialLocationAddress: buildProperty({
            dataType: "string",
            name: "Memorial Location Address",
            description: "Full address of the memorial service location"
        }),
        
        // === NEW PHASE 1 FIELDS: FAMILY CONTACT INFORMATION ===
        familyContactName: buildProperty({
            dataType: "string",
            name: "Family Contact Name",
            description: "Primary family contact person's full name"
        }),
        familyContactEmail: buildProperty({
            dataType: "string",
            name: "Family Contact Email",
            description: "Primary family contact person's email address"
        }),
        familyContactPhone: buildProperty({
            dataType: "string",
            name: "Family Contact Phone",
            description: "Primary family contact person's phone number"
        }),
        familyContactPreference: buildProperty({
            dataType: "string",
            name: "Family Contact Preference",
            enumValues: [
                { id: "phone", label: "Phone" },
                { id: "email", label: "Email" }
            ],
            description: "Preferred method of contact for the family"
        }),
        
        // === NEW PHASE 1 FIELDS: ADDITIONAL NOTES ===
        additionalNotes: buildProperty({
            dataType: "string",
            name: "Additional Notes",
            multiline: true,
            description: "Any additional notes or special instructions for the memorial service"
        }),
        
        // === CONTENT AND VISIBILITY ===
        isPublic: buildProperty({
            dataType: "boolean",
            name: "Public Memorial",
            description: "Whether this memorial is publicly accessible",
            defaultValue: true
        }),
        content: buildProperty({
            dataType: "string",
            name: "Memorial Content",
            markdown: true,
            description: "Main content/story for the memorial page"
        }),
        custom_html: buildProperty({
            dataType: "string",
            name: "Custom HTML",
            multiline: true,
            description: "Custom HTML content for the memorial page"
        }),
        
        // === PERSONAL INFORMATION ===
        imageUrl: buildProperty({
            dataType: "string",
            name: "Profile Image URL",
            storage: {
                storagePath: "memorial-profiles",
                acceptedFiles: ["image/*"],
                maxSize: 1024 * 1024 * 5 // 5 MB
            },
            description: "Main profile image for the memorial"
        }),
        birthDate: buildProperty({
            dataType: "string",
            name: "Birth Date",
            description: "Date of birth (YYYY-MM-DD format)"
        }),
        deathDate: buildProperty({
            dataType: "string",
            name: "Date of Passing",
            description: "Date of passing (YYYY-MM-DD format)"
        }),
        
        // === MEDIA GALLERY ===
        photos: buildProperty({
            dataType: "array",
            name: "Photo Gallery",
            of: {
                dataType: "string",
                storage: {
                    storagePath: "memorial-photos",
                    acceptedFiles: ["image/*"],
                    maxSize: 1024 * 1024 * 5 // 5 MB
                }
            },
            description: "Photo gallery for the memorial"
        }),
        
        // === LIVESTREAM CONFIGURATION ===
        livestreamConfig: buildProperty({
            dataType: "map",
            name: "Livestream Configuration",
            description: "Configuration data from the calculator/booking form"
        }),
        
        // === TIMESTAMPS ===
        createdAt: buildProperty({
            dataType: "date",
            name: "Created At",
            autoValue: "on_create",
            readOnly: true
        }),
        updatedAt: buildProperty({
            dataType: "date",
            name: "Updated At",
            autoValue: "on_update",
            readOnly: true
        }),
        
        // === LEGACY COMPATIBILITY FIELDS ===
        title: buildProperty({
            dataType: "string",
            name: "Legacy Title",
            description: "Legacy field - maps to lovedOneName"
        }),
        description: buildProperty({
            dataType: "string",
            name: "Legacy Description",
            markdown: true,
            description: "Legacy field - maps to content"
        }),
        creatorUid: buildProperty({
            dataType: "string",
            name: "Legacy Creator UID",
            description: "Legacy field - maps to createdByUserId"
        })
    }
});

console.log("✅ Enhanced Memorials Collection Schema initialized successfully");