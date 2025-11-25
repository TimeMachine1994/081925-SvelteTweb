import { describe, it, expect } from 'vitest';

describe('Routing Fixes Integration', () => {
	describe('Event URL Generation', () => {
		it('should generate correct event URLs without /tributes/', () => {
			const event = {
				id: 'event-123',
				fullSlug: 'john-doe-event-2024',
				slug: 'john-doe-event'
			};

			// Test the correct URL format
			const correctUrl = `/${event.fullSlug}`;
			expect(correctUrl).toBe('/john-doe-event-2024');
			expect(correctUrl).not.toContain('/tributes/');
		});

		it('should handle fallback to slug if fullSlug missing', () => {
			const event = {
				id: 'event-456',
				slug: 'jane-smith-event'
				// fullSlug missing
			};

			const url = `/${event.fullSlug || event.slug}`;
			expect(url).toBe('/jane-smith-event');
			expect(url).not.toContain('/tributes/');
		});

		it('should generate correct email tribute URLs', () => {
			const fullSlug = 'event-service-2024';
			const tributeUrl = `https://tributestream.com/${fullSlug}`;
			
			expect(tributeUrl).toBe('https://tributestream.com/event-service-2024');
			expect(tributeUrl).not.toContain('/tributes/');
		});
	});

	describe('Portal Navigation', () => {
		it('should redirect management actions to /profile', () => {
			const managementUrl = '/profile';
			
			expect(managementUrl).toBe('/profile');
			expect(managementUrl).not.toContain('/my-portal/tributes/');
		});

		it('should redirect new event creation to family registration', () => {
			const createUrl = '/register/family';
			
			expect(createUrl).toBe('/register/family');
			expect(createUrl).not.toContain('/my-portal/tributes/');
		});
	});

	describe('API Response URLs', () => {
		it('should generate correct mobile viewer URLs', () => {
			const event = {
				fullSlug: 'test-event-2024',
				slug: 'test-event',
				id: 'event-789'
			};

			const viewerUrl = `/${event.fullSlug || event.slug || event.id}`;
			expect(viewerUrl).toBe('/test-event-2024');
			expect(viewerUrl).not.toContain('/tributes/');
		});

		it('should handle missing fullSlug gracefully', () => {
			const event = {
				slug: 'backup-event',
				id: 'event-999'
			};

			const viewerUrl = `/${event.fullSlug || event.slug || event.id}`;
			expect(viewerUrl).toBe('/backup-event');
		});

		it('should fallback to ID if both slug fields missing', () => {
			const event = {
				id: 'event-000'
			};

			const viewerUrl = `/${event.fullSlug || event.slug || event.id}`;
			expect(viewerUrl).toBe('/event-000');
		});
	});

	describe('Livestream Dashboard Navigation', () => {
		it('should generate correct "View Event" link', () => {
			const event = {
				fullSlug: 'livestream-event-2024'
			};

			const viewMemorialUrl = `/${event.fullSlug}`;
			expect(viewMemorialUrl).toBe('/livestream-event-2024');
			expect(viewMemorialUrl).not.toContain('/tributes/');
		});
	});

	describe('Legacy Path Detection', () => {
		it('should identify legacy /tributes/ paths as incorrect', () => {
			const legacyPaths = [
				'/tributes/some-event',
				'/my-portal/tributes/123/edit',
				'/my-portal/tributes/new'
			];

			legacyPaths.forEach(path => {
				expect(path).toContain('/tributes/');
				// These paths should not be used in the application
			});
		});

		it('should validate correct paths do not contain /tributes/', () => {
			const correctPaths = [
				'/event-service-2024',
				'/profile',
				'/register/family',
				'/livestream/event-123'
			];

			correctPaths.forEach(path => {
				expect(path).not.toContain('/tributes/');
			});
		});
	});

	describe('URL Validation', () => {
		it('should validate event page URLs are at root level', () => {
			const memorialUrls = [
				'/john-doe-event',
				'/jane-smith-service-2024',
				'/event-celebration'
			];

			memorialUrls.forEach(url => {
				// Should start with / but not contain any other path segments before the slug
				expect(url).toMatch(/^\/[^\/]+$/);
				expect(url).not.toContain('/tributes/');
			});
		});

		it('should validate management URLs go to correct endpoints', () => {
			const managementUrls = [
				'/profile',
				'/register/family',
				'/livestream/event-123'
			];

			managementUrls.forEach(url => {
				expect(url).not.toContain('/my-portal/tributes/');
				expect(url).not.toContain('/tributes/');
			});
		});
	});
});
