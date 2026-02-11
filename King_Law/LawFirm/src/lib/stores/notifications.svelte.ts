type NotificationType = 'message' | 'document' | 'invoice' | 'case' | 'system';

type Notification = {
	id: string;
	type: NotificationType;
	title: string;
	description?: string;
	href?: string;
	read: boolean;
	createdAt: Date;
};

function createNotificationsStore() {
	let notifications = $state<Notification[]>([]);
	let loading = $state(false);

	function addNotification(n: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
		notifications = [
			{
				...n,
				id: crypto.randomUUID(),
				read: false,
				createdAt: new Date()
			},
			...notifications
		];
	}

	function markAsRead(id: string) {
		notifications = notifications.map(n =>
			n.id === id ? { ...n, read: true } : n
		);
	}

	function markAllAsRead() {
		notifications = notifications.map(n => ({ ...n, read: true }));
	}

	function dismiss(id: string) {
		notifications = notifications.filter(n => n.id !== id);
	}

	function clearAll() {
		notifications = [];
	}

	return {
		get notifications() { return notifications; },
		get unreadCount() { return notifications.filter(n => !n.read).length; },
		get loading() { return loading; },
		addNotification,
		markAsRead,
		markAllAsRead,
		dismiss,
		clearAll
	};
}

export const notificationsStore = createNotificationsStore();
