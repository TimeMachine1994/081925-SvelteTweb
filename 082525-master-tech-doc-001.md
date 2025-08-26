# Master Technical Design: Tributestream SvelteKit Migration (082525-001)

## 1. Introduction

### 1.1. Purpose

This document serves as the single source of truth for the technical design of the Tributestream platform's migration from React/Next.js to SvelteKit. It synthesizes all previous technical design documents and recent feature implementations into a cohesive, actionable blueprint for development. Its purpose is to guide the development team, ensuring a consistent and high-quality result.

### 1.2. Project Overview

Tributestream is a specialized online platform designed to help users create, manage, and share memorial services and tributes for their loved ones. The migration to SvelteKit aims to improve performance, simplify the codebase, and enhance the developer experience.

## 2. Architecture

### 2.1. Target State (Post-Migration)

The new architecture is built on SvelteKit, leveraging its features to create a more performant, maintainable, and scalable platform.

#### 2.2.1. SvelteKit Routing and Component Structure

-   **Routing:** SvelteKit's file-based routing is used to organize pages, layouts, and server-side logic in the `src/routes` directory.
-   **Components:** Components are organized by feature in `src/lib/components`, with shared UI components in `src/lib/components/ui`.

#### 2.2.2. Firebase Integration

-   **Server-Side:** The Firebase Admin SDK is used in SvelteKit's `+page.server.ts` and `+server.ts` files for secure data access.
-   **Client-Side:** The client-side Firebase SDK is used for real-time updates and authentication.

## 3. Data Model

The application uses Firestore as its primary database.

### 3.1. `memorials` Collection

This collection stores all data related to a specific memorial service.

-   **Key Fields:**
    -   `lovedOneName` (string): The full name of the deceased.
    -   `slug` (string): A URL-friendly identifier.
    -   `creatorUid` (string): The UID of the user who created the memorial.
    -   `photos` (array of strings): Stores public URLs for images in Firebase Storage.
    -   **Service Coordination Fields:**
        -   `familyContactName` (string, optional)
        -   `familyContactEmail` (string)
        -   `familyContactPhone` (string)
        -   `familyContactPreference` (enum: 'phone' | 'email')
        -   `directorFullName` (string)
        -   `directorEmail` (string, optional)
        -   `funeralHomeName` (string, optional)
        -   `memorialLocationName` (string, optional)
        -   `memorialLocationAddress` (string, optional)
        -   `memorialDate` (string, optional)
        -   `memorialTime` (string, optional)
        -   `additionalNotes` (string, optional)

### 3.2. `users` Collection

This collection stores user profile information.

-   **Key Fields:**
    -   `email` (string): The user's primary email address.
    -   `displayName` (string): The user's full name.
    -   `role` (string): The user's role (e.g., `owner`, `funeral_director`). Managed via FireCMS and linked to a Firebase Auth custom claim.
    -   `phone` (string, optional)
    -   `funeralHomeName` (string, optional)

## 4. Authentication and Authorization

### 4.1. Authentication Flow

User authentication is managed using Firebase Auth, with session management handled by SvelteKit.

-   **Registration:**
    -   **Funeral Director Registration (`/register/funeral-director`):** This is a comprehensive service coordination form. The funeral director provides service details, and an account is created for them using the provided **family contact email** as the primary identifier. A random password is generated and emailed. The director is assigned the `owner` role via a custom claim.
    -   **Auto-Login:** After registration, a custom token is generated for a seamless, automatic login experience.
-   **Login/Session:** Standard login is handled client-side, with the SvelteKit server setting a secure, `HttpOnly` cookie for session management.

### 4.2. Authorization

-   **Custom Claims:** Access control is implemented using Firebase Auth custom claims (`role`, `admin`).
-   **Server Hooks:** The `hooks.server.ts` file verifies the session on every request and attaches the user's identity and roles to `event.locals`.
-   **Storage Rules:** Firebase Storage rules restrict write access to a memorial's photo path to the memorial's owner (`creatorUid`).

## 5. API Service Contract

-   **SvelteKit Endpoints (`+server.ts`):** Used for most backend logic, including user management, photo uploads, and data queries.
-   **Cloud Functions:** Maintained for specific tasks like payment processing.

## 6. Component Plan

### 6.1. Key Components

-   **`LiveUrlPreview.svelte`:** A new component that provides a real-time preview of the public memorial URL as the user types the loved one's name in the registration form.
-   **`funeral-director/+page.svelte`:** The registration form has been refactored into a multi-section service coordination form, collecting detailed information about the service, family contacts, and funeral director.
-   **Role-Based Portals (e.g., `OwnerPortal.svelte`):** The `/my-portal` page dynamically renders different dashboard components based on the user's role.
-   **`PhotoUploader.svelte` & `PhotoGallery.svelte`:** Core components for managing memorial photos, using progressive enhancement and `invalidateAll()` for seamless UI updates.
-   **`RolePreviewer.svelte`:** An admin-only component for testing different role-based portal views.

## 7. State Management

-   **Global State:** Svelte stores are used for global state like authentication status.
-   **Local State:** Svelte 5 runes (`$state`, `$derived`) are used for component-level state.
-   **Data Fetching:** Server `load` functions are the primary mechanism for data fetching. `invalidateAll()` is used to refresh data after client-side mutations.

## 8. Admin Panel (FireCMS)

-   **Architecture:** A standalone React/Vite application in the `firecms/` directory, served at `/admin`.
-   **Integration:** Connects directly to the project's Firestore database.
-   **Authorization:** Access is restricted to users with an `admin` custom claim.
-   **Schema:** Includes schemas for the `memorials` and `users` collections, allowing admins to manage all new service coordination fields.

## 9. User Roles and Portals

### 9.1. Defined Roles

-   `owner`
-   `family_member`
-   `viewer`
-   `funeral_director`
-   `remote_producer`
-   `onsite_videographer`

### 9.2. Role Permissions

| Role | Target Abilities |
| :--- | :--- |
| **owner** | Create, edit, manage photos for, and delete their own memorials. Invite other users. |
| **funeral_director**| View all memorials associated with their funeral home. Manage livestream details. |
| ... | ... |

### 9.3. Admin Preview Functionality

Admins can preview different role portals by using the `?preview_role=<role_name>` query parameter on the `/my-portal` URL.

## 10. Testing Strategy

-   **Unit Testing:** Vitest for Svelte components and frontend logic.
-   **Integration Testing:** Firebase Emulator Suite for testing backend interactions.
-   **End-to-End Testing:** Playwright for validating complete user flows.

## 11. Undocumented Features (as of 082425)

The following features have been implemented but require formal documentation updates:
-   Calculator & Checkout Flow (`/app/calculator/`)
-   User Profile Page (`/profile/`)
-   Public Tribute Page (`/tributes/[fullSlug]/`)
-   Livestream Management (`/my-portal/tributes/[memorialId]/livestream/new/`)
-   Various API Endpoints (`/api/livestream/create`, `/api/memorials/.../follow`, etc.)