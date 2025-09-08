import { onDestroy } from 'svelte';
import type { CalculatorFormData, CalculatorConfig } from '$lib/types/livestream';

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

	// Auto-save function with enhanced data validation
	async function autoSave(formData: CalculatorFormData) {
		// Ensure memorialId is included in formData
		const enhancedFormData = {
			...formData,
			memorialId,
			updatedAt: new Date(),
			autoSaved: true
		};
		
		const dataString = JSON.stringify(enhancedFormData);
		
		// Skip if data hasn't changed
		if (dataString === lastSaveData) {
			return;
		}

		console.log('💾 Auto-saving schedule data for memorial:', memorialId);
		isSaving = true;
		hasUnsavedChanges = false;

		try {
			const response = await fetch(`/api/memorials/${memorialId}/schedule/auto-save`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					formData: enhancedFormData,
					timestamp: Date.now()
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				lastSaveData = dataString;
				lastSaved = new Date();
				console.log('✅ Schedule auto-saved successfully to calculatorConfig');
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

	// Load auto-saved data with enhanced structure support
	async function loadAutoSavedData(): Promise<CalculatorFormData | null> {
		console.log('📖 Loading auto-saved schedule data for memorial:', memorialId);
		
		try {
			const response = await fetch(`/api/memorials/${memorialId}/schedule/auto-save`);
			const result = await response.json();

			if (response.ok && result.success && result.hasAutoSave) {
				console.log('✅ Auto-saved data loaded from calculatorConfig');
				const autoSavedData = result.autoSave.formData;
				
				// Ensure the data has the memorial context
				const enhancedData = {
					...autoSavedData,
					memorialId,
					autoSaved: true
				};
				
				onLoad?.(enhancedData);
				return enhancedData;
			} else {
				console.log('ℹ️ No auto-saved data found for memorial:', memorialId);
				onLoad?.(null);
				return null;
			}
		} catch (error) {
			console.error('💥 Error loading auto-saved data:', error);
			onLoad?.(null);
			return null;
		}
	}

	// Load full calculator config (including booking items and totals)
	async function loadCalculatorConfig(): Promise<CalculatorConfig | null> {
		console.log('📖 Loading full calculator config for memorial:', memorialId);
		
		try {
			const response = await fetch(`/api/memorials/${memorialId}/schedule/auto-save`);
			const result = await response.json();

			if (response.ok && result.success && result.calculatorConfig) {
				console.log('✅ Calculator config loaded');
				return result.calculatorConfig;
			} else {
				console.log('ℹ️ No calculator config found');
				return null;
			}
		} catch (error) {
			console.error('💥 Error loading calculator config:', error);
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
		loadAutoSavedData,
		loadCalculatorConfig
	};
}
