# Audited Master Technical Document: Tributestream Platform

## Executive Summary of Findings

This document is the result of a comprehensive audit of the Tributestream codebase against its existing technical documentation. The primary objective was to create a definitive, code-accurate source of truth to inform a ground-up rewrite of the application. The audit revealed a significant and critical divergence between the documented architecture and the implemented reality. While the core application is functional and leverages a sophisticated set of features, the lack of corresponding documentation presents a major risk for future development and the planned rewrite.

### Critical, High-Impact Discrepancies:

*   **Undocumented Granular RBAC System:** A complex, fine-grained Role-Based Access Control system for memorial collaboration exists but is almost entirely undocumented. This includes specific permissions for `family_member` roles and an operational, but logically divergent, "follow" system for `viewer` roles.
*   **Undocumented Superuser Admin Features:** The Admin Portal contains high-privilege, undocumented features, including the ability to reassign memorial ownership and manage video embeds for any tribute. These features are critical for platform management but have no paper trail.
*   **Multiple Undocumented API Surfaces:** The audit uncovered numerous undocumented API endpoints crucial for application functionality, including a RESTful API for saving draft calculator states, a full suite of endpoints for managing user invitations, and endpoints for admin-level memorial management.
*   **Undocumented Third-Party Integrations:** The codebase revealed critical, undocumented integrations with third-party services, namely **Stripe** for payment processing and **Cloudflare Stream** for livestreaming video infrastructure. These are core to the business logic and revenue model.
*   **Significant Architectural Drift:** The implemented data models and component structures are substantially more complex than documented. Key examples include the dual-storage strategy for the calculator (drafts vs. final configurations), the existence of numerous undocumented Firestore collections (`invitations`, `followers`, `livestreamConfigurations`, etc.), and the replacement of simple photo components with a powerful, all-in-one `SlideshowEditor`.

### Quantitative Analysis:

*   **Undocumented Firestore Collections:** 7 (`familyMembers`, `followers`, `invitations`, `livestreamConfigurations`, `calculatorState`, `photoUploads`, `auditLogs`)
*   **Undocumented API Endpoints:** 8 (`/api/calculator-state`, `/api/memorials/.../assign`, `/api/memorials/.../embeds`, `/api/memorials/.../invite`, `/api/memorials/.../follow`, `/api/livestream/create`, `/api/set-admin-claim`, `/api/set-role-claim`)
*   **Major Logic Deviations:** 3 (Viewer access via "follows" instead of "invites", default role behavior for Funeral Directors, inconsistent authorization logic between routes)
*   **Undocumented Critical Features:** 5 (Slideshow Editor, Admin Owner Reassignment, Admin Embed Management, Calculator Draft Persistence, User Invitation Management)
*   **Undocumented Third-Party Integrations:** 2 (Stripe, Cloudflare Stream)

### Conclusion & Rewrite Risk Assessment:

The overall health of the codebase is that of a rapidly evolving project where features were implemented far faster than they could be documented. The code itself demonstrates sophisticated solutions to complex problems (e.g., user-specific drafts, granular permissions). However, the chasm between the code and the documentation is the single greatest risk to the rewrite. Without this audit, the development team would have rebuilt the application based on a dangerously incomplete and inaccurate understanding of its own features, security model, and architecture. This document now serves as the essential blueprint to mitigate that risk, but the rewrite team must proceed with the understanding that the true complexity of the application lies in these undocumented systems.

---

## Part 1: Consolidated and Annotated Master Documentation

## 1. Introduction

### 1.1. Purpose

This document serves as the single source of truth for the technical design of the Tributestream platform. It is the result of a direct audit of the production codebase and supersedes all previous technical design documents. Its purpose is to provide a complete and accurate blueprint for the planned application rewrite.

### 1.2. Project Overview

Tributestream is a specialized online platform designed to help users create, manage, and share memorial services and tributes for their loved ones. The platform is built on SvelteKit and Firebase and includes features for role-based collaboration, photo slideshows, livestreaming, and service booking.

## 2. Architecture

### 2.1. Frontend Architecture

The application is a modern SvelteKit project.

*   **Routing:** SvelteKit's file-based routing is used to organize all pages, API endpoints, and server-side data loading logic within the `src/routes` directory.
*   **Components:** Reusable components are organized in `src/lib/components`. This includes UI elements, feature-specific components like the `calculator`, and a suite of role-based `portals` for the user dashboard.
*   **State Management:** Application state is managed using Svelte 5 runes (`$state`, `$derived`) for local component state and Svelte stores (`writable`) for global state, such as the current user's authentication status.

