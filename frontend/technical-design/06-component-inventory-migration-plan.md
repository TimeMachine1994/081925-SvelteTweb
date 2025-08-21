# Component Inventory and Migration Plan

## 1. Purpose

This document provides a comprehensive inventory of all React components in the Tributestream application and outlines a strategic plan for their migration to Svelte. The goal is to ensure a smooth, efficient, and consistent transition by detailing how each component's props, state management, lifecycle methods, and dependencies will be translated into Svelte's architecture.

## 2. Content

The following table provides a structured inventory of React components and their corresponding Svelte migration plan.

| Original React Component | Mapped Svelte Component | Props/Events Translation | State Management Translation | Lifecycle Methods Translation | External Dependencies | Migration Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Providers** | | | | | | |
| `AuthProvider.tsx` | `auth.store.svelte.ts` | N/A (provides context) | Context providing user state will become a Svelte store or a set of exported `$state` variables. | `onAuthStateChanged` logic within `useEffect` will be managed in the store, updating reactive state. | `firebase/auth` | The Svelte store will be the single source of truth for auth state, eliminating the need for a provider component. |
| `FirebaseProvider.tsx` | `firebase.svelte.ts` | N/A (provides context) | Context will be replaced by a simple module exporting initialized Firebase services. | `useEffect` for initialization is no longer needed; initialization happens once on module load. | `firebase/app`, `firebase/auth`, etc. | This simplifies to a utility module. No component needed. |
| `QueryProvider.tsx` | `+layout.svelte` (or equivalent root) | N/A | TanStack Query will be integrated at the root level, likely in a root layout, to provide query client access. | N/A | `@tanstack/react-query` | Svelte Query (`@tanstack/svelte-query`) will be used. The setup is similar. |
| `RecaptchaProvider.tsx` | `recaptcha.svelte.ts` | N/A | Context will be replaced by a module with functions to handle reCAPTCHA logic. | `useEffect` for script loading will be handled in the module. | `google-recaptcha` | Logic will be encapsulated in a module, not a component. |
| `ThemeProvider.tsx` | `ThemeToggle.svelte` | Props for theme settings. | Context for theme will be replaced by a Svelte store. | `useEffect` for applying theme changes will be replaced with `$effect`. | `next-themes` | Theme logic will be managed by a store and a simple toggle component. |
| **Layout Components** | | | | | | |
| `AppLayout.tsx` | `+layout.svelte` | Props for layout variations. | State for mobile nav visibility (`useState`) will become `$state`. | N/A | | This will be the main layout file in SvelteKit. |
| `Header.tsx` | `Header.svelte` | Props for navigation links. | `useState` for mobile menu will be `$state`. | N/A | `next/link` | `next/link` will be replaced with `<a>` tags. |
| **Admin Components** | | | | | | |
| `AdminRouteGuard.tsx` | `+layout.server.ts` | N/A | Auth state will be checked on the server. | N/A | `firebase/auth` | This logic will move to a server-side layout load function in SvelteKit. |
| `AdminSubNav.tsx` | `AdminSubNav.svelte` | Props for navigation items. | No internal state. | N/A | `next/link` | Straightforward conversion. |
| `TributesDataTable.tsx` | `TributesDataTable.svelte` | Props for data (`columns`, `data`) will be passed in. | State for sorting, filtering, and pagination will be managed with `$state`. | `useEffect` for fetching data will be replaced by reactive logic that re-fetches when dependencies change. | `@tanstack/react-table` | We will use the Svelte adapter for TanStack Table (`@tanstack/svelte-table`) to preserve the table logic. |
| `UsersDataTable.tsx` | `UsersDataTable.svelte` | Props for data (`columns`, `data`) will be passed in. | State for sorting, filtering, and pagination will be managed with `$state`. | `useEffect` for fetching data will be replaced by reactive logic. | `@tanstack/react-table` | Use `@tanstack/svelte-table`. |
| **Common Components** | | | | | | |
| `LoadingSpinner.tsx` | `LoadingSpinner.svelte` | Props like `size` and `color` will be directly translated using `let { size, color } = $props()`. | No internal state. | N/A | None | Straightforward conversion. This is a presentational component. |
| `Logo.tsx` | `Logo.svelte` | Props will be translated directly. | No internal state. | N/A | `next/image` | Will be replaced with a standard `<img>` tag or a Svelte-specific image optimization component if needed. |
| `VideoPlayer.tsx` | `VideoPlayer.svelte` | Props for video source. | `useState` for player state will be `$state`. | `useEffect` for player initialization will be `onMount`. | Video library (e.g., `react-player`) | A Svelte-compatible video player library will be used. |
| **Form Components** | | | | | | |
| `BookingForm.tsx` | `BookingForm.svelte` | Props for initial data will be passed in. Events for submission (`onSubmit`) will be handled with form actions or dispatched events. | `useState` for form fields will be replaced with `$state` for individual reactive values. `react-hook-form` will be replaced with a Svelte form library like `svelte-formify` or native form handling. | `useEffect` for data fetching or side effects will be replaced with `$effect` or reactive statements. | `react-hook-form`, `zod` | Form logic will need to be re-implemented. This is a component of moderate complexity. |
| `FuneralDirectorForm.tsx` | `FuneralDirectorForm.svelte` | Props for form data. | `react-hook-form` state will be replaced with a Svelte forms library. | `useEffect` for side effects will be `$effect`. | `react-hook-form`, `zod` | High complexity due to multi-step logic. |
| `ProfileForm.tsx` | `ProfileForm.svelte` | Props for user data. | `react-hook-form` state will be replaced. | `useEffect` for data loading will be reactive logic. | `react-hook-form`, `zod` | Standard form migration. |
| **UI Components (shadcn/ui)** | | | | | | |
| `accordion.tsx`, `alert.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`, `checkbox.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `input.tsx`, `label.tsx`, `popover.tsx`, `radio-group.tsx`, `select.tsx`, `separator.tsx`, `sheet.tsx`, `skeleton.tsx`, `slider.tsx`, `switch.tsx`, `table.tsx`, `tabs.tsx`, `textarea.tsx`, `toast.tsx`, `tooltip.tsx` | `Button.svelte`, `Card.svelte`, etc. | Props will be translated directly. | No internal state. | N/A | `class-variance-authority`, `clsx`, `radix-ui` | These are largely presentational. We will use a Svelte UI library like `shadcn-svelte` or `bits-ui` to replace them, maintaining a consistent design system. |

## 3. Key Question

### How will complex React components (e.g., those using render props, HOCs, or custom hooks) be re-architected in Svelte?

Svelte's architecture offers more direct and often simpler alternatives to complex React patterns:

*   **Higher-Order Components (HOCs) and Render Props:** These patterns are used in React to share logic and UI. In Svelte, this is largely replaced by two features:
    *   **Snippets (`{#snippet}`):** Svelte's equivalent of slots allows for flexible component composition, replacing the need for render props to inject content. A parent component can pass multiple named snippets to a child, giving it precise control over the final rendered output.
    *   **Composition:** Logic can be extracted into regular JavaScript/TypeScript functions or modules that use runes (`.svelte.js`/`.svelte.ts` files). These functions can encapsulate reactive logic and be imported into any component, providing a more direct way to share functionality than HOCs.

*   **Custom Hooks:** React's custom hooks (`use...`) are for sharing stateful, reusable logic. Svelte achieves this through:
    *   **Runes in `.svelte.js`/`.svelte.ts` files:** By exporting functions that use runes like `$state` and `$derived` from these special files, we can create reusable, reactive "stores" or logic blocks that can be imported and used across multiple components. This is the modern Svelte equivalent to custom hooks.
    *   **Svelte Stores:** For more complex state management patterns, especially those involving asynchronous logic or interoperability with external systems, Svelte's built-in stores (`writable`, `readable`, `derived`) provide a powerful pattern for managing and sharing state.

By leveraging these Svelte-native patterns, we can re-architect complex React components into more readable, maintainable, and often more performant Svelte components, avoiding the layers of abstraction common in advanced React applications.