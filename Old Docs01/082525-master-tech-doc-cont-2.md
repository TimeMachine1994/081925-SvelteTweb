# Master Technical Design: Tributestream SvelteKit Migration

## 1. Introduction

### 1.1. Purpose

This document serves as the single source of truth for the technical design of the Tributestream platform's migration from React/Next.js to SvelteKit. It synthesizes all previous technical design documents into a cohesive, actionable blueprint for development. Its purpose is to guide the development team through the migration process, ensuring a consistent and high-quality result.

### 1.2. Project Overview

Tributestream is a specialized online platform designed to help users create, manage, and share memorial services and tributes for their loved ones. The migration to SvelteKit aims to improve performance, simplify the codebase, and enhance the developer experience.

## 2. Architecture

### 2.1. Current State (Pre-Migration)

The existing application is built on a modern stack including React, Next.js, TypeScript, and Firebase. It utilizes a component-based architecture with server-side rendering, Firebase for backend services, and Algolia for search. While functional, the architecture has weaknesses in terms of potential tight coupling with the Firebase SDK and monolithic Cloud Functions.

### 2.2. Target State (Post-Migration)

The new architecture will be built on SvelteKit, leveraging its features to create a more performant, maintainable, and scalable platform.

#### 2.2.1. SvelteKit Routing and Component Structure

-   **Routing:** SvelteKit's file-based routing will be used to organize pages, layouts, and server-side logic in the `src/routes` directory.
-   **Components:** Components will be organized by feature in `src/lib/components`, with shared UI components in `src/lib/components/ui`.

#### 2.2.2. Firebase Integration

-   **Server-Side:** The Firebase Admin SDK will be used in SvelteKit's `+page.server.ts` and `+server.ts` files for secure data access.
-   **Client-Side:** The client-side Firebase SDK will be used for real-time updates and authentication.

## 3. Data Model

The application will continue to use Firestore as its primary database. The existing data model is largely suitable, with the following potential optimizations:

-   **Data Duplication:** To improve performance, some data may be duplicated (e.g., adding `creatorDisplayName` to the `memorials` collection).
-   **Collection Consolidation:** The `userEventConfigurations`, `eventConfigs`, and `privateNotes` collections may be consolidated to simplify queries.
-   **Indexing Review:** Firestore indexes will be reviewed and optimized for SvelteKit's data fetching patterns.
-   **Memorial Photos:** A `photos` field (array of strings) has been added to the `memorials` collection. This array stores the public download URLs for each image uploaded to a specific memorial, linking the Firestore document to the files in Firebase Storage.
-   **User Roles:** A `role` field (string) has been added to the `users` collection to support role-based access control. This field is managed via FireCMS and corresponds to a custom claim on the user's Firebase Auth token.

## 4. Authentication and Authorization

User authentication and authorization will be managed using Firebase Auth, with a secure flow integrated into SvelteKit.

-   **Authentication Flow:** User registration, login, and password reset will be handled via the Firebase Auth SDK on the client, with session management using secure, `HttpOnly` cookies set by the SvelteKit server.
-   **Authorization:** Access control is implemented using Firebase Auth custom claims. A user's `role` (e.g., `owner`, `viewer`) and `admin` status are set as custom claims on their token. The SvelteKit server hook (`hooks.server.ts`) verifies the session cookie on every request and attaches the user's identity, including their role and admin status, to the `event.locals` object. This allows for granular, server-side permission checks in `load` functions and API endpoints.
-   **Storage Rules:** Firebase Storage rules have been configured to enforce that users can only write to paths corresponding to memorials they own (`creatorUid`). This prevents unauthorized uploads. All photos are publicly readable to allow for easy display in the tribute gallery.

## 5. API Service Contract

Backend interactions will be handled by a combination of SvelteKit server endpoints and Firebase Cloud Functions.

-   **SvelteKit Endpoints:** Existing Next.js API routes for admin functionality, login, and search will be re-implemented as SvelteKit `+server.ts` endpoints.
    -   A new endpoint at `/my-portal/tributes/[memorialId]/upload` handles photo uploads. It accepts `multipart/form-data`, validates user ownership of the memorial, uploads the file to a structured path in Firebase Storage, and updates the corresponding memorial document in Firestore with the new photo's URL.
    -   New endpoints at `/api/set-admin-claim` and `/api/set-role-claim` have been created to allow administrators to manage user permissions via Firebase custom claims.
-   **Cloud Functions:** Existing callable Cloud Functions for creating memorials, saving calculator configurations, and processing payments will be maintained.

## 6. Component Migration Plan

React components will be migrated to Svelte, leveraging Svelte's features to simplify the codebase.

