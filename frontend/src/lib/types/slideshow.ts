/**
 * 🎬 Slideshow Settings and Control Types
 * Comprehensive type definitions for slideshow configuration and controls
 */

export interface SlideshowSettings {
	// ⏱️ Timing Controls
	duration: number; // milliseconds per slide (1000-30000)
	transitionSpeed: number; // transition duration in milliseconds (100-2000)
	autoplay: boolean;
	loop: boolean;
	
	// 🎭 Transition Effects
	transition: 'fade' | 'slide' | 'zoom' | 'kenburns';
	
	// 🎮 Display Options
	showControls: boolean;
	showProgressBar: boolean;
	showSlideCounter: boolean;
	allowFullscreen: boolean;
	
	// 🎨 Appearance
	backgroundColor: string;
	controlOpacity: number; // 0.1-1.0
	cornerRadius: number; // 0-20px
}

export interface SlideshowControlsProps {
	memorialId?: string;
	initialSettings?: Partial<SlideshowSettings>;
	readonly?: boolean;
}

export interface SlideshowPreset {
	id: string;
	name: string;
	description: string;
	icon: string;
	settings: SlideshowSettings;
}

export interface ValidationError {
	field: string;
	message: string;
}

export interface SettingsHistory {
	settings: SlideshowSettings;
	timestamp: number;
	action: string;
}

// 🎯 Default settings
export const DEFAULT_SLIDESHOW_SETTINGS: SlideshowSettings = {
	duration: 5000, // 5 seconds
	transitionSpeed: 500, // 0.5 seconds
	autoplay: false,
	loop: true,
	transition: 'fade',
	showControls: true,
	showProgressBar: true,
	showSlideCounter: true,
	allowFullscreen: true,
	backgroundColor: '#000000',
	controlOpacity: 0.8,
	cornerRadius: 8
};

// 🎨 Preset configurations
export const SLIDESHOW_PRESETS: SlideshowPreset[] = [
	{
		id: 'fast',
		name: 'Fast',
		description: 'Quick transitions for dynamic viewing',
		icon: '⚡',
		settings: {
			...DEFAULT_SLIDESHOW_SETTINGS,
			duration: 2000,
			transitionSpeed: 300,
			transition: 'slide',
			autoplay: true
		}
	},
	{
		id: 'slow',
		name: 'Slow',
		description: 'Gentle pace for contemplative viewing',
		icon: '🐌',
		settings: {
			...DEFAULT_SLIDESHOW_SETTINGS,
			duration: 10000,
			transitionSpeed: 800,
			transition: 'fade',
			autoplay: true
		}
	},
	{
		id: 'cinematic',
		name: 'Cinematic',
		description: 'Ken Burns effect for dramatic presentation',
		icon: '🎬',
		settings: {
			...DEFAULT_SLIDESHOW_SETTINGS,
			duration: 8000,
			transitionSpeed: 1000,
			transition: 'kenburns',
			autoplay: true,
			backgroundColor: '#1a1a1a'
		}
	},
	{
		id: 'minimal',
		name: 'Minimal',
		description: 'Clean interface with subtle transitions',
		icon: '✨',
		settings: {
			...DEFAULT_SLIDESHOW_SETTINGS,
			duration: 6000,
			transitionSpeed: 600,
			transition: 'fade',
			showControls: false,
			showProgressBar: false,
			showSlideCounter: false,
			backgroundColor: '#ffffff',
			controlOpacity: 0.3
		}
	}
];

// 🎨 Background color options
export const BACKGROUND_COLORS = [
	{ name: 'Black', value: '#000000', preview: '#000000' },
	{ name: 'Dark Gray', value: '#1a1a1a', preview: '#1a1a1a' },
	{ name: 'Medium Gray', value: '#404040', preview: '#404040' },
	{ name: 'Light Gray', value: '#f5f5f5', preview: '#f5f5f5' },
	{ name: 'White', value: '#ffffff', preview: '#ffffff' },
	{ name: 'Navy', value: '#1e293b', preview: '#1e293b' },
	{ name: 'Forest', value: '#064e3b', preview: '#064e3b' },
	{ name: 'Burgundy', value: '#7c2d12', preview: '#7c2d12' }
];

// 🎭 Transition type information
export const TRANSITION_TYPES = [
	{
		id: 'fade',
		name: 'Fade',
		description: 'Smooth opacity transition',
		icon: '🌅',
		preview: 'Gentle cross-fade between images'
	},
	{
		id: 'slide',
		name: 'Slide',
		description: 'Horizontal sliding motion',
		icon: '➡️',
		preview: 'Images slide in from the right'
	},
	{
		id: 'zoom',
		name: 'Zoom',
		description: 'Scale-based transition',
		icon: '🔍',
		preview: 'Images zoom in and out'
	},
	{
		id: 'kenburns',
		name: 'Ken Burns',
		description: 'Cinematic pan and zoom',
		icon: '🎬',
		preview: 'Slow pan and zoom for dramatic effect'
	}
] as const;

// 📏 Validation constraints
export const VALIDATION_CONSTRAINTS = {
	duration: { min: 1000, max: 30000 },
	transitionSpeed: { min: 100, max: 2000 },
	controlOpacity: { min: 0.1, max: 1.0 },
	cornerRadius: { min: 0, max: 20 }
};

// 🔧 Utility functions
export function validateSettings(settings: Partial<SlideshowSettings>): ValidationError[] {
	console.log('🔍 Validating slideshow settings:', settings);
	const errors: ValidationError[] = [];

	if (settings.duration !== undefined) {
		const { min, max } = VALIDATION_CONSTRAINTS.duration;
		if (settings.duration < min || settings.duration > max) {
			errors.push({
				field: 'duration',
				message: `Duration must be between ${min/1000}s and ${max/1000}s`
			});
		}
	}

	if (settings.transitionSpeed !== undefined) {
		const { min, max } = VALIDATION_CONSTRAINTS.transitionSpeed;
		if (settings.transitionSpeed < min || settings.transitionSpeed > max) {
			errors.push({
				field: 'transitionSpeed',
				message: `Transition speed must be between ${min}ms and ${max}ms`
			});
		}
	}

	if (settings.controlOpacity !== undefined) {
		const { min, max } = VALIDATION_CONSTRAINTS.controlOpacity;
		if (settings.controlOpacity < min || settings.controlOpacity > max) {
			errors.push({
				field: 'controlOpacity',
				message: `Control opacity must be between ${min} and ${max}`
			});
		}
	}

	if (settings.cornerRadius !== undefined) {
		const { min, max } = VALIDATION_CONSTRAINTS.cornerRadius;
		if (settings.cornerRadius < min || settings.cornerRadius > max) {
			errors.push({
				field: 'cornerRadius',
				message: `Corner radius must be between ${min}px and ${max}px`
			});
		}
	}

	console.log('✅ Validation complete, found', errors.length, 'errors');
	return errors;
}

export function mergeSettings(base: SlideshowSettings, overrides: Partial<SlideshowSettings>): SlideshowSettings {
	console.log('🔄 Merging slideshow settings');
	return { ...base, ...overrides };
}

export function formatDuration(ms: number): string {
	return `${(ms / 1000).toFixed(1)}s`;
}

export function formatTransitionSpeed(ms: number): string {
	return `${ms}ms`;
}