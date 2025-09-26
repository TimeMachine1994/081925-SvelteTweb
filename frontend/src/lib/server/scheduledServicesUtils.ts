import type { Memorial } from '$lib/types/memorial';

/**
 * Convert Memorial.services data to scheduled services format
 * This utility handles the conversion from Memorial data structure to the format
 * expected by the livestream system
 */
export function convertMemorialToScheduledServices(memorial: Memorial): any[] {
	const services: any[] = [];
	
	if (!memorial.services) {
		console.warn('⚠️ Memorial has no services data');
		return services;
	}

	// Add main service
	if (memorial.services.main) {
		const mainService = {
			id: 'main_main',
			title: `${memorial.lovedOneName} Memorial Service`,
			status: 'scheduled', // Default status
			location: memorial.services.main.location,
			time: memorial.services.main.time,
			hours: memorial.services.main.hours || 1,
			isVisible: true, // Default to visible
			cloudflareId: memorial.livestream?.cloudflareId || null,
			streamKey: memorial.livestream?.streamKey || null,
			streamUrl: memorial.livestream?.streamUrl || null,
			recordingPlaybackUrl: memorial.livestream?.recordingPlaybackUrl || null,
			viewerCount: 0
		};

		// Check if this service has custom stream data
		if (memorial.customStreams?.main_main) {
			const customData = memorial.customStreams.main_main;
			mainService.status = customData.status || mainService.status;
			mainService.isVisible = customData.isVisible !== false; // Default to visible
			mainService.cloudflareId = customData.cloudflareId || mainService.cloudflareId;
			mainService.streamKey = customData.streamKey || mainService.streamKey;
			mainService.streamUrl = customData.streamUrl || mainService.streamUrl;
			mainService.recordingPlaybackUrl = customData.recordingPlaybackUrl || mainService.recordingPlaybackUrl;
			mainService.viewerCount = customData.viewerCount || 0;
		}

		services.push(mainService);
	}

	// Add additional services
	if (memorial.services.additional && Array.isArray(memorial.services.additional)) {
		memorial.services.additional.forEach((additionalService, index) => {
			if (additionalService.enabled) {
				const serviceId = `additional_${index}`;
				const service = {
					id: serviceId,
					title: `Additional Service ${index + 1}`,
					status: 'scheduled',
					location: additionalService.location,
					time: additionalService.time,
					hours: additionalService.hours || 1,
					isVisible: true, // Default to visible
					cloudflareId: null,
					streamKey: null,
					streamUrl: null,
					recordingPlaybackUrl: null,
					viewerCount: 0
				};

				// Check if this service has custom stream data
				if (memorial.customStreams?.[serviceId]) {
					const customData = memorial.customStreams[serviceId];
					service.status = customData.status || service.status;
					service.isVisible = customData.isVisible !== false;
					service.cloudflareId = customData.cloudflareId || service.cloudflareId;
					service.streamKey = customData.streamKey || service.streamKey;
					service.streamUrl = customData.streamUrl || service.streamUrl;
					service.recordingPlaybackUrl = customData.recordingPlaybackUrl || service.recordingPlaybackUrl;
					service.viewerCount = customData.viewerCount || 0;
				}

				services.push(service);
			}
		});
	}

	// Add any custom streams that don't correspond to services
	if (memorial.customStreams) {
		Object.entries(memorial.customStreams).forEach(([streamId, streamData]: [string, any]) => {
			// Skip if we already processed this stream
			if (streamId === 'main_main' || streamId.startsWith('additional_')) {
				return;
			}

			// Skip invalid entries (like "undefined", "main", or entries with only isVisible)
			if (!streamData || streamId === 'undefined' || streamId === 'main' || 
				(Object.keys(streamData).length === 1 && 'isVisible' in streamData)) {
				return;
			}

			const customService = {
				id: streamId,
				title: streamData.title || `Custom Stream ${streamId}`,
				status: streamData.status || 'scheduled',
				location: { name: 'Custom Location', address: '', isUnknown: true },
				time: { date: null, time: null, isUnknown: true },
				hours: 1,
				isVisible: streamData.isVisible !== false,
				cloudflareId: streamData.cloudflareId || null,
				streamKey: streamData.streamKey || null,
				streamUrl: streamData.streamUrl || null,
				recordingPlaybackUrl: streamData.recordingPlaybackUrl || null,
				viewerCount: streamData.viewerCount || 0
			};

			services.push(customService);
		});
	}

	// Sort services by date/time (scheduled first, then by date)
	services.sort((a, b) => {
		// If both have dates, sort by date
		if (a.time?.date && b.time?.date) {
			const dateA = new Date(a.time.date + (a.time.time ? `T${a.time.time}` : ''));
			const dateB = new Date(b.time.date + (b.time.time ? `T${b.time.time}` : ''));
			return dateA.getTime() - dateB.getTime();
		}
		
		// Services with dates come first
		if (a.time?.date && !b.time?.date) return -1;
		if (!a.time?.date && b.time?.date) return 1;
		
		// Both without dates, sort by ID (main service first)
		if (a.id === 'main_main') return -1;
		if (b.id === 'main_main') return 1;
		
		return a.id.localeCompare(b.id);
	});

	console.log(`📅 Converted ${services.length} scheduled services for memorial ${memorial.id}`);
	return services;
}

/**
 * Generate unique stream credentials for a service
 */
export function generateStreamCredentials(serviceId: string): { streamKey: string; streamUrl: string } {
	const timestamp = Date.now();
	const randomSuffix = Math.random().toString(36).substring(2, 10);
	
	return {
		streamKey: `stream_${timestamp}_${randomSuffix}`,
		streamUrl: 'rtmps://live.cloudflare.com:443/live/'
	};
}

/**
 * Validate service time information
 */
export function validateServiceTime(time: any): boolean {
	if (!time) return false;
	if (time.isUnknown) return true; // Unknown time is valid
	return !!(time.date && time.time);
}

/**
 * Format service time for display
 */
export function formatServiceTime(time: any): string {
	if (!time || time.isUnknown) return 'Time TBD';
	if (!time.date) return 'Date TBD';
	
	const date = new Date(time.date);
	const timeStr = time.time ? ` at ${time.time}` : '';
	return date.toLocaleDateString() + timeStr;
}

/**
 * Get service status color class
 */
export function getServiceStatusColor(status: string): string {
	switch (status) {
		case 'live': return 'bg-red-500';
		case 'scheduled': return 'bg-blue-500';
		case 'completed': return 'bg-green-500';
		default: return 'bg-gray-500';
	}
}

/**
 * Check if a service is currently live
 */
export function isServiceLive(service: any): boolean {
	return service.status === 'live';
}

/**
 * Check if a service is completed and has recording
 */
export function isServiceRecorded(service: any): boolean {
	return service.status === 'completed' && (service.recordingPlaybackUrl || service.cloudflareId);
}

/**
 * Filter services by visibility
 */
export function filterVisibleServices(services: any[]): any[] {
	return services.filter(service => service.isVisible !== false);
}

/**
 * Filter services by status
 */
export function filterServicesByStatus(services: any[], status: string): any[] {
	return services.filter(service => service.status === status);
}
