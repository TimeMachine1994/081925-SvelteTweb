# FireCMS Integration Plan: Managing Tributestream Collections

## 1. Objective

The goal of this document is to provide a clear, step-by-step guide for integrating the primary Firestore collections of the Tributestream application (`users` and `memorials`) into the FireCMS admin panel. This will enable administrators to easily manage the application's data through a user-friendly interface.

**Developer's Note:** Throughout this process, you are required to add **copious console logging and descriptive comments** to your code. This is crucial for debugging during development and for long-term maintainability. Every new file and major code block should explain its purpose. Every function or complex property should log its execution.

---

## 2. Prerequisites

Before you begin, ensure that you can run the FireCMS application locally.

1.  Navigate to the `firecms` directory: `cd firecms`
2.  Install dependencies: `npm install`
3.  Run the development server: `npm run dev`
4.  Open your browser to the local address provided. You should see the FireCMS login screen.

---

## 3. Step-by-Step Integration Plan

### Step 3.1: Create the `users` Collection Schema

First, we will define the schema for the `users` collection. This will allow admins to view and manage user data.

1.  **Create the file:** In the `firecms/src/collections/` directory, create a new file named `users.tsx`.

2.  **Define the Collection:** Add the following code to `users.tsx`. This code defines the structure of the `users` collection and its properties.

    ```typescript
    // firecms/src/collections/users.tsx

    import { buildCollection, buildProperty } from "@firecms/core";
    import { User } from "../types/user.ts"; // We will create this type definition next

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
            })
        }
    });
    ```

3.  **Create the Type Definition:** For type safety, create a `types` folder inside `firecms/src/` and add a `user.ts` file.

    ```typescript
    // firecms/src/types/user.ts
    
    /**
     * Defines the data structure for a User document in Firestore.
     */
    export type User = {
        displayName: string;
        email: string;
        createdAt: Date;
    }
    ```

### Step 3.2: Create the `memorials` Collection Schema

Next, we'll define the schema for the `memorials` collection, which is the core data of the application.

1.  **Create the file:** In the `firecms/src/collections/` directory, create a new file named `memorials.tsx`.

2.  **Define the Collection:** Add the following code to `memorials.tsx`. This schema includes properties for text, images, and a reference to the `users` collection.

    ```typescript
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
    ```

3.  **Create the Type Definition:** Add a `memorial.ts` file to the `firecms/src/types/` directory.

    ```typescript
    // firecms/src/types/memorial.ts

    /**
     * Defines the data structure for a Memorial document in Firestore.
     */
    export type Memorial = {
        title: string;
        description: string;
        creatorUid: string;
        photos: string[];
        createdAt: Date;
        updatedAt: Date;
    }
    ```

### Step 3.3: Update the FireCMS App with New Collections

Now, we need to tell the main FireCMS component to use our new collection schemas.

1.  **Open `App.tsx`:** Navigate to and open `firecms/src/App.tsx`.

2.  **Import Collections:** Import the `usersCollection` and `memorialsCollection` you just created. Remove the import for the `demoCollection`.

    ```typescript
    // ... other imports
    // import { demoCollection } from "./collections/demo"; // REMOVE THIS LINE
    import { usersCollection } from "./collections/users"; // ADD THIS LINE
    import { memorialsCollection } from "./collections/memorials"; // ADD THIS LINE
    // ...
    ```

3.  **Update Collections Array:** Find the `collections` constant and replace `demoCollection` with your new collections.

    ```typescript
    // ... inside the App component
    const collections = useMemo(() => {
        console.log("Loading collections into FireCMS:", ["usersCollection", "memorialsCollection"]);
        // return [demoCollection]; // REMOVE THIS LINE
        return [usersCollection, memorialsCollection]; // ADD THIS LINE
    }, []);
    // ...
    ```

### Step 4: Testing and Verification

1.  **Start the App:** If it's not already running, start the FireCMS dev server (`npm run dev` in the `firecms` directory).
2.  **Check the Console:** Open your browser's developer console. You should see the log messages you added, such as "Initializing Users Collection Schema" and "Loading collections into FireCMS".
3.  **Log In:** Log in to the admin panel at `/admin`.
4.  **Verify Navigation:** You should now see "Users" and "Memorials" in the side navigation menu instead of "Demo collection".
5.  **Test CRUD Operations:**
    *   Navigate to the "Memorials" collection.
    *   Create a new memorial entry, fill out the fields, and upload an image.
    *   Verify the new entry appears in the list.
    *   Edit the entry.
    *   Delete the entry.
    *   Repeat the process for the "Users" collection (if your permissions allow).

---

## 5. Conclusion

By following these steps, you will have successfully integrated your core application collections into FireCMS. This provides a secure and efficient way for administrators to manage user data and memorial tributes. You can now proceed to create schemas for any other collections your application requires.