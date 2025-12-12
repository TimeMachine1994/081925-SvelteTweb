import type { PageLoad } from './$types';
import type { EventSlideshow } from '$lib/types/slideshow';

export const load: PageLoad = async ({ url }) => {
	// Extract eventId from URL
	const eventId = url.searchParams.get('eventId');
	
	// Extract edit data from URL
	const editParam = url.searchParams.get('edit');
	let editData: EventSlideshow | null = null;
	let isEditMode = false;
	
	if (editParam) {
		try {
			editData = JSON.parse(decodeURIComponent(editParam));
			isEditMode = true;
		} catch (error) {
			console.error('Failed to parse edit data:', error);
		}
	}
	
	// Use eventId from editData if available, otherwise from URL
	const finalMemorialId = editData?.eventId || eventId;
	
	return {
		eventId: finalMemorialId,
		editData,
		isEditMode
	};
};
