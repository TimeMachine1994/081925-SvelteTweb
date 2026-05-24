export interface Booking {
    userId: string;
    memorialId: string;
    package: string;
    serviceDetails: {
        lovedOneName: string;
        memorialDate: string;
        memorialTime: string;
        locationName: string;
        locationAddress: string;
    };
    additionalServices: {
        [key: string]: boolean;
    };
    status: 'pending' | 'confirmed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}