import { casesStore } from '$lib/stores/cases.svelte';
import { documentsStore } from '$lib/stores/documents.svelte';
import { messagesStore } from '$lib/stores/messages.svelte';

export const load = async () => {
	if (typeof window === 'undefined') return {};

	await Promise.all([
		casesStore.fetchCases(),
		documentsStore.fetchDocuments(),
		messagesStore.fetchMessages()
	]);

	return {};
};