### 2.2. Backend & Services Architecture

The backend is a serverless architecture leveraging Firebase and SvelteKit's server-side capabilities.

*   **SvelteKit Server Logic:** Secure, server-side logic is implemented in `+page.server.ts` (for page data loading and form actions) and `+server.ts` (for RESTful API endpoints). These modules use the Firebase Admin SDK for privileged database and authentication operations.
*   **Database:** Cloud Firestore is the primary database. Data access is governed by a detailed set of security rules defined in `firestore.rules`.
*   **Authentication:** Firebase Authentication is the core identity provider.
*   **File Storage:** Firebase Storage is used for user-uploaded assets, primarily memorial photos.
*   **Search:** Algolia is used for search indexing and querying, managed via a server-side integration.
*   **Livestreaming:** Cloudflare Stream is used as the third-party infrastructure for creating and managing livestream inputs (RTMP URLs and stream keys).
*   **Payments:** Stripe is integrated for processing payments within the Calculator/Checkout flow.

> **[ANALYSIS & DISCREPANCY REPORT]**
> **Original Documentation:** Mentioned the potential for monolithic Cloud Functions and described a simpler backend.
> **Current Implementation:** The architecture is more distributed than documented. SvelteKit's server routes have taken on the role of a traditional backend, handling many tasks originally slated for Cloud Functions. The integrations with Algolia, Cloudflare Stream, and Stripe are critical, fully implemented architectural components that were either briefly mentioned or entirely absent from the documentation.
> **Rewrite Recommendation:** This SvelteKit-centric backend architecture is effective and should be retained. The service boundaries are clearer than a monolithic Cloud Function approach. The rewrite must fully account for the external service integrations from day one.

## 3. Data Model & Security

The application uses Cloud Firestore, with data structures defined in `frontend/src/lib/types/` and access control enforced by `firestore.rules`.

### 3.1. Firestore Collections

*   `/users/{userId}`: Stores public user profile information, including their assigned `role`.
*   `/memorials/{memorialId}`: The core document for a tribute. Contains details about the loved one, content, and configuration.
*   `/memorials/{memorialId}/familyMembers/{userId}`: A subcollection storing users who have been invited to collaborate on a memorial, including their specific permissions.
*   `/memorials/{memorialId}/followers/{userId}`: A subcollection tracking users who are "following" a memorial (the `viewer` role).
*   `/memorials/{memorialId}/calculatorState/{userId}`: A subcollection for storing in-progress drafts of the calculator/booking form, unique to each user.
*   `/invitations/{invitationId}`: A top-level collection of all invitation documents sent to users for specific memorials.
*   `/livestreamConfigurations/{memorialId}`: A top-level collection storing the final, saved or paid booking configurations from the calculator.

> **[ANALYSIS & DISCREPANCY REPORT]**
> **Original Documentation:** Only documented the `users` and `memorials` collections.
> **Current Implementation:** The actual data model is far more complex, utilizing multiple undocumented collections and subcollections to support features like invitations, collaboration, and draft saving. This reflects a significant evolution of the application's feature set.
> **Rewrite Recommendation:** The implemented data model is logical and supports the existing features. It should be adopted as the baseline for the rewrite. The documentation for each collection and its schema must be thoroughly maintained.

### 3.2. Firestore Security Rules (`firestore.rules`)

The `firestore.rules` file implements a detailed and granular security model.

*   **Admins:** Have read/write access to all data.
*   **Users:** Can only read/write their own `/users/{userId}` document.
*   **Memorials:**
    *   **Read:** Public memorials are readable by anyone. Private memorials are readable only by the owner, admins, or associated family members.
    *   **Create:** Any authenticated user can create a memorial.
    *   **Update:** Owners and admins have full update permissions. Family members can only update photo-related fields.
    *   **Delete:** Only owners and admins can delete memorials.
*   **Subcollections:** Access to subcollections like `familyMembers` and `followers` is tightly controlled based on the user's relationship to the parent memorial.

