import { getAdminDb } from '$lib/server/firebase';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Timestamp } from 'firebase-admin/firestore';
import { EmptyForm } from '$lib/data/calculator';
import type { Memorial } from '$lib/types/memorial';

// Helper function to generate slug from loved one's name
function generateSlug(lovedOneName: string): string {
	console.log('🔗 Generating slug for:', lovedOneName);
	const slug = `celebration-of-life-for-${lovedOneName
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '') // Remove special characters
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/-+/g, '-') // Replace multiple hyphens with single
		.replace(/^-|-$/g, '')}` // Remove leading/trailing hyphens
		.substring(0, 100); // Limit length
	console.log('🔗 Generated slug:', slug);
	return slug;
}

// The POST handler has been removed to prevent the creation of draft bookings from the calculator.
// A memorial is already created upon user registration, so this functionality is redundant.