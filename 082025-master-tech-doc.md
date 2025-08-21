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

## 4. Authentication and Authorization

User authentication and authorization will be managed using Firebase Auth, with a secure flow integrated into SvelteKit.

-   **Authentication Flow:** User registration, login, and password reset will be handled via the Firebase Auth SDK on the client, with session management using secure, `HttpOnly` cookies set by the SvelteKit server.
-   **Authorization:** Access control will be implemented on both the client-side (conditional rendering) and server-side (in `load` functions and API endpoints) based on the user's authentication state and custom claims.

## 5. API Service Contract

Backend interactions will be handled by a combination of SvelteKit server endpoints and Firebase Cloud Functions.

-   **SvelteKit Endpoints:** Existing Next.js API routes for admin functionality, login, and search will be re-implemented as SvelteKit `+server.ts` endpoints.
-   **Cloud Functions:** Existing callable Cloud Functions for creating memorials, saving calculator configurations, and processing payments will be maintained.

## 6. Component Migration Plan

React components will be migrated to Svelte, leveraging Svelte's features to simplify the codebase.

-   **Providers:** React Context providers will be replaced with Svelte stores or simple modules.
-   **Layout Components:** Next.js layout components will be migrated to SvelteKit layouts (`+layout.svelte`).
-   **UI Components:** The `shadcn/ui` React components will be replaced with a Svelte-native UI library like `shadcn-svelte` or `bits-ui`.
-   **Complex Patterns:** React HOCs, render props, and custom hooks will be re-architected using Svelte snippets, composition, and runes in `.svelte.js` files.

## 7. State Management

Application state will be managed using Svelte's built-in features.

-   **Global State:** Svelte stores (`writable`, `readable`, `derived`) will be used for global state, such as the user's authentication status.
-   **Local State:** Svelte 5 runes (`$state`, `$derived`) will be used for local component state.
-   **Data Fetching:** Data will be fetched primarily on the server using SvelteKit's `load` functions, with client-side fetching for real-time updates.

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