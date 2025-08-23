// firecms/src/collections/users.tsx

import { buildCollection, buildProperty } from "@firecms/core";
import { User, UserRole } from "../types/user";

console.log("Initializing Users Collection Schema");

/**
 * This is the schema definition for the 'users' collection in Firestore.
 * FireCMS uses this to automatically generate the UI for managing users.
 */
export const usersCollection = buildCollection<User>({
    id: "users",
    name: "Users",
    path: "users",
    description: "Registered users of the Tributestream platform",
    permissions: ({ authController }) => ({
        // Only allow admins to edit and delete users
        edit: authController.extra?.admin ?? false,
        create: authController.extra?.admin ?? false,
        delete: authController.extra?.admin ?? false,
    }),
    properties: {
        // Display Name of the user
        displayName: buildProperty({
            dataType: "string",
            name: "Display Name",
            validation: { required: true }
        }),
        // User's email address
        email: buildProperty({
            dataType: "string",
            name: "Email",
            validation: {
                required: true,
                email: true
            },
            readOnly: true // Email should not be editable from the admin panel
        }),
        // Timestamps for record creation
        createdAt: buildProperty({
            dataType: "date",
            name: "Created at",
            autoValue: "on_create",
            readOnly: true
        }),
        // User's role
        role: buildProperty({
            dataType: "string",
            name: "Role",
            description: "The user's role in the system",
            enumValues: {
                family_member: "Family Member",
                viewer: "Viewer",
                owner: "Owner",
                funeral_director: "Funeral Director",
                remote_producer: "Remote Producer",
                onsite_videographer: "Onsite Videographer"
            }
        })
    }
});