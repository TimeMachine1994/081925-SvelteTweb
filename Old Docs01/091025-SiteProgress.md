# SvelteKit Application Routes and Endpoints

This document provides a comprehensive overview of the pages and API routes in the Tributestream SvelteKit application.

## Pages (`+page.svelte`)

This section details the user-facing pages of the application.

| Route | Description | Key Functions & Notes |
| :--- | :--- | :--- |
| `/` | The main landing page with a search and create tribute call-to-action. | `handleCreateTribute()`, `handleSearchTributes()` |
| `/admin` | A simplified admin dashboard for managing recent memorials and creating new ones. | `createMemorial()`, `formatDate()` |
| `/admin-test` | A test page for verifying admin access and basic Firestore functionality. | Displays user info and test results. |
| `/app/calculator` | A page that houses the livestream calculator component. | `memorialId` from URL. |
| `/app/checkout/success` | A page displayed after a successful purchase, showing an order summary. | Displays data from `PageData`. |
| `/auth/session` | Handles session creation using a token from the URL. | `onMount()` handles `signInWithCustomToken`. |
| `/for-funeral-directors` | A landing page for funeral directors to register. | Static content. |
| `/invite/[invitationId]` | A page for users to accept or decline memorial invitations. | `accept` and `decline` form actions. |
| `/login` | The user login page. | Uses the `Login.svelte` component. |
| `/my-portal` | The main user portal, displaying memorials based on user role. | `formatDate()` |
| `/my-portal/tributes/[memorialId]/edit` | A page for managing a specific memorial's content, photos, and livestream. | `PhotoUploader`, `LivestreamScheduleTable`, `LivestreamControl` components. |
| `/payment` | The main payment page, handling customer information and Stripe card elements. | `handleSubmit()`, `processPayment()`, `handleRetry()` |
| `/payment/receipt` | A page displayed after a successful payment, showing a detailed receipt. | `sendConfirmationEmail()`, `lockSchedule()`, `downloadReceipt()` |
| `/profile` | The user's profile page. | Uses the `Profile.svelte` component. |
| `/register/funeral-director` | A form for funeral directors to register a new family memorial. | `useFormAutoSave`, `copyToClipboard()` |
| `/register/funeral-home` | A registration form for new funeral homes. | `useFormAutoSave`, auto-login on success. |
| `/register/loved-one` | A registration form for family members to create a new memorial. | `validateForm()`, `handleSubmit()` |
| `/schedule` | The main pricing and scheduling calculator page. | `calculateBookingItems()`, `handleBookNow()`, `handleSaveAndPayLater()` |
| `/schedule/[memorialId]` | A memorial-specific version of the scheduling calculator. | `useAutoSave`, `handleBookNow()`, `handleSaveAndPayLater()` |
| `/schedule/new` | A page for creating a new memorial before proceeding to the calculator. | `createNewMemorial()` |
| `/search` | A page for searching for memorials using Algolia. | `performSearch()` |
| `/theme` | A showcase of all UI components for the application. | Static content. |
| `/theme2` | A second showcase of UI components with a different theme. | Static content. |
| `/tributes/[fullSlug]` | The public-facing page for a single memorial. | `toggleFollow()` |

## API Endpoints (`+server.ts`)

This section details the backend API routes.

### Admin Routes

| Route | Method | Description |
| :--- | :--- | :--- |
| `/api/admin/create-memorial` | `POST` | Creates a new memorial and a user account for the family. |
| `/api/admin/stats` | `GET` | Fetches dashboard statistics for the admin panel. |
| `/api/admin/users` | `GET`, `POST` | `GET`: Fetches all users. `POST`: Creates a new user. |
| `/api/admin/users/[uid]/activate` | `POST` | Activates a user account. |
| `/api/admin/users/[uid]/suspend` | `POST` | Suspends a user account with a given reason. |

### Funeral Director Routes