-   **Providers:** React Context providers will be replaced with Svelte stores or simple modules.
-   **Layout Components:** Next.js layout components will be migrated to SvelteKit layouts (`+layout.svelte`).
-   **UI Components:** The `shadcn/ui` React components will be replaced with a Svelte-native UI library like `shadcn-svelte` or `bits-ui`.
-   **Complex Patterns:** React HOCs, render props, and custom hooks will be re-architected using Svelte snippets, composition, and runes in `.svelte.js` files.
-   **Photo Feature Components:** The `PhotoUploader.svelte` and `PhotoGallery.svelte` components provide the core user interface for photo management. `PhotoUploader` uses SvelteKit's progressive enhancement (`use:enhance`) to handle form submission. Upon a successful upload, it calls `invalidateAll()` to trigger a server-side data refresh, ensuring the `PhotoGallery` component automatically displays the new image without a full page reload.
-   **User Portal Components:** The `/my-portal` page has been refactored into a hub that dynamically renders role-specific dashboard components (e.g., `OwnerPortal.svelte`, `FuneralDirectorPortal.svelte`). An admin-only `RolePreviewer.svelte` component has been added to facilitate testing of the different portal views.

## 7. State Management

Application state will be managed using Svelte's built-in features.

-   **Global State:** Svelte stores (`writable`, `readable`, `derived`) will be used for global state, such as the user's authentication status.
-   **Local State:** Svelte 5 runes (`$state`, `$derived`) will be used for local component state.
-   **Data Fetching & Invalidation:** Data is fetched on the server via `load` functions. For client-side actions that modify data (like photo uploads), the `invalidateAll()` function from `$app/navigation` is used to programmatically refetch server data, keeping the UI in sync with the backend state.

## 8. Deployment and CI/CD

The application will be deployed to Google Cloud Run via Firebase Hosting, with an automated CI/CD pipeline.

-   **SvelteKit Adapter:** The `adapter-auto` will be used to build the application for a Node.js environment.
-   **CI/CD Pipeline:** A GitHub Actions workflow will be used to automate testing and deployment on every push to the `main` branch.

## 9. Testing Strategy

A comprehensive testing strategy will be implemented to ensure application quality.

-   **Unit Testing:** Vitest will be used for testing Svelte components and frontend logic. Jest will be used for backend utility functions.
-   **Integration Testing:** The Firebase Emulator Suite will be used to test interactions between the frontend, backend services, and the database.
-   **End-to-End Testing:** Playwright will be used to validate complete user flows in a browser environment.

## 10. Performance Optimization

The application will be optimized for performance, with a focus on Core Web Vitals.

-   **KPIs:** The targets are LCP < 2.5s, FID < 100ms, and CLS < 0.1.
-   **Strategies:**
    -   **Bundle Optimization:** Leveraging SvelteKit's code-splitting and tree-shaking.
    -   **Image Loading:** Using modern formats, responsive images, and lazy loading.
    -   **Data Fetching:** Prioritizing SSR for initial page loads and implementing caching.

## 11. Admin Panel (FireCMS)

### 11.1. Overview

The project utilizes FireCMS, a headless CMS and admin panel built for Firebase, to provide an administrative interface for managing application data. This allows for content management without requiring direct database manipulation or custom-built admin tools, significantly speeding up development and simplifying content workflows.

### 11.2. Implementation Details

-   **Architecture:** The FireCMS instance is a standalone React/Vite application located in the `firecms/` directory, separate from the SvelteKit frontend.
-   **Routing:** It is configured to be served under the `/admin` path, providing a clear separation from the public-facing application.
-   **Integration:** It connects directly to the project's `fir-tweb` Firestore database and Firebase Storage instance, acting as a direct management layer for the application's backend data.

### 11.3. Authentication and Authorization

-   **Authentication:** The admin panel uses Firebase Authentication, supporting logins via Google and email/password providers.
-   **Authorization:** A custom authorization hook is implemented to restrict access. It verifies that a logged-in user has an `admin` custom claim in their Firebase Auth token, ensuring only privileged users can access the CMS and manage content.

### 11.4. Data Management and Schema

-   **UI Generation:** FireCMS dynamically generates a user interface based on collection schemas defined as code. This provides a type-safe and version-controlled way to manage the admin panel's structure.
-   **Current State:** The current implementation includes schemas for the `memorials` and `users` collections. The `users` schema includes a `role` field to allow for role-based access control management directly from the admin panel.

## 12. User Roles and Portals

A role-based access control (RBAC) system has been implemented to provide tailored experiences and permissions for different user types.

### 12.1. Defined Roles

The following user roles have been established:
- `family_member`
- `viewer`
- `owner`
- `funeral_director`
- `remote_producer`
- `onsite_videographer`

### 12.2. Role Permissions

This table outlines the intended abilities for each role.

