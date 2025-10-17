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
            console.log("👤 Users Collection Permissions Check:", {
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
            enumValues: [
                { id: "family_member", label: "Family Member" },
                { id: "viewer", label: "Viewer" },
                { id: "owner", label: "Owner" },
                { id: "funeral_director", label: "Funeral Director" },
                { id: "remote_producer", label: "Remote Producer" },
                { id: "onsite_videographer", label: "Onsite Videographer" }
            ]
        })
    }
});