// Store to manage ChatSlider UI state
class ChatUIStore {
	isOpen = $state(false);
	selectedClientId = $state<string | null>(null);
	selectedClientName = $state<string | null>(null);
	filterUncategorized = $state(false);

	open() {
		this.isOpen = true;
	}

	close() {
		this.isOpen = false;
		this.selectedClientId = null;
		this.selectedClientName = null;
		this.filterUncategorized = false;
	}

	toggle() {
		if (this.isOpen) {
			this.close();
		} else {
			this.open();
		}
	}

	openForClient(clientId: string, clientName: string) {
		this.selectedClientId = clientId;
		this.selectedClientName = clientName;
		this.filterUncategorized = true;
		this.isOpen = true;
	}
}

export const chatUIStore = new ChatUIStore();
