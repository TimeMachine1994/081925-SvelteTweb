export type Tier = 'Solo' | 'Live' | 'Legacy' | null;

export interface Addons {
	photography: boolean;
	audioVisualSupport: boolean;
	liveMusician: boolean;
	woodenUsbDrives: number;
}

export interface ServiceLocation {
	name: string;
	address: string;
	isUnknown: boolean;
}

export interface ServiceTime {
	date: string | null;
	time: string | null;
	isUnknown: boolean;
}

export interface AdditionalService {
	enabled: boolean;
	location: ServiceLocation;
	startTime: string | null;
	hours: number;
}

export interface CalculatorFormData {
	lovedOneName: string;
	mainService: {
		location: ServiceLocation;
		time: ServiceTime;
		hours: number;
	};
	additionalLocation: AdditionalService;
	additionalDay: AdditionalService;
	funeralDirectorName: string;
	funeralHome: string;
	addons: Addons;
}

export interface BookingItem {
	id: string;
	name: string;
	price: number;
	quantity: number;
}
export interface LivestreamConfig {
	id: string;
	basePackage: string;
	duration: number;
	platform: string;
	addObs: boolean;
	addExtraCameras: number;
	addExtraMicrophones: number;
	total: number;
	userId: string;
	createdAt: any;
}