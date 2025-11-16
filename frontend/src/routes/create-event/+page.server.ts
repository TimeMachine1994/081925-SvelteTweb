import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

/**
 * Create Event Page Server
 * 
 * NOTE: This currently redirects to the existing memorial registration system
 * with event-focused parameters. In the future, this can be expanded to have
 * its own dedicated event creation logic.
 */

export const load: PageServerLoad = async ({ url }) => {
	// Pass through any query parameters (name, package, etc.)
	return {
		eventName: url.searchParams.get('name') || '',
		selectedPackage: url.searchParams.get('package') || ''
	};
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
		
		// For now, redirect to the existing loved-one registration
		// In the future, this can create events in a separate collection
		// TODO: Create dedicated event collection and registration flow
		throw redirect(303, `/register/loved-one?${params.toString()}`);
	}
};
