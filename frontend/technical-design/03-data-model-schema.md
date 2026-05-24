# Firestore Data Model Schema

## 1. Purpose

This document details the structure of the application's data in Firestore. Its primary purpose is to confirm the existing data model and identify potential optimizations for SvelteKit's data fetching patterns. By providing a clear, centralized reference for all collections and document structures, this schema will guide development, ensure data consistency, and facilitate a smooth migration to SvelteKit.

## 2. Content

This section documents all Firestore collections, the structure of documents within those collections, any subcollections, and critical indexing or security rules.

### Collections

#### `memorials`

Stores the primary content for each tribute page.

*   **Document ID:** `{fullSlug}` (e.g., `celebration-of-life-for-john-doe`)
*   **Fields:**
    *   `lovedOneName` (string): The full name of the deceased.
    *   `slug` (string): The URL-friendly version of the loved one's name.
    *   `fullSlug` (string): The complete URL slug for the memorial page.
    *   `createdByUserId` (string): The UID of the user who created the memorial.
    *   `creatorEmail` (string): The email of the user who created the memorial.
    *   `creatorName` (string): The name of the user who created the memorial.
    *   `directorFullName` (string, optional): The name of the funeral director.
    *   `funeralHomeName` (string, optional): The name of the funeral home.
    *   `memorialDate` (string, optional): The date of the memorial service.
    *   `memorialTime` (string, optional): The time of the memorial service.
    *   `memorialLocationName` (string, optional): The name of the memorial location.
    *   `memorialLocationAddress` (string, optional): The address of the memorial location.
    *   `isPublic` (boolean): Whether the memorial is visible to the public.
    *   `content` (string): The HTML content of the tribute page.
    *   `custom_html` (string, nullable): Legacy field for custom HTML content.
    *   `createdAt` (timestamp): The timestamp when the memorial was created.
    *   `updatedAt` (timestamp): The timestamp when the memorial was last updated.
*   **Subcollections:**
    *   `contacts`: Stores contact information for the memorial.
        *   **Document ID:** Auto-generated
        *   **Fields:**
            *   `name` (string)
            *   `email` (string)
            *   `phone` (string)

#### `users`

Stores user account information.

*   **Document ID:** `{userId}` (Firebase Auth UID)
*   **Fields:**
    *   `uid` (string): The user's Firebase Auth UID.
    *   `email` (string): The user's email address.
    *   `displayName` (string): The user's display name.
    *   `lovedOneFullName` (string, optional): The name of the loved one associated with the user's memorial.
    *   `contactEmail` (string, optional): The user's contact email.
    *   `directorFullName` (string, optional): The full name of the funeral director.
    *   `funeralHomeName` (string, optional): The name of the funeral home.
    *   `skipWelcomeEmail` (boolean): A flag to skip the generic welcome email.
    *   `createdAt` (timestamp): The timestamp when the user account was created.
    *   `updatedAt` (timestamp): The timestamp when the user account was last updated.

#### `userEventConfigurations`

Stores the configuration for a user's event, created from the livestream calculator.

*   **Document ID:** Auto-generated
*   **Fields:**
    *   `userId` (string): The UID of the user who owns the configuration.
    *   `package` (string): The selected livestream package.
    *   `totalCalculatedAmount` (number): The total cost of the package.
    *   `currency` (string): The currency of the payment (e.g., `usd`).
    *   `isPaymentSuccessful` (boolean): A flag indicating if the payment was successful.
    *   `stripePaymentIntentId` (string, optional): The ID of the Stripe Payment Intent.
    *   `stripePaymentStatus` (string, optional): The status of the Stripe payment.
    *   `paymentIntentCreatedAt` (timestamp, optional): The timestamp when the payment intent was created.
    *   `isPaymentPending` (boolean): A flag indicating if the payment is pending.
    *   `paymentProcessedAt` (timestamp, optional): The timestamp when the payment was processed.
    *   `isScheduleLocked` (boolean): A flag to lock the schedule after payment.
    *   `scheduleItems` (array of objects): An array of schedule items for the event.
    *   `createdAt` (timestamp): The timestamp when the configuration was created.
    *   `updatedAt` (timestamp): The timestamp when the configuration was last updated.
    *   `lastUpdatedByAdmin` (string, optional): The UID of the admin who last updated the configuration.
*   **Subcollections:**
    *   `privateNotes`: Stores private notes for the event configuration.
        *   **Document ID:** Auto-generated
        *   **Fields:**
            *   `note` (string)
            *   `createdAt` (timestamp)

#### `eventConfigs`

Stores event configurations created by the `createMemorial` function.

