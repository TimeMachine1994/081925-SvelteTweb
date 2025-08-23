// firecms/src/types/user.ts

/**
 * Defines the data structure for a User document in Firestore.
 */
export type UserRole =
    | 'family_member'
    | 'viewer'
    | 'owner'
    | 'funeral_director'
    | 'remote_producer'
    | 'onsite_videographer';

export type User = {
    displayName: string;
    email: string;
    createdAt: Date;
    role?: UserRole;
}