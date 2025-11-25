import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

/**
 * Create Event Page Server
 * 
 * NOTE: This currently redirects to the existing event registration system
 * with event-focused parameters. In the future, this can be expanded to have
 * its own dedicated event creation logic.
 */

export const load: PageServerLoad = async ({ url, locals }) => {
	// Direct users to the registration page immediately
	// This avoids showing two registration forms
	const params = new URLSearchParams();
	if (url.searchParams.get('name')) params.set('name', url.searchParams.get('name')!);
	if (url.searchParams.get('package')) params.set('package', url.searchParams.get('package')!);
	
	throw redirect(303, `/register/new-event-and-account?${params.toString()}`);
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		
		// Get form values
		const eventName = data.get('eventName') as string;
		const name = data.get('name') as string;
		const email = data.get('email') as string;
		const phone = data.get('phone') as string;
		const selectedPackage = data.get('selectedPackage') as string;
		const recaptchaToken = data.get('recaptchaToken') as string;
		
		// Build redirect URL with parameters
		const params = new URLSearchParams();
		if (eventName) params.set('name', eventName);
		if (selectedPackage) params.set('package', selectedPackage);
		
		// For now, redirect to the existing new-event-and-account registration
		// In the future, this can create events in a separate collection
		// TODO: Create dedicated event collection and registration flow
		throw redirect(303, `/register/new-event-and-account?${params.toString()}`);
	}
};
