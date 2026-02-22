import type { PageServerLoad } from './$types';
import { getRecaptchaSiteKey } from '$lib/server/recaptcha';

export const load: PageServerLoad = async () => {
	return {
		recaptchaSiteKey: getRecaptchaSiteKey()
	};
};
