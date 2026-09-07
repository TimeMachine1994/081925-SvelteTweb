/**
 * Admin Toast Store
 *
 * Lightweight notification queue for admin action feedback (success/error).
 */
import { writable } from 'svelte/store';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
	id: number;
	variant: ToastVariant;
	message: string;
}

let nextId = 0;

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	function push(message: string, variant: ToastVariant = 'info', durationMs = 4000) {
		const id = nextId++;
		update((toasts) => [...toasts, { id, variant, message }]);
		if (durationMs > 0) {
			setTimeout(() => dismiss(id), durationMs);
		}
		return id;
	}

	function dismiss(id: number) {
		update((toasts) => toasts.filter((t) => t.id !== id));
	}

	return {
		subscribe,
		dismiss,
		success: (message: string) => push(message, 'success'),
		error: (message: string) => push(message, 'error'),
		info: (message: string) => push(message, 'info')
	};
}

export const adminToast = createToastStore();
