import type { Timestamp } from 'firebase/firestore';
import type { ServiceDetails, AdditionalServiceDetails, LocationInfo, TimeInfo } from './memorial';

export type Tier = 'solo' | 'live' | 'legacy' | null;

export interface Addons {
	photography: boolean;
	audioVisualSupport: boolean;
	liveMusician: boolean;
	woodenUsbDrives: number;
}

export interface CalculatorFormData {
	// Memorial Reference (service details now stored in Memorial)
	memorialId: string;             // Required - references Memorial for service data
	
	// Calculator-Specific Configuration
	selectedTier: Tier;             // Service tier
	addons: Addons;                 // Selected add-on services
	
	// Metadata
	createdAt?: Date;               // Form creation
	updatedAt?: Date;               // Form update
	autoSaved?: boolean;            // Auto-save flag
}

export interface BookingItem {
	id: string;
	name: string;
	package: string;
	price: number;
	quantity: number;
	total: number;
}

export interface LivestreamConfig {
	id: string;
	formData: CalculatorFormData;
	bookingItems: BookingItem[];
	total: number;
	uid: string;
	memorialId: string;
	status: 'draft' | 'saved' | 'pending_payment' | 'paid' | 'confirmed';
	createdAt: Timestamp;
	lastModified: Timestamp;
	lastModifiedBy: string;
	paymentIntentId?: string;
}

// Payment tracking interface
export interface PaymentRecord {
	paymentIntentId: string;
	status: 'pending' | 'succeeded' | 'failed';
	amount: number;
	createdAt: Timestamp;
	paidAt?: Timestamp;
}
