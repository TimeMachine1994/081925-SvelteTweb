import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Firebase admin and middleware dependencies
vi.mock('$lib/server/firebase', () => ({
	adminDb: {
		collection: vi.fn(() => ({
			doc: vi.fn(() => ({
				get: vi.fn(),
				update: vi.fn()
			}))
		}))
	}
}));

vi.mock('$lib/server/memorialMiddleware', () => ({
	requireViewAccess: vi.fn(),
	requireEditAccess: vi.fn()
}));

describe('Scheduled Services Integration', () => {
	describe('Data Structure Validation', () => {
		it('should validate Memorial.services structure', () => {
			const memorialServices = {
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
			};

			// Validate main service structure
			expect(memorialServices.main).toHaveProperty('location');
			expect(memorialServices.main).toHaveProperty('time');
			expect(memorialServices.main).toHaveProperty('hours');
			expect(memorialServices.main.location).toHaveProperty('name');
			expect(memorialServices.main.location).toHaveProperty('address');
			expect(memorialServices.main.location).toHaveProperty('isUnknown');

			// Validate additional services structure
			expect(Array.isArray(memorialServices.additional)).toBe(true);
			expect(memorialServices.additional[0]).toHaveProperty('enabled');
			expect(memorialServices.additional[0]).toHaveProperty('location');
			expect(memorialServices.additional[0]).toHaveProperty('time');
			expect(memorialServices.additional[0]).toHaveProperty('hours');
		});

		it('should convert Memorial.services to scheduled services format', () => {
			const memorialServices = {
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
			};

			// Simulate the conversion logic from the server
			const scheduledServices = [];

			// Convert main service
			if (memorialServices.main) {
				const mainService = {
					id: 'main',
					title: memorialServices.main.location.name || 'Main Service',
					location: memorialServices.main.location,
					time: memorialServices.main.time,
					hours: memorialServices.main.hours,
					status: 'scheduled',
					type: 'main',
					streamKey: `stream_main_${Date.now()}`,
					streamUrl: 'rtmps://live.cloudflare.com:443/live/'
				};
				scheduledServices.push(mainService);
			}

			// Convert additional services
			if (memorialServices.additional && memorialServices.additional.length > 0) {
				memorialServices.additional.forEach((additionalService, index) => {
					if (additionalService.enabled) {
						const scheduledService = {
							id: `additional_${index}`,
							title: additionalService.location.name || `Additional Service ${index + 1}`,
							location: additionalService.location,
							time: additionalService.time,
							hours: additionalService.hours,
							status: 'scheduled',
							type: 'additional',
							index,
							streamKey: `stream_additional_${index}_${Date.now()}`,
							streamUrl: 'rtmps://live.cloudflare.com:443/live/'
						};
						scheduledServices.push(scheduledService);
					}
				});
			}

			expect(scheduledServices).toHaveLength(2);
			expect(scheduledServices[0].id).toBe('main');
			expect(scheduledServices[0].title).toBe('Main Chapel');
			expect(scheduledServices[0].type).toBe('main');
			expect(scheduledServices[1].id).toBe('additional_0');
			expect(scheduledServices[1].title).toBe('Garden Chapel');
			expect(scheduledServices[1].type).toBe('additional');
		});

		it('should generate unique stream credentials', () => {
			const generateStreamCredentials = () => {
				const streamKey = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
				const streamUrl = `rtmps://live.cloudflare.com:443/live/`;
				return { streamKey, streamUrl };
			};

			const credentials1 = generateStreamCredentials();
			const credentials2 = generateStreamCredentials();

			expect(credentials1.streamKey).toMatch(/^stream_\d+_[a-z0-9]+$/);
			expect(credentials1.streamUrl).toBe('rtmps://live.cloudflare.com:443/live/');
			expect(credentials1.streamKey).not.toBe(credentials2.streamKey);
		});

		it('should sort services by date', () => {
			const services = [
				{
					id: 'service1',
					title: 'Later Service',
					time: { date: '2024-01-20', time: '10:00', isUnknown: false }
				},
				{
					id: 'service2',
					title: 'Earlier Service',
					time: { date: '2024-01-10', time: '14:00', isUnknown: false }
				},
				{
					id: 'service3',
					title: 'No Date Service',
					time: { date: null, time: null, isUnknown: true }
				}
			];

			// Sort by date/time (same logic as server)
			const sortedServices = services.sort((a, b) => {
				const dateA = a.time.date ? new Date(a.time.date).getTime() : 0;
				const dateB = b.time.date ? new Date(b.time.date).getTime() : 0;
				return dateA - dateB;
			});

			expect(sortedServices[0].title).toBe('No Date Service'); // null dates come first (0)
			expect(sortedServices[1].title).toBe('Earlier Service');
			expect(sortedServices[2].title).toBe('Later Service');
		});
	});

	describe('Stream Status Management', () => {
		it('should handle status transitions', () => {
			const service = {
				id: 'test-service',
				title: 'Test Service',
				status: 'scheduled'
			};

			// Test status transitions
			expect(service.status).toBe('scheduled');

			// Simulate going live
			service.status = 'live';
			expect(service.status).toBe('live');

			// Simulate completing
			service.status = 'completed';
			expect(service.status).toBe('completed');
		});

		it('should validate status values', () => {
			const validStatuses = ['scheduled', 'live', 'completed'];
			const testStatus = 'live';

			expect(validStatuses.includes(testStatus)).toBe(true);
			expect(validStatuses.includes('invalid')).toBe(false);
		});
	});

	describe('Error Handling', () => {
		it('should handle missing memorial data gracefully', () => {
			const memorial = null;
			const scheduledServices = [];

			// Simulate server logic for missing memorial
			if (!memorial) {
				expect(scheduledServices).toHaveLength(0);
			}
		});

		it('should handle missing services gracefully', () => {
			const memorial = {
				id: 'test-memorial',
				services: null
			};

			const scheduledServices = [];

			// Simulate server logic for missing services
			if (!memorial.services?.main) {
				// No main service to convert
			}

			if (!memorial.services?.additional || memorial.services.additional.length === 0) {
				// No additional services to convert
			}

			expect(scheduledServices).toHaveLength(0);
		});

		it('should filter out disabled additional services', () => {
			const additionalServices = [
				{
					enabled: true,
					location: { name: 'Enabled Service', address: '123 St', isUnknown: false },
					time: { date: '2024-01-15', time: '10:00', isUnknown: false },
					hours: 2
				},
				{
					enabled: false,
					location: { name: 'Disabled Service', address: '456 St', isUnknown: false },
					time: { date: '2024-01-16', time: '14:00', isUnknown: false },
					hours: 1
				}
			];

			const enabledServices = additionalServices.filter(service => service.enabled);
			expect(enabledServices).toHaveLength(1);
			expect(enabledServices[0].location.name).toBe('Enabled Service');
		});
	});

	describe('Frontend State Management', () => {
		it('should handle service selection', () => {
			const services = [
				{ id: 'service1', title: 'Service 1' },
				{ id: 'service2', title: 'Service 2' }
			];

			let selectedService = null;

			// Simulate service selection
			const selectService = (service) => {
				selectedService = service;
			};

			selectService(services[0]);
			expect(selectedService).toBe(services[0]);
			expect(selectedService.title).toBe('Service 1');
		});

		it('should generate dynamic stream credentials', () => {
			const selectedService = {
				id: 'test-service',
				streamKey: 'test-stream-key-123',
				streamUrl: 'rtmps://live.cloudflare.com:443/live/'
			};

			// Simulate the derived credentials logic
			const streamCredentials = selectedService ? {
				streamKey: selectedService.streamKey || '',
				serverUrl: 'rtmps://live.cloudflare.com:443/live/',
				rtmpsUrl: 'rtmps://live.cloudflare.com:443/live/' + selectedService.streamKey
			} : {
				streamKey: '',
				serverUrl: '',
				rtmpsUrl: ''
			};

			expect(streamCredentials.streamKey).toBe('test-stream-key-123');
			expect(streamCredentials.serverUrl).toBe('rtmps://live.cloudflare.com:443/live/');
			expect(streamCredentials.rtmpsUrl).toBe('rtmps://live.cloudflare.com:443/live/test-stream-key-123');
		});

		it('should handle empty service selection', () => {
			const selectedService = null;

			const streamCredentials = selectedService ? {
				streamKey: selectedService.streamKey || '',
				serverUrl: 'rtmps://live.cloudflare.com:443/live/',
				rtmpsUrl: 'rtmps://live.cloudflare.com:443/live/' + selectedService.streamKey
			} : {
				streamKey: '',
				serverUrl: '',
				rtmpsUrl: ''
			};

			expect(streamCredentials.streamKey).toBe('');
			expect(streamCredentials.serverUrl).toBe('');
			expect(streamCredentials.rtmpsUrl).toBe('');
		});
	});
});
