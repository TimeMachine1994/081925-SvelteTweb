import { describe, it, expect } from 'vitest';
import { 
	convertMemorialToScheduledServices,
	generateStreamCredentials,
	validateServiceTime,
	formatServiceTime,
	filterVisibleServices
} from '$lib/server/scheduledServicesUtils';
import type { Memorial } from '$lib/types/memorial';

describe('Multi-Service Streams Integration', () => {
	describe('Scheduled Services Utils', () => {
		it('should convert memorial services to scheduled format', () => {
			const mockMemorial = {
				id: 'memorial-123',
				lovedOneName: 'John Doe',
				services: {
					main: {
						location: { name: 'Main Chapel', address: '123 Main St', isUnknown: false },
						time: { date: '2024-01-15', time: '10:00', isUnknown: false },
						hours: 2
					},
					additional: [
						{
							enabled: true,
							location: { name: 'Garden Chapel', address: '456 Garden Ave', isUnknown: false },
							time: { date: '2024-01-16', time: '14:00', isUnknown: false },
							hours: 1.5
						}
					]
				},
				customStreams: {
					main_main: {
						status: 'live',
						isVisible: true,
						cloudflareId: 'cf-123'
					}
				}
			} as Memorial;

			const services = convertMemorialToScheduledServices(mockMemorial);

			expect(services).toHaveLength(2);
			
			const mainService = services.find(s => s.id === 'main_main');
			expect(mainService).toBeDefined();
			expect(mainService?.title).toBe('John Doe Memorial Service');
			expect(mainService?.status).toBe('live');
			expect(mainService?.isVisible).toBe(true);
			expect(mainService?.location.name).toBe('Main Chapel');

			const additionalService = services.find(s => s.id === 'additional_0');
			expect(additionalService).toBeDefined();
			expect(additionalService?.title).toBe('Additional Service 1');
			expect(additionalService?.location.name).toBe('Garden Chapel');
		});

		it('should generate unique stream credentials', () => {
			const creds1 = generateStreamCredentials('service1');
			const creds2 = generateStreamCredentials('service2');

			expect(creds1.streamKey).toBeDefined();
			expect(creds1.streamUrl).toBe('rtmps://live.cloudflare.com:443/live/');
			expect(creds1.streamKey).not.toBe(creds2.streamKey);
			expect(creds1.streamKey).toMatch(/^stream_\d+_[a-z0-9]+$/);
		});

		it('should validate service times correctly', () => {
			expect(validateServiceTime({ date: '2024-01-15', time: '10:00', isUnknown: false })).toBe(true);
			expect(validateServiceTime({ date: null, time: null, isUnknown: true })).toBe(true);
			expect(validateServiceTime({ date: '2024-01-15', time: null, isUnknown: false })).toBe(false);
			expect(validateServiceTime(null)).toBe(false);
		});

		it('should format service times correctly', () => {
			const time = { date: '2024-01-15', time: '10:00', isUnknown: false };
			const formatted = formatServiceTime(time);
			
			expect(formatted).toContain('2024');
			expect(formatted).toContain('10:00');

			expect(formatServiceTime({ date: null, time: null, isUnknown: true })).toBe('Time TBD');
			expect(formatServiceTime(null)).toBe('Time TBD');
		});

		it('should filter visible services correctly', () => {
			const services = [
				{ id: '1', title: 'Service 1', isVisible: true },
				{ id: '2', title: 'Service 2', isVisible: false },
				{ id: '3', title: 'Service 3' }, // Default visible
				{ id: '4', title: 'Service 4', isVisible: undefined } // Default visible
			];

			const visibleServices = filterVisibleServices(services);
			
			expect(visibleServices).toHaveLength(3);
			expect(visibleServices.map(s => s.id)).toEqual(['1', '3', '4']);
		});
	});

	describe('Visibility Control Logic', () => {
		it('should handle default visibility correctly', () => {
			const services = [
				{ id: '1', isVisible: undefined },
				{ id: '2', isVisible: true },
				{ id: '3', isVisible: false }
			];

			const visible = filterVisibleServices(services);
			
			// Services with undefined or true should be visible
			expect(visible).toHaveLength(2);
			expect(visible.map(s => s.id)).toEqual(['1', '2']);
		});

		it('should handle visibility toggle logic', () => {
			// Test the toggle logic used in the frontend
			const service1 = { isVisible: true };
			const service2 = { isVisible: false };
			const service3 = { isVisible: undefined };

			// Toggle logic: isVisible === false ? true : false
			expect(service1.isVisible === false ? true : false).toBe(false);
			expect(service2.isVisible === false ? true : false).toBe(true);
			expect(service3.isVisible === false ? true : false).toBe(false);
		});
	});

	describe('Service Sorting and Organization', () => {
		it('should sort services by date correctly', () => {
			const mockMemorial = {
				id: 'memorial-123',
				lovedOneName: 'John Doe',
				services: {
					main: {
						location: { name: 'Main Chapel', address: '', isUnknown: false },
						time: { date: '2024-01-16', time: '10:00', isUnknown: false },
						hours: 1
					},
					additional: [
						{
							enabled: true,
							location: { name: 'Chapel A', address: '', isUnknown: false },
							time: { date: '2024-01-15', time: '09:00', isUnknown: false },
							hours: 1
						},
						{
							enabled: true,
							location: { name: 'Chapel B', address: '', isUnknown: false },
							time: { date: '2024-01-17', time: '11:00', isUnknown: false },
							hours: 1
						}
					]
				}
			} as Memorial;

			const services = convertMemorialToScheduledServices(mockMemorial);
			
			// Should be sorted by date: 2024-01-15, 2024-01-16, 2024-01-17
			expect(services[0].time.date).toBe('2024-01-15');
			expect(services[1].time.date).toBe('2024-01-16');
			expect(services[2].time.date).toBe('2024-01-17');
		});

		it('should handle services without dates', () => {
			const mockMemorial = {
				id: 'memorial-123',
				lovedOneName: 'John Doe',
				services: {
					main: {
						location: { name: 'Main Chapel', address: '', isUnknown: false },
						time: { date: null, time: null, isUnknown: true },
						hours: 1
					}
				},
				customStreams: {
					custom_1: {
						title: 'Custom Stream',
						status: 'scheduled'
					}
				}
			} as Memorial;

			const services = convertMemorialToScheduledServices(mockMemorial);
			
			expect(services).toHaveLength(2);
			// Main service should come first even without date
			expect(services[0].id).toBe('main_main');
		});
	});
});
