# User Role Implementation Plan (082325)

This document outlines the plan to implement role-based access control (RBAC) for different user types within the Tributestream platform. This plan is designed to align with the existing architecture as defined in the Master Technical Design documents.

The new user roles to be implemented are:
- `family_member`
- `viewer`
- `owner`
- `funeral_director`
- `remote_producer`
- `onsite_videographer`

## Role Permissions and Abilities

This table outlines the intended abilities for each role. The initial implementation focuses on creating the roles and a basic portal view. The "Target Abilities" will be implemented in subsequent phases.

| Role | Current Abilities (What they can do NOW) | Target Abilities (What they SHOULD be able to do) |
| :--- | :--- | :--- |
| **owner** | See the "Owner" dashboard. Create/edit/view their own memorials. | Create new memorials. Edit, manage photos for, and delete memorials they own. Invite other users (family, viewers). |
| **family_member** | See the "Family Member" dashboard. | View memorials they are invited to. Potentially upload photos or leave comments (if allowed by the owner). |
| **viewer** | See the "Viewer" dashboard. | View memorials they are invited to (read-only access). |
| **funeral_director**| See the "Funeral Director" dashboard. | View all memorials associated with their funeral home. Potentially manage livestream details or assist owners. |
| **remote_producer**| See the "Remote Producer" dashboard. | Access technical details and controls for livestreams they are assigned to. |
| **onsite_videographer**| See the "Videographer" dashboard. | View event details, schedules, and contact information for assigned memorials. |

## Implementation Steps & Progress Log

| Step | Task | Status | Notes |
| :--- | :--- | :--- | :--- |
| 1 | Update Data Model & FireCMS | ✅ Completed | The `User` type and FireCMS `users` collection now include the `role` field. |
| 2 | Create Role-Setting Endpoint | ✅ Completed | The API endpoint at `/api/set-role-claim` is live and functional for admins. |
| 3 | Update Server Auth Hook | ✅ Completed | The server hook now reads the `role` custom claim and adds it to `event.locals.user`. |
| 4 | Implement Role-Based UI | ✅ Completed | The `/my-portal` page now renders a different placeholder view for each user role. |
| 5 | Implement Admin Preview | 🔲 Pending | Add functionality for admins to preview the portal as different roles. |
| 6 | Secure "Create Memorial" | 🔲 Pending | Restrict access to the "Create Memorial" page to the `owner` role only. |

### Step 1: Update Data Model & FireCMS

-   **Modify `User` Type:** Add a `role` field to the `User` type definition in `firecms/src/types/user.ts`.
-   **Update FireCMS Schema:** Add a `role` property to the `usersCollection` schema in `firecms/src/collections/users.tsx`.

### Step 2: Create Role-Setting Endpoint

-   **Create `+server.ts`:** Implement a new SvelteKit server endpoint at `frontend/src/routes/api/set-role-claim/+server.ts`.
-   **Endpoint Logic:** The endpoint accepts a UID and a role, sets the custom claim, and updates the Firestore document.
-   **Security:** The endpoint is secured to ensure only authenticated administrators can set roles.

### Step 3: Update Server Authentication Hook

-   **Enhance `hooks.server.ts`:** Modify the `handle` function to extract the `role` and `admin` custom claims.
-   **Update `event.locals`:** Add the `role` and `admin` status to the `event.locals.user` object.

### Step 4: Implement Role-Based UI in "My Portal"

-   **Modify `+page.server.ts`:** Update the `load` function to pass the full `locals.user` object to the page.
-   **Modify `+page.svelte`:** Update the component to conditionally render different UI placeholders based on the user's role.

This structured approach ensures that the new functionality is built on a solid foundation, is secure, and is well-integrated with the existing application architecture.