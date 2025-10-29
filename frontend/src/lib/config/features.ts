/**
 * Feature Flags Configuration
 * 
 * Controls rollout of new features and experimental functionality
 */

import { env } from '$env/dynamic/public';

export const FEATURES = {
	// Feature flags can be added here as needed
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
