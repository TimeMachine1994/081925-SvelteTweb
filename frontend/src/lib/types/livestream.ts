import type { Timestamp } from 'firebase/firestore';

export type Tier = 'solo' | 'live' | 'legacy' | null;

export interface LocationInfo {
	name: string;
	address: string;
	isUnknown: boolean;
}

export interface TimeInfo {
	date: string | null;
	time: string | null;
	isUnknown: boolean;
}

export interface ServiceDetails {
	location: LocationInfo;
	time: TimeInfo;
	hours: number;
}

export interface AdditionalServiceDetails {
	enabled: boolean;
	location: LocationInfo;
	startTime: string | null;
	hours: number;
}

export interface Addons {
	photography: boolean;
	audioVisualSupport: boolean;
	liveMusician: boolean;
	woodenUsbDrives: number;
}

export interface CalculatorFormData {
	// Memorial context
	memorialId?: string;
	lovedOneName: string;
	
	// Service configuration
	selectedTier: Tier;
	mainService: ServiceDetails;
	additionalLocation: AdditionalServiceDetails;
	additionalDay: AdditionalServiceDetails;
	
	// Contact information
	funeralDirectorName: string;
	funeralHome: string;
	
	// Add-ons
	addons: Addons;
	
	// Metadata
	createdAt?: Date;
	updatedAt?: Date;
	autoSaved?: boolean;
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
	userId: string;
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

// Unified calculator configuration for Firestore
export interface CalculatorConfig {
	formData: CalculatorFormData;
	bookingItems: BookingItem[];
	total: number;
	lastModified: Timestamp;
	lastModifiedBy: string;
	status: 'draft' | 'saved' | 'paid' | 'confirmed';
	autoSave?: {
		formData: CalculatorFormData;
		lastModified: Date;
		lastModifiedBy: string;
		timestamp: number;
		autoSave: boolean;
	};
}