*   **Document ID:** `{memorialId}`
*   **Fields:**
    *   `memorialId` (string): The ID of the associated memorial.
    *   `userId` (string): The UID of the user who owns the configuration.
    *   `createdAt` (timestamp): The timestamp when the configuration was created.
    *   `updatedAt` (timestamp): The timestamp when the configuration was last updated.

#### `privateNotes`

Stores private notes associated with a memorial.

*   **Document ID:** `{memorialId}`
*   **Fields:**
    *   `memorialId` (string): The ID of the associated memorial.
    *   `userId` (string): The UID of the user who owns the note.
    *   `note` (string): The content of the note.
    *   `createdAt` (timestamp): The timestamp when the note was created.
    *   `updatedAt` (timestamp): The timestamp when the note was last updated.

#### `mail`

Used by the `firestore-send-email` extension to send emails.

*   **Document ID:** Auto-generated
*   **Fields:**
    *   `to` (array of strings): The recipient email addresses.
    *   `message` (object):
        *   `subject` (string): The email subject.
        *   `html` (string): The HTML content of the email.
        *   `text` (string): The plain text content of the email.

#### `emailTemplates`

Stores email templates used by the application.

*   **Document ID:** `{templateName}` (e.g., `welcomeEmail`)
*   **Fields:**
    *   `subject` (string): The email subject.
    *   `templateContent` (string): The Handlebars template content.
    *   `updatedAt` (timestamp): The timestamp when the template was last updated.
    *   `updatedBy` (string): The UID of the admin who last updated the template.

#### `blogPosts`

Stores blog posts for the application.

*   **Document ID:** Auto-generated
*   **Fields:**
    *   `title` (string): The title of the blog post.
    *   `content` (string): The content of the blog post.
    *   `status` (string): The status of the blog post (e.g., `published`, `draft`).
    *   `createdAt` (timestamp): The timestamp when the post was created.
    *   `updatedAt` (timestamp): The timestamp when the post was last updated.

#### `auditLogs`

Stores audit logs for administrative actions.

*   **Document ID:** Auto-generated
*   **Fields:**
    *   `action` (string): The action performed (e.g., `TRIBUTE_DELETED`).
    *   `actor` (object): Information about the user who performed the action.
    *   `entity` (object): Information about the entity that was acted upon.
    *   `description` (string): A description of the action.
    *   `context` (object): The context in which the action was performed.
    *   `details` (object, optional): Additional details about the action.
    *   `timestamp` (timestamp): The timestamp of the action.

#### `receipts`

Stores payment receipts.

*   **Document ID:** `{paymentIntentId}`
*   **Fields:**
    *   `userId` (string): The UID of the user who made the payment.
    *   `bookingId` (string): The ID of the associated booking.
    *   `paymentId` (string): The Stripe Payment Intent ID.
    *   `status` (string): The status of the payment.
    *   `amount` (number): The payment amount.
    *   `amountInCents` (number): The payment amount in cents.
    *   `currency` (string): The currency of the payment.
    *   `createdAt` (timestamp): The timestamp when the receipt was created.
    *   `lovedOneName` (string, optional): The name of the loved one for the memorial.
    *   `package` (string, optional): The selected livestream package.

#### `userFiles`

Stores metadata for user-uploaded files.

*   **Document ID:** Auto-generated
*   **Fields:**
    *   `userId` (string): The UID of the user who uploaded the file.
    *   `fileName` (string): The name of the file.
    *   `fileUrl` (string): The URL of the file in Firebase Storage.
    *   `createdAt` (timestamp): The timestamp when the file was uploaded.

## 3. Key Question

**Are there any data modeling changes required or beneficial for SvelteKit integration?**

The existing data model is well-structured and generally suitable for SvelteKit. However, a few optimizations could be beneficial:

*   **Data Duplication for Performance:** To reduce the number of reads required on the client, we could duplicate some data. For example, the `memorials` collection could include a `creatorDisplayName` field, which would eliminate the need to fetch the `users` document separately when displaying a list of memorials.
*   **Consolidate Configuration Collections:** The `userEventConfigurations`, `eventConfigs`, and `privateNotes` collections are all related to event configuration. We could consider consolidating these into a single `configurations` collection with a `type` field to differentiate between them. This would simplify queries and reduce the number of collections to manage.
*   **Review Indexing:** As we build out the SvelteKit application, we should review the Firestore indexes to ensure they are optimized for the new data fetching patterns. This will be particularly important for any new queries that are introduced.

Overall, the existing data model is a solid foundation, and any changes should be focused on performance and simplification rather than a complete overhaul.