type AuditAction =
	| 'login'
	| 'logout'
	| 'case_created'
	| 'case_updated'
	| 'document_uploaded'
	| 'document_downloaded'
	| 'invoice_created'
	| 'invoice_paid'
	| 'message_sent'
	| 'settings_updated'
	| 'user_created'
	| 'staff_code_created'
	| 'theme_changed';

type AuditEntry = {
	id: string;
	action: AuditAction;
	description: string;
	metadata?: Record<string, unknown>;
	timestamp: Date;
};

function createAuditLogStore() {
	let entries = $state<AuditEntry[]>([]);

	function log(action: AuditAction, description: string, metadata?: Record<string, unknown>) {
		const entry: AuditEntry = {
			id: crypto.randomUUID(),
			action,
			description,
			metadata,
			timestamp: new Date()
		};

		entries = [entry, ...entries].slice(0, 100); // Keep last 100

		// Optionally persist to server in the future
		// fetch('/api/audit', { method: 'POST', body: JSON.stringify(entry) });
	}

	function clear() {
		entries = [];
	}

	return {
		get entries() { return entries; },
		log,
		clear
	};
}

export const auditLogStore = createAuditLogStore();
