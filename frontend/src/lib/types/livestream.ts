// Livestream and Calculator Types

export type Tier = 'solo' | 'standard' | 'premium' | 'legacy';

export interface CalculatorFormData {
	selectedTier: Tier;
	hours: number;
	additionalLocation: boolean;
	additionalDay: boolean;
	addons: {
		usbDrive: boolean;
		additionalHours: number;
	};
}

export interface BookingItem {
	name: string;
	price: number;
	quantity?: number;
}

export interface TierInfo {
	name: string;
	price: number;
	features: string[];
	popular?: boolean;
}

export const TIER_PRICING: Record<Tier, TierInfo> = {
	solo: {
		name: 'Solo',
		price: 99,
		features: ['Single camera angle', 'HD streaming', 'Basic recording']
	},
	standard: {
		name: 'Standard',
		price: 199,
		features: ['Multiple camera angles', 'HD streaming', 'Professional recording', 'Chat moderation'],
		popular: true
	},
	premium: {
		name: 'Premium',
		price: 299,
		features: ['Multiple camera angles', '4K streaming', 'Professional recording', 'Chat moderation', 'Priority support']
	},
	legacy: {
		name: 'Legacy',
		price: 149,
		features: ['Legacy tier features', 'HD streaming', 'Basic recording']
	}
};