> **[ANALYSIS & DISCREPANCY REPORT]**
> **Original Documentation:** Provided a high-level overview of authorization.
> **Current Implementation:** The `firestore.rules` file is the definitive specification for the application's security and data access logic. It contains numerous rules for undocumented collections and implements the fine-grained permissions for the `family_member` role.
> **Rewrite Recommendation:** The security rules are the most critical piece of the backend logic. The rewrite must replicate this security model precisely. Any changes must be carefully vetted to avoid introducing security vulnerabilities.

## 4. Authentication and Authorization

### 4.1. Authentication Flow

The application uses a hybrid authentication flow that combines Firebase client-side authentication with a server-managed session.

1.  **Client-Side Login:** The user signs in or registers using the Firebase Authentication SDK in the browser.
2.  **Token Exchange:** Upon a successful login, the client-side `onIdTokenChanged` listener gets the Firebase ID token.
3.  **Session Creation:** The client `POST`s this token to the `/api/session` endpoint.
4.  **Server-Side Verification:** The SvelteKit server verifies the ID token using the Firebase Admin SDK.
5.  **Cookie Setting:** The server creates a secure, `HttpOnly` session cookie and sends it back to the client.
6.  **Session Logout:** When the user signs out, the client sends a `DELETE` request to `/api/session`, and the server clears the cookie.

> **[ANALYSIS & DISCREPANCY REPORT]**
> **Original Documentation:** Correctly described the high-level flow. It incorrectly listed a `/logout` endpoint.
> **Current Implementation:** The logout functionality is correctly implemented as a `DELETE` request to the `/api/session` endpoint, which is a better RESTful practice.
> **Rewrite Recommendation:** Retain the current, implemented flow. It is secure and leverages the strengths of both Firebase and SvelteKit.

### 4.2. Authorization (RBAC)

Authorization is managed via Firebase Custom Claims, which are read and applied on every request by the server hook.

*   **`hooks.server.ts`:** This file is the heart of the authorization system.
    *   It inspects the session cookie on every server-side request.
    *   It verifies the cookie and decodes the claims, including `role` and `admin` status.
    *   It populates the `event.locals.user` object with the user's identity and permissions.
*   **`load` Functions:** Server-side `load` functions and `actions` throughout the application use `event.locals.user` to make authorization decisions before fetching data or performing mutations.

> **[ANALYSIS & DISCREPANCY REPORT]**
> **Original Documentation:** Described the use of custom claims and `event.locals` correctly but did not detail the full list of roles or their implemented data access logic.
> **Current Implementation:** The server hook is the canonical implementation of the authorization strategy. It also contains an undocumented feature for a `first_visit_memorial_popup` cookie.
> **Rewrite Recommendation:** This server hook pattern is a SvelteKit best practice and should be maintained. The undocumented popup logic should be formally documented or removed if it's obsolete.

## 5. API Service Contract

The application exposes a number of RESTful API endpoints and server actions.

### 5.1. Core API Endpoints

*   `POST /api/session`: Creates a server session from a Firebase ID token.
*   `DELETE /api/session`: Deletes the server session cookie (logout).
*   `POST /api/set-admin-claim`: **(Admin Only)** Sets the `admin` custom claim for a user.
*   `POST /api/set-role-claim`: **(Admin Only)** Sets the `role` custom claim for a user.

### 5.2. Undocumented API Endpoints

*   `GET /api/calculator-state/[memorialId]`: Fetches a user's saved draft of the calculator state for a specific memorial.
*   `POST /api/calculator-state/[memorialId]`: Saves a user's draft of the calculator state.
*   `POST /api/memorials/[memorialId]/assign`: **(Admin Only)** Reassigns the owner of a memorial.
*   `POST /api/memorials/[memorialId]/embeds`: **(Admin Only)** Adds a video embed to a memorial.
*   `DELETE /api/memorials/[memorialId]/embeds`: **(Admin Only)** Deletes a video embed from a memorial.
*   `POST /api/memorials/[memorialId]/invite`: Creates and sends an invitation for a user to collaborate on a memorial.
*   `DELETE /api/memorials/[memorialId]/invite/[invitationId]`: Deletes an invitation.
*   `POST /api/memorials/[memorialId]/invite/[invitationId]`: **(Overloaded)** Used to accept an invitation and to transfer the "Point of Contact" status.
*   `POST /api/memorials/[memorialId]/follow`: Allows a user to "follow" a memorial.
*   `POST /api/livestream/create`: **(Admin Only)** Creates a new livestream input via the Cloudflare Stream API.

