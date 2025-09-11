# Afternoon Progress & To-Do (09/10/25)

## Progress Made: Production Refactor

We have made significant progress in preparing the application for production. Here is a summary of the completed tasks:

### 1. Mock Implementations Replaced
-   **Stripe Payment Status:** The mock API endpoint for checking payment status (`/api/check-payment-status`) has been replaced with a production-ready implementation that communicates directly with the Stripe API.
-   **Schedule Locking:** The mock schedule locking mechanism has been refactored. The `/api/lock-schedule` endpoint now verifies payment with Stripe before updating the memorial's status in Firestore.
-   **File Uploads:** The photo upload functionality has been fully implemented. The system now uploads files to Firebase Storage and saves the public URL in the `photos` Firestore collection, replacing the previous placeholder logic.
-   **Livestream Integration:** The mock livestream endpoint has been integrated with Cloudflare Stream. The system now creates a real "Live Input" and stores the correct stream key and playback URLs.

### 2. Environment Variable Standardization
-   The codebase has been refactored to exclusively use SvelteKit's `$env/static/private` and `$env/static/public` modules for environment variables.
-   Direct dependencies on `process.env` have been removed from key files like `lib/firebase-admin.ts` and `lib/config/stripe.ts`, improving security and consistency.

### 3. Email Notifications Implemented
-   All `TODO` items related to email notifications have been completed.
-   The email service has been standardized to use `Resend`.
-   Welcome emails with login credentials are now automatically sent when an admin, a funeral director, or a family member creates a new user account.
-   Invitation emails with a direct link to the acceptance page are now sent when a user is invited to a memorial.

### 4. Funeral Director Workflow Refined
-   **Streamlined Navigation:** The main portal has been updated to provide a more efficient workflow for funeral directors. They are now taken directly to the schedule editor for a memorial, bypassing the general management page.
-   **Corrected Memorial Permissions:** A critical bug was fixed where the `funeralDirectorUid` was not being saved when a memorial was created. This has been resolved, ensuring funeral directors have the correct permissions for the memorials they create.
-   **Fixed Registration Form:** An issue with the funeral director registration form was resolved. The form now correctly handles the server's success response and navigates to the new memorial page as intended.

### 5. Stripe Checkout Integration
-   **Payment Flow Modernized:** The entire payment process has been refactored to use Stripe Checkout, a secure, hosted payment page. This improves the user experience and enhances security by offloading card data handling to Stripe.
-   **API Update:** The `/api/create-payment-intent` endpoint now creates a Stripe Checkout Session and returns a URL to the hosted payment page.
-   **Simplified Payment Page:** The `/payment` page has been converted into a redirect handler that automatically sends the user to the Stripe Checkout page.

### 6. Funeral Director Portal Overhaul
-   **Profile as Central Hub:** The `/profile` page now serves as the main dashboard for funeral directors, replacing the previous `/my-portal` page.
-   **Integrated Memorial Management:** The profile page now displays a list of managed memorials and includes the "Create New Memorial" button, centralizing the workflow.
-   **Streamlined Navigation:** The main navigation and all relevant redirects (e.g., "Save and Pay Later") have been updated to point to the new `/profile` hub.
-   **Code Cleanup:** The obsolete `/my-portal` directory and its associated files have been deleted from the codebase.

### 7. Code Cleanup Initiated
-   We have begun the process of removing unnecessary `console.log` statements from the codebase to clean up production logs, focusing on high-traffic files like server hooks, authentication components, and API endpoints.
-   Styling for several placeholder components (`/register/_page.svelte`, `FamilyMemberPortal.svelte`, etc.) has been updated to match the application's modern "glassmorphism" theme.

### 8. Schedule Page Analysis (09/10/25)

A full analysis of the schedule page (`/schedule`) and its underlying systems was conducted. The page serves as the central hub for service configuration, pricing calculation, and booking.

**Key Findings:**

-   **Workflow**: The page requires a `memorialId` URL parameter for context. If a user arrives without one, they are redirected to the `/profile` page to select or create a memorial. This ensures all scheduling activities are tied to a specific event.

-   **Data Loading**: On initial load, the page makes a `GET` request to `/api/memorials/[memorialId]/schedule/auto-save` to fetch any previously saved calculator data from the `calculatorConfig` field in the memorial's Firestore document.

-   **State Management**: The page is fully modernized with Svelte 5 runes. All form inputs and derived calculations (like `totalPrice`) use `$state` and `$derived`, ensuring a highly reactive and efficient user interface.

-   **Auto-Save Mechanism**: An `$effect` hook provides a built-in, debounced auto-save feature. It monitors form data for changes and sends a `POST` request to the `/api/memorials/[memorialId]/schedule/auto-save` endpoint 2 seconds after the user stops making edits. The `useAutoSave.ts` composable has been deprecated in favor of this more direct implementation.

-   **Data Persistence**: All calculator and schedule data is stored within a single object, `calculatorConfig`, in the corresponding `memorial` document in Firestore. This centralized approach simplifies data management.

-   **Role-Based Access**: The API endpoints enforce strict, role-based permissions. Access is granted only to the memorial owner, the assigned funeral director, invited family members, and admins. This prevents unauthorized users from viewing or modifying schedule details.

-   **User Actions**:
    -   **"Book Now"**: Initiates the payment process by calling `/api/create-payment-intent` and redirecting the user to Stripe Checkout.
    -   **"Save and Pay Later"**: Manually triggers the auto-save endpoint and redirects the user to their `/profile` page, allowing them to resume later.

## To-Do: Finalizing for Production

The following tasks remain to complete the production refactor:

-   [ ] **Complete `console.log` Cleanup:** Systematically remove the remaining non-essential debugging logs from the rest of the application to ensure clean production logs.
-   [ ] **Refactor `useAutoSave.ts`:** Manually remove the debugging logs from this composable, as the previous automated attempt failed.
-   [ ] **Final Code Review:** Conduct a final pass over the entire codebase to ensure consistency, readability, and adherence to best practices before deployment.
