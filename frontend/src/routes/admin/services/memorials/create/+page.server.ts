import { redirect, isRedirect } from '@sveltejs/kit';
import { requireAdmin, requireAdminAction } from '$lib/server/adminGuard';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals, { resource: 'memorial', action: 'create' });
	return {};
};

export const actions: Actions = {
	create: async ({ request, fetch, locals }) => {
		const guard = requireAdminAction(locals, { resource: 'memorial', action: 'create' });
		if (!guard.ok) return guard.failure;

		try {
			const formData = await request.formData();

			const memorialData = {
				lovedOneName: (formData.get('lovedOneName') as string)?.trim(),
				creatorEmail: (formData.get('creatorEmail') as string)?.trim(),
				creatorName: (formData.get('creatorName') as string)?.trim() || undefined,
				serviceDate: (formData.get('serviceDate') as string) || null,
				serviceTime: (formData.get('serviceTime') as string) || null,
				location: (formData.get('location') as string)?.trim() || '',
				content: (formData.get('content') as string)?.trim() || ''
			};

			if (!memorialData.lovedOneName || !memorialData.creatorEmail) {
				return {
					success: false,
					error: 'Loved one name and creator email are required'
				};
			}

			const response = await fetch('/api/admin/create-memorial', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(memorialData)
			});

			const result = await response.json();

			if (!response.ok) {
				return {
					success: false,
					error: result.error || 'Failed to create memorial'
				};
			}

			// Redirect to the new memorial's detail page
			throw redirect(303, `/admin/services/memorials/${result.memorialId}`);
		} catch (error) {
			if (isRedirect(error)) {
				throw error;
			}

			console.error('Error creating memorial:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}
};
