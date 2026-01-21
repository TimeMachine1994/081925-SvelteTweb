export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type Toast = {
	id: string;
	message: string;
	type: ToastType;
	duration?: number;
};

class ToastStore {
	toasts = $state<Toast[]>([]);

	add(message: string, type: ToastType = 'info', duration = 3000) {
		const id = crypto.randomUUID();
		const toast: Toast = { id, message, type, duration };
		
		this.toasts.push(toast);

		if (duration > 0) {
			setTimeout(() => {
				this.remove(id);
			}, duration);
		}
	}

	remove(id: string) {
		this.toasts = this.toasts.filter(t => t.id !== id);
	}

	success(message: string, duration = 3000) {
		this.add(message, 'success', duration);
	}

	error(message: string, duration = 5000) {
		this.add(message, 'error', duration);
	}

	warning(message: string, duration = 4000) {
		this.add(message, 'warning', duration);
	}

	info(message: string, duration = 3000) {
		this.add(message, 'info', duration);
	}
}

export const toastStore = new ToastStore();
