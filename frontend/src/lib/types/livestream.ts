// Using native Date object for serialization across client/server boundary
// import type { Timestamp } from 'firebase/firestore';

interface ScheduleItem {
	date: string | null;
	hours: number;
	itemName: string;
	itemType: string;
	locationAddress: string | null;
	locationName: string | null;
	startTime: string;
}

export interface LivestreamBooking {
	additionalDayHours: number;
	additionalDayLocationAddress: string | null;
	additionalDayLocationName: string | null;
	additionalDayStartTime: string | null;
	additionalDays: boolean;
	additionalHours: number;
	additionalLocationAddress: string | null;
	additionalLocationName: string | null;
	additionalLocations: boolean;
	additionalStartTime: string | null;
	addons: {
		audioVisual: boolean;
		liveMusician: boolean;
		photography: boolean;
	};
	createdAt: Date;
	funeralDirector: string | null;
	funeralHome: string | null;
	hours: number;
	isPaymentSuccessful: boolean;
	livestreamTime: string;
	locationAddress: string | null;
	locationName: string | null;
	lovedOneName: string | null;
	package: string;
	paymentEmail: string | null;
	pocEmail: string;
	savedAt: Date;
	scheduleItems: ScheduleItem[];
	serviceDate: string | null;
	title: string;
	totalCalculatedAmount: number;
	updatedAt: Date;
	userId: string;
}
export interface LivestreamDetails {
  title: string;
  description: string;
  streamDate: Date | null;
  isLive: boolean;
  streamUrl?: string;
  thumbnailUrl?: string;
}