// firecms/src/collections/memorials.tsx

import { buildCollection, buildProperty } from "@firecms/core";
import { Memorial } from "../types/memorial.ts"; // We will create this type definition next

console.log("Initializing Memorials Collection Schema");

/**
 * This is the schema definition for the 'memorials' collection in Firestore.
 * It includes fields for tribute details, photo uploads, and creator information.
 */
export const memorialsCollection = buildCollection<Memorial>({
    id: "memorials",
    name: "Memorials",
    path: "memorials",
    description: "Memorials and tributes created by users",
    properties: {
        // The main title of the memorial
        title: buildProperty({
            dataType: "string",
            name: "Title",
            validation: { required: true }
        }),
        // A detailed description or story, with markdown support
        description: buildProperty({
            dataType: "string",
            name: "Description",
            markdown: true,
        }),
        // The UID of the user who created the memorial
        creatorUid: buildProperty({
            dataType: "string",
            name: "Creator UID",
            readOnly: true,
            description: "The Firebase UID of the user who created this memorial."
        }),
        // An array of public URLs for photos stored in Firebase Storage
        photos: buildProperty({
            dataType: "array",
            name: "Photos",
            of: {
                dataType: "string",
                storage: {
                    storagePath: "memorial-photos",
                    acceptedFiles: ["image/*"],
                    maxSize: 1024 * 1024 * 5 // 5 MB
                }
            },
            description: "Upload photos for the memorial gallery."
        }),
        // Timestamps for creation and updates
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
        })
    }
});