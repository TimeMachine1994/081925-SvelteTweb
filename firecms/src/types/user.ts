// firecms/src/types/user.ts

/**
 * Defines the data structure for a User document in Firestore.
 */
export type User = {
    displayName: string;
    email: string;
    createdAt: Date;
}