// Streaming Method Types for TributeStream
// Defines configurations for the three streaming workflows

export type StreamingMethod = 'obs' | 'phone-to-obs' | 'phone-to-mux';

/**
 * OBS Method Configuration
 * Traditional RTMP streaming with OBS or other streaming software
 */
export interface OBSMethodConfig {
	rtmpUrl: string;
	streamKey: string;
	cloudflareInputId: string;
}

/**
 * Phone to OBS Method Configuration
 * Phone acts as camera source in OBS via WebRTC/WHIP
 * Requires two Cloudflare live inputs:
 * 1. Phone source (WHIP) - for phone camera
 * 2. OBS destination (RTMP) - for final mixed output
 */
export interface PhoneToOBSMethodConfig {
	// OBS Destination (where OBS streams final output)
	obsDestination: {
		rtmpUrl: string;
		streamKey: string;
		cloudflareInputId: string;
	};
	// Phone Source (phone camera via WebRTC)
	phoneSource: {
		whipUrl: string; // For phone to stream via WebRTC
		playbackUrl: string; // For OBS browser source
		cloudflareInputId: string;
	};
}

/**
 * Phone to MUX Method Configuration
 * Direct phone streaming with Cloudflare restreaming to MUX
 * Cloudflare handles live streaming, MUX handles recording
 */
export interface PhoneToMUXMethodConfig {
	// Cloudflare (for live streaming)
	cloudflare: {
		whipUrl: string;
		inputId: string;
	};
	// MUX (for recording via restreaming)
	mux: {
		streamId: string;
		streamKey: string;
		playbackId: string;
	};
	// Configuration status
	restreamingConfigured: boolean;
}

/**
 * Unified streaming method configuration
 * Type-safe union for all three methods
 */
export type StreamMethodConfig =
	| { method: 'obs'; config: OBSMethodConfig }
	| { method: 'phone-to-obs'; config: PhoneToOBSMethodConfig }
	| { method: 'phone-to-mux'; config: PhoneToMUXMethodConfig };

/**
 * Type guards for streaming methods
 */
export function isOBSMethod(config: StreamMethodConfig): config is { method: 'obs'; config: OBSMethodConfig } {
	return config.method === 'obs';
}

export function isPhoneToOBSMethod(config: StreamMethodConfig): config is { method: 'phone-to-obs'; config: PhoneToOBSMethodConfig } {
	return config.method === 'phone-to-obs';
}

export function isPhoneToMUXMethod(config: StreamMethodConfig): config is { method: 'phone-to-mux'; config: PhoneToMUXMethodConfig } {
	return config.method === 'phone-to-mux';
}

/**
 * Validate streaming method
 */
export function isValidStreamingMethod(method: string): method is StreamingMethod {
	return ['obs', 'phone-to-obs', 'phone-to-mux'].includes(method);
}

/**
 * Method display information for UI
 */
export interface StreamingMethodInfo {
	method: StreamingMethod;
	icon: string;
	title: string;
	description: string;
	complexity: 'simple' | 'medium' | 'advanced';
	requiresOBS: boolean;
	requiresPhone: boolean;
}

export const STREAMING_METHOD_INFO: Record<StreamingMethod, StreamingMethodInfo> = {
	obs: {
		method: 'obs',
		icon: '💻',
		title: 'OBS',
		description: 'Professional streaming software',
		complexity: 'simple',
		requiresOBS: true,
		requiresPhone: false
	},
	'phone-to-obs': {
		method: 'phone-to-obs',
		icon: '📱➡️💻',
		title: 'Phone to OBS',
		description: 'Use phone as camera in OBS',
		complexity: 'medium',
		requiresOBS: true,
		requiresPhone: true
	},
	'phone-to-mux': {
		method: 'phone-to-mux',
		icon: '📱',
		title: 'Phone to MUX',
		description: 'Stream directly from phone',
		complexity: 'advanced',
		requiresOBS: false,
		requiresPhone: true
	}
};
