import { onDestroy } from 'svelte';
import type { CalculatorFormData } from '$lib/types/livestream';

export interface AutoSaveOptions {
	memorialId: string;
	delay?: number; // milliseconds to wait before auto-saving
	onSave?: (success: boolean, error?: string) => void;
	onLoad?: (data: CalculatorFormData | null) => void;
}

export function useAutoSave(
	endpoint: string,
	debounceMs: number = 2000,
	storageKey?: string,
	options: AutoSaveOptions = { memorialId: '' }
) {
	let saveTimeout: NodeJS.Timeout | null = null;
	let lastSaveData: string | null = null;
	
	// Test environment compatibility
	let isSaving = false;
	let lastSaved: Date | null = null;
	let hasUnsavedChanges = false;
	
	const { memorialId, delay = debounceMs, onSave, onLoad } = options;

	console.log('🔄 Auto-save composable initialized');

	// Auto-save function
	async function autoSave(formData: CalculatorFormData) {
		const dataString = JSON.stringify(formData);
		
		// Skip if data hasn't changed
		if (dataString === lastSaveData) {
			return;
		}

		console.log('💾 Auto-saving schedule data...');
		isSaving = true;
		hasUnsavedChanges = false;

		try {
			const response = await fetch(`/api/memorials/${memorialId}/schedule/auto-save`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					formData,
					timestamp: Date.now()
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				lastSaveData = dataString;
				lastSaved = new Date();
				console.log('✅ Schedule auto-saved successfully');
				onSave?.(true);
			} else {
				console.error('❌ Auto-save failed:', result.error);
				hasUnsavedChanges = true;
				onSave?.(false, result.error);
			}
		} catch (error) {
			console.error('💥 Auto-save error:', error);
			hasUnsavedChanges = true;
			onSave?.(false, error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isSaving = false;
		}
	}

	// Debounced auto-save trigger
	function triggerAutoSave(formData: CalculatorFormData) {
		hasUnsavedChanges = true;
		
		// Clear existing timeout
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}

		// Set new timeout
		saveTimeout = setTimeout(() => {
			autoSave(formData);
		}, delay);
	}

	// Load auto-saved data
	async function loadAutoSavedData(): Promise<CalculatorFormData | null> {
		console.log('📖 Loading auto-saved schedule data...');
		
		try {
			const response = await fetch(`/api/memorials/${memorialId}/schedule/auto-save`);
			const result = await response.json();

			if (response.ok && result.success && result.hasAutoSave) {
				console.log('✅ Auto-saved data loaded');
				const autoSavedData = result.autoSave.formData;
				onLoad?.(autoSavedData);
				return autoSavedData;
			} else {
				console.log('ℹ️ No auto-saved data found');
				onLoad?.(null);
				return null;
			}
		} catch (error) {
			console.error('💥 Error loading auto-saved data:', error);
			onLoad?.(null);
			return null;
		}
	}

	// Manual save function
	async function saveNow(formData: CalculatorFormData) {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}
		await autoSave(formData);
	}

	// Cleanup on component destroy
	onDestroy(() => {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}
	});

	return {
		// State
		isSaving: () => isSaving,
		lastSaved: () => lastSaved,
		hasUnsavedChanges: () => hasUnsavedChanges,
		
		// Methods
		triggerAutoSave,
		saveNow,
		loadAutoSavedData
	};
}
