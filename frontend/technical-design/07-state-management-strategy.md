# State Management Strategy for SvelteKit Migration

## 1. Purpose

This document defines the official strategy for managing application state within the Tributestream platform following its migration to SvelteKit. The goal is to establish clear, consistent, and efficient patterns for handling global state, local component state, and data fetched from Firebase. Adhering to this strategy will ensure a predictable and maintainable codebase that leverages the full potential of Svelte and SvelteKit's reactive capabilities.

## 2. Content

### Global State Management

Global state, accessible across the entire application, will be managed using Svelte Stores. This approach replaces the React Context model used in the previous Next.js architecture.

*   **`writable` Stores:** For state that can be modified from various components, such as UI theme settings or shopping cart contents.
*   **`readable` Stores:** For state that should not be modified directly by components, such as the current user's authentication status. The store's logic will control its value.
*   **`derived` Stores:** For state that is computed from one or more other stores. For example, a `derived` store could calculate the total price of items in a `writable` cart store.

A key application of this pattern will be the management of the user's authentication state, which will be handled by a custom `readable` store that wraps Firebase's `onAuthStateChanged` listener.

### Local Component State

For state that is confined to a single component, Svelte 5's runes provide a simple and powerful solution.

*   **`$state`:** Used to declare reactive, component-level variables. This is the direct replacement for React's `useState` hook and should be the default choice for local state.
*   **`$derived`:** Used for values that are computed from `$state` variables. This replaces the need for memoization hooks like `useMemo`.

This rune-based approach simplifies component logic, reduces boilerplate, and enhances performance by enabling fine-grained reactivity.

### Data Fetching and Caching with Firebase/Firestore

The strategy for fetching and managing data from Firebase is designed to be secure, efficient, and reactive, leveraging SvelteKit's unique features.

1.  **Server-Side Data Fetching:** SvelteKit's `load` functions, running in `+page.server.ts` or `+layout.server.ts` files, will be the primary mechanism for fetching data required for a page to render. These functions execute on the server, allowing for secure use of the Firebase Admin SDK to access Firestore. This pattern is ideal for fetching initial page data that doesn't require real-time updates.

2.  **Client-Side Real-Time Updates:** For data that needs to be reactive (e.g., live chat, notifications, or real-time updates to a tribute page), the client-side Firebase SDK will be used. Components will subscribe to Firestore queries directly. Svelte stores can be used to wrap these subscriptions, making the real-time data easily available to any component that needs it.

3.  **Caching:** SvelteKit's `load` functions provide built-in caching mechanisms. For client-side data, custom stores can implement their own caching logic to avoid redundant Firestore reads, especially for frequently accessed, non-critical data.

## 3. Key Question

### What is the best pattern for managing Firebase Auth user state and Firestore data reactively in SvelteKit?

The optimal pattern is a hybrid approach that leverages both SvelteKit's server-side capabilities and Svelte's client-side reactivity:

1.  **User Authentication State:**
    *   A custom, application-wide `readable` store (e.g., `userStore`) will be created in `src/lib/stores/auth.ts`.
    *   This store will wrap the `onAuthStateChanged` listener from the client-side Firebase Auth SDK.
    *   When the auth state changes, the store will update its value, and this change will reactively propagate to every component subscribed to the store (`$userStore`). This provides a single source of truth for the user's authentication status on the client.

2.  **Initial Data Load:**
    *   The root `+layout.server.ts` will use its `load` function to check for the user's session cookie.
    *   If the user is authenticated, this `load` function will securely fetch essential, non-sensitive user data (e.g., name, roles) from Firestore using the Firebase Admin SDK.
    *   This data is then passed down to client-side pages, making it immediately available on render without a client-side fetch.

3.  **Reactive Firestore Data:**
    *   For data that requires real-time updates, components will use the client-side Firestore SDK to subscribe to document or query snapshots.
    *   To make this data reusable and cleanly integrated, the subscription logic will be encapsulated within a `readable` store. The store will manage the subscription lifecycle, automatically unsubscribing when it's no longer needed, and will update its value whenever new data arrives from Firestore.

This pattern provides the best of all worlds: secure, server-rendered initial data for fast page loads, a single reactive source of truth for authentication state, and seamless, real-time updates for dynamic data, all while using idiomatic Svelte and SvelteKit features.
