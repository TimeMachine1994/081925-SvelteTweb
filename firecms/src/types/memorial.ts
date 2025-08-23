// firecms/src/types/memorial.ts

/**
 * Defines the data structure for a Memorial document in Firestore.
 */
export type Memorial = {
    title: string;
    description: string;
    creatorUid: string;
    photos: string[];
    createdAt: Date;
    updatedAt: Date;
}