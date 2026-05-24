export interface Invitation {
    email: string;
    role: 'family_member' | 'viewer';
    status: 'pending' | 'accepted';
    createdAt: Date;
    acceptedAt?: Date;
}