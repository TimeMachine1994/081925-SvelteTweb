/**
 * Feature Flags Configuration
 * 
 * Controls rollout of new features and experimental functionality
 */

import { env } from '$env/dynamic/public';

export const FEATURES = {
	/**
	 * Use Mux for browser streaming instead of WHIP
	 * When enabled: Browser streams use Mux WebRTC → Mux Bridge → Cloudflare RTMP
	 * When disabled: Browser streams use WHIP → Cloudflare (legacy)
	 */
	USE_MUX_FOR_BROWSER_STREAMING: env.PUBLIC_USE_MUX_STREAMING === 'true' || true, // Default enabled

	/**
	 * Enable Mux webhook processing
	 * When enabled: Process real-time events from Mux
	 * When disabled: Skip webhook processing
	 */
	ENABLE_MUX_WEBHOOKS: env.PUBLIC_ENABLE_MUX_WEBHOOKS === 'true' || true, // Default enabled

	/**
	 * Debug mode for Mux integration
	 * When enabled: Extra logging and debug information
	 * When disabled: Standard logging only
	 */
	MUX_DEBUG_MODE: env.PUBLIC_MUX_DEBUG === 'true' || false // Default disabled
} as const;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
	return FEATURES[feature];
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): string[] {
	return Object.entries(FEATURES)
		.filter(([_, enabled]) => enabled)
		.map(([feature, _]) => feature);
}
