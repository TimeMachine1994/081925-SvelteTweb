// firecms/src/collections/memorials.tsx

import { buildCollection, buildProperty } from "@firecms/core";
import { Event } from "../types/event";

console.log("🏗️ Initializing Enhanced Memorials Collection Schema");

/**
 * Enhanced schema definition for the 'memorials' collection in Firestore.
 * Updated for Phase 1 refactoring with comprehensive funeral service coordination fields.
 */
export const memorialsCollection = buildCollection<Event>({
    id: "memorials",
    name: "Memorials",
    path: "memorials",
    description: "Enhanced memorials and tributes with comprehensive service coordination",
    permissions: ({ authController }) => {
        // Check multiple ways to determine admin status
        const isAdmin = authController.extra?.admin || 
                       (authController as any).isAdmin || 
                       authController.user?.email?.includes("austinbryanfilm@gmail.com") ||
                       authController.user?.email?.includes("@tributestream.com") ||
                       authController.user?.email?.includes("@firecms.co") ||
                       false;
        
        // Only log occasionally to reduce spam
        if (Math.random() < 0.01) { // Log ~1% of permission checks
            console.log("🏛️ Memorials Collection Permissions Check:", {
                authControllerExists: !!authController,
                extraExists: !!authController.extra,
                adminFlag: authController.extra?.admin,
                directAdminFlag: (authController as any).isAdmin,
                emailCheck: authController.user?.email,
                finalIsAdmin: isAdmin,
                timestamp: new Date().toISOString()
            });
        }
        
        return {
            // Full CRUD access for admin users
            read: isAdmin,
            edit: isAdmin,
            create: isAdmin,
            delete: isAdmin,
        };
    },
    properties: {
        // === CORE MEMORIAL INFORMATION ===
        id: buildProperty({
            dataType: "string",
            name: "Event ID",
            readOnly: true,
            description: "Unique identifier for the event"
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
            description: "Complete URL path for the event"
        }),
        
        // === CREATOR INFORMATION ===
        createdByUserId: buildProperty({
            dataType: "string",
            name: "Creator User ID",
            readOnly: true,
            description: "Firebase UID of the user who created this event"
        }),
        creatorEmail: buildProperty({
            dataType: "string",
            name: "Creator Email",
            validation: { required: true },
            description: "Email address of the event creator"
        }),
        creatorName: buildProperty({
            dataType: "string",
            name: "Creator Name",
            validation: { required: true },
            description: "Full name of the event creator"
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
            name: "Event Date",
            description: "Date of the event service (YYYY-MM-DD format)"
        }),
        memorialTime: buildProperty({
            dataType: "string",
            name: "Event Time",
            description: "Time of the event service"
        }),
        memorialLocationName: buildProperty({
            dataType: "string",
            name: "Event Location Name",
            description: "Name of the event service location"
        }),
        memorialLocationAddress: buildProperty({
            dataType: "string",
            name: "Event Location Address",
            description: "Full address of the event service location"
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
            description: "Any additional notes or special instructions for the event service"
        }),
        
        // === CONTENT AND VISIBILITY ===
        isPublic: buildProperty({
            dataType: "boolean",
            name: "Public Event",
            description: "Whether this event is publicly accessible",
            defaultValue: true
        }),
        content: buildProperty({
            dataType: "string",
            name: "Event Content",
            markdown: true,
            description: "Main content/story for the event page"
        }),
        custom_html: buildProperty({
            dataType: "string",
            name: "Custom HTML",
            multiline: true,
            description: "Custom HTML content for the event page"
        }),
        
        // === PERSONAL INFORMATION ===
        imageUrl: buildProperty({
            dataType: "string",
            name: "Profile Image URL",
            storage: {
                storagePath: "event-profiles",
                acceptedFiles: ["image/*"],
                maxSize: 1024 * 1024 * 5 // 5 MB
            },
            description: "Main profile image for the event"
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
                    storagePath: "event-photos",
                    acceptedFiles: ["image/*"],
                    maxSize: 1024 * 1024 * 5 // 5 MB
                }
            },
            description: "Photo gallery for the event"
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