| Route | Method | Description |
| :--- | :--- | :--- |
| `/api/funeral-director/create-customer-memorial` | `POST` | Creates a memorial and a new customer user account. |
| `/api/funeral-director/create-memorial` | `POST` | Creates a memorial for an existing customer. |
| `/api/funeral-director/memorials` | `GET` | Fetches all memorials managed by the logged-in funeral director. |
| `/api/funeral-director/profile` | `GET`, `PATCH` | `GET`: Fetches the funeral director's profile. `PATCH`: Updates the profile. |
| `/api/funeral-director/quick-register-family` | `POST` | A streamlined endpoint for quickly registering a family and creating a memorial. |
| `/api/funeral-director/register` | `POST` | Submits a new funeral director's registration for approval. |

### Memorial & Livestream Routes

| Route | Method | Description |
| :--- | :--- | :--- |
| `/api/memorials/[memorialId]/assign` | `POST` | Reassigns the ownership of a memorial to a new user. |
| `/api/memorials/[memorialId]/embeds` | `POST`, `PUT`, `DELETE` | Manages embedded content (e.g., videos, slideshows) for a memorial. |
| `/api/memorials/[memorialId]/follow` | `POST`, `DELETE` | `POST`: Follows a memorial. `DELETE`: Unfollows a memorial. |
| `/api/memorials/[memorialId]/invite` | `POST` | Sends an invitation to a user to become a family member for a memorial. |
| `/api/memorials/[memorialId]/invite/[invitationId]` | `DELETE`, `POST` | `DELETE`: Removes an invitation. `POST`: Transfers family point of contact. |
| `/api/memorials/[memorialId]/livestream` | `POST`, `DELETE`, `GET` | `POST`: Starts a livestream. `DELETE`: Stops a livestream. `GET`: Gets livestream status. |
| `/api/memorials/[memorialId]/livestream/[streamId]` | `GET`, `PATCH`, `DELETE` | Manages a specific livestream session. |
| `/api/memorials/[memorialId]/livestream/start` | `POST` | Starts a livestream session for a memorial. |
| `/api/memorials/[memorialId]/livestreams` | `GET` | Fetches all livestreams for a memorial. |
| `/api/memorials/[memorialId]/schedule` | `PATCH` | Updates the schedule for a memorial. |
| `/api/memorials/[memorialId]/schedule/auto-save` | `POST`, `GET` | `POST`: Auto-saves the schedule. `GET`: Retrieves the auto-saved schedule. |
| `/api/memorials/[memorialId]/stream/mobile` | `POST` | Sets up a mobile stream for a memorial. |
| `/api/memorials/[memorialId]/stream/status` | `POST` | Updates the status of a stream (live or not). |

### Payment & Webhook Routes

| Route | Method | Description |
| :--- | :--- | :--- |
| `/api/check-payment-status` | `POST` | Checks the status of a Stripe payment intent (mock implementation). |
| `/api/create-payment-intent` | `POST` | Creates a Stripe payment intent for a booking. |
| `/api/lock-schedule` | `POST` | Locks a schedule after a successful payment (mock implementation). |
| `/api/webhooks/stripe` | `POST` | Handles incoming webhooks from Stripe for payment events. |

### Email & Session Routes

| Route | Method | Description |
| :--- | :--- | :--- |
| `/api/send-action-required-email` | `POST` | Sends an email when a payment requires further action. |
| `/api/send-confirmation-email` | `POST` | Sends a payment confirmation email. |
| `/api/send-failure-email` | `POST` | Sends an email when a payment fails. |
| `/api/session` | `POST` | Creates a session cookie for a user after they have been authenticated. |
| `/api/set-admin-claim` | `POST` | Sets a custom claim on a Firebase user to grant admin privileges. |
| `/api/set-role-claim` | `POST` | Sets a custom 'role' claim on a Firebase user. |
| `/clear-session` | `GET`, `POST` | Clears the user's session cookie. |
| `/logout` | `GET`, `POST` | Logs the user out by revoking refresh tokens and deleting the session cookie. |