| Role | Target Abilities (What they SHOULD be able to do) |
| :--- | :--- |
| **owner** | Create new memorials. Edit, manage photos for, and delete memorials they own. Invite other users (family, viewers). |
| **family_member** | View memorials they are invited to. Potentially upload photos or leave comments (if allowed by the owner). |
| **viewer** | View memorials they are invited to (read-only access). |
| **funeral_director**| View all memorials associated with their funeral home. Potentially manage livestream details or assist owners. |
| **remote_producer**| Access technical details and controls for livestreams they are assigned to. |
| **onsite_videographer**| View event details, schedules, and contact information for assigned memorials. |

### 12.3. Admin Preview Functionality

To facilitate development and testing, a role preview feature has been implemented for administrators.
-   **Mechanism:** When an admin is logged in, they can append a `?preview_role=<role_name>` query parameter to the `/my-portal` URL.
-   **Logic:** The server-side `load` function for the portal page detects this parameter, verifies the user is an admin, and then temporarily overrides their role for that page view.
-   **UI:** A `RolePreviewer.svelte` component is displayed only to admins, providing a simple dropdown to switch between different role views without needing to log out or change data.

## 13. User Role Implementation Plan (082325)

This document outlines the plan to implement role-based access control (RBAC) for different user types within the Tributestream platform. This plan is designed to align with the existing architecture as defined in the Master Technical Design documents.

The new user roles to be implemented are:
- `family_member`
- `viewer`
- `owner`
- `funeral_director`
- `remote_producer`
- `onsite_videographer`

### Role Permissions and Abilities

This table outlines the intended abilities for each role. The initial implementation focuses on creating the roles and a basic portal view. The "Target Abilities" will be implemented in subsequent phases.

| Role | Current Abilities (What they can do NOW) | Target Abilities (What they SHOULD be able to do) |
| :--- | :--- | :--- |
| **owner** | See the "Owner" dashboard. Create/edit/view their own memorials. | Create new memorials. Edit, manage photos for, and delete memorials they own. Invite other users (family, viewers). |
| **family_member** | See the "Family Member" dashboard. | View memorials they are invited to. Potentially upload photos or leave comments (if allowed by the owner). |
| **viewer** | See the "Viewer" dashboard. | View memorials they are invited to (read-only access). |
| **funeral_director**| See the "Funeral Director" dashboard. | View all memorials associated with their funeral home. Potentially manage livestream details or assist owners. |
| **remote_producer**| See the "Remote Producer" dashboard. | Access technical details and controls for livestreams they are assigned to. |
| **onsite_videographer**| See the "Videographer" dashboard. | View event details, schedules, and contact information for assigned memorials. |

### Implementation Steps & Progress Log

| Step | Task | Status | Notes |
| :--- | :--- | :--- | :--- |
| 1 | Update Data Model & FireCMS | ✅ Completed | The `User` type and FireCMS `users` collection now include the `role` field. |
| 2 | Create Role-Setting Endpoint | ✅ Completed | The API endpoint at `/api/set-role-claim` is live and functional for admins. |
| 3 | Update Server Auth Hook | ✅ Completed | The server hook now reads the `role` custom claim and adds it to `event.locals.user`. |
| 4 | Implement Role-Based UI | ✅ Completed | The `/my-portal` page now renders a different placeholder view for each user role. |
| 5 | Implement Admin Preview | 🔲 Pending | Add functionality for admins to preview the portal as different roles. |
| 6 | Secure "Create Memorial" | 🔲 Pending | Restrict access to the "Create Memorial" page to the `owner` role only. |

#### Step 1: Update Data Model & FireCMS

-   **Modify `User` Type:** Add a `role` field to the `User` type definition in `firecms/src/types/user.ts`.
-   **Update FireCMS Schema:** Add a `role` property to the `usersCollection` schema in `firecms/src/collections/users.tsx`.

#### Step 2: Create Role-Setting Endpoint

-   **Create `+server.ts`:** Implement a new SvelteKit server endpoint at `frontend/src/routes/api/set-role-claim/+server.ts`.
-   **Endpoint Logic:** The endpoint accepts a UID and a role, sets the custom claim, and updates the Firestore document.
-   **Security:** The endpoint is secured to ensure only authenticated administrators can set roles.

#### Step 3: Update Server Authentication Hook

-   **Enhance `hooks.server.ts`:** Modify the `handle` function to extract the `role` and `admin` custom claims.
-   **Update `event.locals`:** Add the `role` and `admin` status to the `event.locals.user` object.

#### Step 4: Implement Role-Based UI in "My Portal"

-   **Modify `+page.server.ts`:** Update the `load` function to pass the full `locals.user` object to the page.
-   **Modify `+page.svelte`:** Update the component to conditionally render different UI placeholders based on the user's role.

This structured approach ensures that the new functionality is built on a solid foundation, is secure, and is well-integrated with the existing application architecture.

