# API Service Contract

## 1. Purpose

This document defines the interfaces for all backend interactions within the Tributestream application. Its goal is to provide a clear and comprehensive reference for both frontend and backend development, ensuring consistency and predictability in data exchange. This includes interactions with Firebase Cloud Functions and direct data access to Firestore from the client.

## 2. Content

### 2.1. Cloud Functions

This section details the callable Cloud Functions that are invoked from the client application.

---

#### **`createMemorial`**

*   **Purpose:** Creates a new memorial, along with associated user and event configuration documents. Handles both new and existing user scenarios.
*   **Inputs (Request Body):**
    *   `memorialData` (object): Contains details about the memorial and its creator.
        *   `creatorEmail` (string, required)
        *   `creatorName` (string, required)
        *   `lovedOneName` (string, required)
    *   `eventConfigData` (object): Initial event configuration. Can be an empty object.
    *   `privateNoteData` (object): Initial private note. Can be an empty object.
    *   `formType` (string): Identifier for the form used to create the memorial (e.g., "create-memorial").
    *   `tempPassword` (string, optional): A temporary password for a new user.
*   **Outputs (Response Body):**
    *   `success` (boolean): Indicates if the operation was successful.
    *   `message` (string): A descriptive message about the result.
    *   `slug` (string): The generated slug for the new memorial page.
    *   `isNewUser` (boolean): Indicates if a new user was created.
*   **Error Codes:**
    *   `invalid-argument`: Missing or invalid required fields.
    *   `already-exists`: A user with the provided email already exists, or the logged-in user already has a memorial.
    *   `internal`: A server-side error occurred.

---

#### **`saveCalculatorConfiguration`**

*   **Purpose:** Saves or updates a user's event configuration from the livestream calculator.
*   **Inputs (Request Body):**
    *   An object containing the fields from the `SaveCalculatorConfigurationPayload` interface, including `lovedOneName`, `serviceDate`, `totalCalculatedAmount`, `package`, etc.
*   **Outputs (Response Body):**
    *   `success` (boolean): Indicates if the operation was successful.
    *   `message` (string): A descriptive message about the result.
    *   `eventId` (string): The ID of the saved event configuration document.
*   **Error Codes:**
    *   `unauthenticated`: The user is not logged in.
    *   `invalid-argument`: Missing required fields in the payload.
    *   `not-found`: No memorial record found for the user.
    *   `internal`: A server-side error occurred.

---

#### **`getLatestCalculatorConfiguration`**

*   **Purpose:** Retrieves the most recent calculator configuration for the logged-in user.
*   **Inputs:** None (authentication context is used).
*   **Outputs (Response Body):**
    *   `data` (object | null): The latest configuration object, or `null` if none is found.
*   **Error Codes:**
    *   `unauthenticated`: The user is not logged in.
    *   `internal`: A server-side error occurred.

---

#### **`processStripePayment`**

*   **Purpose:** Creates a Stripe Payment Intent to initiate a payment.
*   **Inputs (Request Body):**
    *   `bookingId` (string, required): The ID of the event configuration to be paid for.
    *   `billingInfo` (object, optional): The user's billing address.
*   **Outputs (Response Body):**
    *   `success` (boolean): Indicates if the operation was successful.
    *   `paymentIntentId` (string): The ID of the created Stripe Payment Intent.
    *   `clientSecret` (string): The client secret for the Payment Intent.
    *   `status` (string): The status of the Payment Intent.
*   **Error Codes:**
    *   `unauthenticated`: The user is not logged in.
    *   `invalid-argument`: Missing or invalid required fields.
    *   `already-exists`: Payment has already been processed for this booking.
    *   `internal`: A server-side error occurred.

---

#### **`confirmStripePayment`**

*   **Purpose:** Confirms a Stripe payment after it has been processed on the client.
*   **Inputs (Request Body):**
    *   `bookingId` (string, required): The ID of the event configuration.
    *   `paymentIntentId` (string, required): The ID of the Stripe Payment Intent.
*   **Outputs (Response Body):**
    *   `success` (boolean): Indicates if the operation was successful.
    *   `paymentId` (string): The ID of the confirmed payment.
    *   `status` (string): The final status of the payment.
*   **Error Codes:**
    *   `unauthenticated`: The user is not logged in.
    *   `invalid-argument`: Missing or invalid required fields.
    *   `failed-precondition`: The payment is not in a "succeeded" state.
    *   `internal`: A server-side error occurred.

---

### 2.2. Firestore Direct Access

This section documents the queries and mutations performed directly from the client-side application.

#### **Reads**

*   **`users` collection:**
    *   **Get by ID:** Fetches a single user document by its UID.
        *   *Location:* `src/app/my-portal/page.tsx`, `src/app/calculator/components/CalculatorView.tsx`
*   **`memorials` collection:**
    *   **Query by `createdByUserId`:** Fetches the most recent memorial created by the current user.
        *   *Location:* `src/app/my-portal/page.tsx`, `src/app/calculator/components/CalculatorView.tsx`
*   **`emailTemplates` collection:**
    *   **Get by ID:** Fetches a single email template document by its ID.
        *   *Location:* `src/app/admin/email-templates/[templateId]/page.tsx`
*   **`receipts` collection:**
    *   **Get by ID:** Fetches a single receipt document by its ID.
        *   *Location:* `src/app/receipt/[receiptId]/page.tsx`
*   **`contacts` sub-collection:**
    *   **Get all:** Fetches all documents in the `contacts` sub-collection of a memorial.
        *   *Location:* `src/app/my-portal/page.tsx`
*   **`privateNotes` sub-collection:**
    *   **Query and order by `submittedAt`:** Fetches all private notes for a given event configuration, ordered by submission time.
        *   *Location:* `src/app/my-portal/page.tsx`

#### **Writes**

*   **`users` collection:**
    *   **Set with merge:** Creates or updates a user document.
        *   *Location:* `src/app/create-memorial/page.tsx` (Note: This is a fallback, primary creation is in the `createMemorial` function).

## 3. Key Question

**Are there any existing Next.js API routes that need to be re-implemented as SvelteKit server endpoints or Cloud Functions?**

Yes. The existing Next.js API routes under `/api/admin` are essential for the admin portal's functionality. These routes handle fetching audit logs, tributes, and users. As the application is migrated to SvelteKit, these endpoints will need to be re-implemented as SvelteKit server endpoints to maintain the admin portal's functionality. The `/api/login` and `/api/search-livestreams` routes will also need to be migrated. The `/api/admin/email-templates/preview` route, which handles server-side rendering of email templates, will also need a SvelteKit equivalent.