type ToastType = 'success' | 'error' | 'info' | 'warning';

type Toast = {
	id: string;
	message: string;
	type: ToastType;
	duration: number;
};

class ToastStore {
	toasts = $state<Toast[]>([]);

	private addToast(message: string, type: ToastType, duration = 5000) {
		const id = crypto.randomUUID();
		const toast: Toast = { id, message, type, duration };
		this.toasts = [...this.toasts, toast];

		setTimeout(() => {
			this.remove(id);
		}, duration);

		return id;
	}

	success(message: string, duration = 5000) {
		return this.addToast(message, 'success', duration);
	}

	error(message: string, duration = 5000) {
		return this.addToast(message, 'error', duration);
	}

	info(message: string, duration = 5000) {
		return this.addToast(message, 'info', duration);
	}

	warning(message: string, duration = 5000) {
		return this.addToast(message, 'warning', duration);
	}

	remove(id: string) {
		this.toasts = this.toasts.filter(t => t.id !== id);
	}

	clear() {
		this.toasts = [];
	}
}

export const toastStore = new ToastStore();