## 14. Admin Dashboard Component Progress (082325)

This document tracks the implementation progress of the new Admin Dashboard, based on the architecture outlined in `admin-dashboard-plan.md`.

### Phase 1: Foundation & Read-Only View

The initial phase focused on establishing the foundational structure for the admin dashboard.

| Task | Status | Notes |
| :--- | :--- | :--- |
| Create `AdminPortal.svelte` component | ✅ Completed | The new component file has been created at `frontend/src/lib/components/portals/AdminPortal.svelte`. |
| Update `load` function for admins | ✅ Completed | The `load` function in `/my-portal/+page.server.ts` now fetches all memorials for admin users. |
| Implement conditional rendering | ✅ Completed | The `/my-portal/+page.svelte` now correctly displays the `AdminPortal` for admins. |
| Implement memorials table | ✅ Completed | A read-only table displaying all memorials has been added to the `AdminPortal`. |

**Outcome:** Phase 1 is complete. The foundational, read-only version of the Admin Dashboard is live for admin users.

### Phase 2: Core Actions

This phase focused on adding essential management actions to the dashboard to make it interactive.

| Task | Status |
| :--- | :--- |
| Add "Create New Memorial" button | ✅ Completed |
| Add "Actions" column to memorials table | ✅ Completed |
| Add "Edit" & "Create/Manage Livestream" buttons | ✅ Completed |

**Outcome:** Phase 2 is complete. The Admin Dashboard is now interactive.

### Phase 3: Advanced Functionality

The final phase introduced more complex features like user reassignment and embed management.

| Task | Status |
| :--- | :--- |
| Create API endpoint for reassigning ownership | ✅ Completed |
| Implement UI for reassigning ownership | ✅ Completed |
| Design and implement embed management | ✅ Completed |

**Outcome:** Phase 3 is complete. The Admin Dashboard is now feature-complete according to the initial plan.

## 15. Project Status & Documentation Gap Analysis (082425)
This document provides an overview of the current application status by comparing the implemented codebase against the master technical documents (082325-master-tech-doc-cont.md, 082325-RolePlan.md, 082325-admincomponent-progress.md).

The following pages, features, and API endpoints have been implemented in the application but are not yet described in the official documentation.

### 1. Undocumented Pages & Features
Calculator & Checkout Flow

Description: A complete feature set allowing users to calculate service costs and complete payments.
Location: /frontend/src/routes/app/calculator/ and /frontend/src/routes/app/checkout/
Components: All components within frontend/src/lib/components/calculator/
Server Logic: frontend/src/lib/server/stripe.ts
User Profile Page

Description: A dedicated page for users to view and manage their profile information.
Location: /frontend/src/routes/profile/
Component: frontend/src/lib/components/Profile.svelte
Public Tribute Page

Description: The public-facing page that displays a memorial tribute to visitors.
Location: /frontend/src/routes/tributes/[fullSlug]/
Multi-Step Registration

Description: A specialized registration flow with distinct paths for 'Funeral Directors' and 'Loved Ones'.
Location: /frontend/src/routes/register/funeral-director/ and /frontend/src/routes/register/loved-one/
Livestream Management

Description: A user-facing page for creating and managing new livestreams associated with a memorial.
Location: /frontend/src/routes/my-portal/tributes/[memorialId]/livestream/new/
Theme Showcase Pages

Description: Two pages that appear to be for internal development and testing of visual themes.
Location: /frontend/src/routes/theme/ and /frontend/src/routes/theme2/
### 2. Undocumented API Endpoints
Create Livestream

Endpoint: POST /api/livestream/create
Description: Creates a new livestream session.
Location: frontend/src/routes/api/livestream/create/+server.ts
Follow Memorial

Endpoint: POST /api/memorials/[memorialId]/follow
Description: Allows a user to follow a specific memorial.
Location: frontend/src/routes/api/memorials/[memorialId]/follow/+server.ts
Invite to Memorial

Endpoint: POST /api/memorials/[memorialId]/invite
Description: Enables sending invitations for a memorial to other users.
Location: frontend/src/routes/api/memorials/[memorialId]/invite/+server.ts
User Logout

Endpoint: POST /logout
Description: A dedicated endpoint to terminate the user's session.
Location: frontend/src/routes/logout/+server.ts
Session Management

Endpoint: /api/session
Description: Handles authentication session-related tasks.
Location: frontend/src/routes/api/session/+server.ts
### 3. Undocumented Components & Types
Core Layout Components:
Navbar.svelte: The main application navigation bar.
Footer.svelte: The application footer.
Data Types:
follower.ts: Type definitions related to the 'follow' feature.
invitation.ts: Type definitions for the user invitation system.
livestream.ts: Type definitions for livestream management.