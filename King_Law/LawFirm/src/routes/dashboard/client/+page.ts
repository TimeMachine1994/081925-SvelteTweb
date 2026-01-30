import { casesStore } from '$lib/stores/cases.svelte.ts';
import { documentsStore } from '$lib/stores/documents.svelte.ts';
import { messagesStore } from '$lib/stores/messages.svelte.ts';

export const load = async () => {
	if (typeof window === 'undefined') return {};

	await Promise.all([
		casesStore.fetchCases(),
		documentsStore.fetchDocuments(),
		messagesStore.fetchMessages()
	]);

	return {};
};
