# Plan to Fix Algolia Module Error

This plan outlines the steps to resolve the "Failed to resolve module specifier 'algoliasearch'" error by properly separating client-side and server-side code.

### 1. Isolate Server-Side Logic

- **Action**: Create a new file, `frontend/src/routes/search/+page.server.ts`.
- **Purpose**: This file will handle all backend-related tasks for the search page. It will be responsible for:
    - Importing the `algoliasearch` library using the admin key.
    - Performing the initial search when the page is first loaded on the server.
- **Benefit**: This ensures the `algoliasearch` module and the admin key are never sent to the browser, resolving the module resolution error and improving security.

### 2. Streamline Data Loading for the Client

- **Action**: Modify the existing `frontend/src/routes/search/+page.ts` file.
- **Purpose**: This file's new role will be to pass data from the server to the page and provide the necessary public credentials for client-side searching. It will:
    - Receive the initial search results from `+page.server.ts`.
    - Pass the `PUBLIC_ALGOLIA_APP_ID` and `PUBLIC_ALGOLIA_SEARCH_ONLY_API_KEY` to the page.
- **Benefit**: This file will no longer import server-side libraries, making it safe to run in the browser.

### 3. Refactor the Search Component

- **Action**: Update the `frontend/src/routes/search/+page.svelte` file.
- **Purpose**: The component will be updated to handle both the initial data from the server and subsequent client-side searches. It will:
    - Receive the initial search results as a prop from the `load` function.
    - Initialize a new, lightweight Algolia search client on the client-side using the public keys.
    - Use this client-side instance to perform searches as the user types in the search box.
- **Benefit**: This creates a seamless user experience, with a fast initial load and responsive real-time search updates.

This approach ensures a clean separation of concerns, fixes the critical error, and improves the security and performance of the search feature.