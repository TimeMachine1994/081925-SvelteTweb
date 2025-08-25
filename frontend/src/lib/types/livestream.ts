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
	lovedOneName: string;
	mainService: ServiceDetails;
	additionalLocation: AdditionalServiceDetails;
	additionalDay: AdditionalServiceDetails;
	funeralDirectorName: string;
	funeralHome: string;
	addons: Addons;
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
	status: 'saved' | 'pending_payment' | 'paid';
	createdAt: Timestamp;
	paymentIntentId?: string;
}