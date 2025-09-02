import type { Timestamp } from 'firebase/firestore';
import type { CalculatorFormData, BookingItem } from './livestream';

/**
 * Represents the state and data of a single booking process.
 * This unified model serves as the single source of truth for both
 * in-progress (draft) and finalized (confirmed) bookings, replacing
 * the legacy `livestreamConfigurations` and `calculatorState` models.
 */
export interface Booking {
	id: string;
	status: 'draft' | 'pending_payment' | 'confirmed' | 'cancelled' | 'completed';
	
	// Core booking data from the calculator
	formData: CalculatorFormData;
	bookingItems: BookingItem[];
	total: number;
	step: number; // Add step to track calculator progress
	
	// User and Memorial associations
	userId: string | null; // Null for anonymous users
	memorialId: string | null; // Null until explicitly assigned
	
	// Timestamps and metadata
	createdAt: Timestamp;
	updatedAt: Timestamp;
	paymentIntentId?: string;
}