> **[ANALYSIS & DISCREPANCY REPORT]**
> **Original Documentation:** Only documented a fraction of the API endpoints. The Gap Analysis document listed some, but this audit confirmed the full list and their functionality.
> **Current Implementation:** The application has a rich, undocumented API surface that is essential for its interactive features.
> **Rewrite Recommendation:** The entire API surface must be formally documented using a standard like OpenAPI. The overloaded `POST` endpoint for invitations should be refactored into separate, more explicit endpoints (e.g., `.../accept` and `.../make-contact`).

## 6. Key Features & Discrepancies

### 6.1. Calculator & Checkout Flow

This is a complete, multi-step feature for booking and paying for livestreaming services. It is entirely undocumented.

*   **Architecture:** It uses a sophisticated dual-persistence mechanism. A RESTful API (`/api/calculator-state`) is used for saving user-specific drafts, while SvelteKit form actions are used for final submission, payment intent creation with Stripe, and saving the final record to the `livestreamConfigurations` collection.
*   **Integrated Onboarding:** It includes a dedicated registration flow (`/app/calculator/register`) that creates a new user, assigns them the `owner` role, and seamlessly logs them in to continue their booking.

> **[ANALYSIS & DISCREPANCY REPORT]**
> **Original Documentation:** Completely absent.
> **Current Implementation:** A core, revenue-generating feature of the application.
> **Rewrite Recommendation:** This feature must be treated as a first-class citizen in the rewrite. The dual-persistence architecture is clever but complex; it should be evaluated for simplification, perhaps by consolidating all state into the `livestreamConfigurations` document with a more detailed status field (e.g., `draft`, `pending_payment`, `paid`).

### 6.2. User Portals & RBAC

The `/my-portal` route is the hub for all authenticated user experiences, dynamically rendering different UI components based on the user's role.

*   **Admin Portal:** A powerful, undocumented dashboard for managing all memorials, reassigning ownership, and managing video embeds.
*   **Owner Portal:** A dashboard for owners to view their memorials and link to management pages.
*   **Family Member Portal:** A portal for invited collaborators to view memorials and access photo management.
*   **Viewer Portal:** A portal for users to view memorials they have "followed."

> **[ANALYSIS & DISCREPANCY REPORT]**
> **Original Documentation:** Outlined a basic plan for RBAC but contained inaccurate descriptions of role abilities.
> **Current Implementation:** The RBAC system is far more advanced than documented, with granular permissions and undocumented features like the "follow" system for viewers. The data access logic in the main portal's `load` function does not perfectly match the documented intent (e.g., `funeral_director` defaults to `owner` behavior).
> **Rewrite Recommendation:** The RBAC data model (roles, custom claims) is solid. However, the data access logic in the `/my-portal` `load` function must be refactored to create explicit, clear queries for each and every role, removing the ambiguous fallback behavior. The "follow" vs. "invite" logic for viewers needs to be clarified as a business requirement.

### 6.3. Memorial & Slideshow Management

This feature allows for the detailed editing of a memorial's content, primarily through a powerful, all-in-one slideshow editor.

*   **`SlideshowEditor.svelte`:** This undocumented component has replaced the simpler `PhotoUploader` and `PhotoGallery` components mentioned in the documentation. It provides a unified interface for uploading photos, reordering them, deleting them, and editing their metadata.
*   **Undocumented Actions:** The feature is powered by a suite of undocumented SvelteKit actions for `reorderPhotos`, `deletePhoto`, `updatePhotoMetadata`, and `updateSlideshowSettings`.
*   **Granular Permissions:** The backend logic enforces a fine-grained permission model, allowing owners and admins full control while granting family members specific, limited abilities (e.g., cannot delete photos, can only edit metadata if a specific permission flag is set).

> **[ANALYSIS & DISCREPANCY REPORT]**
> **Original Documentation:** Described a much simpler system with separate components for uploading and viewing photos.
> **Current Implementation:** An advanced, feature-rich content management system for slideshows with a corresponding undocumented API and a complex, undocumented permission model.
> **Rewrite Recommendation:** The `SlideshowEditor` is a significant piece of IP and should be the model for the rewrite. The backend permission logic is excellent and should be replicated exactly. The discrepancy where `deletePhoto` does not delete the file from Firebase Storage should be addressed; a Cloud Function triggered on document update could be used to clean up orphaned files.