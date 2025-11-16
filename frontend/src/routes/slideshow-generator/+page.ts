import type { PageLoad } from './$types';
import type { MemorialSlideshow } from '$lib/types/slideshow';

export const load: PageLoad = async ({ url }) => {
	// Extract memorialId from URL
	const memorialId = url.searchParams.get('memorialId');
	
	// Extract edit data from URL
	const editParam = url.searchParams.get('edit');
	let editData: MemorialSlideshow | null = null;
	let isEditMode = false;
	
	if (editParam) {
		try {
			editData = JSON.parse(decodeURIComponent(editParam));
			isEditMode = true;
		} catch (error) {
			console.error('Failed to parse edit data:', error);
		}
	}
	
	// Use memorialId from editData if available, otherwise from URL
	const finalMemorialId = editData?.memorialId || memorialId;
	
	return {
		memorialId: finalMemorialId,
		editData,
		isEditMode
	};
};
